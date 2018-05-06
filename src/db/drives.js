const neo4j = require('../extensions/neo4j.js');
const endOfLine = require('os').EOL;
const uuid = require('uuid/v1');

exports.saveDrive = function(drive){
  const driveId = uuid();
  const tripBoundary  = drive.tripBoundary.ToPolygonString();
  let session = neo4j.session();
  let query = 'MATCH(user:User{userId:{userId}})' + endOfLine;
  query += 'MERGE(d:Date{date:{travelDate}})' + endOfLine;
  query += 'MERGE(sl:Location{latitude:{startLocationLatitude},longitude:{startLocationLongitude},address:{startLocationAddress}})' + endOfLine;
  query += 'MERGE(el:Location{latitude:{endLocationLatitude},longitude:{endLocationLongitude},address:{endLocationAddress}})' + endOfLine;
  query += 'CREATE(user)-[:POSTS]->(dr:Drive{driveId:{driveId},travelDate:{travelDate},travelTime:{travelTime},availableSeats:{availableSeats},travelDescription:{travelDescription}, wkt:{tripBoundary}}),' + endOfLine;
  query += '(dr)-[:SCHEDULED_ON]->(d),' + endOfLine;
  query += '(dr)-[:STARTING_AT]->(sl),' + endOfLine;
  query += '(dr)-[:ENDING_AT]->(el) WITH dr' + endOfLine;
  query += 'CALL spatial.addNode(\'drives\', dr) YIELD node RETURN node';

  return session.run(query,
      {
        driveId: driveId,
        userId: drive.userId,
        travelDate: drive.travelDate.toISOString(),
        travelTime: drive.travelTime,
        startLocationAddress: drive.startLocation.address,
        startLocationLatitude: drive.startLocation.latitude,
        startLocationLongitude: drive.startLocation.longitude,
        endLocationAddress: drive.endLocation.address,
        endLocationLatitude: drive.endLocation.latitude,
        endLocationLongitude: drive.endLocation.longitude,
        availableSeats: parseInt(drive.availableSeats),
        travelDescription: drive.travelDescription,
        tripBoundary: tripBoundary
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
    'CONSTRAINT ON ( drive:Drive ) ASSERT drive.driveId IS UNIQUE'
];

exports.ActiveIndexes = [
    'INDEX ON :Drive(driveId)'
];
