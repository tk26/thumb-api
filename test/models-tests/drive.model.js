const chai = require('chai');
const should = chai.should();
const sinon = require('sinon');
const GeoPoint = require('thumb-utilities').GeoPoint;
const uuid = require('uuid/v1');

describe('drive.model', () => {
  describe('findDriveMatchesForTrip', () => {
    let startPoint = new GeoPoint(60.2,15.2);
    let endPoint = new GeoPoint(61.2,16.2);

    it('should return empty array when no drives exist', async() => {
      const drivesDB = require('../../src/db/drives.js');
      sinon.stub(drivesDB, 'getDriveMatchesForTrip').callsFake(async() =>{
        return [];
      });

      const Drive = require('../../src/models/drive.model.js');
      let results = await Drive.findDriveMatchesForTrip(startPoint, endPoint, "2018-03-31");
      results.length.should.equal(0);
      drivesDB.getDriveMatchesForTrip.restore();
    });

    it('should return drive with no user details if user does not exist', async() => {
      const User2 = require('../../src/models/user2.model.js');
      const drivesDB = require('../../src/db/drives.js');
      sinon.stub(drivesDB, 'getDriveMatchesForTrip').callsFake(async() =>{
        return [{
          "travelTime": "3,7",
          "driveId": "7bc6e920-515a-11e8-8707-81d858e4dc1f",
          "travelDate": "2018-03-31T00:00:00.000Z",
          "availableSeats": 3,
          "travelDescription": "Testing trip boundary"
        }];
      });

      const Drive = require('../../src/models/drive.model.js');

      let results = await Drive.findDriveMatchesForTrip(startPoint, endPoint, "2018-03-31");
      results.length.should.equal(1);
      results[0].userProfilePicture.should.equal('');
      results[0].userName.should.equal('');
      results[0].userFirstName.should.equal('');
      results[0].userLastName.should.equal('');
      drivesDB.getDriveMatchesForTrip.restore();
    });

    it('should return drive match when drive exists for params', async() => {
      const drivesDB = require('../../src/db/drives.js');
      const drive = {
        travelTime: "3,7",
        driveId: "7bc6e920-515a-11e8-8707-81d858e4dc1f",
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

      sinon.stub(drivesDB, 'getDriveMatchesForTrip').callsFake(async() =>{
        return [{
          "travelTime": drive.travelTime,
          "driveId": drive.driveId,
          "travelDate": drive.travelDate,
          "availableSeats": drive.availableSeats,
          "travelDescription": drive.travelDescription,
          "userId": drive.userId,
          "profilePicture": "asdfsadf",
          "userName": "testuser",
          "firstName": "Test",
          "lastName": "User"
        }];
      });

      const Drive = require('../../src/models/drive.model.js');

      let results = await Drive.findDriveMatchesForTrip(startPoint, endPoint, "2018-03-31");
      results.length.should.equal(1);
      let resultString = JSON.stringify(results[0]);
      let driveString = JSON.stringify(drive);
      chai.expect(resultString).to.equal(driveString);
      drivesDB.getDriveMatchesForTrip.restore();
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
      const drivesDB = require('../../src/db/drives.js');
      sinon.stub(drivesDB, 'getRiderInvitation').callsFake(async() =>{
        return [
          {
            invitation:{
              invitationId: '123'
            }
          }];
      });
      const Drive = require('../../src/models/drive.model.js');
      Drive.inviteRider(fromUserId, toUserId, driveId, '4pm', rideId, '')
        .then(() => {throw Error('expected exception to be thrown when invitation exists!')
        })
        .catch((err) => {})
        .finally(() => {
          drivesDB.getRiderInvitation.restore();
        });
    });

    it('should successfully invite rider and return invitation when no invitation exists', async() => {
      const drivesDB = require('../../src/db/drives.js');
      sinon.stub(drivesDB, 'getRiderInvitation').callsFake(async() =>{
        return [];
      });
      sinon.stub(drivesDB, 'inviteRider').callsFake(async() =>{
        return [{
          invitation:{
            invitationId: uuid()
          }
        }];
      });
      const Drive = require('../../src/models/drive.model.js');
      let result = await Drive.inviteRider(fromUserId, toUserId, driveId, requestedTime, rideId, comment);
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
