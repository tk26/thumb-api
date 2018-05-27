let config = require('../config.js');
let User = require('./user.model.js');
let thumbUtil = require('thumb-utilities');
let ridesDB = require('../db/rides.js');
let uuid = require('uuid/v1');

module.exports = class Ride{
   /**
   * @param {String} userId
   * @param {Location} startLocation
   * @param {Location} endLocation
   * @param {Date} travelDate
   * @param {String} travelTime
   * @param {String} travelDescription
   * @param {Guid} rideId - If not provided, the constructor will set ride ID to a new UUID
   */
  constructor(userId, startLocation, endLocation, travelDate, travelTime, travelDescription, rideId){
    this.userId = userId;
    this.startLocation = startLocation;
    this.endLocation = endLocation;
    this.travelDate = travelDate;
    this.travelTime = travelTime;
    this.travelDescription = travelDescription;
    this.rideId = rideId ? rideId : uuid();
  }

  /**
   *
   * @returns {Ride}
   */
  save(){
    return ridesDB.saveRide(this);
  }

  /**
   *
   * @param {object} req
   */
  static createRideFromRequest(req){
    let body = req.body;
    const startLocation = new thumbUtil.Location(
      body.startLocation.address,
      body.startLocation.city,
      body.startLocation.longitude,
      body.startLocation.latitude
    );

    const endLocation = new thumbUtil.Location(
      body.endLocation.address,
      body.endLocation.city,
      body.endLocation.longitude,
      body.endLocation.latitude
    );

    let travelTime = body.travelTime.join();

    return new Ride(req.decoded.userId, startLocation, endLocation, new Date(body.travelDate),
      travelTime, body.travelDescription);
  }

  /**
   *
   * @param {GeoPoint} startPoint
   * @param {GeoPoint} endPoint
   * @param {Date} travelDate
   * @returns {object}
   */
  static async findRideMatchesForTrip(startPoint, endPoint, travelDate){
    const tripBoundary = thumbUtil.TripBoundary.calculateBoundaryAroundPoints(startPoint, endPoint, config.APP_SETTINGS.TRIP_BOUNDARY_DISTANCE);
    let rides = await ridesDB.getRideMatchesForTripBoundary(tripBoundary, travelDate);
    let obj_ids = rides.map(d => d.userId);
    let users = await User.find({_id: {$in: obj_ids}});
    rides.forEach((r) =>{
      let user = users.find((u) => {
        return u._id.toString() === r.userId;
      });
      let userProfilePicture, userName, firstName, lastName;

      if(user){
        userProfilePicture = user.profile_picture;
        userName = user.username;
        firstName = user.firstName;
        lastName = user.lastName;
      }

      r.userProfilePicture = userProfilePicture ? userProfilePicture : '';
      r.userName = userName ? userName : '';
      r.userFirstName = firstName ? firstName : '';
      r.userLastName = lastName ? lastName : '';
    });

    return rides;
  }
}
