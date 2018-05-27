let thumbUtil = require('thumb-utilities');
let config = require('../config.js');
let User = require('./user.model.js');
let drivesDB = require('../db/drives.js');
let uuid = require('uuid/v1');

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
  save(){
    return drivesDB.saveDrive(this);
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
    let obj_ids = drives.map(d => d.userId);
    let users = await User.find({_id: {$in: obj_ids}});
    drives.forEach((d) =>{
      let user = users.find((u) => {
        return u._id.toString() === d.userId;
      });
      let userProfilePicture, userName, firstName, lastName;

      if(user){
        userProfilePicture = user.profile_picture;
        userName = user.username;
        firstName = user.firstName;
        lastName = user.lastName;
      }

      d.userProfilePicture = userProfilePicture ? userProfilePicture : '';
      d.userName = userName ? userName : '';
      d.userFirstName = firstName ? firstName : '';
      d.userLastName = lastName ? lastName : '';
    });

    return drives;
  }
}
