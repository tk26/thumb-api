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
    if(nodes[i].properties.driveId === driveId)
    {
      driveResult = nodes[i].properties;
      break;
    }
  }
  return driveResult;
}

describe.only('Drives DB Tests', () => {

  describe('getDriveMatchesForTrip', () => {
    let travelDate = new Date("3/31/2018");
    let drive = new Drive({
      "startLocation" : {latitude:60.2,longitude:15.2,address:"623 Main Street"},
      "endLocation" : {latitude:61.2,longitude:16.2,address:"623 Washington Street"},
      "travelDate": travelDate,
      "travelTime": [3, 7],
      "availableSeats" : 3,
      "travelDescription" : 'Drive DB Tests'
    });
    let driveId = uuid();
    drive.addTripBoundary(drive);

    before(async() => {
      const tripBoundary  = drive.tripBoundary.ToPolygonString();
      let session = neo4j.session();
      let query = 'MERGE(d:Date{date:{travelDate}})' + endOfLine;
      query += 'CREATE(dr:Drive{driveId:{driveId},travelDate:{travelDate},travelTime:{travelTime},availableSeats:{availableSeats},travelDescription:{travelDescription}, wkt:{tripBoundary}}),' + endOfLine;
      query += '(dr)-[:SCHEDULED_ON]->(d) WITH dr' + endOfLine;
      query += 'CALL spatial.addNode(\'drives\', dr) YIELD node RETURN node';

      await neo4j.execute(query,
          {
            driveId: driveId,
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
    });

    it('should return created drive when provided matching trip', async() => {
      let driveResult;
      let nodes = await drivesDB.getDriveMatchesForTrip(drive.startLocation, drive.endLocation, drive.travelDate);
      driveResult = getDriveFromResults(nodes, driveId);
      driveResult.driveId.should.equal(driveId);
    });

    it('should not return created drive when provided trip on different date', async() => {
      let nodes = await drivesDB.getDriveMatchesForTrip(drive.startLocation, drive.endLocation, new Date("2018-04-01"));
      let driveResult = getDriveFromResults(nodes, driveId);
      chai.expect(driveResult).to.be.null;
    });

    it('should not return created drive when when provided trip with start location outside polygon', async() => {
      let startLocation = {
        address: "123 Main Street",
        coordinates: new GeoPoint(-10, -10)
      };

      let nodes = await drivesDB.getDriveMatchesForTrip(startLocation, drive.endLocation, drive.travelDate);
      let driveResult = getDriveFromResults(nodes, driveId);
      chai.expect(driveResult).to.be.null;
    });

    it('should not return created drive when when provided trip with end location outside polygon', async() => {
      let endLocation = {
        address: "123 Main Street",
        coordinates: new GeoPoint(-10, -10)
      };

      let nodes = await drivesDB.getDriveMatchesForTrip(drive.startLocation, endLocation, drive.travelDate);
      let driveResult = getDriveFromResults(nodes, driveId);
      chai.expect(driveResult).to.be.null;
    });
  });
});

