const chai = require('chai');
const should = chai.should();
const sinon = require('sinon');
const GeoPoint = require('thumb-utilities').GeoPoint;

describe('drive.model', () => {
  describe('findDriveMatchesForTrip', () => {
    let startPoint = new GeoPoint(60.2,15.2);
    let endPoint = new GeoPoint(61.2,16.2);

    it('should return empty array when no drives exist', async() => {
      const User = require('../../src/models/user.model.js');
      const drivesDB = require('../../src/db/drives.js');
      sinon.stub(drivesDB, 'getDriveMatchesForTrip').callsFake(async() =>{
        return [];
      });
      sinon.stub(User, 'find').callsFake(async() => {
        return [];
      });

      const Drive = require('../../src/models/drive.model.js');
      let results = await Drive.findDriveMatchesForTrip(startPoint, endPoint, "2018-03-31");
      results.length.should.equal(0);
      User.find.restore();
      drivesDB.getDriveMatchesForTrip.restore();
    });

    it('should return drive with no user details if user does not exist', async() => {
      const User = require('../../src/models/user.model.js');
      const drivesDB = require('../../src/db/drives.js');
      sinon.stub(drivesDB, 'getDriveMatchesForTrip').callsFake(async() =>{
        return [{
          "travelTime": "3,7",
          "driveId": "7bc6e920-515a-11e8-8707-81d858e4dc1f",
          "travelDate": "2018-03-31T00:00:00.000Z",
          "availableSeats": 3,
          "travelDescription": "Testing trip boundary",
          "userId": "5aef443fa52e0f5404a705f6"
        }];
      });
      sinon.stub(User, 'find').callsFake(async() => {
        return [{
          "_id": {
            toString: function(){
              return '';
            }
          }
        }];
      });

      const Drive = require('../../src/models/drive.model.js');

      let results = await Drive.findDriveMatchesForTrip(startPoint, endPoint, "2018-03-31");
      results.length.should.equal(1);
      results[0].userProfilePicture.should.equal('');
      results[0].userName.should.equal('');
      results[0].userFirstName.should.equal('');
      results[0].userLastName.should.equal('');
      User.find.restore();
      drivesDB.getDriveMatchesForTrip.restore();
    });

    it('should return drive match when drive exists for params', async() => {
      const User = require('../../src/models/user.model.js');
      const drivesDB = require('../../src/db/drives.js');
      const drive = {
        travelTime: "3,7",
        driveId: "7bc6e920-515a-11e8-8707-81d858e4dc1f",
        travelDate: "2018-04-18T00:00:00.000Z",
        availableSeats: 3,
        travelDescription: "Unit Testing Trip matches",
        userId: "5aef443fa52e0f5404a705f6",
        userProfilePicture: "asdfsadf",
        userName: "testuser",
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
          "userId": drive.userId
        }];
      });
      sinon.stub(User, 'find').callsFake(async() => {
        return [{
          "_id": {
            toString: function(){
              return drive.userId;
            }
          },
          "profile_picture": drive.userProfilePicture,
          "username": drive.userName,
          "firstName": drive.userFirstName,
          "lastName": drive.userLastName
        }];
      });

      const Drive = require('../../src/models/drive.model.js');

      let results = await Drive.findDriveMatchesForTrip(startPoint, endPoint, "2018-03-31");
      results.length.should.equal(1);
      let resultString = JSON.stringify(results[0]);
      let driveString = JSON.stringify(drive);
      chai.expect(resultString).to.equal(driveString);
      User.find.restore();
      drivesDB.getDriveMatchesForTrip.restore();
    });
  });
});
