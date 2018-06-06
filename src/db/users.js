const config = require('../config.js');
const neo4j = require('../extensions/neo4j.js');
const endOfLine = require('os').EOL;
const logger = require('thumb-logger').getLogger(config.DB_LOGGER_NAME);

exports.saveUser = async function(user){
  try {
    let mongoResult = await user.save();
    let query = 'MERGE(u:User{userId:{userId}})' + endOfLine;
    query += 'SET u.email = {email} RETURN u';
    let neoResult = await neo4j.execute(query,{
      userId: mongoResult._id.toString(),
      email: mongoResult.email
    });
    return neoResult.records;
  } catch(err){
    logger.error(err);
    throw err;
  }
}

exports.deleteUser = async function(user){
  let query = 'MATCH(u:User{userId:{userId}})-[r]-()' + endOfLine;
  query += 'DELETE u,r';

  try{
    await neo4j.execute(query, {userId: user._id.toString()});
    return await user.constructor.deleteOne({'email': this.email});
  } catch (err){
    logger.error(err);
    throw err;
  }
}

exports.saveExpoToken = async (userId, expoToken) => {
  try {
    let query = 'MERGE(u:User{userId:{userId}})' + endOfLine;
    query += 'SET u.expoToken = {expoToken} RETURN u';
    return await neo4j.execute(query,{ userId, expoToken });
  } catch(err){
    logger.error(err);
    throw err;
  }
}

exports.ActiveConstraints = [
    'CONSTRAINT ON ( user:User ) ASSERT user.userId IS UNIQUE'
];

exports.ActiveIndexes = [
    'INDEX ON :User(userId)'
];
