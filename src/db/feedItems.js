const neo4j = require('../extensions/neo4j.js');
const endOfLine = require('os').EOL;
const config = require('../config.js');
const logger = require('thumb-logger').getLogger(config.DB_LOGGER_NAME);


/**
 * @param {String} userId
 * @param {Date} fromTimeStamp
 * @returns {array}
*/
exports.getRidePostsFromFollowedUsers = async function(userId, fromTimestamp){
  let query = 'MATCH(user:User{userId:{userId}})-[:FOLLOWS]->(users:User)' + endOfLine;
  query += 'WITH users' + endOfLine;
  query += 'MATCH (users)-[p:POSTS]->(rides:Ride)' + endOfLine;
  query += 'WHERE (p.postedOn > $fromTimestamp)' + endOfLine;
  query += 'MATCH (rides)-[:STARTING_AT]->(sl:Location)' + endOfLine;
  query += 'MATCH (rides)-[:ENDING_AT]->(el:Location)' + endOfLine;
  query += 'MATCH (rides)-[:SCHEDULED_ON]->(d:Date)' + endOfLine;
  query += 'RETURN "RIDE" AS postType, rides.rideId AS key, rides.rideId AS postId,';
  query += 'users.userId, users.username, users.firstName, users.lastName, users.profilePicture,';
  query += 'd.date, el.city, rides.travelDescription as caption, p.postedOn' + endOfLine;
  query += 'ORDER BY p.postedOn DESC';

  try {
      let results = await neo4j.execute(query, {
          userId: userId,
          fromTimestamp: fromTimestamp
      });
      return neo4j.mapKeysToFields(results);
  } catch(error) {
      logger.error(error);
      throw error;
  }
}

/**
 * @param {String} userId
 * @param {Date} fromTimeStamp
 * @returns {array}
*/
exports.getDrivePostsFromFollowedUsers = async function(userId, fromTimestamp){
  let query = 'MATCH(user:User{userId:{userId}})-[:FOLLOWS]->(users:User)' + endOfLine;
  query += 'WITH users' + endOfLine;
  query += 'MATCH (users)-[p:POSTS]->(drives:Drive)' + endOfLine;
  query += 'WHERE (p.postedOn > $fromTimestamp)' + endOfLine;
  query += 'MATCH (drives)-[:STARTING_AT]->(sl:Location)' + endOfLine;
  query += 'MATCH (drives)-[:ENDING_AT]->(el:Location)' + endOfLine;
  query += 'MATCH (drives)-[:SCHEDULED_ON]->(d:Date)' + endOfLine;
  query += 'RETURN "DRIVE" AS postType, drives.driveId AS key, drives.driveId AS postId,';
  query += 'users.userId, users.username, users.firstName, users.lastName, users.profilePicture,';
  query += 'd.date, el.city, drives.travelDescription as caption, p.postedOn' + endOfLine;
  query += 'ORDER BY p.postedOn DESC';

  try {
      let results = await neo4j.execute(query, {
          userId: userId,
          fromTimestamp: fromTimestamp
      });
      return neo4j.mapKeysToFields(results);
  } catch(error) {
      logger.error(error);
      throw error;
  }
}
