var neo4j = require('neo4j-driver').v1;
var config = require('../config.js');

// Create a driver instance.
// It should be enough to have a single driver per database per application.
var driver = neo4j.driver("bolt://" + config.NEO4J_DATABASE_URL,
    neo4j.auth.basic(config.NEO4J_DATABASE_USER, config.NEO4J_DATABASE_PASSWORD));

driver.execute = async function(script, parameters){
  let session = this.session();
  try {
    return await session.run(script, parameters)
  } catch(err){
    throw err;
  } finally {
    session.close();
  }
}

driver.deserializeResults = function(rawResults){
  let results = [];

  for(let i=0; i<rawResults.records.length; i++){
    let fields = rawResults.records[i]._fields;
    let record = {};
    for(let j=0; j<fields.length; j++){
      let type;
      let properties = fields[j].properties;
      if('labels' in fields[j]){
        type = fields[j].labels[0];
      } else if('type' in fields[j]){
        type = fields[j].type;
      } else {
        throw TypeError('Unknown record type.')
      }

      type = type.toLowerCase();

      if(type in record){
        record[type].push(properties);
      } else {
        record[type] = [properties];
      }
    }
    results.push(record);
  }
  return results;
}

module.exports = driver;
