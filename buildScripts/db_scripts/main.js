const neo4jInitialize = require('./neo4j.initialize.js');

neo4jInitialize.setUpDB()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    throw err;
  });
