var neo4j = require('neo4j-driver').v1;
var config = require('../config.js');

// Create a driver instance.
// It should be enough to have a single driver per database per application.
var driver = neo4j.driver("bolt://" + config.NEO4J_DATABASE_URL,
    neo4j.auth.basic(config.NEO4J_DATABASE_USER, config.NEO4J_DATABASE_PASSWORD));

driver.execute = async function(script){
  let session = this.session();
  try {
    return await session.run(script)
  } catch(err){
    throw err;
  } finally {
    session.close();
  }
}

module.exports = driver;
