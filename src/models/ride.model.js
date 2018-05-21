let mongoose = require('mongoose');
let locationTypes = require('./types/location.type.js');
let Location = mongoose.Schema.Types.Location;
let User = require('./user.model.js');
let TripBoundary = require('thumb-utilities').TripBoundary;
let ridesDB = require('../db/rides.js');

var RideSchema = mongoose.Schema({
    /* Neo4j Properties */
    userId: String,
    startLocation: Location,
    endLocation: Location,
    travelDate: Date,
    travelTime: String,
    pickupNotes: String,
    travelDescription: String
}, {
    timestamps: true
});

RideSchema.methods.saveRide = function(ride){
  return ridesDB.saveRide(ride);
};

RideSchema.statics.findRideMatchesForTrip = async function(startPoint, endPoint, travelDate){
  const tripBoundary = TripBoundary.calculateBoundaryAroundPoints(startPoint, endPoint,32186.9);
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

module.exports = mongoose.model('ride', RideSchema);
