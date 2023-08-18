// Load Config
let config = require('../../server/config.json');
if (process.env.NODE_ENV == 'dev') config = require('../../server/config.dev.json');

// Retrieve Server Instance
const app = require('../../server/server');

// Provider Configs
const p_config = config.number_providers.telynx;

// Import correct module based on provider protocol
if (p_config.protocol == 'https') var http = require('follow-redirects').https;
else var http = require('follow-redirects').http;

// HTTP Method Constants
const get = 'GET';
const post = 'POST';

// Overall HTTPs Request Method
const http_request = async function (api_method, api_path, request_data) {
  return new Promise(async (resolve, reject) => {
    try {
      // If a get request convert data to parameters
      if (api_method.toUpperCase() === 'GET' && Object.keys(request_data).length > 0) {
        let parameters = "";

        Object.entries(request_data).forEach(parameter => {
          let tmp = "";
          if (typeof parameter[1] === 'string') {
            tmp = "filter[" + encodeURIComponent(parameter[0]) + "]=" + encodeURIComponent(parameter[1]) + "&";
          } else {
            let data = parameter[1];
            for(let key in data)
              tmp += "filter[" + encodeURIComponent(parameter[0]) + "][" + encodeURIComponent(key) + "]=" + encodeURIComponent(data[key]) + "&";
          }

          parameters += tmp;
        });

        parameters = parameters.slice(0, -1);
        api_path = api_path + '?' + parameters;
      }

      var options = {
        method: api_method,
        hostname: p_config.host,
        port: p_config.port,
        path: p_config.path + '/' + api_path,
        headers: {
          "Authorization": "Bearer " + p_config.key,
          "Content-Type": "application/json"
        },
        maxRedirects: 20,
      };

      var req = http.request(options, function (res) {
        var chunks = [];

        res.on('data', function (chunk) {
          chunks.push(chunk);
        });

        res.on('end', function (chunk) {
          var body = Buffer.concat(chunks);
          if (body != null && body.toString().length > 0) {
            try {
              const json_body = JSON.parse(body.toString());
              if (json_body.hasOwnProperty('errors')) {
                let json_err = json_body.errors.shift();
                // let err =new Error();
                // err.statusCode = 500;
                // err.message = json_err.detail;
                throw new Error(json_err.detail);
                // return resolve(json_body)
              } else
               return resolve(json_body);
            } catch (err) {
              return reject(err);
            }
          }

          return reject(new Error('Empty result'))
        });

        res.on('error', function (error) {
          return reject(error);
        });
      });

      // Write post data if set
      if (api_method.toUpperCase() === 'POST' && Object.keys(request_data).length > 0)
        req.write(JSON.stringify(request_data));

      req.end();
    } catch (err) {
      return reject(err);
    }
  });
};

/**
 * Locally check if number is already reserved
 * @param {*} number
 * @returns
 */
function isNumberAlreadyReserved(number) {
  const np = app.models.NumberProvider;
  const filter = {
    where: {and: [{number: number}, {reserved: 1}]},
  };
  np.findOne(filter, (err, found_number) => {
    if (!err && found_number) {
      return true;
    } else {
      return false;
    }
  });
}

/**
 * Exctract number from payload
 * @param {*} data
 * @returns
 */
const extract_numbers = async function (data, npa, nxx) {
  let normalized_data = [];
  data.forEach(number => {
    let fee;
    let setup;
    let recur = 'monthly';

    // Number already reserved
    if (isNumberAlreadyReserved(number.phone_number)) return;

    // Discard if number is not reservable
    if (!number.reservable) return;

    /**
     * There only one kind of fee for Telynx number
     */
    fee = number.cost_information.monthly_cost;
    setup = number.cost_information.upfront_cost;
    recur = 'monthly';

    let state;
    let rcenter;
    number.region_information.forEach(item => {
      if (item.region_type == 'state') state = item.region_name;
      if (item.region_type == 'rate_center') rcenter = item.region_name;
    });

    /**
     * Create a unique number
     */
    let normalized_number = {
      prov_id: -1,
      name: number.phone_number,
      number: number.phone_number,
      type: number.phone_number_type,
      recur: recur,
      npa: npa,
      nxx: nxx,
      ratecenter: rcenter,
      state: state,
      fee: fee,
      setup_fee: setup,
      raw: number,
    };

    // Push it inside normalized data array
    normalized_data.push(normalized_number);
  });

  // Return json object
  return JSON.parse(JSON.stringify(normalized_data));
};

// Number Lookup
async function lookup(type, number, state, npa, nxx, ratecenter, result_limit) {
    if (result_limit == null || result_limit <= 0) result_limit = 10;

    let filter = {
      phone_number_type: type,
      limit: result_limit,
    };

    // NPA filter add
    if (npa != null && npa.trim().length > 0) {
      filter.national_destination_code = npa;

      let ops = "contains";
      let number_filter = "";

      // Filter by NXX
      if (nxx != null && nxx.trim().length > 0) {
        ops = "starts_with";
        number_filter = nxx;
      }

      if (number != null && number.trim().length > 0)
        number_filter += number;

      if (number_filter != null && number_filter.trim().length > 0)
        filter.phone_number = { [ops]: number_filter };
    }

    // A country code is always needed
    filter.country_code = "US";
    filter.administrative_area = (state != null && state.trim().length > 0) ? state.toUpperCase() : "";

    // Filter by ratecenter
    if (ratecenter != null && ratecenter.trim().length > 0) filter.rate_center = ratecenter.toUpperCase();

    // Place lookup request
    try {
      const payload = await http_request(get, 'available_phone_numbers', filter);
      return extract_numbers(payload.data, npa, nxx);
    } catch (err) {
      return { code: 500, error: err }
    }
}

/**
 * Order a specific number through Telnyx APIs
 * @param {*} number
 * @returns
 */
async function reserve(number) {
    let request_data = {
      "billing_group_id": p_config.default_billing_group_id,
      "connection_id": p_config.default_connection_id,
      "phone_numbers": [{"phone_number": number }]
    }

    // Place order request
    try {
      const payload = await http_request(post, 'number_orders', request_data);
      return payload.data
    } catch (err) {
      return { code: 500, error: err }
    }
}

async function release(type, number, state, npa, nxx, ratecenter, result_limit) {
  return new Promise(async (resolve, reject) => {
    if (result_limit == null || result_limit <= 0) result_limit = 10;

    let filter = {
      phone_number_type: type,
      limit: result_limit,
    };

    // NPA filter add
    if (npa != null && npa.trim().length > 0) {
      filter.national_destination_code = npa;

      // Filter by NXX
      if(nxx != null && nxx.trim().length > 0) {
        filter.phone_number = { "starts_with": number };

      // Filter by number (a match case can be expressed)
      } else if (number != null && number.trim().length > 0) {
        let ops = "contains";

        if(number.slice(0) === '%' && number.slice(-1) !== '%') {
          ops = "starts_with";
        } else if(number.slice(0) !== '%' && number.slice(-1) === '%') {
          ops = "ends_with";
        }

        filter.phone_number = { [ops]: number };
      }
    }

    // A country code is always needed
    filter.country_code = (state != null && state.trim().length > 0) ? state.toUpperCase() : "US";

    // Filter by ratecenter
    if (ratecenter != null && ratecenter.trim().length > 0) filter.rate_center = ratecenter.toUpperCase();

    // Place lookup request
    try {
      const payload = await http_request(get, 'available_phone_numbers', filter);
      resolve(extract_numbers(payload.data, npa, nxx));
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  // Function to exports in format: <function exported name>:<function local name>
  lookup: lookup,
  reserve: reserve,
  release: release
};
