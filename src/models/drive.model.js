let mongoose = require('mongoose');
let locationTypes = require('./types/location.type.js');
let tripBoundaryType = require('./types/tripboundary.type.js');
let Location = mongoose.Schema.Types.Location;
let TripBoundarySchema = mongoose.Schema.Types.TripBoundarySchema;
let User = require('./user.model.js');
let drivesDB = require('../db/drives.js');
let thumbUtil = require('thumb-utilities');

var DriveSchema = mongoose.Schema({
    userId: String,
    startLocation: Location,
    endLocation: Location,
    travelDate: Date,
    travelTime: String,
    availableSeats: Number,
    travelDescription: String,
    tripBoundary: TripBoundarySchema
}, {
    timestamps: true
});

DriveSchema.methods.addTripBoundary = function(){
  this.tripBoundary = thumbUtil.TripBoundary.calculateBoundaryAroundPoints(this.startLocation.coordinates, this.endLocation.coordinates, 32186.9);
}

DriveSchema.methods.saveDrive = function(){
  return drivesDB.saveDrive(this);
};

DriveSchema.statics.findDriveMatchesForTrip = async function(startPoint, endPoint, travelDate){
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

module.exports = mongoose.model('drive', DriveSchema);
