// Load Config
let config = require('../../server/config.json');
if (process.env.NODE_ENV == 'dev') config = require('../../server/config.dev.json');

const app = require('../../server/server');
const moment = require('moment');

// Load Stripe Module
let stripe = require('stripe')(config.payment.stripe.secret_prod_key);
if (process.env.NODE_ENV == 'dev') stripe = require('stripe')(config.payment.stripe.secret_dev_key);

module.exports = function (Model) {
  app.on('started', function () {});

  const remotes = app.remotes();

  remotes.before('*.find', function (ctx, next) {
    const token = JSON.parse(JSON.stringify(ctx.req.accessToken));

    if (token) {
      const user_id = token.userId;
      const customer_id = token.DashUser.customerId;

      // Inject Customer Id to avoid unattended data retrival
      if (user_id > 1 && customer_id > 1) {
        let tmp_filter = {};
        if (!ctx.req.query.filter) ctx.req.query.filter = {};
        tmp_filter = typeof ctx.req.query.filter == 'object' ? JSON.parse(JSON.stringify(ctx.req.query.filter)) : JSON.parse(ctx.req.query.filter);
        if (tmp_filter.where) {
          tmp_filter.where = {and: [tmp_filter.where]};
          tmp_filter.where.and.push({customerId: customer_id});
        } else {
          tmp_filter.where = {customerId: customer_id};
        }

        ctx.req.query.filter = JSON.stringify(tmp_filter);
      }
    }

    console.log('Just for breakpoint purpose.');
    next();
  });

  /**
   * Check for customer sync between local db and payment portal,
   * If check fails customer will be blocked.
   * Admin can force syncup.
   * @param {*} customer
   * @returns
   */
  Model.customersync = async (customer, sync) => {
    return new Promise(async (resolve, reject) => {

      const token = JSON.parse(JSON.stringify(options.accessToken));
      if (!token) reject(new Error('Invalid user or customer.'));

      // Force sync action to false if issued by other user than SAdmin
      if(token.DashUser.id > 1) sync = false;

      let found = false;
      if(customer && customer.token && customer.token.trim().length > 1) {
        found = true;
      } else {
        const customer = await stripe.customers.retrieve(customer.token);
        if(!customer.error) found = true;
      }

      // Customer not found, creating it
      if(!found) {
        // Async found, disable customer
        customer.enabled = false;
        const cus = app.models.Customer;
        await cus.updateAllPromise({'id': customer.id}, customer);
        if(sync) await stripe.customers.create({name: customer.companyName, email: customer.billingEmail})
        .then(async function (stripe_customer) {
          // Update customer with new token
          customer.token = stripe_customer.id;
          await cus.updateAllPromise({'id': customer.id}, customer);

          // If customer not found paytment method can't exists (due to 3ds validation)
          // Remove already associated local methods.
          const pym = app.models.PaymentMethod;
          await pym.destroyAll({where: {customerId: customer.id}});

          // Also attached plans have to be locally removed
          const pvr = app.models.ProductVariation;
          await pvr.destroyAll({where: {customerId: customer.id}});

          // N.B.: Local wallet will be left untouched
        }).catch(function (err) {
          reject(err);
        });

        // Return sync status
        resolve(found);
      }
    });
  }

  /**
   * Validate and register a new Customer witht associated payment method
   * @param {*} customer_email
   * @param {*} payment
   * @param {*} service
   * @param {*} customer
   * @returns
   */
  Model.register = async (email, payment, service, customer) => {
    return new Promise(async (resolve, reject) => {
      // For Credit Card Payment Type
      if (payment.type == 'card') {
        if (!payment.token || payment.token.trim().length <= 0) {
          let err = new Error();
          err.statusCode = 500;
          err.message = 'Data hijacking blocking transaction!';

          reject(err);
        }

        let variation = app.models.ProductVariation;
        variation.findOne({where: {id: service.planId}}, function (err, variation_result) {
          if (err || !variation_result) {
            let err = new Error();
            err.statusCode = 500;
            err.message = 'Error retrieving subscription plan!';
            reject(err);
          } else {
            stripe.customers
              .create({name: customer.companyName, email: email})
              .then(async function (stripe_customer) {
                // Update local customer with payment gateway link data
                customer.token = stripe_customer.id;
                customer.save();

                // Attach an already created payment method and Attach Customer to It
                const stripe_payment = await stripe.paymentMethods.attach(payment.token, {customer: stripe_customer.id});
                if (!stripe_payment) {
                  let err = new Error();
                  err.statusCode = 500;
                  err.message = 'Unable to attach a payment method to the customer, notify administrator if the problem persists.';
                  reject(err);
                }

                // Build an expiration date
                let expdate = Date.parse(stripe_payment.exp_year + '-' + stripe_payment.exp_month + '-01');

                // Locally store payment method
                let payment_payload = {
                  primary: 1,
                  expDate: expdate,
                  token: stripe_payment.id,
                  name: stripe_payment.name,
                  customerId: customer.id,
                  description: stripe_payment.card.brand + ' - ' + stripe_payment.card.last4,
                };

                const pym = app.models.PaymentMethod;
                pym.create(payment_payload, async function (err, created_payment_method) {
                  if (!err && created_payment_method) {
                    // Update customer setting the default payment method
                    const updated_customer = await stripe.customers.update(stripe_customer.id, {
                      invoice_settings: {default_payment_method: stripe_payment.id},
                    });

                    if (!updated_customer) {
                      let err = new Error();
                      err.statusCode = 500;
                      err.message = 'Unable to update payment method for the customer, notify administrator if the problem persists.';
                      reject(err);
                    }

                    Model.get_product(variation_result)
                      .then(async stripe_product => {
                        // Update local product token with stripe id
                        variation_result.token = stripe_product.token;
                        variation_result.save();

                        Model.create_price_byproduct(variation_result)
                          .then(async function (stripe_price) {
                            Model.create_subscription(stripe_customer.id, stripe_price.id)
                              .then(async function (subscription_result) {
                                let cust_product_rel = app.models.CustomerProductsRel;
                                let prod_rel = {
                                  quantity: 1,
                                  recurType: 'month',
                                  customerId: customer.id,
                                  priceRef: stripe_price.id,
                                  productId: variation_result.id,
                                  subRef: subscription_result.id,
                                };

                                cust_product_rel.create(prod_rel, async function (err, result) {
                                  if (!err && result) {
                                    // Build an expiration date
                                    let expdate = Date.parse(stripe_payment.exp_year + '-' + stripe_payment.exp_month + '-01');

                                    // Locally store payment method
                                    let payment_payload = {
                                      expDate: expdate,
                                      customerId: customer.id,
                                      token: stripe_payment.id,
                                      name: stripe_payment.name,
                                      description: stripe_payment.brand + ' - ' + stripe_payment.last4,
                                    };

                                    // Charge customer for balance
                                    const created_charge = await Model.create_charge(service.starting_balance, customer.currency, false, customer, payment, null, true);
                                    if (!created_charge) {
                                      let err = new Error();
                                      err.statusCode = 500;
                                      err.message = 'Unable to charge customer for ' + amount + ' ' + customer.currency + ', notify administrator if the problem persists.';
                                      reject(err);
                                      return
                                    }

                                    // All done
                                    resolve(Object.assign(stripe_customer, stripe_payment, stripe_product));
                                  } else {
                                    if (!err) {
                                      let err = new Error();
                                      err.statusCode = 500;
                                      err.message = 'Error validating product data!';
                                    }
                                    reject(err);
                                  }
                                });
                              })
                              .catch(function (err) {
                                reject(err);
                              });
                          })
                          .catch(function (err) {
                            reject(err);
                          });
                      })
                      .catch(function (err) {
                        reject(err);
                      });
                  } else {
                    if (!err) {
                      err = new Error();
                      err.statusCode = 500;
                      err.message = 'Unable to locally store payment method!';
                    }
                    reject(err);
                  }
                });
              })
              .catch(function (err) {
                reject(err);
              });
          }
        });
      }
    });
  };

  /**
   * Create a Stripe Customer Card Object
   * @param {*} customer object
   * @param {*} card object
   * @returns Stripe Customer Card Object
   */
  Model.create_card = async (customer, card) => {
    return new Promise(async (resolve, reject) => {
      if (!customer.token || customer.token.trim().length < 0) {
        let err = new Error();
        err.statusCode = 500;
        err.message = 'Not accounted customer, please use another one';

        reject(err);
      }

      stripe.customers
        .createSource(customer.id, {source: card})
        .then(created_card => {
          resolve(created_card);
        })
        .catch(err => {
          reject(err);
        });
    });
  };

  /**
   * Return Stripe Customer Cards List
   * @param {*} customer object
   * @returns Stripe Customer Cards list
   */
  Model.get_cards = async customer => {
    return new Promise(async (resolve, reject) => {
      if (!customer.token || customer.token.trim().length < 0) {
        let err = new Error();
        err.statusCode = 500;
        err.message = 'Not accounted customer, please use another one';

        reject(err);
      }

      stripe.customers
        .listSources(customer.id, {object: 'card'})
        .then(cards_list => {
          resolve(cards_list);
        })
        .catch(err => {
          reject(err);
        });
    });
  };

  /**
   * Delete Stripe Customer Associated Card
   * @param {*} customer object
   * @param {*} card object
   * @returns Stripe Customer Cards list
   */
  Model.delete_card = async (customer, card) => {
    return new Promise(async (resolve, reject) => {
      if (!customer.token || customer.token.trim().length < 0) {
        let err = new Error();
        err.statusCode = 500;
        err.message = 'Not accounted customer, please use another one';

        reject(err);
      }

      if (!card.id || card.id.trim().length < 0) {
        let err = new Error();
        err.statusCode = 500;
        err.message = 'Invalid card, please use another one';

        reject(err);
      }

      stripe.customers
        .deleteSource(customer.token, card.id)
        .then(cards_list => {
          resolve(cards_list);
        })
        .catch(err => {
          reject(err);
        });
    });
  };

  /**
   * Set a primary payment method
   * @param {*} customer object
   * @returns Stripe Customer Cards list
   */
  Model.set_payment_primary = async (payment_id, options) => {
    return new Promise(async (resolve, reject) => {
      if (!payment_id) reject(new Error('Invalid payment method.'));

      const token = JSON.parse(JSON.stringify(options.accessToken));
      if (!token) reject(new Error('Invalid user or customer.'));

      const customer_id = token.DashUser.customerId;

      const c_model = app.models.Customer;
      let customer = await c_model.findOne({where: {id: customer_id}})
      if (customer && customer.token && customer.token!="" && (!customer.billingId || customer.billingId=="")) {
        await Model.save_billing_id(customer)
      }

      const query1 = `UPDATE payment_method SET isPrimary=1 WHERE customerId = ${customer_id} AND id  = ${payment_id}`;
      const query2 = `UPDATE payment_method SET isPrimary=0 WHERE customerId = ${customer_id} AND id != ${payment_id}`;

      try {
        Model.dataSource.connector.query(query1, (err, results) => {
          if (err) reject(false);
          if (results && results.affectedRows > 0)
            Model.dataSource.connector.query(query2, (err, results) => {
              if (err) reject(false);
              if (results && results.affectedRows > 0) {
                resolve(true);
              }
            });
        });
      } catch (e) {
        reject(false);
      }
    });
  };

  /**
   * Expose remote method above
   */
  Model.remoteMethod('set_payment_primary', {
    description: 'Set the primary payment method',
    http: {
      path: '/set_primary',
      verb: 'post',
    },
    accepts: [
      {arg: 'payment_id', type: 'number', required: true},
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},
    ],
    returns: [{type: 'boolean', root: true}],
  });

  /**
   * Get Customer Primary Payment Method
   * @param {*} customer object
   * @returns Stripe Customer Cards list
   */
  Model.get_primary_method = async customer => {
    return new Promise(async (resolve, reject) => {
      if (!customer) reject(new Error('Please provide a customer.'));
      if (!customer.token || customer.token.trim().length < 1) reject(new Error('Please provide a valid customer.'));

      try {
        Model.findOne({where: {and: [{customerId: customer.id}, {primary: 1}]}}).then(async payment_method => {
          if (payment_method && payment_method.token.trim().length > 0) {
            resolve(payment_method);
          } else {
            let err = new Error('Unable to find a valid payment method');
            reject(err);
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  };

  Model.has_primary_method = async (options) => {
    return new Promise(async (resolve, reject) => {
      const token = JSON.parse(JSON.stringify(options.accessToken));
      if (!token) reject(new Error('Invalid user or customer.'));

      const customer_id = token.DashUser.customerId;

      try {
        Model.findOne({where: {and: [{customerId: customer_id}, {primary: 1}]}}).then(async payment_method => {
          if (payment_method && payment_method.token.trim().length > 0) {
            resolve({ success: true});
          } else {
            resolve({ success: false});
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  };

  Model.remoteMethod('has_primary_method', {
    description: 'Has primary payment method',
    http: {
      path: '/has_primary_method',
      verb: 'get',
    },
    accepts: [
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},
    ],
    returns: {type: 'object', root: true},
  });

  Model.save_billing_id = async customer => {
    if (customer.billingId && customer.billingId!="")
      return
    // if (!customer.token || customer.token.trim().length < 0)
    //   return

    let token = customer.token.substring(4)
    let hash = 0;
    for (let i=0; i<token.length; i++) {
      hash  = (hash << 3) + (token.charCodeAt(i)-47);
      hash |= 0;
    }

    let id = "" + (Math.abs(hash))
    if (id.length>11)
      throw new Error('Something get wrong with Billing ID!');

    id = "00000000000000" + id
    customer.billingId = id.substring(id.length-11)
    await customer.save()
  }

  /**
   * Return Stripe Customer Object if exists
   * @param {*} customer token
   * @returns Stripe Customer Object
   */
  Model.get_customer = async customer => {
    return new Promise(async (resolve, reject) => {
      if (!customer.token || customer.token.trim().length < 0) {
        stripe.customers.create({name:customer.companyName, email: customer.billingEmail})
          .then(async function(stripe_customer) {
            customer.token = stripe_customer.id;
            await customer.save();

            await Model.save_billing_id(customer)
            resolve(stripe_customer)
          })
          .catch(err => {
            reject(err)
          })
        // let err = new Error();
        // err.statusCode = 500;
        // err.message = 'Not accounted customer, please use another one';
        //
        // reject(err);
      } else {
        if (customer && customer.token && customer.token!="" && (!customer.billingId || customer.billingId=="")) {
          await Model.save_billing_id(customer)
        }

        stripe.customers
          .retrieve(customer.token)
          .then(stripe_customer => {
            resolve(stripe_customer);
          })
          .catch(err => {
            reject(err);
          });
      }
    });
  };

  /**
   * Retrieve or create, if not present, a product from payment gateway
   * @param {*} ProductVariation
   * @returns
   */
  Model.create_product = async product_variation => {
    return new Promise(async (resolve, reject) => {
      const product = app.models.Product;
      product.findOne({where: {id: product_variation.productId}}, function (err, found_product) {
        if (err) reject(err);

        // Build a unique product name
        const product_name = found_product.sku + '-' + product_variation.id + '-' + product_variation.customerId + '-' + new Date().getTime();

        stripe.products
          .create({name: product_name})
          .then(function (stripe_product) {
            product_variation.token = stripe_product.id;
            resolve(product_variation);
          })
          .catch(function (err) {
            reject(err);
          });
      });
    });
  };

  /**
   * Retrieve or create, if not exists, stripe product
   * @param {*} product
   * @returns
   */
  Model.get_product = async product => {
    return new Promise(async (resolve, reject) => {
      if (product.token == null) {
        Model.create_product(product)
          .then(function (stripe_product) {
            resolve(product);
          })
          .catch(function (err) {
            reject(err);
          });
      } else {
        stripe.products
          .retrieve(product.token)
          .then(function (stripe_product) {
            if (!stripe_product || stripe_product.id != product.token) {
              Model.create_product(product)
                .then(function (stripe_product) {
                  resolve(product);
                })
                .catch(function (err) {
                  reject(err);
                });
            } else {
              resolve(product);
            }
          })
          .catch(function (err) {
            Model.create_product(product)
              .then(function (stripe_product) {
                resolve(product);
              })
              .catch(function (err) {
                reject(err);
              });
          });
      }
    });
  };

  /**
   * Delete Payment Portal Product
   * @param {*} product
   * @returns
   */
  Model.delete_product = async product_token => {
    return new Promise(async (resolve, reject) => {
      stripe.products
        .del(product_token)
        .then(function (deleted_product) {
          resolve(deleted_product);
        })
        .catch(function (err) {
          // Unable to remove probably due to an attached price
          // Just archive it
          stripe.products
            .update(product_token, {active: false, description: 'Archived due to a delete request'})
            .then(function (archived_product) {
              resolve(archived_product);
            })
            .catch(function (err) {
              reject(err);
            });
        });
    });
  };

  /**
   * Retrieve or create, if not present, a price from payment gateway
   * @param {*} product
   * @returns
   */
  Model.get_price = async product => {
    return new Promise(async (resolve, reject) => {
      if (!product.hasOwnProperty('plan') || product.plan.trim().length <= 0) {
        Model.create_price(product)
          .then(function (stripe_price) {
            resolve(stripe_price);
          })
          .catch(function (err) {
            reject(err);
          });
      } else {
        stripe.plans
          .retrieve(product.plan)
          .then(function (stripe_price) {
            if (!stripe_price) {
              Model.create_price(product)
                .then(function (stripe_price) {
                  resolve(stripe_price);
                })
                .catch(function (err) {
                  reject(err);
                });
            } else {
              resolve(stripe_price);
            }
          })
          .catch(function (err) {
            Model.create_price(product)
              .then(function (stripe_price) {
                resolve(stripe_price);
              })
              .catch(function (err) {
                reject(err);
              });
          });
      }
    });
  };

  /**
   * Create Payment Portal Price
   * @param {*} price
   * @returns
   */
  Model.create_price = async price => {
    return new Promise(async (resolve, reject) => {
      stripe.prices
        .create(price)
        .then(function (stripe_price) {
          resolve(stripe_price);
        })
        .catch(function (err) {
          reject(err);
        });
    });
  };

  /**
   * Create Payment Portal Price Desumed by Product Variation Model
   * @param {*} product_variation
   * @returns
   */
  Model.create_price_byproduct = async product => {
    return new Promise(async (resolve, reject) => {
      stripe.prices
        .create({
          unit_amount: parseInt(product.price) * 100,
          currency: product.currency,
          recurring: {interval: product.recur},
          product: product.token,
        })
        .then(function (stripe_price) {
          resolve(stripe_price);
        })
        .catch(function (err) {
          reject(err);
        });
    });
  };

  /**
   * Archive Payment Portal Price
   * @param {*} price_token
   * @returns
   */
  Model.archive_price = async token => {
    return new Promise(async (resolve, reject) => {
      stripe.prices
        .update(token, {
          active: false,
        })
        .then(function (archived_price) {
          resolve(archived_price);
        })
        .catch(function (err) {
          reject(err);
        });
    });
  };

  /**
   * Create Payment Portal Recurring Subscription
   * @param {String} customer_id reference
   * @param {String} price_id reference
   * @returns
   */
  Model.create_subscription = async (customer, price) => {
    return new Promise(async (resolve, reject) => {
      stripe.subscriptions
        .create({
          customer: customer,
          items: [{price: price}],
        })
        .then(function (created_subs) {
          resolve(created_subs);
        })
        .catch(function (err) {
          reject(err);
        });
    });
  };

  /**
   * Cancel Payment Portal Recurring Subscription
   * @param {String} subscription_token
   * @returns
   */
  Model.cancel_subscription = async token => {
    return new Promise(async (resolve, reject) => {
      stripe.subscriptions
        .del(token)
        .then(function (cancelled_subs) {
          resolve(cancelled_subs);
        })
        .catch(function (err) {
          reject(err);
        });
    });
  };

  /**
   * Create a one time charge
   * @param {*} amount to be charged
   * @param {*} currency of the amount
   * @param {*} subtract or add amount to customer wallet
   * @param {*} customer to be charged
   * @param {*} payment contains the payment customer object to be charged
   * @param {*} description of the charge
   * @param {*} isCharge true for Customer Charge otherwise for PaymentIntent
   * @returns transaction oject
   */
  Model.create_charge = async (amount, currency, subtract, customer, payment, description, productId, isCharge) => {
    return new Promise(async (resolve, reject) => {
      if (!amount || amount < 1) {
        reject(new Error('Provide a valid amount to refund.'));
        return
      }

      if (!customer) {
        reject(new Error('A valid customer is needed.'));
        return
      }

      if (!productId)
        productId = 3

      try {

        // If a payment object is not expressed we're going to charge the local wallet
        if (!payment || !payment.token) {
          const transaction = {
            amount: amount,
            productId: productId,
            paymentId: null,
            customerId: customer.id,
            currency: customer.currency,
            description: description != null && description.trim().length > 0 ? description : 'Wallet charged per user request (no payment method available at the moment)',
          };

          const pt = app.models.PaymentTransaction;
          await pt.create(transaction, null);

          // Can we superseed on this? -- TODO send an error email if something wrong
          const wallet_update = await Model.update_wallet(customer, amount, subtract);

          // Return created payment intent
          resolve(wallet_update);

        } else {

          /**
           * Try to directly charge (or intent for payment) the customer primary payment method
           */

          let paymentObject = null;

          if(isCharge === true) {

            const charge_payload = {
              amount: amount * 100,
              customer: customer.token,
              currency: currency ? currency : customer.currency
            }

            const charge = await stripe.charges.create(charge_payload);
            paymentObject = charge;
          } else {

            const intent = {
              customer: customer.token,
              setup_future_usage: 'off_session',
              amount: amount * 100,
              currency: currency ? currency : customer.currency,
              automatic_payment_methods: {
                enabled: true,
              },
            };

            const paymentIntent = await stripe.paymentIntents.create(intent);
            paymentObject = paymentIntent;
          }

          // Something went wrong
          if(!paymentObject) {
            reject(new Error('Unable to properly charge customer.'));
          }

          try {
            const transaction = {
              amount: amount,
              productId: productId,
              paymentId: payment.id,
              token: paymentObject.id,
              customerId: customer.id,
              currency: customer.currency,
              description: description != null && description.trim().length > 0 ? description : 'Customer service charge.',
            };

            const pt = app.models.PaymentTransaction;
            pt.create(transaction, null);

            // Can we superseed on this? -- TODO send an error email if something wrong
            const wallet_update = await Model.update_wallet(customer, amount, subtract);

            // Return the payment object used
            resolve(paymentObject);
          } catch (err) {
            // TODO -- Probably an email should to be sent
            reject(err);
          }
        }
      } catch (err) {
        // TODO -- Probably an email should to be sent
        reject(err);
      }
    });
  };

  Model.refund_charge = async(amount, currency, customer, payment, description, productId, tx) => {
    return new Promise(async (resolve, reject) => {
      if (!amount) {
        reject(new Error('Provide a valid amount to refund.'));
        return
      }

      if (!customer) {
        reject(new Error('A valid customer is needed.'));
        return
      }

      if (!productId)
        productId = 3

      // Create charge object
      const charge = { charge: tx.token };

      // Add amount for partial refund
      amount = Number(parseFloat(amount).toFixed(2));
      if(amount == tx.amount) charge.amount = amount;

      try {
        stripe.refunds.create(charge, async function (err, paymentIntent) {
          console.log(err)
          if (err || !paymentIntent) {
            console.log(err)
            reject(new Error('Unable to create a refund request, try again later.'))
            return
          }

          try {
            const transaction = {
              amount: (-1) * amount,
              productId: productId,
              paymentId: payment.id,
              customerId: customer.id,
              currency: customer.currency,
              description: description != null && description.trim().length > 0 ? description : "" + (-1) * amount + " refunded per user request.",
            };

            const pt = app.models.PaymentTransaction;
            pt.create(transaction, null);

            const query = `UPDATE payment_transaction SET is_refunded=1 WHERE id = ${tx.id}`;
            Model.dataSource.connector.query(query, async (err, results) => {})

            // Can we superseed on this? -- TODO send an error email if something wrong
            const wallet_update = await Model.update_wallet(customer, amount, true, false);

            // Return created payment intent
            resolve(paymentIntent);
          } catch (err) {
            // TODO -- Probably an email should to be sent
            reject(err);
          }
        })
      } catch (err) {
        reject(err)
      }
    })
  }

  /**
   * Retrieve a list of charges for a specific customer
   * @param {*} customer
   * @returns
   */
  Model.charges_list = async customer => {
    return new Promise(async (resolve, reject) => {
      if (!customer.token) {
        let err = new Error();
        err.statusCode = 500;
        err.message = 'Not a valid billing user.';
        reject(err);
      }

      stripe.charges
        .search({query: "customer: '" + customer.token + "'"})
        .then(function (charges) {
          resolve(charges);
        })
        .catch(function (err) {
          reject(err);
        });
    });
  };

  /**
   * Update customer wallet balance with amount
   * @param {*} customer_id reference to customer wallet
   * @param {*} amount to charge (can be negative or positive number)
   */
  Model.update_wallet = async (customer, amount, subtract, isAutoCharge) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Retrieve updated customer balance
        let balance = await Model.customer_balance(customer.id);

        // Apply
        if (subtract) balance = Number(parseFloat(balance.balance).toFixed(2)) - Number(parseFloat(amount).toFixed(2));
        else balance = Number(parseFloat(balance.balance).toFixed(2)) + Number(parseFloat(amount).toFixed(2));

        // Update Customer Balance
        const query = `UPDATE customer SET balance = ${balance} WHERE id = ${customer.id}`;

        try {
          Model.dataSource.connector.query(query, async (err, results) => {
            if (err) reject(err);
            if (results && results.affectedRows > 0) {
              if (isAutoCharge==null || isAutoCharge==true) {
                try {
                  Model.auto_charge(customer.id).then(result => {
                    resolve(results);
                  }).catch(err => {
                    resolve(results);
                  });
                } catch (err) {
                  resolve(results);
                }
              } else {
                resolve(results);
              }
            }
          });
        } catch (err) {
          reject(err);
        }
      } catch (err) {
        reject(err);
      }
    });
  };

  Model.customer_charging_settings = async customer_id => {
    return new Promise(async (resolve, reject) => {
      try {
        // Used a select to be fastest as possible
        const query = `SELECT settings FROM customer WHERE id = ${customer_id}`;

        try {
          Model.dataSource.connector.query(query, (err, charging_settings) => {
            if (err) reject(err);
            if (charging_settings)  resolve(charging_settings.pop());
            else reject(null);
          });
        } catch (err) {
          reject(err);
        }
      } catch (err) {
        reject(err);
      }
    });
  };

  /**
   * Get customer wallet balance
   * @param {*} customer_id reference to customer wallet
   */
  Model.customer_balance = async customer_id => {
    return new Promise(async (resolve, reject) => {
      try {
        // Used a select to be fastest as possible
        const query = `SELECT balance FROM customer WHERE id = ${customer_id}`;

        try {
          Model.dataSource.connector.query(query, (err, balance) => {
            if (err) reject(err);
            if (balance) resolve(balance.pop());
            else reject(null);
          });
        } catch (err) {
          reject(err);
        }
      } catch (err) {
        reject(err);
      }
    });
  };

  /**
   * Expose remote method above
   */
  Model.remoteMethod('customer_balance', {
    description: 'Retrieve customer wallet balance',
    http: {
      path: '/customer_balance',
      verb: 'post',
    },
    accepts: [{arg: 'customer_id', type: 'string', required: true}],
    returns: [{type: 'object', root: true}],
  });

  Model.auto_charge = async customer_id => {
    return new Promise(async (resolve, reject) => {
      try {
        const c_model = app.models.Customer;
        c_model.findOne({where: {id: customer_id}})
          .then(async customer => {
            let balance = customer.balance
            let settings = customer.settings

            let falls = 15, autoAmount = 35;
            try {
              if (settings) {
                let prices = JSON.parse(settings)
                if (prices && prices.priceFalls)
                  falls = prices.priceFalls
                if (prices && prices.priceCharge)
                  autoAmount = prices.priceCharge
              } else {
              }
            } catch(err) {
            }

            let results = { code: 200, message: "Sufficient balance!"}
            if (balance<falls) {
              const pm = app.models.PaymentMethod;
              try {
                pm.get_customer(customer)
                  .then(stripe_customer => {
                    pm.get_primary_method(customer)
                      .then(primary_method => {
                        Model.create_charge(autoAmount, customer.currency, false, customer, primary_method, "Auto-Charging", 4, false)
                          .then(created_charge => {
                            console.log("Auto-Charge Result", created_charge)
                            resolve(results);
                          })
                          .catch(err => {
                            console.log("Auto-Charge Error", err)
                            reject(err);
                          })
                      })
                      .catch(err => {
                        console.log("Auto-Charge method", err)
                        reject(err);
                      })
                  })
                  .catch(err => {
                    console.log("Auto-Charge customer", err)
                    reject(err);
                  })
              } catch (err) {
                reject(err);
              }
            } else {
              resolve(results);
            }

          })
          .catch(err => {
            reject(err)
          })
      } catch (err) {
        reject(err);
      }
    });
  };

  /**
   * Expose remote method above
   */
  Model.remoteMethod('auto_charge', {
    description: 'auto-charge customer wallet',
    http: {
      path: '/auto_charge',
      verb: 'post',
    },
    accepts: [{arg: 'customer_id', type: 'string', required: true}],
    returns: [{type: 'object', root: true}],
  });

  /**
   * Charge a customer
   * @param {*} amount to be charged
   * @param {*} payment_token contains reference to payment method to be charged
   * @returns Transaction object
   */
  Model.charge_customer = async (amount, payment_token, customerId, options) => {
    return new Promise(async (resolve, reject) => {
      if (!amount) reject(new Error('Invalid amount to charge.'));
      if (!payment_token) reject(new Error('Invalid payment method to charge.'));

      const token = JSON.parse(JSON.stringify(options.accessToken));
      if (!token) reject(new Error('Invalid user or customer.'));

      let description = null

      let customer_id = token.DashUser.customerId;
      if (customerId) {
        customer_id = customerId
        description = "Deposit made by admin."
      }
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
            return
          }

          let primary_method = await pm.findOne({where: {token: payment_token}})
          if (!primary_method) {
            primary_method = await pm.get_primary_method(customer);
          }

          if (!primary_method) {
            let err = new Error();
            err.statusCode = 500;
            err.message = 'Unable to find customer payment method, notify administrator if the problem persists.';
            reject(err);
            return
          }

          // Charge User on Stripe
          const created_charge = await Model.create_charge(amount, customer.currency, false, customer, primary_method, description, false);
          if (!created_charge) {
            let err = new Error();
            err.statusCode = 500;
            err.message = 'Unable to charge customer for ' + amount + ' ' + customer.currency + ', notify administrator if the problem persists.';
            reject(err);
            return
          }

          resolve(created_charge);
        })
        .catch(e => {
          reject(e);
        });
    });
  };

  /**
   * Expose remote method above
   */
  Model.remoteMethod('charge_customer', {
    description: 'Charge customer wallet',
    http: {
      path: '/charge_customer',
      verb: 'post',
    },
    accepts: [
      {arg: 'amount', type: 'number', required: true},
      {arg: 'source', type: 'string', required: true},
      {arg: 'customerId', type: 'number', required: false},
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},
    ],
    returns: [{type: 'boolean', root: true}],
  });

  /**
   * Retrieve Customer Wallet Balance - meant to be called by external clients
   * @param {String} options where to find customer reference
   * @returns
   */
  Model.balance = async options => {
    return new Promise(async (resolve, reject) => {
      const token = JSON.parse(JSON.stringify(options.accessToken));
      if (!token) resolve({balance: 0});

      // Retrieve customer from request
      const customer_id = token.DashUser.customerId;

      try {
        // Used a select to be fastest as possible
        const query = `SELECT balance FROM customer WHERE id = ${customer_id}`;

        try {
          Model.dataSource.connector.query(query, (err, balance) => {
            if (err) reject(err);
            if (balance) resolve(balance.pop());
            else reject(null);
          });
        } catch (err) {
          reject(err);
        }
      } catch (err) {
        reject(err);
      }
    });
  };

  /**
   * Expose remote method above
   */
  Model.remoteMethod('balance', {
    description: 'Retrieve customer balance',
    http: {
      path: '/balance',
      verb: 'get',
    },
    accepts: [{arg: 'options', type: 'object', http: 'optionsFromRequest'}],
    returns: [
      {
        arg: 'result',
        type: 'object',
        description: 'Account balance result.',
        root: true,
      },
    ],
  });

  /**
   * Create a Payment Intent for initial Checkout
   * @param {Number} amount to charge
   * @param {String} options where to find customer reference
   * @returns
   */
  Model.create_intent = async amount => {
    return new Promise(async (resolve, reject) => {
      if (!amount || amount <= 0) reject(new Error({statusCode: 500, message: 'Please provide a valid amount.'}));

      stripe.paymentIntents.create(
        {
          amount: Number(parseFloat(amount).toFixed(2)) * 100,
          currency: 'usd',
          payment_method_types: ['card'],
          setup_future_usage: 'off_session',
        },
        function (err, paymentIntent) {
          if (err) {
            reject(err);
          } else {
            resolve(paymentIntent);
          }
        },
      );
    });
  };

  /**
   * Expose remote method above
   */
  Model.remoteMethod('create_intent', {
    description: 'Create Payment Intent for Checkout',
    http: {
      path: '/create_intent',
      verb: 'post',
    },
    accepts: [{arg: 'amount', type: 'string', required: true}],
    returns: [
      {
        arg: 'result',
        type: 'object',
        description: 'Payment Intent Result Object.',
        root: true,
      },
    ],
  });

  /**
   * Create a new Payment Method for the Customer
   * @param {String} customer reference
   * @param {String} payment reference
   * @returns
   */
  Model.attach = async data => {
    return new Promise(async (resolve, reject) => {
      const pym = app.models.PaymentMethod;
      let customer_token = data.customer.token

      const c_model = app.models.Customer;
      let customer = await c_model.findOne({where: {id: data.customer.id}})

      if (!data.customer.token) {
        if (customer) {
          const stripe_customer = await pym.get_customer(customer)
          if (stripe_customer)
            customer_token = stripe_customer.id
        }
      } else {
        if (customer) {
          await Model.save_billing_id(customer)
        }
      }

      stripe.customers
        .createSource(customer_token, {source: data.payment.token})
        .then(function (stripe_payment) {
          // Build an expiration date
          let expdate = Date.parse(stripe_payment.exp_year + '-' + stripe_payment.exp_month + '-01');

          // Locally store payment method
          let payment_payload = {
            primary: 0,
            expDate: expdate,
            token: stripe_payment.id,
            name: stripe_payment.name,
            customerId: data.customer.id,
            description: stripe_payment.brand + ' - ' + stripe_payment.last4,
          };

          pym.create(payment_payload, function (err, payment_method) {
            if (!err && payment_method) {
              // Create Setup Intent
              stripe.setupIntents
                .create({
                  confirm: true,
                  customer: customer_token,
                  payment_method_types: ['card'],
                  payment_method: stripe_payment.id,
                })
                .then(function (setup_intent) {
                  resolve(stripe_payment);
                })
                .catch(function (err) {
                  reject(err);
                });
            } else {
              if (!err) {
                err = new Error();
                err.statusCode = 500;
                err.message = 'Unable to create payment method!';
              }
              reject(err);
            }
          });
        })
        .catch(function (err) {
          reject(err);
        });
    });
  };

  /**
   * Expose remote method above
   */
  Model.remoteMethod('attach', {
    description: 'Create a new Payment Method for the Customer',
    http: {
      path: '/attach',
      verb: 'post',
    },
    accepts: [
      {
        arg: 'payment',
        type: 'object',
        description: 'Payment Object (containing a customer object with ath laeast a valid customer id and a payment object at least containing a valid token)',
        required: true,
        http: {
          source: 'body',
        },
      },
    ],
    returns: [
      {
        arg: 'payment',
        type: 'object',
        description: 'Created Payment Object',
        root: true,
      },
    ],
  });

  /**
   * Detach an existing Payment Object from the Customer
   * @param {String} token reference
   * @returns
   */
  Model.detach = async token => {
    return new Promise(async (resolve, reject) => {
      stripe.paymentMethods
        .detach(token)
        .then(function (stripe_detached_payment) {
          const pym = app.models.PaymentMethod;
          pym.destroyAll({where: {token: token}}, function (err, payment_method) {
            if (!err && payment_method) {
              resolve(stripe_detached_payment);
            } else {
              if (!err) {
                err = new Error();
                err.statusCode = 500;
                err.message = 'Unable to create payment method!';
              }
              reject(err);
            }
          });
        })
        .catch(function (err) {
          reject(err);
        });
    });
  };

  /**
   * Expose remote method above
   */
  Model.remoteMethod('detach', {
    description: 'Detach an existing Payment Object from the Customer',
    http: {
      path: '/detach',
      verb: 'post',
    },
    accepts: [
      {
        arg: 'token',
        type: 'string',
        description: 'A valid payment object token reference.',
        required: true,
      },
    ],
    returns: [
      {
        arg: 'payment',
        type: 'object',
        description: 'Detached Payment Object',
        root: true,
      },
    ],
  });

  Model.refund = async (customerId, transactionId, amount, options) => {
    return new Promise(async (resolve, reject) => {
      if (!customerId) reject(new Error('Invalid customer to charge.'));
      if (!amount) reject(new Error('Invalid amount to charge.'));

      const token = JSON.parse(JSON.stringify(options.accessToken));
      if (!token) reject(new Error('Invalid user or customer.'));

      const c_model = app.models.Customer;
      c_model.findOne({where: {id: customerId}})
        .then(async customer => {
          const t_model = app.models.PaymentTransaction;
          const tx = await t_model.findOne({where: {id: transactionId}})
            .catch(err => {
              reject(err)
            })

          if (!tx) {
            reject(new Error("No Transaction"))
            return
          }

          const p_model = app.models.PaymentMethod;
          const pm = p_model.findOne({where: {id: tx.paymentId}})
            .catch(err => {
              reject(err)
            })

          if (!pm) {
            reject(new Error("No PaymentMethod"))
            return
          }

          if (customer && customer.token && customer.token!="" && (!customer.billingId || customer.billingId=="")) {
            await p_model.save_billing_id(customer)
          }

          p_model.refund_charge(amount, customer.currency, customer, pm, amount + " refunded by an administrator.", tx.productId, tx)
            .then(res => {
              resolve(res)
            })
            .catch(err => {
              reject(err)
            })
        })
        .catch(e => {
          reject(e)
        });
    });
  }

  Model.remoteMethod('refund', {
    description: 'Refund customer wallet',
    http: {
      path: '/refund',
      verb: 'put',
    },
    accepts: [
      {arg: 'customerId', type: 'number', required: true},
      {arg: 'transactionId', type: 'number', required: true},
      {arg: 'amount', type: 'number', required: true},
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},
    ],
    returns: [{type: 'boolean', root: true}],
  });

  Model.invoice = async (customerId, transactionId, options) => {
    return new Promise(async (resolve, reject) => {
      if (!customerId) reject(new Error('Invalid customer to charge.'));

      const token = JSON.parse(JSON.stringify(options.accessToken));
      if (!token) reject(new Error('Invalid user or customer.'));

      const c_model = app.models.Customer;
      c_model.findOne({where: {id: customerId}})
        .then(async customer => {
          const t_model = app.models.PaymentTransaction;
          const tx = await t_model.findOne({where: {id: transactionId}})
            .catch(err => {
              reject(err)
            })

          if (!tx) {
            reject(new Error("No Transaction"))
            return
          }

          const p_model = app.models.PaymentMethod;
          const pm = p_model.findOne({where: {id: tx.paymentId}})
            .catch(err => {
              reject(err)
            })

          if (!pm) {
            reject(new Error("No PaymentMethod"))
            return
          }

          if (customer && customer.token && customer.token!="" && (!customer.billingId || customer.billingId=="")) {
            await p_model.save_billing_id(customer)
          }

          let invoice = null
          try {
            invoice = await stripe.invoices.create({
              customer: customer.token,
              collection_method: 'send_invoice',
              auto_advance: false,
              days_until_due: 0,
              pending_invoice_items_behavior: 'exclude',
            })

            const invoiceItem = await stripe.invoiceItems.create({
              customer: customer.token,
              invoice: invoice.id,
              amount: tx.amount * 100,
              currency: tx.currency,
              description: tx.description + " " + tx.transactionDate.toISOString()
            })
          } catch (err) {
            console.log("Error in creating invoice", err)
            reject(err)
            return
          }

          if (invoice) {
            try {
              invoice = await stripe.invoices.finalizeInvoice(invoice.id)
              // console.log("F----", invoice)

              let invoice_details = null
              if (invoice) {
                invoice_details = {
                  id: invoice.id,
                }

                if (invoice.account_country)
                  invoice_details.country = invoice.account_country
                if (invoice.account_name)
                  invoice_details.name = invoice.account_name
                invoice_details.due_date = invoice.due_date
                invoice_details.pdf = invoice.invoice_pdf
                invoice_details.no = invoice.number

                const query = ` update payment_transaction set invoice_details='${JSON.stringify(invoice_details)}' where id=${tx.id} `
                try {
                  Model.dataSource.connector.query(query, async (err, results) => {
                    if (err) reject(err);
                    if (results && results.affectedRows > 0) {
                        resolve(results);
                    }
                  });
                } catch (err) {
                  reject(err);
                }
              } else {
                reject(new Error("Invoice cannot be created"))
              }
            } catch (err) {
              console.log("Error in finalizing invoice", err)
              reject(err)
              return
            }
          } else {
            reject(new Error("Invoice cannot be created"))
          }

        })
        .catch(e => {
          reject(e)
        });
    });
  }

  Model.remoteMethod('invoice', {
    description: 'Make a invoice',
    http: {
      path: '/invoice',
      verb: 'put',
    },
    accepts: [
      {arg: 'customerId', type: 'number', required: true},
      {arg: 'transactionId', type: 'number', required: true},
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},
    ],
    returns: [{type: 'boolean', root: true}],
  });


  Model.subscriptions = async (options) => {
    return new Promise(async (resolve, reject) => {
      const user = JSON.parse(JSON.stringify(options.accessToken));
      if (!user) {
        reject(new Error('Unauthorized!'));
        return
      }

      if (user.DashUser.id!=1) {
        reject(new Error('Unauthorized!'));
        return
      }

      let date_format = "MM/DD/YYYY"
      try {
        const f = JSON.parse(user.DashUser.uiSettings)
        if (f.dateFormat)
          date_format = f.dateFormat.toUpperCase()
      } catch (err){
        date_format = "MM/DD/YYYY"
      }

      let result = []
      let date_format = "MM/DD/YYYY"
      try {
        const f = JSON.parse(user.DashUser.uiSettings)
        if (f.dateFormat)
          date_format = f.dateFormat.toUpperCase()
      } catch (err){
        date_format = "MM/DD/YYYY"
      }

      let result = []
      const subscriptions = await stripe.subscriptions.list({limit: 100})

      const c_model = app.models.Customer;
      const pv_model = app.models.ProductVariation;
      const p_model = app.models.Product;

      const variations = []
      const customers = []
      const products = []

      if (subscriptions && subscriptions.data) {
        for(let item of subscriptions.data) {
          const row = {
            id: item.id,
            customer_token: item.customer,
            collection_method: item.collection_method,
            created: moment(item.created*1000).format(date_format),
            start_date: moment(item.start_date*1000).format(date_format),
            period: {
              start: moment(item.current_period_start*1000).format(date_format),
              end: moment(item.current_period_end*1000).format(date_format)
            },
            plan: {
              id: item.plan.id,
              amount: item.plan.amount / 100,
              interval: item.plan.interval,
              product: item.plan.product,
              created: moment(item.plan.created*1000).format(date_format),
            },
            quantity: item.quantity,
            status: item.status,
          }

          const c = customers.find(c => c.token == item.customer)
          if (c) {
            row.customer = c
          } else {
            row.customer = await c_model.findOne({where: {token: item.customer}})
            if (row.customer)
              customers.push(row.customer)
          }

          const v = variations.find(v => v.token==item.plan.product)
          if (v) {
            row.product_variation = v
          } else {
            row.product_variation = await pv_model.findOne({where: {token: item.plan.product}})
            if (row.product_variation)
              variations.push(row.product_variation)
          }

          if (row.product_variation) {
            const p = products.find(p => p.id==row.product_variation.productId)
            if (p)
              row.product = p
            else {
              row.product = await p_model.findOne({where: {id: row.product_variation.productId}})
              if (row.product)
                products.push(row.product)
            }
          }

          result.push(row)
        }
      }

      resolve(result)
    });
  }

  Model.remoteMethod('subscriptions', {
    description: 'Get all subscriptions from stripe',
    http: {
      path: '/subscriptions',
      verb: 'get',
    },
    accepts: [
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},
    ],
    returns: [{type: 'object', root: true}],
  });
};
