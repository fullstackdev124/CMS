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

  Model.updateUserBalance = async customer_id => {
    return new Promise(async (resolve, reject) => {
      // SUM all transaction to correctly retrieve user balance -- TODO probably transaction have to be summarized
      // after a while to avoid table entries growing up
      let query = `SELECT ROUND(SUM(amount), 2) as 'balance' FROM payment_transaction WHERE customerId = '${customer_id}'`;

      try {
        Model.dataSource.connector.query(query, async (err, balance) => {
          if (err) reject(err);
          if (balance && balance.length > 0) {
            // Normalize balance return if needed
            balance = parseFloat(balance[0].balance);

            // Update customer balance
            query = `UPDATE customer SET balance = '${balance}' WHERE id = '${customer_id}'`;

            // Don't wait for it
            const customer = app.models.Customer;
            await customer.dataSource.connector.query(query, async (err, updated_customer) => {
              if (err) reject(err);
              resolve({customer: customer_id, balance: balance});
            });
          } else {
            reject({statusCode: 404, message: 'Nothing found!'});
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  };

  /**
   * Create a payment treansaction object
   * @param {Number} amount transaction amount
   * @param {String} currency transaction currency
   * @param {String} type transaction type (credit or debit)
   * @param {Number} customer_id transaction target customer
   * @param {Number} payment_id payment method used for transaction
   * @param {Number} product_id product target of transaction
   * @param {String} description transaction textual description
   * @returns
   */
  Model.store = async (amount, type, currency, customer_id, payment_id, product_id, description) => {
    return new Promise(async (resolve, reject) => {
      if (!amount || amount <= 0) reject(new Error('Wrong transaction amount'));
      if (!customer_id) reject(new Error('Invalid customer'));
      if (!product_id) reject(new Error('Invalid product'));

      if (!type) type = 'debit';
      if (!currency) currency = 'USD';

      if (!description || description.toString().trim().length <= 0) description = 'Charge for ' + type + ' of ' + amount + ' ' + currency + ' to customer id: ' + customer_id;

      // Correct the sign based on transaction type
      amount = type == 'credit' ? amount : amount * -1;

      let transaction = {
        amount: amount,
        currency: currency,
        transactionDate: Date.now(),
        description: description,
        customerId: customer_id,
        paymentId: payment_id,
        productId: product_id,
      };

      // Store transaction
      Model.create(transaction, function (err, created_transaction) {
        if (err || !created_transaction) {
          if (err) err = new Error();
          err.statusCode = 500;
          err.message = 'Error creating transaction, if problem persists please contact administrator!';
          reject(err);
        } else {
          // Update Customer Balance (non-blocking)
          Model.updateUserBalance(customer_id);
          // Return Created Transaction
          resolve(created_transaction);
        }
      });
    });
  };
};
