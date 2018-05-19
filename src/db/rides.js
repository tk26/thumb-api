const neo4j = require('../extensions/neo4j.js');
const endOfLine = require('os').EOL;
const uuid = require('uuid/v1');

exports.saveRide = async function(ride){
  const rideId = uuid();
  let query = 'MATCH(user:User{userId:{userId}})' + endOfLine;
  query += 'MERGE(d:Date{date:{travelDate}})' + endOfLine;
  query += 'MERGE(sl:Location{latitude:{startLocationLatitude},longitude:{startLocationLongitude},address:{startLocationAddress},wkt:{startLocationPoint}})' + endOfLine;
  query += 'MERGE(el:Location{latitude:{endLocationLatitude},longitude:{endLocationLongitude},address:{endLocationAddress},wkt:{endLocationPoint}})' + endOfLine;
  query += 'CREATE(user)-[:POSTS]->(r:Ride{rideId:{rideId},travelDate:{travelDate},travelTime:{travelTime},pickupNotes:{pickupNotes},travelDescription:{travelDescription}}),' + endOfLine;
  query += '(r)-[:SCHEDULED_ON]->(d),' + endOfLine;
  query += '(r)-[:STARTING_AT]->(sl),' + endOfLine;
  query += '(r)-[:ENDING_AT]->(el)' + endOfLine;
  query += 'WITH sl as start, el as end, r as ride' + endOfLine;
  query += 'CALL spatial.addNode(\'locations\',start) YIELD node AS s' + endOfLine;
  query += 'CALL spatial.addNode(\'locations\',end) YIELD node AS e' + endOfLine;
  query += 'RETURN ride';

  let results = await neo4j.execute(query,
      {
        rideId: rideId,
        userId: ride.userId,
        travelDate: ride.travelDate.toISOString(),
        travelTime: ride.travelTime,
        startLocationAddress: ride.startLocation.address,
        startLocationLatitude: ride.startLocation.coordinates.latitude,
        startLocationLongitude: ride.startLocation.coordinates.longitude,
        startLocationPoint: ride.startLocation.coordinates.ToPointString(),
        endLocationAddress: ride.endLocation.address,
        endLocationLatitude: ride.endLocation.coordinates.latitude,
        endLocationLongitude: ride.endLocation.coordinates.longitude,
        endLocationPoint: ride.endLocation.coordinates.ToPointString(),
        pickupNotes: ride.pickupNotes ? ride.pickupNotes : "",
        travelDescription: ride.travelDescription
      }
    );

    return results.records[0]._fields[0].properties;
};

exports.getRideMatchesForTrip = async function(tripBoundary, travelDate){
  let query = 'CALL spatial.intersects(\'locations\',"' + tripBoundary.ToPolygonString() + '") YIELD node AS l' + endOfLine;
  query += 'WITH l AS loc MATCH (loc:Location)<-[:STARTING_AT]-(r:Ride)-[:ENDING_AT]->(loc:Location)' + endOfLine;
  query += 'WITH r AS rides MATCH(rides:Ride)-[SCHEDULED_ON]->(:Date{date:{travelDate}})' + endOfLine;
  query += 'RETURN rides';

  let results = await neo4j.execute(query, {travelDate: travelDate});
  return results;
}

exports.ActiveConstraints = [
    'CONSTRAINT ON ( ride:Ride ) ASSERT ride.rideId IS UNIQUE'
];

exports.ActiveIndexes = [
    'INDEX ON :Ride(rideId)'
];
