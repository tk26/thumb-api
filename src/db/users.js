const config = require('../config.js');
const neo4j = require('../extensions/neo4j.js');
const endOfLine = require('os').EOL;
const logger = require('thumb-logger').getLogger(config.DB_LOGGER_NAME);

exports.saveUser = async function(user){
  try {
    let query = 'MERGE(u:User{userId:{userId}})' + endOfLine;
    query += 'SET u.firstName = {firstName}' + endOfLine
    query += 'SET u.lastName = {lastName}' + endOfLine
    query += 'SET u.email = {email}' + endOfLine
    query += 'SET u.school = {school}' + endOfLine
    query += 'SET u.password = {password}' + endOfLine
    query += 'SET u.username = {username}' + endOfLine
    query += 'SET u.birthday = {birthday}' + endOfLine
    query += 'SET u.verified = {verified}' + endOfLine
    query += 'SET u.verificationId = {verificationId} RETURN u';
    let neoResult = await neo4j.execute(query,{
      userId: user.userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      school: user.school,
      password: user.password,
      username: user.username,
      birthday: user.birthday,
      verified: false,
      verificationId: user.verificationId,
    });
    return neoResult.records;
  } catch(err){
    logger.error(err);
    throw err;
  }
}

exports.deleteUser = async function(user){
  let query = 'MATCH(u:User{userId:{userId}})' + endOfLine;
  query += 'DETACH DELETE u';

  try{
    await neo4j.execute(query, {userId: user.userId});
  } catch (err){
    logger.error(err);
    throw err;
  }
}

exports.verifyUser = async function (verificationId) {
  let query = 'MATCH(u:User{verificationId:{verificationId}})' + endOfLine;
  query += 'SET u.verificationId = \'\'' + endOfLine
  query += 'SET u.verified = true RETURN u';
  try {
    let neoResult = await neo4j.execute(query,{ verificationId });
    return neoResult.records[0]._fields[0].properties;
  } catch(err) {
    logger.error(err);
    throw err;
  }
}

exports.validateUsername = async function (username) {
  let query = 'MATCH(u:User{username:{username}, verified:true})' + endOfLine;
  query += 'RETURN u';

  try{
    let neoResult = await neo4j.execute(query,{ username });
    return neoResult.records.length === 0;
  } catch (err){
    logger.error(err);
    throw err;
  }
}

exports.validateEmail = async function (email) {
  let query = 'MATCH(u:User{email:{email}, verified:true})' + endOfLine;
  query += 'RETURN u';

  try{
    let neoResult = await neo4j.execute(query,{ email });
    return neoResult.records.length === 0;
  } catch (err){
    logger.error(err);
    throw err;
  }
}

exports.findUser = async function (email) {
  let query = 'MATCH(u:User{email:{email}})' + endOfLine;
  query += 'RETURN u';

  try{
    let neoResult = await neo4j.execute(query,{ email });
    return neoResult.records[0]._fields[0].properties;
  } catch (err){
    logger.error(err);
    throw err;
  }
}

exports.retrieveUser = async function (username) {
  let query = 'MATCH(u:User{username:{username}, verified:true})' + endOfLine;
  query += 'RETURN u';

  try{
    let neoResult = await neo4j.execute(query,{ username });
    return neoResult.records[0]._fields[0].properties;
  } catch (err){
    logger.error(err);
    throw err;
  }
}

exports.updatePasswordResetToken = async function (userId, passwordResetToken) {
  let query = 'MATCH(u:User{userId:{userId}, verified:true})' + endOfLine;
  query += 'SET u.passwordResetToken = {passwordResetToken} RETURN u';
  try {
    let neoResult = await neo4j.execute(query,{ userId, passwordResetToken });
    return neoResult.records[0]._fields[0].properties;
  } catch(err) {
    logger.error(err);
    throw err;
  }
}

exports.updatePassword = async function (userId, password) {
  let query = 'MATCH(u:User{userId:{userId}, verified:true})' + endOfLine;
  query += 'SET u.password = {password} RETURN u';
  try {
    let neoResult = await neo4j.execute(query,{ userId, password });
    return neoResult.records[0]._fields[0].properties;
  } catch(err) {
    logger.error(err);
    throw err;
  }
}

exports.updateUser = async function (userId, profilePicture, bio) {
  let query = 'MATCH(u:User{userId:{userId}, verified:true})' + endOfLine;
  query += profilePicture.length > 0 ? 'SET u.profilePicture = \''+ profilePicture + '\'' + endOfLine : '';
  query += bio.length > 0 ? 'SET u.bio = \'' + bio + '\'' + endOfLine : '';
  query += 'RETURN u';
  try {
    let neoResult = await neo4j.execute(query,{ userId });
    return neoResult.records[0]._fields[0].properties;
  } catch(err) {
    logger.error(err);
    throw err;
  }
}

exports.attachExpoToken = async function (userId, expoToken) {
  let query = 'MATCH(u:User{userId:{userId}, verified:true})' + endOfLine;
  query += 'SET u.expoToken = {expoToken} RETURN u';
  try {
    let neoResult = await neo4j.execute(query,{ userId, expoToken });
    return neoResult.records[0]._fields[0].properties;
  } catch(err) {
    logger.error(err);
    throw err;
  }
}

exports.ActiveConstraints = [
  'CONSTRAINT ON ( user:User ) ASSERT user.userId IS UNIQUE',
  'CONSTRAINT ON ( user:User ) ASSERT user.email IS UNIQUE',
  'CONSTRAINT ON ( user:User ) ASSERT user.username IS UNIQUE',
];

exports.ActiveIndexes = [
  'INDEX ON :User(userId)',
  'INDEX ON :User(email)',
  'INDEX ON :User(username)',
];
