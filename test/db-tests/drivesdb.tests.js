const thumbUtil = require('thumb-utilities');
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
    let startLocation = new thumbUtil.Location('623 Main Street', 'Bloomington',15.2, 60.2);
    let endLocation = new thumbUtil.Location('623 Washington Street', 'Bloomington', 16.2, 61.2);
    let userId = uuid();
    let drive = new Drive(userId, startLocation, endLocation, travelDate, '3,7', 3, 'Drive DB Tests');

    before(async() => {
      let query = 'MERGE(d:Date{date:{travelDate}})' + endOfLine;
      query += 'CREATE(dr:Drive{driveId:{driveId},travelDate:{travelDate},travelTime:{travelTime},availableSeats:{availableSeats},travelDescription:{travelDescription}, wkt:{tripBoundary}}),' + endOfLine;
      query += '(u:User{userId:{userId}})-[:POSTS]->(dr),' + endOfLine;
      query += '(dr)-[:SCHEDULED_ON]->(d) WITH dr' + endOfLine;
      query += 'CALL spatial.addNode(\'drives\', dr) YIELD node RETURN node';

      await neo4j.execute(query,
          {
            driveId: drive.driveId,
            userId: drive.userId,
            travelDate: drive.travelDate.toISOString(),
            travelTime: drive.travelTime,
            availableSeats: parseInt(drive.availableSeats),
            travelDescription: drive.travelDescription,
            tripBoundary: drive.tripBoundary.ToPolygonString()
          }
        );
    });

    after(async() => {
      let query = 'MATCH (d:Drive{driveId:{driveId}})' + endOfLine;
      query += 'DETACH DELETE d';
      await neo4j.execute(query,{driveId: drive.driveId});
      query = 'MATCH(u:User{userId:{userId}}) DETACH DELETE u';
      await neo4j.execute(query,{userId: drive.userId});
    });

    it('should return created drive when provided matching trip', async() => {
      let driveResult;
      let nodes = await drivesDB.getDriveMatchesForTrip(drive.startLocation.coordinates, drive.endLocation.coordinates, drive.travelDate);
      driveResult = getDriveFromResults(nodes, drive.driveId);
      driveResult.driveId.should.equal(drive.driveId);
    });

    it('should not return created drive when provided trip on different date', async() => {
      let nodes = await drivesDB.getDriveMatchesForTrip(drive.startLocation.coordinates, drive.endLocation.coordinates, new Date("2018-04-01"));
      let driveResult = getDriveFromResults(nodes, drive.driveId);
      chai.expect(driveResult).to.be.null;
    });

    it('should not return created drive when when provided trip with start location outside polygon', async() => {
      let startPoint = new GeoPoint(-10, -10);

      let nodes = await drivesDB.getDriveMatchesForTrip(startPoint, drive.endLocation.coordinates, drive.travelDate);
      let driveResult = getDriveFromResults(nodes, drive.driveId);
      chai.expect(driveResult).to.be.null;
    });

    it('should not return created drive when when provided trip with end location outside polygon', async() => {
      let endPoint =  new GeoPoint(-10, -10);

      let nodes = await drivesDB.getDriveMatchesForTrip(drive.startLocation.coordinates, endPoint, drive.travelDate);
      let driveResult = getDriveFromResults(nodes, drive.driveId);
      chai.expect(driveResult).to.be.null;
    });
  });
});

