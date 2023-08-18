'use strict';
var app = require('../../server/server');
var LoopBackContext = require('loopback-context');

// That should to reflect entries in gui_permission tables
const perm_deny = 1;
const perm_readonly = 2;
const perm_all = 3;

module.exports = function (Model) {

    app.on('started', function () {

    });

    Model.enableByAdminRole = async (role) => {
        return new Promise(async (resolve, reject) => {

            const section_model = app.models.GuiSection;
            section_model.find({}, function (err, sections) {
                if (err || !sections) {
                    if (!err) {
                        let err = new Error();
                        err.statusCode = 500;
                        err.message = "Error validating customer data!";
                    }

                    reject(err);
                }

                sections = JSON.parse(JSON.stringify(sections));
                sections.forEach(section => {

                    let permid = perm_all;
                    if (section.id < 3) permid = perm_deny;

                    let visibility = {
                        "guipermissionId": permid,
                        "guisectionId": section.id,
                        "roleId": role.id,
                        "GuiSection": section,
                        "DashRole": role
                    };

                    Model.create(visibility, function (err, visibility_result) {
                        if (!err && visibility_result != null) {
                            console.log("[ii] GuiVisibility Created: ", visibility_result);
                        } else {
                            console.log("[ee] Unable to create: ", visibility_result);
                        }
                    });
                });

                resolve(sections);
            });
        });
    }
}
