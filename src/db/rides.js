const User = require('../models/user.model.js');
const Ride = require('../models/ride.model.js');
const neo4j = require('../extensions/neo4j.js');
const endOfLine = require('os').EOL;

exports.saveRide = function(ride){
  let session = neo4j.session();
  let query = 'MATCH(user:User{userPublicId:{userPublicId}})' + endOfLine;
  query += 'CREATE(user)-[:POSTS]->(r:Ride{travelDate:{travelDate},travelTime:{travelTime}}),' + endOfLine;
  query += '(r)-[:SCHEDULED_ON]->(:Date{travelDate:{travelDate},travelTime:{travelTime}}),' + endOfLine;
  query += '(r)-[:STARTING_AT]->(:Address{address:{startAddress}}),' + endOfLine;
  query += '(r)-[:ENDING_AT]->(:Address{address:{endAddress}})';

  return session.run(query,
      {
        userPublicId: ride.body.userPublicId,
        travelDate: ride.body.travelDate,
        travelTime: ride.body.travelTime,
        startAddress: ride.body.startAddress,
        endAddress: ride.body.endAddress
      }
    )
    .then(() => {
      return;
    })
    .catch(error => {
      throw error;
    })
    .finally(() => {
      session.close();
    });
}
