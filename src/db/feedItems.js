const neo4j = require('../extensions/neo4j.js');
const endOfLine = require('os').EOL;
const config = require('../config.js');
const logger = require('thumb-logger').getLogger(config.DB_LOGGER_NAME);


/**
 * @param {String} userId
 * @param {Date} fromTimeStamp
 * @returns {object}
*/
exports.getRidePostsFromFollowedUsers = async function(userId, fromTimestamp){
  let query = 'MATCH(user:User{userId:{userId}})-[:FOLLOWS]->(users:User)' + endOfLine;
  query += 'WITH users' + endOfLine;
  query += 'MATCH (users)-[:POSTS]->(rides:Ride)' + endOfLine;
  query += 'WHERE (rides.createdDate > $fromTimestamp)' + endOfLine;
  query += 'MATCH (rides)-[:STARTING_AT]->(sl:Location)' + endOfLine;
  query += 'MATCH (rides)-[:ENDING_AT]->(el:Location)' + endOfLine;
  query += 'MATCH (rides)-[:SCHEDULED_ON]->(d:Date)' + endOfLine;
  query += 'RETURN users, rides, sl, el, d ORDER BY rides.createdDate DESC' ;

  try {
      let results = await neo4j.execute(query, {
          userId: userId,
          fromTimestamp: fromTimestamp
      });
      return neo4j.deserializeResults(results);
  } catch(error) {
      logger.error(error);
      throw error;
  }
}
