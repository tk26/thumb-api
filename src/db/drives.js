const neo4j = require('../extensions/neo4j.js');
const endOfLine = require('os').EOL;
const config = require('../config.js');
const logger = require('thumb-logger').getLogger(config.API_LOGGER_NAME);

exports.saveDrive = async function(drive){
  const tripBoundary  = drive.tripBoundary.ToPolygonString();
  let query = 'MATCH(user:User{userId:{userId}})' + endOfLine;
  query += 'MERGE(d:Date{date:{travelDate}})' + endOfLine;
  query += 'MERGE(sl:Location{latitude:{startLocationLatitude},longitude:{startLocationLongitude},address:{startLocationAddress},city:{startLocationCity}})' + endOfLine;
  query += 'MERGE(el:Location{latitude:{endLocationLatitude},longitude:{endLocationLongitude},address:{endLocationAddress},city:{endLocationCity}})' + endOfLine;
  query += 'CREATE(user)-[:POSTS]->(dr:Drive{driveId:{driveId},travelDate:{travelDate},travelTime:{travelTime},availableSeats:{availableSeats},travelDescription:{travelDescription}, wkt:{tripBoundary}}),' + endOfLine;
  query += '(dr)-[:SCHEDULED_ON]->(d),' + endOfLine;
  query += '(dr)-[:STARTING_AT]->(sl),' + endOfLine;
  query += '(dr)-[:ENDING_AT]->(el) WITH dr' + endOfLine;
  query += 'CALL spatial.addNode(\'drives\', dr) YIELD node RETURN node';

  try {
    let results = await neo4j.execute(query,
      {
        driveId: drive.driveId,
        userId: drive.userId,
        travelDate: drive.travelDate.toISOString(),
        travelTime: drive.travelTime,
        startLocationAddress: drive.startLocation.address,
        startLocationCity: drive.startLocation.city,
        startLocationLatitude: drive.startLocation.coordinates.latitude,
        startLocationLongitude: drive.startLocation.coordinates.longitude,
        endLocationAddress: drive.endLocation.address,
        endLocationCity: drive.endLocation.city,
        endLocationLatitude: drive.endLocation.coordinates.latitude,
        endLocationLongitude: drive.endLocation.coordinates.longitude,
        availableSeats: parseInt(drive.availableSeats),
        travelDescription: drive.travelDescription,
        tripBoundary: tripBoundary
      }
    );
    return results.records[0]._fields[0].properties;
  } catch(error){
    logger.error(error);
    throw error;
  }
}

exports.getDriveMatchesForTrip = async function(startPoint, endPoint, travelDate) {
  let query = 'CALL spatial.intersects(\'drives\',"' + startPoint.ToPointString() + '") YIELD node AS starts' + endOfLine;
  query += 'CALL spatial.intersects(\'drives\',"' + endPoint.ToPointString() + '") YIELD node AS ends' + endOfLine;
  query += 'WITH starts, ends' + endOfLine;
  query += 'MATCH (starts:Drive)-[:SCHEDULED_ON]->(d:Date{date:{travelDate}})' + endOfLine;
  query += 'MATCH(ends:Drive)-[:SCHEDULED_ON]->(d:Date{date:{travelDate}})' + endOfLine;
  query += 'WITH collect(starts) as s, collect(ends) as e' + endOfLine;
  query += 'WITH apoc.coll.intersection(s,e) AS drives' + endOfLine;
  query += 'UNWIND drives AS d' + endOfLine;
  query += 'MATCH(d:Drive)<-[:POSTS]-(u:User)' + endOfLine;
  query += 'RETURN d, u LIMIT 25';

  try{
    let rawResults = await neo4j.execute(query,{travelDate: new Date(travelDate).toISOString()});
    let results = [];
    if (rawResults.records.length > 0){
      for(var i=0; i<rawResults.records.length; i++){
        let drive = rawResults.records[i]._fields[0].properties;
        delete drive.bbox;
        delete drive.wkt;
        delete drive.gtype;
        drive.userId = rawResults.records[i]._fields[1].properties.userId;
        results.push(drive);
      }
    }
    return results;
  } catch(error){
    logger.error(error);
    throw error;
  }
}

/**
 * @param {String} driveId
 * @param {String} toUserId
 * @returns {Boolean}
 */
exports.getRiderInvitation = async function(driveId, toUserId){
  let query = 'MATCH(d:Drive{driveId:{driveId}})<-[:TO_JOIN]-(i:Invitation)' + endOfLine;
  query += 'MATCH(i)-[:TO]->(u:User{userId:{toUserId}})' + endOfLine;
  query += 'RETURN i';

  try {
    let rawResults = await neo4j.execute(query,{
      toUserId: toUserId,
      driveId: driveId
    });

    return neo4j.deserializeResults(rawResults);
  } catch(error){
    throw error;
  }
}


/**
 * @param {RiderInvitation} riderInvite
 * @returns {object}
 */
exports.inviteRider = async function(riderInvite){
  let query = 'MATCH(fromUser:User{userId:{fromUserId}})' + endOfLine;
  query += 'MATCH(toUser:User{userId:{toUserId}})' + endOfLine;
  query += 'MATCH(d:Drive{driveId:{driveId}})' + endOfLine;
  query += 'MATCH(r:Ride{rideId:{rideId}})' + endOfLine;
  query += 'MERGE(fromUser)-[s:SENDS{sentOn:{sentOn}}]->(i:Invitation{invitationId:{invitationId}, requestedTime:{requestedTime}, comment:{comment}})-[:TO]->(toUser)' + endOfLine;
  query += 'MERGE(i)-[:TO_JOIN]->(d)' + endOfLine;
  query += 'MERGE(i)-[:FOR]->(r)' + endOfLine;
  query += 'RETURN fromUser, toUser, d, r, i, s';

  try {
    let rawResults = await neo4j.execute(query,{
      invitationId: riderInvite.invitationId,
      fromUserId: riderInvite.fromUserId,
      toUserId: riderInvite.toUserId,
      driveId: riderInvite.driveId,
      requestedTime: riderInvite.requestedTime,
      rideId: riderInvite.rideId,
      sentOn: riderInvite.sentOn.toISOString(),
      comment: riderInvite.comment ? riderInvite.comment : ''
    });

    return neo4j.deserializeResults(rawResults);
  } catch(error){
    throw error;
  }
}

exports.ActiveConstraints = [
    'CONSTRAINT ON ( drive:Drive ) ASSERT drive.driveId IS UNIQUE'
];

exports.ActiveIndexes = [
    'INDEX ON :Drive(driveId)'
];
