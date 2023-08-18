// Load Config
let config = require('../../server/config.json');
if (process.env.NODE_ENV == 'dev') config = require('../../server/config.dev.json');

const app = require('../../server/server');

const fs = require('fs');
const redis = require('redis');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');

const authFailure = {
  name: 'AuthFailed',
  statusCode: 401,
  message: 'Authentication failure!',
};

const passError = {
  name: 'PassError',
  statusCode: 401,
  message: 'Username or password not found!',
};

let redisClient = null;

/******************************************
 *
 *  HELPER FUNCTIONS
 *
 *****************************************/

const canUserDo = function (token, action, resource) {
  if (!token) return false;

  console.log('\n\n***********');
  console.log('Subject:', token);
  console.log('Action:', action);
  console.log('Object:', resource);
  console.log('***********\n\n');

  // Check is user is an Admin or SuperAdmin
  const isUserSuperAdmin = token.userId === config.adminId ? true : false;
  const isUserAdmin = token.userId === config.adminRoleId ? true : false;

  // SuperAdmin can do everything
  if (isUserSuperAdmin) return true;

  // Check by Action
  switch (action) {
    case 'get-password':
    case 'reset-password':
      if (!isUserAdmin && token.userId === resource) return true;
      break;
  }

  return false;
};

const readHTMLTemplate = function (path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, {encoding: 'utf-8'}, function (err, html) {
      if (err) {
        reject(err);
      } else {
        resolve(html);
      }
    });
  });
};

const emailSender = async function (data, op) {
  // Create Email Client Transport
  let transport = null;
  try {
    // Ignore invalid/self-signed certificates
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
    // Build transport
    transport = nodemailer.createTransport(config.emailConnector);
  } catch (t_err) {
    console.log('Transport warning:', t_err);
    return false;
  }

  // Return error
  if (!transport) {
    return false;
  }

  // Select email template
  let template = '/../../server/templates/register.html';
  if (op === 'reset') {
    template = '/../../server/templates/reset.html';
  }

  // Convert Template and Send it
  const html = await readHTMLTemplate(__dirname + template);
  const templateHTML = handlebars.compile(html);
  const activationurl = `http://${app.get('server_address')}` + config.emailConnector.activationURL + '?token=' + data.verificationToken;

  const replacements = {
    proto: 'http',
    host: config.host,
    name: data.name,
    password: data.password,
    username: data.username,
    endpoint: config.restApiRoot,
    activationurl: activationurl,
  };

  const htmlToSend = templateHTML(replacements);

  let subject = '[CMS] User Activation';
  if (op === 'reset') {
    subject = '[CMS] Password reset';
  }

  try {
    const mailOptions = {
      from: config.emailConnector.fromEmail,
      to: data.email,
      subject: subject,
      html: htmlToSend,
    };

    await transport.sendMail(mailOptions);
    return true;
  } catch (e) {
    return false;
  }
};

const sendVerificationEmail = async (email, code) => {
  // Create Email Client Transport
  let transport = null;
  try {
    // Ignore invalid/self-signed certificates
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
    // Build transport
    transport = nodemailer.createTransport(config.emailConnector);
  } catch (t_err) {
    console.log('Transport warning:', t_err);
    return false;
  }

  // Return error
  if (!transport) {
    return false;
  }

  // Select email template
  const template = '/../../server/templates/email_verification.html';

  // Convert Template and Send it
  const html = await readHTMLTemplate(__dirname + template);
  const templateHTML = handlebars.compile(html);
  const replacements = {
    code: code,
  };
  const htmlToSend = templateHTML(replacements);
  const subject = '[CMS] User SignUp';

  try {
    const mailOptions = {
      from: config.emailConnector.fromEmail,
      to: email,
      subject: subject,
      html: htmlToSend,
    };

    transport.sendMail(mailOptions, function (err, response) {
      if (!err && response != null) {
        var regex = '^Message\\-Id:\\s*<[0-9.a-fA-F]+@' + nodemailer.X_MAILER_NAME.replace(/([\(\)\\\.\[\]\-\?\:\!\{\}])/g, '\\$1') + '>$';
        let result = response.message.match(new RegExp(regex, 'm'));
        return true;
      } else {
        return false;
      }
    });
  } catch (e) {
    return false;
  }
};

