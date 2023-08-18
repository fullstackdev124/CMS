'use strict';
const crypto = require('crypto');
var app = require('../../server/server');

module.exports = function (Model) {
  app.on('started', function () {
    Model.nestRemoting('Products');
  });

  // Create Proper Admin and Roles After a Customer Get Created
  Model.afterRemote('create', (ctx, customer, next) => {
    console.log("Customer created:", customer);
    next();
  });

  Model.createCustomer = async customer => {
    return new Promise(async (resolve, reject) => {
      const settings = {
        localdid: 2,
        tollfree: 3,
        localdid_fee: 0,
        tollfree_fee: 0,
      };

      let new_customer = {
        enabled: 1,
        firstName: '',
        lastName: '',
        vatNumber: '',
        companyName: customer.name,
        address: customer.address,
        city: '',
        state: '',
        country: '',
        zip: '',
        phone: customer.phone,
        settings: JSON.stringify(settings),
      };

      Model.create(new_customer, function (err, result) {
        if (!err && result) {
          resolve(result);
        } else {
          if (!err) {
            let err = new Error();
            err.statusCode = 500;
            err.message = 'Error validating customer data!';
          }

          reject(err);
        }
      });
    });
  };

  /**
   * Charge Customer Wallet.
   * @param {*} customerId
   * @param {*} amount
   * @param {*} description
   * @param {*} options
   * @returns
   */
  Model.charge_wallet = async (customerId, amount, description, options) => {
    return new Promise(async (resolve, reject) => {
      if (!customerId) reject(new Error('Invalid customer to charge.'));
      if (!amount) reject(new Error('Invalid amount to charge.'));

      const token = JSON.parse(JSON.stringify(options.accessToken));
      if (!token) reject(new Error('Invalid user or customer.'));

      const c_model = app.models.Customer;
      c_model.findOne({where: {id: customerId}})
        .then(async customer => {
          const transaction = {
            amount: amount,
            productId: 3, // manual charge or refund
            paymentId: null,
            customerId: customer.id,
            currency: customer.currency,
            description: description != null && description.trim().length > 0 ? description : 'Wallet charged per admin request',
          };

          const p_model = app.models.PaymentMethod;
          if (customer && customer.token && customer.token!="" && (!customer.billingId || customer.billingId=="")) {
            await p_model.save_billing_id(customer)
          }

          const pt = app.models.PaymentTransaction;
          pt.create(transaction, null);

          let balance = customer.balance
          balance = Number(parseFloat(balance).toFixed(2)) + Number(parseFloat(amount).toFixed(2));

          const pm = app.models.PaymentMethod;
          let results = await pm.update_wallet(customer, amount);
          if (results && results.affectedRows > 0)
            resolve({id: customer.id, balance: balance});
          else
            reject(null);
        })
        .catch(e => {
          reject(e)
        });
    });
  }

  Model.remoteMethod('charge_wallet', {
    description: 'Charge customer wallet',
    http: {
      path: '/charge_wallet',
      verb: 'put',
    },
    accepts: [
      {arg: 'customerId', type: 'number', required: true},
      {arg: 'amount', type: 'number', required: true},
      {arg: 'description', type: 'string', required: true},
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},
    ],
    returns: [{type: 'boolean', root: true}],
  });

  /**
   * Set Customer Availability
   * @param {*} customer
   * @param {*} enabled
   * @returns
   */
  Model.setstatus = async (customer, enabled) => {
    return new Promise(async (resolve, reject) => {

      const token = JSON.parse(JSON.stringify(options.accessToken));
      if (!token) reject(new Error('Invalid user or customer.'));

      if(token.DashUser.id > 1) reject(new Error('User not allowed.'));

      Model.findOne({where: {id: customer.id}})
        .then(async found_customer => {
          found_customer.enabled = enabled;
          cus.updateAll({'id': found_customer.id}, updated_customer, (err, result) => {
            if(!err) resolve(true);

            reject(false);
          });
        })
        .catch(e => {
          reject(e)
        });
    });
  }

  Model.remoteMethod('setstatus', {
    description: 'Enable/Disable customer status',
    http: {
      path: '/set_status',
      verb: 'post',
    },
    accepts: [
      {arg: 'customer', type: 'object', required: true},
      {arg: 'enabled', type: 'boolean', required: true},
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},
    ],
    returns: [{type: 'boolean', root: true}],
  });

};
