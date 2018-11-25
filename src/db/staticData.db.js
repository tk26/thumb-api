const neo4j = require('../extensions/neo4j.js');
const endOfLine = require('os').EOL;
const config = require('../config.js');
const logger = require('thumb-logger').getLogger(config.DB_LOGGER_NAME);

exports.getAllUniversities = async function() {
  let query = 'MATCH(u:University) RETURN u.officialName AS officialName, u.shortName as shortName' + endOfLine;
  query += 'ORDER BY officialName';
  try {
    let results = [];
    let rawResults = await neo4j.execute(query);
    rawResults.records.forEach(function(record){
      results.push({
        officialName: record.get('officialName'),
        shortName: record.get('shortName')
      });
    });
    return results;
  } catch (error){
    logger.error(error);
    throw error;
  }
}

exports.saveUniversity = async function(officialName, shortName){
  let query = 'MERGE(u:University{officialName:{officialName}, shortName:{shortName}})' + endOfLine;
  query += 'RETURN u.officialName AS officialName, u.shortName as shortName';
  try {
    let results = [];
    let rawResults = await neo4j.execute(query, {officialName, shortName});
    rawResults.records.forEach(function(record){
      results.push({
        officialName: record.get('officialName'),
        shortName: record.get('shortName')
      });
    });
    return results;
  } catch (error){
    logger.error(error);
    throw error;
  }
}

exports.deleteUniversity = async function(officialName){
  let query = 'MATCH(u:University{officialName:{officialName}}) DELETE u';
  try {
    await neo4j.execute(query, {officialName});
  } catch (error){
    logger.error(error);
    throw error;
  }
}
