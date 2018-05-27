const chai = require('chai');
const should = chai.should();
const sinon = require('sinon');
const GeoPoint = require('thumb-utilities').GeoPoint;

describe('ride.model', () => {
  describe('findRideMatchesForTrip', () => {
    let startPoint = new GeoPoint(60.2,15.2);
    let endPoint = new GeoPoint(61.2,16.2);

    it('should return empty array when no rides exist', async() => {
      const User = require('../../src/models/user.model.js');
      const ridesDB = require('../../src/db/rides.js');
      sinon.stub(ridesDB, 'getRideMatchesForTripBoundary').callsFake(async() =>{
        return [];
      });
      sinon.stub(User, 'find').callsFake(async() => {
        return [];
      });

      const Ride = require('../../src/models/ride.model.js');
      let results = await Ride.findRideMatchesForTrip(startPoint, endPoint, "2018-03-31");
      results.length.should.equal(0);
      User.find.restore();
      ridesDB.getRideMatchesForTripBoundary.restore();
    });

    it('should return ride with no user details if user does not exist', async() => {
      const User = require('../../src/models/user.model.js');
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
      sinon.stub(User, 'find').callsFake(async() => {
        return [{
          "_id": {
            toString: function(){
              return '';
            }
          }
        }];
      });

      const Ride = require('../../src/models/ride.model.js');

      let results = await Ride.findRideMatchesForTrip(startPoint, endPoint, "2018-03-31");
      results.length.should.equal(1);
      results[0].userProfilePicture.should.equal('');
      results[0].userName.should.equal('');
      results[0].userFirstName.should.equal('');
      results[0].userLastName.should.equal('');
      User.find.restore();
      ridesDB.getRideMatchesForTripBoundary.restore();
    });

    it('should return ride match when ride exists for params', async() => {
      const User = require('../../src/models/user.model.js');
      const ridesDB = require('../../src/db/rides.js');
      const ride = {
        travelTime: "3,7",
        rideId: "7bc6e920-515a-11e8-8707-81d858e4dc1f",
        travelDate: "2018-04-18T00:00:00.000Z",
        availableSeats: 3,
        travelDescription: "Unit Testing Trip matches",
        userId: "5aef443fa52e0f5404a705f6",
        userProfilePicture: "asdfsadf",
        userName: "testuser",
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
          "userId": ride.userId
        }];
      });
      sinon.stub(User, 'find').callsFake(async() => {
        return [{
          "_id": {
            toString: function(){
              return ride.userId;
            }
          },
          "profile_picture": ride.userProfilePicture,
          "username": ride.userName,
          "firstName": ride.userFirstName,
          "lastName": ride.userLastName
        }];
      });

      const Ride = require('../../src/models/ride.model.js');

      let results = await Ride.findRideMatchesForTrip(startPoint, endPoint, "2018-03-31");
      results.length.should.equal(1);
      let resultString = JSON.stringify(results[0]);
      let rideString = JSON.stringify(ride);
      chai.expect(resultString).to.equal(rideString);
      User.find.restore();
      ridesDB.getRideMatchesForTripBoundary.restore();
    });
  });
});
