const chai = require('chai');
const should = chai.should();
const sinon = require('sinon');
const GeoPoint = require('thumb-utilities').GeoPoint;
const uuid = require('uuid/v1');

describe('ride.model', () => {
  describe('findRideMatchesForTrip', () => {
    let startPoint = new GeoPoint(60.2,15.2);
    let endPoint = new GeoPoint(61.2,16.2);

    it('should return empty array when no rides exist', async() => {
      const ridesDB = require('../../src/db/rides.js');
      sinon.stub(ridesDB, 'getRideMatchesForTripBoundary').callsFake(async() =>{
        return [];
      });

      const Ride = require('../../src/models/ride.model.js');
      let results = await Ride.findRideMatchesForTrip(startPoint, endPoint, "2018-03-31");
      results.length.should.equal(0);
      ridesDB.getRideMatchesForTripBoundary.restore();
    });

    it('should return ride with no user details if user does not exist', async() => {
      const ridesDB = require('../../src/db/rides.js');
      sinon.stub(ridesDB, 'getRideMatchesForTripBoundary').callsFake(async() =>{
        return [{
          "travelTime": "3,7",
          "rideId": "7bc6e920-515a-11e8-8707-81d858e4dc1f",
          "travelDate": "2018-03-31T00:00:00.000Z",
          "travelDescription": "Testing trip boundary",
          "userId": "5aef443fa52e0f5404a705f6"
        }];
      });

      const Ride = require('../../src/models/ride.model.js');

      let results = await Ride.findRideMatchesForTrip(startPoint, endPoint, "2018-03-31");
      results.length.should.equal(1);
      results[0].userProfilePicture.should.equal('');
      results[0].userName.should.equal('');
      results[0].userFirstName.should.equal('');
      results[0].userLastName.should.equal('');
      ridesDB.getRideMatchesForTripBoundary.restore();
    });

    it('should return ride match when ride exists for params', async() => {
      const ridesDB = require('../../src/db/rides.js');
      const ride = {
        travelTime: "3,7",
        rideId: "7bc6e920-515a-11e8-8707-81d858e4dc1f",
        travelDate: "2018-04-18T00:00:00.000Z",
        availableSeats: 3,
        travelDescription: "Unit Testing Trip matches",
        userId: "5aef443fa52e0f5404a705f6",
        profilePicture: "asdfsadf",
        userName: "testuser",
        firstName: "Test",
        lastName: "User",
        userProfilePicture: "asdfsadf",
        userFirstName: "Test",
        userLastName: "User"
      }

      sinon.stub(ridesDB, 'getRideMatchesForTripBoundary').callsFake(async() =>{
        return [{
          "travelTime": ride.travelTime,
          "rideId": ride.rideId,
          "travelDate": ride.travelDate,
          "availableSeats": ride.availableSeats,
          "travelDescription": ride.travelDescription,
          "userId": ride.userId,
          "profilePicture": "asdfsadf",
          "userName": "testuser",
          "firstName": "Test",
          "lastName": "User"
        }];
      });

      const Ride = require('../../src/models/ride.model.js');

      let results = await Ride.findRideMatchesForTrip(startPoint, endPoint, "2018-03-31");
      results.length.should.equal(1);
      let resultString = JSON.stringify(results[0]);
      let rideString = JSON.stringify(ride);
      chai.expect(resultString).to.equal(rideString);
      ridesDB.getRideMatchesForTripBoundary.restore();
    });
  });
  describe('inviteRider', () => {
    const fromUserId = uuid();
    const toUserId = uuid();
    const driveId = uuid();
    const rideId = uuid();
    const requestedTime = '4pm';
    const comment = 'test';

    it('should throw error when invitation already exists', async() => {
      const ridesDB = require('../../src/db/rides.js');
      sinon.stub(ridesDB, 'getDriverInvitation').callsFake(async() =>{
        return [
          {
            invitation:{
              invitationId: '123'
            }
          }];
      });
      const Ride = require('../../src/models/ride.model.js');
      Ride.inviteDriver(fromUserId, toUserId, rideId, '4pm', driveId, '')
        .then(() => {throw Error('expected exception to be thrown when invitation exists!')
        })
        .catch((err) => {})
        .finally(() => {
          ridesDB.getDriverInvitation.restore();
        });
    });

    it('should successfully invite driver and return invitation when no invitation exists', async() => {
      const ridesDB = require('../../src/db/rides.js');
      sinon.stub(ridesDB, 'getDriverInvitation').callsFake(async() =>{
        return [];
      });
      sinon.stub(ridesDB, 'inviteDriver').callsFake(async() =>{
        return [{
          invitation:{
            invitationId: uuid()
          }
        }];
      });
      const Ride = require('../../src/models/ride.model.js');
      let result = await Ride.inviteDriver(fromUserId, toUserId, rideId, requestedTime, driveId, comment);
      result.invitationId.should.not.be.null;
      result.fromUserId.should.equal(fromUserId);
      result.toUserId.should.equal(toUserId);
      result.driveId.should.equal(driveId);
      result.rideId.should.equal(rideId);
      result.requestedTime.should.equal(requestedTime);
      result.comment.should.equal(comment);
    });
  });
});