/**
 * Generate a random code of a fixed sixe
 * @returns
 */
const emailCode = () => +Array.from({length: 0 | (Math.random() * 1 + config.verificationCodeLength)}, () => 0 | (Math.random() * 9 + 1)).join('');

/******************************************
 *
 *  CLASS BEGIN
 *
 *****************************************/

module.exports = function (cuser) {
  app.on('started', () => {
    const user = app.models.DashUser;
    user.nestRemoting('DashTokens');
    user.nestRemoting('UserContacts');
    user.nestRemoting('DashRoleMapping');
    user.nestRemoting('Languages');
  });

  // Rework requesting model
  cuser.beforeRemote('**', (ctx, _, next) => {
    // Attach Source IP Address to every request
    cuser.ip = ctx.req.headers['x-forwarded-for'] || ctx.req.connection.remoteAddress || ctx.req.socket.remoteAddress || ctx.req.connection.socket.remoteAddress;
    // Attach Access Token to every request
    cuser.accessToken = ctx.req.accessToken;
    next();
  });

  // Remove rolemapping before user delete
  cuser.observe('before delete', function (ctx, next) {
    console.log('Looking for %s matching %j', ctx.Model.pluralModelName, ctx.where);
    app.models.DashUser.findOne({where: ctx.where}, (err, user) => {
      if (!err && user) {
        user = JSON.parse(JSON.stringify(user));
        const rolemappings = user.DashRoleMapping;
        console.log("I'm going to delete:", rolemappings);
        rolemappings.forEach(function (rolemapping) {
          app.models.DashRoleMapping.deleteById(rolemapping.id, function (err, res) {
            if (err) {
              console.log('Unable to delete rolemapping!');
            } else {
              console.log('Rolemapping successfully deleted!');
            }
          });
        });
        next();
        // This for blocking purpose
      } else {
        next();
      }
    });
  });

  /**
   * This route return access permission for user to a specific resource
   */
  cuser.cani = async (token, resource) => {
    const now = new Date();
    console.log('[31m[AUTH GUARD][0m Checking for token:[32m', token, '[0mSRC IP:[32m', cuser.ip, '[0mExpires:[32m', now, '[0mResource:[32m', resource, '[0m');
    try {
      const access_token = await app.models.DashAccessToken.findOne({
        where: {
          and: [{id: token}, {srcip: cuser.ip}, {expires: {gt: now}}],
        },
      });
      if (access_token) {
        console.log('[31m[AUTH GUARD][0m [32mAllowed![0m');
        return true;
      }
    } catch (e) {
      console.log('DashUser cani error-----', e);
      console.log('[31m[AUTH GUARD] Disallowed![0m');
      return false;
    }
  };

  /**
   * This call adds custom behaviour to the standard Loopback login.
   * Since it uses the DashUser.login function of the User model, let's also
   * keep the same parameter structure.
   */
  cuser.authenticate = async (credentials, _) => {
    // Finding User model matching requests from datasource
    try {
      const customuser = await cuser.findOne({
        where: {
          and: [
            {activated: true},
            {
              or: [{username: credentials.username}, {email: credentials.username}],
            },
          ],
        },
      });

      // Handle generic error or user not found
      if (!customuser) {
        // If no user found return 401 Auth Failure
        // Return Promised Error :)
        return authFailure;
      }

      // Create Redis Connection.
      // Two redis database will be used:
      // 1. will store token on users basis (handle relationship on loopback side).
      // 2. will store token on access_token basis (for speed purpose on express-gateway side).
      // ---
      // Database 2 is strictly dependent from db 1.
      const rtoken = redis.createClient({
        url: 'redis://' + config.redis.host + ':' + config.redis.port,
        password: config.redis.pass,
      });

      await rtoken.connect();

      // Select specific dbs
      await rtoken.select(1);

      // Use this to allow enduser writing plain password
      // - INSECURE!!! ONLY FOR TESTING PURPOSE -
      // var md5 = require('md5');
      // if(md5(credentials.password) != customuser.password) {
      if (credentials.password !== customuser.password) {
        return passError;
      }

      // Check if a token already exists
      const now = new Date();
      const access_token = await app.models.DashAccessToken.findOne({
        where: {
          and: [{userId: customuser.id}, {srcip: cuser.ip}, {expires: {gt: now}}],
        },
      });

      // Update last login to logged in user
      customuser.last_login = now;
      customuser.save(null, function (err, info) {
        if (!err) {
          console.log('Last login time updated for user:', customuser.username);
        } else {
          console.log('Unable to update last login for user:', customuser.username);
        }
      });

      // If Access Token Exists for a specific IP return it.
      // No new token will be generated every authenticate
      // request.
      if (access_token) {
        // Duplicate Access Token to remove DashUser relation
        const oldtoken = access_token.toJSON();
        delete oldtoken['DashUser'];
        // Return it back
        return oldtoken;
      } else {
        // Create New Token
        const newToken = await app.models.DashAccessToken.create({
          id: app.models.DashAccessToken.createAccessTokenId,
          srcip: cuser.ip,
          userId: customuser.id,
        });
        // Bind new token to Authenticated User Id
        newToken.userId = customuser.id;
        // Push Token to Redis Token Database
        await rtoken.set(newToken.id, JSON.stringify(newToken), 'EX', newToken.ttl);

        // Return it back
        return newToken;
      }
    } catch (err) {
      return err;
    }
  };

  /**
   * Create a modified user
   */
  cuser.add_user = async data => {
    const User = app.models.User;
    try {
      return await User.create(data);
    } catch (e) {
      return e;
    }
  };

  /**
   * Override Password Hashing Method
   */
  cuser.hashPassword = function (plain) {
    // Do not hashes password this because frontend should pass to
    // backend already hashed password.  No plain password allowed
    // across network connections.
    return plain;
  };

  cuser.register = function (data, cb) {
    /* Data be like
      {
          "email": "danilo.santoro@gmail.com",
          "code": "12345",
          "username": "danilo.santoro",
          "password": "letmein.123!",
          "firstName": "Danilo",
          "lastName": "Santoro",
          "Customer": {
              "name": "Tech Fusion ITc",
              "address": "via Nazionale, 1",
              "phone": "0671768302",
              "website": "http://www.techfusion.it",
              "industry": "Telecom"
          },
          "Service": {
              "planId": "1",
              "starting_balance": "35"
          },
          "Payment": {
              "cardName": "Danilo Santoro",
              "cardNo": "4242 4242 4242 4242",
              "cardExpDate": "12/25",
              "cardCvv": "1223",
              "zipCode": "00100",
              "country": "IT"
          }
      }
    */

    // Convert data to a pure json object
    data = JSON.parse(JSON.stringify(data));

    // First validation
    if (
      (data.hasOwnProperty('firstName') && data.username.trim().length <= 0) ||
      (data.hasOwnProperty('lastName') && data.username.trim().length <= 0) ||
      (data.hasOwnProperty('username') && data.username.trim().length <= 0) ||
      (data.hasOwnProperty('password') && data.username.trim().length <= 0) ||
      (data.hasOwnProperty('email') && data.email.trim().length <= 0) ||
      (data.hasOwnProperty('code') && data.code <= 0)
    )
      return cb(new Error(), {
        message: 'failed',
        data: 'Mandatory data missed!',
      });

    // Search for an activated email
    const user_contact = app.models.UserContact;
    user_contact.findOne(
      {
        where: {
          and: [{value: data.email}, {verification_code: data.code}, {userId: {eq: null}}],
        },
      },
      (err, contact) => {
        if (err) return cb(err, {message: 'failed', data: 'Error validating user!'});
        if (contact) {
          // Check For Customer Infos
          if (data.hasOwnProperty('Customer')) {
            if (data.Customer.name.trim().length <= 0) return cb(err, {message: 'failed', data: 'Wrong Customer Name!'});

            // Validate Customer Billing Email
            data.Customer.billingEmail = data.email;

            // Create Customer and proceed with user
            const user_customer = app.models.Customer;
            user_customer
              .createCustomer(data.Customer)
              .then(customer_result => {
                // Create Billing Reference -- TODO
                if (data.hasOwnProperty('Payment')) {
                  // Check for Service Plan Data
                  if (!data.hasOwnProperty('Service')) {
                    // Revert Customer Creation
                    user_customer.destroyById(customer_result.id);
                    // Return Error
                    return cb(new Error("Invalid choosen services plan."));
                  }

                  // Try creating payment method
                  let payment = data.Payment;
                  payment.type = 'card'; // only card supported for now -- TODO
                  payment.customerId = customer_result.id;

                  // Storing Service Object
                  let service = data.Service;

                  const payment_method = app.models.PaymentMethod;
                  payment_method
                    .register(data.email, payment, service, customer_result)
                    .then(pm_result => {
                      // Build User Entity
                      let new_user = {
                        activated: 1,
                        email: data.email,
                        note: '',
                        username: data.username,
                        firstName: data.firstName,
                        lastName: data.lastName,
                        password: data.password,
                        timezone: '-00:00',
                        emailVerified: true,
                        Customer: customer_result,
                        customerId: customer_result.id,
                        verificationToken: crypto.randomBytes(64).toString('hex'),
                        languagesId: 1,
                      };

                      // Creating User
                      try {
                        cuser.create(new_user, function (err, created_user) {
                          if (!err && created_user) {
                            // Updating User Contact Reference
                            contact.userId = created_user.id;
                            contact.save();

                            // Creating User Roles According to new Customer
                            const dashrole = app.models.DashRole;

                            // Normal User Role
                            let user_role = {
                              name: customer_result.companyName + ' User',
                              customerId: customer_result.id,
                              description: customer_result.companyName + ' Normal User Role',
                            };

                            dashrole.create(user_role);

                            // Admin Role
                            let admin_role = {
                              name: customer_result.companyName + ' Admin',
                              customerId: customer_result.id,
                              description: customer_result.companyName + ' Administration Role',
                            };

                            dashrole.create(admin_role, function (err, created_role) {
                              if (!err && created_role != null) {
                                // Map Role to Customer/User
                                const role_mapping = {
                                  principalType: 'ADMINISTRATOR',
                                  principalId: created_user.id,
                                  roleId: created_role.id,
                                  customerId: customer_result.id,
                                  DashRole: created_role,
                                };

                                const rmap = app.models.DashRoleMapping;
                                rmap.create(role_mapping);

                                // Go enabling UI Permissions for new role
                                const uivis = app.models.GuiVisibility;
                                uivis.enableByAdminRole(created_role);

                                // Create Default Tracking Source
                                const tr_source = {
                                  name: 'OTHERS',
                                  type: 'offsite',
                                  position: 0,
                                  customerId: customer_result.id,
                                  description: 'Default tracking source for customer ' + customer_result.companyName,
                                };

                                const dfl_ts = app.models.TrackingSources;
                                dfl_ts.create(tr_source);

                                // Return created user json
                                return cb(null, created_user);
                              } else {
                                // Revert User Creation
                                cuser.destroyById(created_user.id);
                                // Revert Customer Creation
                                user_customer.destroyById(customer_result.id);
                                // Return Error
                                if (!err) err = new Error();
                                return cb(err, {
                                  message: 'failed',
                                  data: 'Error registering new user!',
                                });
                              }
                            });
                          } else {
                            // Revert Customer Creation
                            user_customer.destroyById(customer_result.id);
                            // Return Error
                            if (!err) err = new Error();
                            return cb(err, {
                              message: 'failed',
                              data: 'Error registering new user!',
                            });
                          }
                        });
                      } catch (err) {
                        // Revert Customer Creation
                        user_customer.destroyById(customer_result.id);
                        // Return Error
                        return cb(err, null);
                      }
                    })
                    .catch(err => {
                      // Revert Customer Creation
                      user_customer.destroyById(customer_result.id);

                      return cb(err, {
                        message: 'failed',
                        data: 'Invalid payment data!',
                      });
                    });
                } else {
                  return cb(new Error(), {
                    message: 'failed',
                    data: 'Invalid payment data!',
                  });
                }
              })
              .catch(err => {
                return cb(err, {
                  message: 'failed',
                  data: 'Wrong Customer Data!',
                });
              });
          }
        } else {
          return cb(new Error(), {
            message: 'failed',
            data: 'Error validating user!',
          });
        }
      },
    );
  };

  cuser.activate = async (token, res) => {
    try {
      const user = await cuser.findOne({
        where: {
          and: [{verificationToken: token}, {emailVerified: 0}],
        },
      });
      user.verificationToken = 'verified';
      user.emailVerified = 1;
      user.activated = 1;
      await user.save(null);
      console.log('User updated!');
      res.redirect(`http://${app.get('server_address')}`);
      // user.save(null, function(err, info) {
      // 	if (!err) {
      // 		console.log('User updated!');
      // 		res.redirect(`http://${app.get('server_address')}`);
      // 	} else {
      // 		console.log('Error occourred!');
      // 		res.redirect(`http://${app.get('server_address')}/error`);
      // 	}
      // });
    } catch (err) {
      console.log('User not found:', JSON.stringify(err));
      res.redirect(`http://${app.get('server_address')}/error`);
    }
  };

  cuser.isunique = async (column, pattern) => {
    // This for dynamic query
    let query = {};
    query[column] = pattern;
    query = {where: query};
    query = JSON.parse(JSON.stringify(query));
    console.log('Query:', query);
    // Finding by dynamic query
    try {
      const user = await cuser.findOne(query);
      return !user;
    } catch (err) {
      return err;
    }
  };

  cuser.get_password = async id => {
    if (!canUserDo(cuser.accessToken, 'get-password', id)) {
      return {message: 'User not allowed!'};
    }

    // Finding user by id
    try {
      const user = await cuser.findOne({where: {id: id}});
      if (user) {
        return {password: user.password};
      } else {
        return null;
      }
    } catch (err) {
      return err;
    }
  };

  cuser.reset_account = async id => {
    // Finding user by id
    try {
      const user = await cuser.findOne({where: {id: id}});
      if (user) {
        // Creating random password
        const randPassword = Array(10)
          .fill('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz')
          .map(function (x) {
            return x[Math.floor(Math.random() * x.length)];
          })
          .join('');
        user.password = randPassword;

        // Generating Activation Token
        user.emailVerified = 0;
        user.verificationToken = crypto.randomBytes(64).toString('hex');

        // Build Name
        let name = user.firstName + ' ' + user.lastName;
        if (name.length <= 0) name = user.username;
        user.name = name;

        // Set user as not activated
        user.activated = 0;
        await user.save(user);
        return await emailSender(user, 'reset');
      } else {
        return false;
      }
    } catch (err) {
      return false;
    }
  };

  cuser.forgot_password = async email => {
    // Finding user by email
    try {
      const user = await cuser.findOne({where: {email: email}});
      if (user) {
        // Creating random password
        const randPassword = Array(10)
          .fill('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz')
          .map(function (x) {
            return x[Math.floor(Math.random() * x.length)];
          })
          .join('');
        user.password = randPassword;

        // Generating Activation Token
        user.emailVerified = 0;
        user.verificationToken = crypto.randomBytes(64).toString('hex');

        // Build Name
        let name = user.firstName + ' ' + user.lastName;
        if (name.length <= 0) name = user.username;
        user.name = name;

        // Set user as not activated
        user.activated = 0;
        await user.save(user);
        return await emailSender(user, 'reset');
      } else {
        return false;
      }
    } catch (err) {
      return false;
    }
  };

  cuser.set_role = async (user_id, role_id) => {
    // Finding user by id
    try {
      const user = await cuser.findOne({where: {id: user_id}});
      if (user) {
        const role = app.models.DashRole;
        const rrole = await role.findOne({where: {id: role_id}});
        if (rrole) {
          user.roleId = rrole.id;
          delete user.Dashrole;
          user.save(null, function (err, info) {
            if (!err && info) return true;
          });
        } else {
          return false;
        }
      } else {
        return false;
      }
    } catch (err) {
      return false;
    }
  };

  cuser.several_user = async ids => {
    console.log('ids:', ids);

    const query = `SELECT id, username FROM User WHERE id IN (${ids})`;

    try {
      const results = await cuser.dataSource.connector.query(query);
      if (results && results.length > 0) {
        return results;
      } else {
        return {};
      }
    } catch (err) {
      return err;
    }
  };

  cuser.request_email = function (username, email_address, cb) {
    cuser.findOne({where: {username: username}})
      .then((results) => {
        if (results) {
          return cb(null, {message: 'Username have already existed.', data: 'Username have already existed.'});
        }

        try {
          const code = emailCode();

          const user_contact = app.models.UserContact;
          user_contact.findOne(
            {
              where: {
                and: [{value: email_address}, {userId: {neq: null}}],
              },
            },
            (err, contact) => {
              if (err) return cb(err, {message: 'failed', data: 'Unable to validate!'});
              if (!contact) {
                const uc = {
                  value: email_address,
                  verified: 0,
                  verification_code: code,
                };
                user_contact.upsertWithWhere(
                  {
                    and: [{value: email_address}, {userId: {eq: null}}],
                  },
                  uc,
                  function (err, uc_result) {
                    if (!err && uc_result) {
                      // Send the verification eMail after user contact was correctly stored
                      sendVerificationEmail(email_address, code);
                      return cb(err, uc_result);
                    } else {
                      return cb(err, null);
                    }
                  },
                );
              } else {
                return cb(err, {
                  statusCode: 500,
                  message: 'eMail contact already exists.',
                });
              }
            },
          );
        } catch (e) {
          return cb(e, null);
        }
      })
      .catch(err => {
        return cb(err, {message: 'failed', data: 'Unable to validate!'})
      })

  };

  cuser.verify_email = function (email_address, verify_code, cb) {
    try {
      const user_contact = app.models.UserContact;

      user_contact.findOne(
        {
          where: {
            and: [{verification_code: verify_code}, {value: email_address}, {userId: {eq: null}}],
          },
        },
        function (err, uc_result) {
          if (!err && uc_result != null) {
            const id = uc_result.id;
            uc_result.verified = true;
            user_contact.replaceById(id, uc_result, function (err, res) {
              if (!err && res)
                return cb(err, {
                  message: 'success',
                  data: 'Email successifully validated!',
                });
              else
                return cb(new Error(), {
                  message: 'failure',
                  data: 'Invalid or expired data!',
                });
            });
          } else {
            return cb(err, null);
          }
        },
      );
    } catch (e) {
      return cb(e, null);
    }
  };

  /**
   * Check if User can Access a specific Route
   */
  cuser.remoteMethod('cani', {
    description: 'Check if a user can access a specific resource',
    http: {
      path: '/cani',
      verb: 'post',
    },
    accepts: [
      {
        arg: 'token',
        type: 'string',
        description: 'User Auth Token',
        required: true,
      },
      {
        arg: 'resource',
        type: 'string',
        description: 'Requesting resource access permission',
        required: true,
      },
    ],
    returns: [
      {
        arg: 'permission',
        type: 'boolean',
        root: true,
      },
    ],
  });

  /**
   * Register a path for the new login function
   */
  cuser.remoteMethod('authenticate', {
    description: 'Custom authentication method made by me',
    http: {
      path: '/authenticate',
      verb: 'post',
    },
    accepts: [
      {
        arg: 'credentials',
        type: 'object',
        description: 'Login credentials',
        required: true,
        http: {
          source: 'body',
        },
      },
      {
        arg: 'include',
        type: 'string',
        description: 'Related objects to include in the response.' + 'See the description for more details.',
        http: {
          source: 'query',
        },
      },
    ],
    returns: [
      {
        arg: 'token',
        type: 'object',
        root: true,
      },
    ],
  });

  /**
   * Register a path for the user registration remote method
   */
  cuser.remoteMethod('register', {
    description: 'Register new user',
    http: {
      path: '/register',
      verb: 'post',
    },
    accepts: [
      {
        arg: 'data',
        type: 'object',
        description: 'New user attributes data',
        required: true,
        http: {
          source: 'body',
        },
      },
    ],
    returns: [
      {
        arg: 'status',
        type: 'boolean',
        root: true,
      },
    ],
  });

  /**
   * Register a path for the user activation remote method
   */
  cuser.remoteMethod('activate', {
    description: 'Custom user activation method made by me',
    http: {
      path: '/activate',
      verb: 'get',
    },
    accepts: [
      {
        arg: 'token',
        type: 'string',
        description: 'Activation Token',
        required: true,
      },
      {arg: 'res', type: 'object', http: {source: 'res'}},
    ],
    returns: [
      {
        arg: 'result',
        type: 'boolean',
        root: true,
      },
    ],
  });

  cuser.remoteMethod('add_user', {
    description: 'Overridden User Model Creation Method',
    http: {
      path: '/add_user',
      verb: 'post',
    },
    accepts: [
      {
        arg: 'data',
        type: 'object',
        description: 'User attributes data',
        required: true,
        http: {
          source: 'body',
        },
      },
    ],
    returns: [
      {
        arg: 'status',
        type: 'boolean',
        root: true,
      },
    ],
  });

  cuser.remoteMethod('isunique', {
    description: 'Return true if pattern is matchend in database column',
    http: {
      path: '/isunique',
      verb: 'post',
    },
    accepts: [
      {
        arg: 'column',
        type: 'string',
        description: 'Database column to search',
        required: true,
      },
      {
        arg: 'pattern',
        type: 'string',
        description: 'Search pattern',
        required: true,
      },
    ],
    returns: [
      {
        arg: 'status',
        type: 'boolean',
        root: true,
      },
    ],
  });

  cuser.remoteMethod('get_password', {
    description: 'Return associated user password',
    http: {
      path: '/:id/password',
      verb: 'get',
    },
    accepts: [
      {
        arg: 'id',
        type: 'number',
        description: 'User Id',
        required: true,
      },
    ],
    returns: [
      {
        arg: 'password',
        type: 'object',
        root: true,
      },
    ],
  });

  cuser.remoteMethod('reset_account', {
    description: 'Reset user account',
    http: {
      path: '/:id/account-reset',
      verb: 'get',
    },
    accepts: [
      {
        arg: 'id',
        type: 'number',
        description: 'User Id',
        required: true,
      },
    ],
    returns: [
      {
        arg: 'result',
        type: 'boolean',
        root: true,
      },
    ],
  });

  cuser.remoteMethod('forgot_password', {
    description: 'Request a password reset for a specific email',
    http: {
      path: '/forgot-password',
      verb: 'post',
    },
    accepts: [
      {
        arg: 'email',
        type: 'string',
        description: 'Account Email',
        required: true,
      },
    ],
    returns: [
      {
        arg: 'result',
        type: 'boolean',
        root: true,
      },
    ],
  });

  cuser.remoteMethod('set_role', {
    description: 'Set role for a user',
    http: {
      path: '/:id/role',
      verb: 'post',
    },
    accepts: [
      {
        arg: 'id',
        type: 'number',
        description: 'User Id',
        required: true,
      },
      {
        arg: 'role_id',
        type: 'number',
        description: 'Role Id',
        required: true,
      },
    ],
    returns: [
      {
        arg: 'result',
        type: 'boolean',
        root: true,
      },
    ],
  });

  cuser.remoteMethod('several_user', {
    accepts: [{arg: 'ids', type: 'string', required: false}],
    http: {verb: 'post'},
    returns: [{type: 'object', root: true}],
  });

  cuser.remoteMethod('request_email', {
    accepts: [
      {arg: 'username', type: 'string', required: false},
      {arg: 'email_address', type: 'string', required: false},
    ],
    http: {verb: 'post'},
    returns: [{type: 'object', root: true}],
  });

  cuser.remoteMethod('verify_email', {
    accepts: [
      {arg: 'email_address', type: 'string', required: false},
      {arg: 'verify_code', type: 'string', required: false},
    ],
    http: {verb: 'post'},
    returns: [{type: 'object', root: true}],
  });
};
