const neo4j = require('../extensions/neo4j.js');
const endOfLine = require('os').EOL;
const uuid = require('uuid/v1');

exports.saveRide = function(ride){
  const rideId = uuid();
  let session = neo4j.session();
  let query = 'MATCH(user:User{userId:{userId}})' + endOfLine;
  query += 'MERGE(d:Date{date:{travelDate}})' + endOfLine;
  query += 'MERGE(sl:Location{latitude:{startLocationLatitude},longitude:{startLocationLongitude},address:{startLocationAddress}})' + endOfLine;
  query += 'MERGE(el:Location{latitude:{endLocationLatitude},longitude:{endLocationLongitude},address:{endLocationAddress}})' + endOfLine;
  query += 'CREATE(user)-[:POSTS]->(r:Ride{rideId:{rideId},travelDate:{travelDate},travelTime:{travelTime},pickupNotes:{pickupNotes},travelDescription:{travelDescription}}),' + endOfLine;
  query += '(r)-[:SCHEDULED_ON]->(d),' + endOfLine;
  query += '(r)-[:STARTING_AT]->(sl),' + endOfLine;
  query += '(r)-[:ENDING_AT]->(el) RETURN r';

  return session.run(query,
      {
        rideId: rideId,
        userId: ride.userId,
        travelDate: ride.travelDate.toISOString(),
        travelTime: ride.travelTime,
        startLocationAddress: ride.startLocation.address,
        startLocationLatitude: ride.startLocation.latitude,
        startLocationLongitude: ride.startLocation.longitude,
        endLocationAddress: ride.endLocation.address,
        endLocationLatitude: ride.endLocation.latitude,
        endLocationLongitude: ride.endLocation.longitude,
        pickupNotes: ride.pickupNotes ? ride.pickupNotes : "",
        travelDescription: ride.travelDescription
      }
    )
    .then((results) => {
      return results.records[0]._fields[0].properties;
    })
    .catch(error => {
      console.log(error); // eslint-disable-line no-console
      throw error;
    })
    .finally(() => {
      session.close();
    });
}

exports.ActiveConstraints = [
    'CONSTRAINT ON ( ride:Ride ) ASSERT ride.rideId IS UNIQUE'
];

exports.ActiveIndexes = [
    'INDEX ON :Ride(rideId)'
];
