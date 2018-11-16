const config = require('../config.js');
const neo4j = require('../extensions/neo4j.js');
const endOfLine = require('os').EOL;
const logger = require('thumb-logger').getLogger(config.DB_LOGGER_NAME);

exports.tokenIsObsolete = async function(token){
  let query = 'MATCH(t:ObsoleteToken{token:{token}})' + endOfLine;
  query += 'RETURN t.token';

  try{
    let result = await neo4j.execute(query, {token: token});
    if(result.records.length > 0 && result.records[0]._fields[0] === token){
      return true;
    }
    return false;
  } catch (err){
    logger.error(err);
    throw err;
  }
}

exports.saveObsoleteToken = async function(token){
  let query = 'MERGE(t:ObsoleteToken{token:{token}, createdDate: datetime()})' + endOfLine;
  query += 'RETURN t.token';

  try{
    return await neo4j.execute(query, {token: token});
  } catch (err){
    logger.error(err);
    throw err;
  }
}

exports.deleteObsoleteToken = async function(token){
  let query = 'MATCH(t:ObsoleteToken{token:{token}})' + endOfLine;
  query += 'DELETE t';

  try{
    return await neo4j.execute(query, {token: token});
  } catch (err){
    logger.error(err);
    throw err;
  }
}
