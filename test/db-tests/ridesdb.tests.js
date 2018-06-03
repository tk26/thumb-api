const neo4j = require('../../src/extensions/neo4j.js');
const rideDB = require('../../src/db/rides.js');
const driveDB = require('../../src/db/drives.js');
const Ride = require('../../src/models/ride.model.js');
const Drive = require('../../src/models/drive.model.js');
const thumbUtil = require('thumb-utilities');
const uuid = require('uuid/v1');
const endOfLine = require('os').EOL;

const chai = require('chai');
const should = chai.should();

describe('Rides DB', () => {
  let travelDate = new Date("3/31/2018");
  let startLocation = new thumbUtil.Location('623 Main Street', 'Bloomington',15.2, 60.2);
  let endLocation = new thumbUtil.Location('623 Washington Street', 'Bloomington', 16.2, 61.2);
  let userId = uuid();
  let driveUserId = uuid();
  let ride = new Ride(userId, startLocation, endLocation, travelDate, '3,7', 'Ride DB Tests');
  let drive = new Drive(driveUserId, startLocation, endLocation, travelDate, '3,7', 3, 'Ride DB Tests');

  before(async() => {
    //Create users
    query = 'CREATE (u:User{userId:{userId}}), (du:User{userId:{driveUserId}})';
    await neo4j.execute(query,
      {
        userId: ride.userId,
        driveUserId: drive.userId
      }
    );
    await rideDB.saveRide(ride);
    await driveDB.saveDrive(drive);
  });

  after(async() => {
    let query = 'MATCH (d:Drive{driveId:{driveId}})' + endOfLine;
    query += 'DETACH DELETE d';
    await neo4j.execute(query,{driveId: drive.driveId});

    query = 'MATCH (r:Ride{rideId:{rideId}})' + endOfLine;
    query += 'DETACH DELETE r';
    await neo4j.execute(query,{rideId: ride.rideId});

    query = 'MATCH(u:User{userId:{userId}}) DETACH DELETE u';
    await neo4j.execute(query,{userId: drive.userId});

    query = 'MATCH(u:User{userId:{userId}}) DETACH DELETE u';
    await neo4j.execute(query,{userId: ride.userId});
  });

  describe('inviteRider', () => {
    it('should create invitation when provided Ride and Drive', async() => {
      let driverInvitation = new thumbUtil.DriverInvitation({
        fromUserId: ride.userId,
        toUserId: drive.userId,
        rideId: ride.rideId,
        requestedTime: '5pm',
        driveId: drive.driveId
      });
      let results = await rideDB.inviteDriver(driverInvitation);
      results.length.should.equal(1);
      results[0].invitation[0].invitationId.should.equal(driverInvitation.invitationId);
      results[0].ride[0].rideId.should.equal(driverInvitation.rideId);
      chai.expect(results[0]).to.have.property("drive");
      results[0].drive[0].driveId.should.equal(driverInvitation.driveId);
      let query = 'MATCH(i:Invitation{invitationId:{invitationId}}) DETACH DELETE i';
      await neo4j.execute(query,{invitationId: driverInvitation.invitationId});
    });
    it('should send invitation to user without a drive when provided Ride', async() => {
      let driverInvitation = new thumbUtil.DriverInvitation({
        fromUserId: ride.userId,
        toUserId: drive.userId,
        rideId: ride.rideId,
        requestedTime: '5pm'
      });
      let results = await rideDB.inviteDriver(driverInvitation);
      results.length.should.equal(1);
      results[0].invitation[0].invitationId.should.equal(driverInvitation.invitationId);
      results[0].ride[0].rideId.should.equal(driverInvitation.rideId);
      chai.expect(results[0]).to.not.have.property("drive");
      let query = 'MATCH(i:Invitation{invitationId:{invitationId}}) DETACH DELETE i';
      await neo4j.execute(query,{invitationId: driverInvitation.invitationId});
    });
  });
  describe('getDriverInvitation', () => {
    it('should get created invitation', async() => {
      let driverInvitation = new thumbUtil.DriverInvitation({
        fromUserId: ride.userId,
        toUserId: drive.userId,
        rideId: ride.rideId,
        requestedTime: '5pm',
        driveId: drive.driveId
      });
      let results = await rideDB.inviteDriver(driverInvitation);
      results.length.should.equal(1);
      let invResults = await rideDB.getDriverInvitation(driverInvitation.rideId, driverInvitation.toUserId);
      invResults.length.should.not.equal(0);
    });
  });
  describe('getRideMatchesForTripBoundary', () => {
    let tripBoundaryDistance = 32186.9;
    let rideTripBoundary = thumbUtil.TripBoundary.calculateBoundaryAroundPoints(ride.startLocation.coordinates, ride.endLocation.coordinates, tripBoundaryDistance);

    it('should return created ride when provided tripboundary including ride', async() => {
      let results = await rideDB.getRideMatchesForTripBoundary(rideTripBoundary, ride.travelDate);
      let rideResult = results.find((r) => {
        return r.rideId === ride.rideId;
      });
      chai.expect(rideResult).to.not.be.null;
      chai.expect(rideResult.userId).to.be.equal(ride.userId);
    });

    it('should not return created ride when provided trip boundary that does not include ride', async() => {
      let startPoint = new thumbUtil.GeoPoint(-10,-10);
      let endPoint = new thumbUtil.GeoPoint(-11,-11);
      let tripBoundary = thumbUtil.TripBoundary.calculateBoundaryAroundPoints(startPoint, endPoint, tripBoundaryDistance);
      let results = await rideDB.getRideMatchesForTripBoundary(tripBoundary, ride.travelDate);
      let rideResult = results.find((r) => {
        return r.rideId === ride.rideId;
      });
      chai.expect(rideResult).to.be.undefined;
    });

    it('should not return created ride when provided different travel date', async() => {
      let results = await rideDB.getRideMatchesForTripBoundary(rideTripBoundary, new Date('4/30/2018'));
      let rideResult = results.find((r) => {
        return r.rideId === ride.rideId;
      });
      chai.expect(rideResult).to.be.undefined;
    });
  });
});
