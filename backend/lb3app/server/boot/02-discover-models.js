// *********************************************************************************
// *********************************************************************************
// Enable just for model discovery
// *********************************************************************************
// *********************************************************************************
// *********************************************************************************

/*
var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var outputPath = '/tmp/discovered-models';

module.exports = function (app, callback) {
  // Obtain the datasource registered with the name "db"
  const ds = app.dataSources.db;

  ds.discoverModelDefinitions({ all: true, view: false }, function (err, models) {

    var count = models.length;
    console.log("Found " + count + " models.");

    // Create folder if not exists
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath);
    }

    // Cycle all over the models
    _.each(models, function (model) {
      // Debug
      console.log("Discovering:", model.name);
      ds.discoverSchema(model.name, { associations: false }, function (err, schema) {
        if (!schema) {
          console.error("No valid schema for:", model.name, "Err:", err);
          return;
        }

        var outputName = outputPath + '/' + schema.name + '.json';
        fs.writeFile(outputName, JSON.stringify(schema, null, 2), function (err) {
          if (err) {
            console.log(err);
          } else {
            console.log("JSON saved to " + outputName);
          }
        });

        fs.writeFile(outputPath + '/' + schema.name + '.js', schema.name, function (err) {
          if (err) throw err;
          console.log('Created ' + schema.name + '.json file');
        });

        count = count - 1;
        if (count === 0) {
          console.log("DONE!", count);
          ds.disconnect();
          return;
        }
      });
    });
  });

  callback();
}
*/
