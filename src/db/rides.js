const neo4j = require('../extensions/neo4j.js');
const endOfLine = require('os').EOL;
const config = require('../config.js');
const logger = require('thumb-logger').getLogger(config.DB_LOGGER_NAME);

exports.saveRide = async function(ride){
  let query = 'MATCH(user:User{userId:{userId}})' + endOfLine;
  query += 'MERGE(d:Date{date:{travelDate}})' + endOfLine;
  query += 'MERGE(sl:Location{latitude:{startLocationLatitude},longitude:{startLocationLongitude},address:{startLocationAddress},city:{startLocationCity},wkt:{startLocationPoint}})' + endOfLine;
  query += 'MERGE(el:Location{latitude:{endLocationLatitude},longitude:{endLocationLongitude},address:{endLocationAddress},city:{endLocationCity},wkt:{endLocationPoint}})' + endOfLine;
  query += 'MERGE(user)-[:POSTS{postedOn:{createdDate}}]->(r:Ride{rideId:{rideId},travelDate:{travelDate},travelTime:{travelTime},pickupNotes:{pickupNotes},travelDescription:{travelDescription}})' + endOfLine;
  query += 'MERGE(r)-[:SCHEDULED_ON]->(d)' + endOfLine;
  query += 'MERGE(r)-[:STARTING_AT]->(sl)' + endOfLine;
  query += 'MERGE(r)-[:ENDING_AT]->(el)' + endOfLine;
  query += 'WITH sl as start, el as end, r as ride' + endOfLine;
  query += 'CALL spatial.addNode(\'locations\',start) YIELD node AS s' + endOfLine;
  query += 'CALL spatial.addNode(\'locations\',end) YIELD node AS e' + endOfLine;
  query += 'RETURN ride';

  try {
    let results = await neo4j.execute(query,
      {
        rideId: ride.rideId,
        userId: ride.userId,
        travelDate: ride.travelDate.toISOString(),
        travelTime: ride.travelTime,
        startLocationAddress: ride.startLocation.address,
        startLocationCity: ride.startLocation.city,
        startLocationLatitude: ride.startLocation.coordinates.latitude,
        startLocationLongitude: ride.startLocation.coordinates.longitude,
        startLocationPoint: ride.startLocation.coordinates.ToPointString(),
        endLocationAddress: ride.endLocation.address,
        endLocationCity: ride.endLocation.city,
        endLocationLatitude: ride.endLocation.coordinates.latitude,
        endLocationLongitude: ride.endLocation.coordinates.longitude,
        endLocationPoint: ride.endLocation.coordinates.ToPointString(),
        pickupNotes: ride.pickupNotes ? ride.pickupNotes : "",
        travelDescription: ride.travelDescription,
        createdDate: ride.createdDate.toISOString()
      }
    );

    return results.records[0]._fields[0].properties;
  } catch(error){
    logger.error(error);
    throw error;
  }
};

exports.inviteDriver = async function(driverInvite){
  let query = 'MATCH(fromUser:User{userId:{fromUserId}})' + endOfLine;
  query += 'MATCH(toUser:User{userId:{toUserId}})' + endOfLine;
  query += 'MATCH(r:Ride{rideId:{rideId}})' + endOfLine;
  query += driverInvite.driveId ? 'MATCH(d:Drive{driveId:{driveId}})' + endOfLine : '';
  query += 'MERGE(fromUser)-[s:SENDS{sentOn:{sentOn}}]->(i:Invitation{invitationId:{invitationId}, requestedTime:{requestedTime}, comment:{comment}})-[:TO]->(toUser)' + endOfLine;
  query += 'MERGE(i)-[:TO_JOIN]->(r)' + endOfLine;
  query += driverInvite.driveId ? 'MERGE(i)-[:FOR]->(d)' + endOfLine : '';
  query += 'RETURN fromUser, toUser, r, i, s';
  query += driverInvite.driveId ? ', d' : '';

  try {
    let rawResults = await neo4j.execute(query,{
      invitationId: driverInvite.invitationId,
      fromUserId: driverInvite.fromUserId,
      toUserId: driverInvite.toUserId,
      driveId: driverInvite.driveId,
      requestedTime: driverInvite.requestedTime,
      rideId: driverInvite.rideId,
      sentOn: driverInvite.sentOn.toISOString(),
      comment: driverInvite.comment ? driverInvite.comment : ''
    });

    return neo4j.deserializeResults(rawResults);
  } catch(error){
    logger.error(error);
    throw error;
  }
}

exports.deleteRide = async function(ride){
  let query = 'MATCH (r:Ride{rideId:{rideId}})' + endOfLine;
  query += 'DETACH DELETE r';
  try {
    return await neo4j.execute(query,{rideId: ride.rideId});
  } catch(err){
    logger.error(err);
    throw err;
  }
}

exports.getRideMatchesForTripBoundary = async function(tripBoundary, travelDate){
  let query = 'CALL spatial.intersects(\'locations\',"' + tripBoundary.ToPolygonString() + '") YIELD node AS s' + endOfLine;
  query += 'CALL spatial.intersects(\'locations\',"' + tripBoundary.ToPolygonString() + '") YIELD node AS e' + endOfLine;
  query += 'WITH s, e' + endOfLine;
  query += 'MATCH (s:Location)<-[:STARTING_AT]-(rs:Ride)-[:SCHEDULED_ON]->(d:Date{date:{travelDate}})' + endOfLine;
  query += 'MATCH (e:Location)<-[:ENDING_AT]-(re:Ride)-[:SCHEDULED_ON]->(d:Date{date:{travelDate}})' + endOfLine;
  query += 'WITH collect(rs) AS s, collect(re) AS e' + endOfLine;
  query += 'WITH apoc.coll.intersection(s,e) AS rides' + endOfLine;
  query += 'UNWIND rides AS r' + endOfLine;
  query += 'MATCH(r:Ride)<-[:POSTS]-(u:User)' + endOfLine;
  query += 'RETURN r, u LIMIT 25';

  try{
    let rawResults = await neo4j.execute(query,{travelDate: new Date(travelDate).toISOString()});
    let results = [];
    if (rawResults.records.length > 0){
      for(var i=0; i<rawResults.records.length; i++){
        let ride = rawResults.records[i]._fields[0].properties;
        delete ride.bbox;
        delete ride.wkt;
        delete ride.gtype;
        ride.userId = rawResults.records[i]._fields[1].properties.userId;
        results.push(ride);
      }
    }
    return results;
  } catch(error){
    logger.error(error);
    throw error;
  }
}

exports.getDriverInvitation = async function(rideId, toUserId){
  let query = 'MATCH(r:Ride{rideId:{rideId}})<-[:TO_JOIN]-(i:Invitation)' + endOfLine;
  query += 'MATCH(i)-[:TO]->(u:User{userId:{toUserId}})' + endOfLine;
  query += 'RETURN i';

  try {
    let rawResults = await neo4j.execute(query,{
      toUserId: toUserId,
      rideId: rideId
    });
    return neo4j.deserializeResults(rawResults);
  } catch(error){
    logger.error(error);
    throw error;
  }
}

exports.ActiveConstraints = [
    'CONSTRAINT ON ( ride:Ride ) ASSERT ride.rideId IS UNIQUE'
];

exports.ActiveIndexes = [
    'INDEX ON :Ride(rideId)'
];
