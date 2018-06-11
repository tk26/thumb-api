const thumbUtil = require('thumb-utilities');
const config = require('../config.js');
const User2 = require('./user2.model.js');
const drivesDB = require('../db/drives.js');
const uuid = require('uuid/v1');
const exceptions = require('../constants/exceptions.js');

module.exports = class Drive{
  /**
   * @param {String} userId
   * @param {Location} startLocation
   * @param {Location} endLocation
   * @param {Date} travelDate
   * @param {String} travelTime
   * @param {Number} availableSeats
   * @param {String} travelDescription
   * @param {Guid} driveId - If not provided, the constructor will set drive ID to a new UUID
   */
  constructor(userId, startLocation, endLocation, travelDate, travelTime, availableSeats, travelDescription, driveId){
    this.userId = userId;
    this.startLocation = startLocation;
    this.endLocation = endLocation;
    this.travelDate = travelDate;
    this.travelTime = travelTime;
    this.availableSeats = availableSeats;
    this.travelDescription = travelDescription;
    this.driveId = driveId ? driveId : uuid();
    this.tripBoundary = thumbUtil.TripBoundary.calculateBoundaryAroundPoints(
      startLocation.coordinates, endLocation.coordinates, config.APP_SETTINGS.TRIP_BOUNDARY_DISTANCE);
  }

  /**
   *
   * @returns {Drive}
  */
  async save(){
    return await drivesDB.saveDrive(this);
  }

  /**
   *
   * @returns {Promise}
  */
  async delete(){
    return await drivesDB.deleteDrive(this);
  }

  /**
   * @param {String} driveId
   */
  static async deleteDriveById(driveId) {
    return await drivesDB.deleteDrive({ driveId });
  }

  /**
   *
   * @param {object} req
   */
  static createDriveFromRequest(req){
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

    return new Drive(req.decoded.userId, startLocation, endLocation, new Date(body.travelDate),
      travelTime, body.availableSeats, body.travelDescription);
  }

  /**
   *
   * @param {GeoPoint} startPoint
   * @param {GeoPoint} endPoint
   * @param {Date} travelDate
   * @returns {object}
   */
  static async findDriveMatchesForTrip(startPoint, endPoint, travelDate){
    let drives = await drivesDB.getDriveMatchesForTrip(startPoint, endPoint, travelDate);
    drives.forEach(async (d) =>{
      d.userProfilePicture = d.profilePicture ? d.profilePicture : '';
      d.userName = d.userName ? d.userName : '';
      d.userFirstName = d.firstName ? d.firstName : '';
      d.userLastName = d.lastName ? d.lastName : '';
    });

    return drives;
  }

  /**
   *
   * @param {String} fromUserId
   * @param {String} toUserId
   * @param {String} driveId
   * @param {Array} requestedTimes
   * @param {String} rideId - Optional parameter
   * @param {String} comment - Optional parameter
   * @returns {object}
   */
  static async inviteRider(fromUserId, toUserId, driveId, requestedTime, rideId, comment){
    let currentInvitation = await drivesDB.getRiderInvitation(driveId, toUserId);

    if (currentInvitation.length !== 0){
      throw Error(exceptions.drive.INVITATION_ALREADY_SENT);
    }

    let riderInv = new thumbUtil.RiderInvitation({
      fromUserId : fromUserId,
      toUserId : toUserId,
      driveId : driveId,
      requestedTime : requestedTime,
      rideId : rideId,
      comment : comment
    });

    let results = await drivesDB.inviteRider(riderInv);
    return riderInv;
  }
}
