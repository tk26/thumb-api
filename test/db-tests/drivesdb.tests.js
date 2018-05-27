const neo4j = require('../../src/extensions/neo4j.js');
const drivesDB = require('../../src/db/drives.js');
const Drive = require('../../src/models/drive.model.js');
const GeoPoint = require('thumb-utilities').GeoPoint;
const uuid = require('uuid/v1');
const endOfLine = require('os').EOL;

let chai = require('chai');
let should = chai.should();

let getDriveFromResults = function(nodes, driveId){
  let driveResult = null;
  for(let i=0; i<nodes.length; i++){
    if(nodes[i].driveId === driveId)
    {
      driveResult = nodes[i];
      break;
    }
  }
  return driveResult;
}

describe('Drives DB', () => {

  describe('getDriveMatchesForTrip', () => {
    let travelDate = new Date("3/31/2018");
    let drive = new Drive({
      "startLocation" : {latitude:60.2,longitude:15.2,address:"623 Main Street",city:"Bloomington"},
      "endLocation" : {latitude:61.2,longitude:16.2,address:"623 Washington Street",city:"Bloomington"},
      "travelDate": travelDate,
      "travelTime": [3, 7],
      "availableSeats" : 3,
      "travelDescription" : 'Drive DB Tests'
    });
    let driveId = uuid();
    let userId = uuid();
    drive.addTripBoundary(drive);

    before(async() => {
      const tripBoundary  = drive.tripBoundary.ToPolygonString();
      let query = 'MERGE(d:Date{date:{travelDate}})' + endOfLine;
      query += 'CREATE(dr:Drive{driveId:{driveId},travelDate:{travelDate},travelTime:{travelTime},availableSeats:{availableSeats},travelDescription:{travelDescription}, wkt:{tripBoundary}}),' + endOfLine;
      query += '(u:User{userId:{userId}})-[:POSTS]->(dr),' + endOfLine;
      query += '(dr)-[:SCHEDULED_ON]->(d) WITH dr' + endOfLine;
      query += 'CALL spatial.addNode(\'drives\', dr) YIELD node RETURN node';

      await neo4j.execute(query,
          {
            driveId: driveId,
            userId: userId,
            travelDate: drive.travelDate.toISOString(),
            travelTime: drive.travelTime,
            availableSeats: parseInt(drive.availableSeats),
            travelDescription: drive.travelDescription,
            tripBoundary: tripBoundary
          }
        );
    });

    after(async() => {
      let query = 'MATCH (d:Drive{driveId:{driveId}})' + endOfLine;
      query += 'DETACH DELETE d';
      await neo4j.execute(query,{driveId: driveId});
      query = 'MATCH(u:User{userId:{userId}}) DETACH DELETE u';
      await neo4j.execute(query,{userId: userId});
    });

    it('should return created drive when provided matching trip', async() => {
      let driveResult;
      let nodes = await drivesDB.getDriveMatchesForTrip(drive.startLocation.coordinates, drive.endLocation.coordinates, drive.travelDate);
      driveResult = getDriveFromResults(nodes, driveId);
      driveResult.driveId.should.equal(driveId);
    });

    it('should not return created drive when provided trip on different date', async() => {
      let nodes = await drivesDB.getDriveMatchesForTrip(drive.startLocation.coordinates, drive.endLocation.coordinates, new Date("2018-04-01"));
      let driveResult = getDriveFromResults(nodes, driveId);
      chai.expect(driveResult).to.be.null;
    });

    it('should not return created drive when when provided trip with start location outside polygon', async() => {
      let startPoint = new GeoPoint(-10, -10);

      let nodes = await drivesDB.getDriveMatchesForTrip(startPoint, drive.endLocation.coordinates, drive.travelDate);
      let driveResult = getDriveFromResults(nodes, driveId);
      chai.expect(driveResult).to.be.null;
    });

    it('should not return created drive when when provided trip with end location outside polygon', async() => {
      let endPoint =  new GeoPoint(-10, -10);

      let nodes = await drivesDB.getDriveMatchesForTrip(drive.startLocation.coordinates, endPoint, drive.travelDate);
      let driveResult = getDriveFromResults(nodes, driveId);
      chai.expect(driveResult).to.be.null;
    });
  });
});

