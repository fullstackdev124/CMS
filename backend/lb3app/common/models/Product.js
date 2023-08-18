// Load Config
let config = require('../../server/config.json');
if (process.env.NODE_ENV == 'dev') config = require('../../server/config.dev.json');

const app = require('../../server/server');

// Product Map Template
var product_map = null;

module.exports = function (Model) {
  app.on('started', async function () {});

  Model.on('dataSourceAttached', async function (obj) {
    product_map = await Model.find();
  });

  /**
   * Internal Model Methods
   */
  Model.addCustomerProduct = async (model_ref, model_id, sku, recur, currency, price, min_qty, max_qty, user_id, customer_id, description) => {
    return new Promise(async (resolve, reject) => {
      Model.findOne({where: {sku: sku}}, function (err, found_product) {
        if (err || !found_product) {
          if (!err) {
            let err = new Error();
            err.statusCode = 500;
            err.message = 'Error finding related product, notify administrator if the problem persists.';
          }

          reject(err);
        }

        // Revert to default
        if (!min_qty) min_qty = 1;
        if (!max_qty) max_qty = 1;

        // Generating product variation name
        const name = found_product.sku + '-' + customer_id + '-' + user_id + '-' + Date.now();

        // Define reference here for error handling
        let stripe_product = null;
        let stripe_price = null;
        let stripe_sub = null;

        // Define a Payment Method Model Reference
        const pm = app.models.PaymentMethod;

        // Retrieving Local Customer
        const c_model = app.models.Customer;
        c_model
          .findOne({where: {id: customer_id}})
          .then(async customer => {
            // Retrieving Stripe Customer
            const stripe_customer = await pm.get_customer(customer);
            if (!stripe_customer) {
              let err = new Error();
              err.statusCode = 500;
              err.message = 'Unable to retrieve customer details, notify administrator if the problem persists.';
              reject(err);
            }

            // If not defined revert to preferred currency
            if (!currency) currency = customer.currency;

            // Creating product variation entity
            let product_variation = {
              sku: name,
              recur: recur,
              price: price,
              userId: user_id,
              currency: currency,
              model_ref: model_ref,
              max_quantity: max_qty,
              model_ref_id: model_id,
              customerId: customer_id,
              description: description,
              productId: found_product.id,
            };

            const created_product = await pm.create_product(product_variation);
            if (!created_product) {
              if (!err) err = new Error();
              err.statusCode = 500;
              err.message = 'Unable to create product, notify administrator if the problem persists.';
              reject(err);
            }

            // Convert amount
            let amount = Number(parseFloat(created_product.price).toFixed(2)) * 100;

            // Update reference
            stripe_product = created_product;

            let recurring = null;
            let type = 'recurring';

            // Evaluate charge recurrence
            if (!created_product.recur || created_product.recur == 'onetime' || created_product.recur == 'request' || created_product.recur == none) type = 'one_time';
            else recurring = {interval: created_product.recur};

            // Create Subscription
            if (type == 'recurring') {
              let price = {
                unit_amount: amount,
                product: created_product.token,
                currency: created_product.currency,
              };

              if (type == 'recurring') price.recurring = recurring;

              // Generating or retrieving an already existing Product Price
              const created_price = await pm.create_price(price);
              if (!created_price) {
                let err = new Error();
                err.statusCode = 500;
                err.message = 'Unable to create product plan, notify administrator if the problem persists.';
                reject(err);
              }

              // Update reference
              stripe_price = created_price;

              const created_sub = await pm.create_subscription(stripe_customer.id, created_price.id);
              if (!created_sub) {
                let err = new Error();
                err.statusCode = 500;
                err.message = 'Unable to initialize plan for product, notify administrator if the problem persists.';
                reject(err);
              }

              // Update reference
              stripe_sub = created_sub;

              // Persist Product Variation entity
              const prvar = app.models.ProductVariation;
              prvar.create(created_product, function (err, created_prvar) {
                if (err || !created_prvar) {
                  if (!err) err = new Error();
                  err.statusCode = 500;
                  err.message = 'Unable to finalize product creation, notify administrator if the problem persists.';
                  reject(err);
                }
              });
            } else {
              const primary_method = await pm.get_primary_method(customer);
              if (!primary_method) {
                let err = new Error();
                err.statusCode = 500;
                err.message = 'Unable to find customer payment method, notify administrator if the problem persists.';
                reject(err);
                return
              }

              const created_charge = await pm.create_charge(amount, customer.currency, true, customer, primary_method, description, false);
              if (!created_charge) {
                let err = new Error();
                err.statusCode = 500;
                err.message = 'Unable to charge customer for product, notify administrator if the problem persists.';
                reject(err);
                return
              }
            }

            // Return stripe product
            resolve(stripe_product);
          })
          .catch(e => {
            if (stripe_price) pm.archive_price(stripe_price.id);
            if (stripe_sub) pm.cancel_subscription(stripe_sub.token);
            if (stripe_product) pm.delete_product(stripe_product.token);
            reject(e);
          });
      });
    });
  };

  /**
   * Exposed Methods
   */

  Model.reg_list = async function () {
    return new Promise(async (resolve, reject) => {
      Model.find({where: {group: 'plan'}}, function (err, found) {
        if (err || !found) {
          if (!err) {
            let err = new Error();
            err.statusCode = 500;
            err.message = 'Error retrieving products data!';
          }

          reject(err);
        } else {
          found = JSON.parse(JSON.stringify(found));
          resolve(found);
        }
      });
    });
  };

  Model.remoteMethod('reg_list', {
    accepts: [],
    http: {verb: 'get'},
    returns: [{type: 'Object', root: true}],
  });

  /**
   * Assign a product to a customer
   * @param customer_id	customer identifier
   * @param product_id product variation identifier
   * @param quantity	product quantity
   */
  Model.subscribe_product = async function (customer_id, product_id, quantity) {
    return new Promise(async (resolve, reject) => {
      let cust_product_rel = app.models.CustomerProductsRel;
      let prod_rel = {
        quantity: quantity,
        customerId: customer_id,
        productId: product_id,
      };

      cust_product_rel.create(prod_rel, function (err, result) {
        if (!err && result) {
          resolve(result);
        } else {
          if (!err) {
            let err = new Error();
            err.statusCode = 500;
            err.message = 'Error validating product data!';
          }

          reject(err);
        }
      });
    });
  };

  Model.remoteMethod('subscribe_product', {
    accepts: [
      {arg: 'customer_id', type: 'number', required: true},
      {arg: 'product_id', type: 'number', required: true},
      {arg: 'quantity', type: 'number', required: true},
    ],
    http: {verb: 'post'},
    returns: [{type: 'object', root: true}],
  });

  /**
   * Deassign a product from a customer
   * @param customer_id	customer identifier
   * @param product_id product identifier
   */
  Model.unsubscribe_product = async function (customer_id, product_id) {
    return new Promise(async (resolve, reject) => {
      let cust_product_rel = app.models.CustomerProductsRel;
      cust_product_rel.findOne({where: {and: [{customerId: customer_id}, {productId: product_id}]}}, function (err, cprel_result) {
        if (!err && cprel_result) {
          cust_product_rel.deleteById(cprel_result.id);
          resolve(cprel_result);
        } else {
          if (!err) {
            let err = new Error();
            err.statusCode = 500;
            err.message = 'Unable to find customer reference to given product!';
          }

          reject(err);
        }
      });
    });
  };

  Model.remoteMethod('unsubscribe_product', {
    accepts: [
      {arg: 'customer_id', type: 'number', required: true},
      {arg: 'product_id', type: 'number', required: true},
    ],
    http: {verb: 'post'},
    returns: [{type: 'object', root: true}],
  });
};
