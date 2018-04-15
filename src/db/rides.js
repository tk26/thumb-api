const neo4j = require('../extensions/neo4j.js');
const endOfLine = require('os').EOL;
const uuid = require('uuid/v1');

exports.saveRide = function(ride){
  const rideId = uuid();
  let session = neo4j.session();
  let query = 'MATCH(user:User{userId:{userId}})' + endOfLine;
  query += 'MERGE(d:Date{date:{travelDate}})' + endOfLine;
  query += 'MERGE(sa:Address{address:{startAddress}})' + endOfLine;
  query += 'MERGE(ea:Address{address:{endAddress}})' + endOfLine;
  query += 'CREATE(user)-[:POSTS]->(r:Ride{rideId:{rideId},travelDate:{travelDate},travelTime:{travelTime}},pickupNotes:{pickupNotes}),' + endOfLine;
  query += '(r)-[:SCHEDULED_ON]->(d),' + endOfLine;
  query += '(r)-[:STARTING_AT]->(sa),' + endOfLine;
  query += '(r)-[:ENDING_AT]->(ea) RETURN r';

  return session.run(query,
      {
        rideId: rideId,
        userId: ride.userId,
        travelDate: ride.travelDate.toISOString(),
        travelTime: ride.travelTime,
        startAddress: ride.startAddress,
        endAddress: ride.endAddress,
        pickupNotes: ride.pickupNotes
      }
    )
    .then((results) => {
      return results.records[0]._fields[0].properties;
    })
    .catch(error => {
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
