const config = require('../config.js');
const thumbUtil = require('thumb-utilities');
const ridesDB = require('../db/rides.js');
const uuid = require('uuid/v1');
const exceptions = require('../constants/exceptions.js');

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
  constructor(userId, startLocation, endLocation, travelDate, travelTime, travelDescription, rideId, createdDate){
    this.userId = userId;
    this.startLocation = startLocation;
    this.endLocation = endLocation;
    this.travelDate = travelDate;
    this.travelTime = travelTime;
    this.travelDescription = travelDescription;
    this.rideId = rideId ? rideId : uuid();
    this.createdDate = createdDate ? createdDate : new Date();
  }

  /**
   *
   * @returns {Ride}
  */
  async save(){
    return ridesDB.saveRide(this);
  }

  /**
   *
   * @returns {void}
  */
  async delete(){
    return ridesDB.deleteRide(this);
  }

  /**
   * @param {String} rideId
   */
  static async deleteRideById(rideId) {
    return await ridesDB.deleteRide({ rideId });
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
    rides.forEach(async (r) =>{
      r.userProfilePicture = r.profilePicture ? r.profilePicture : '';
      r.userName = r.userName ? r.userName : '';
      r.userFirstName = r.firstName ? r.firstName : '';
      r.userLastName = r.lastName ? r.lastName : '';
    });

    return rides;
  }

/**
   *
   * @param {String} fromUserId
   * @param {String} toUserId
   * @param {String} rideId
   * @param {Array} requestedTime
   * @param {String} driveId - Optional parameter
   * @param {String} comment - Optional parameter
   * @returns {object}
   */
  static async inviteDriver(fromUserId, toUserId, rideId, requestedTime, driveId, comment){
    let currentInvitation = await ridesDB.getDriverInvitation(rideId, toUserId);

    if (currentInvitation.length !== 0){
      throw Error(exceptions.ride.INVITATION_ALREADY_SENT);
    }

    let driverInv = new thumbUtil.DriverInvitation({
      fromUserId : fromUserId,
      toUserId : toUserId,
      rideId : rideId,
      requestedTime : requestedTime,
      driveId : driveId,
      comment : comment
    });

    let results = await ridesDB.inviteDriver(driverInv);
    return driverInv;
  }
}
