const config = require('../config.js');
const neo4j = require('../extensions/neo4j.js');
const endOfLine = require('os').EOL;
const logger = require('thumb-logger').getLogger(config.DB_LOGGER_NAME);

exports.saveUser = async function(user){
  try {
    let query = 'MERGE(u:User{userId:{userId}})' + endOfLine;
    query += 'SET u.firstName = {firstName}' + endOfLine;
    query += 'SET u.lastName = {lastName}' + endOfLine;
    query += 'SET u.email = {email}' + endOfLine;
    query += 'SET u.password = {password}' + endOfLine;
    query += 'SET u.username = {username}' + endOfLine;
    query += 'SET u.birthday = {birthday}' + endOfLine;
    query += 'SET u.verified = {verified}' + endOfLine;
    query += 'SET u.verificationId = {verificationId}' + endOfLine;
    query += 'RETURN u';
    let neoResult = await neo4j.execute(query,{
      userId: user.userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: user.password,
      username: user.username,
      birthday: user.birthday,
      verified: user.verified,
      verificationId: user.verificationId,
    });
    return neoResult.records;
  } catch(err){
    logger.error(err);
    throw err;
  }
}

exports.addUniverisity = async function(userId, officialName){
  let query = 'MATCH(u:User{userId:{userId}})' + endOfLine;
  query += 'MATCH(un:University{officialName:{officialName}})' + endOfLine;
  query += 'MERGE(u)-[:ATTENDS]->(un)';
  try{
    await neo4j.execute(query, {userId: userId, officialName: officialName});
  } catch (err){
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

exports.deleteUserByEmail = async function(email){
  let query = 'MATCH(u:User{email:{email}})' + endOfLine;
  query += 'DETACH DELETE u';

  try{
    await neo4j.execute(query, {email});
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

exports.findUser = async function ({ userId, email }) {
  let queryFilter = email ? '{email:{email}}' : '';
  queryFilter = userId ? '{userId:{userId}}' : queryFilter;
  let query = 'MATCH(u:User' + queryFilter + ') WITH(u) OPTIONAL MATCH(u)-[:ATTENDS]->(un:University)' + endOfLine;
  query += 'RETURN u.userId AS userId, u.email AS email, u.password AS password, u.firstName AS firstName, u.lastName AS lastName, ';
  query += 'u.username AS username, u.birthday as birthday, u.bio AS bio, u.profilePicture AS profilePicture, un.officialName AS school,';
  query += 'u.verificationId AS verificationId, u.verified AS verified, u.passwordResetToken AS passwordResetToken, u.expoToken AS expoToken';

  try{
    let rawResults = await neo4j.execute(query, {userId, email});
    if(rawResults.records.length === 0){
      return {};
    }
    let record = rawResults.records[0];
    return {
      userId: record.get('userId'),
      email: record.get('email'),
      password: record.get('password'),
      firstName: record.get('firstName'),
      lastName: record.get('lastName'),
      username: record.get('username'),
      birthday: record.get('birthday'),
      bio: record.get('bio'),
      profilePicture: record.get('profilePicture'),
      school: record.get('school'),
      verificationId: record.get('verificationId'),
      verified: record.get('verified'),
      passwordResetToken: record.get('passwordResetToken'),
      expoToken: record.get('expoToken')
    };
  } catch (err){
    logger.error(err);
    throw err;
  }
}

exports.retrieveUser = async function (username) {
  let user, follows, followedBy, query;
  // user
  query = 'MATCH(u:User{username:{username}, verified:true}) WITH(u) OPTIONAL MATCH(u)-[:ATTENDS]->(un:University)' + endOfLine;
  query += 'RETURN u.userId, u.email, u.firstName, u.lastName, u.username, u.birthday, u.bio, u.profilePicture, un.officialName';
  try{
    let neoResult = await neo4j.execute(query,{ username });
    if(neoResult.records.length === 0){
      return {};
    }
    let record = neoResult.records[0];
    user = {
      userId: record.get('u.userId'),
      email: record.get('u.email'),
      firstName: record.get('u.firstName'),
      lastName: record.get('u.lastName'),
      username: record.get('u.username'),
      birthday: record.get('u.birthday'),
      bio: record.get('u.bio'),
      profilePicture: record.get('u.profilePicture'),
      school: record.get('un.officialName')
    };
  } catch (err){
    logger.error(err);
    throw err;
  }
  // users followed
  query = 'MATCH(u:User{username:{username}})-[:FOLLOWS]->(f1:User)' + endOfLine;
  query += 'RETURN f1';

  try{
    let neoResult = await neo4j.execute(query,{ username });
    follows = neoResult.records.length === 0 ? []
      : neoResult.records.map(record => {
        const { firstName, lastName, username } = record._fields[0].properties;
        return { firstName, lastName, username };
    });
  } catch (err){
    logger.error(err);
    throw err;
  }
  // users following
  query = 'MATCH(u:User{username:{username}})<-[:FOLLOWS]-(f2:User)' + endOfLine;
  query += 'RETURN f2';

  try{
    let neoResult = await neo4j.execute(query,{ username });
    followedBy = neoResult.records.length === 0 ? []
      : neoResult.records.map(record => {
        const { firstName, lastName, username } = record._fields[0].properties;
        return { firstName, lastName, username };
      });
  } catch (err){
    logger.error(err);
    throw err;
  }

  return { user, follows, followedBy };
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

exports.updateUser = async function (userId, bio) {
  let query = 'MATCH(u:User{userId:{userId}, verified:true})' + endOfLine;
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

exports.setProfilePicture = async function(userId, pictureId, url) {
  let query = 'MATCH(u:User{userId:{userId}})' + endOfLine;
  query += 'SET u.profilePicture = {url}' + endOfLine;
  query += 'WITH(u) CREATE (u)-[:PROFILE_PICTURE]->(a:Asset{assetId:{assetId}, url:{url}})' + endOfLine;
  query += "RETURN a";
  try {
    let neoResult = await neo4j.execute(query,{
      userId,
      assetId: pictureId,
      url
    });
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

exports.followUser = async function (fromUsername, toUsername) {
  let query = 'MATCH(fromUser:User{username:{fromUsername}})' + endOfLine;
  query += 'MATCH(toUser:User{username:{toUsername}})' + endOfLine;
  query += 'MERGE(fromUser)-[f:FOLLOWS]->(toUser) RETURN toUser.userId, toUser.expoToken';

  try {
    let rawResults = await neo4j.execute(query, { fromUsername, toUsername });
    return neo4j.mapKeysToFields(rawResults);
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

exports.unfollowUser = async function (fromUsername, toUsername) {
  let query = 'MATCH(fromUser:User{username:{fromUsername}})' + endOfLine;
  query += 'MATCH(toUser:User{username:{toUsername}})' + endOfLine;
  query += 'MERGE(fromUser)-[f:FOLLOWS]->(toUser) DELETE f';

  try {
    let results = await neo4j.execute(query, { fromUsername, toUsername });
    return results;
  } catch (error) {
    logger.error(error);
    throw error;
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
