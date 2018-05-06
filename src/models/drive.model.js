let mongoose = require('mongoose');
let locationTypes = require('./types/location.type.js');
let tripBoundaryType = require('./types/tripboundary.type.js');
let Location = mongoose.Schema.Types.Location;
let TripBoundarySchema = mongoose.Schema.Types.TripBoundarySchema;
let drivesDB = require('../db/drives.js');
let thumbUtil = require('thumb-utilities');

var DriveSchema = mongoose.Schema({
    /* Neo4j Properties */
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

DriveSchema.methods.addTripBoundary = function(drive){
  const startPoint = new thumbUtil.GeoPoint(drive.startLocation.longitude, drive.startLocation.latitude);
  const endPoint = new thumbUtil.GeoPoint(drive.endLocation.longitude, drive.endLocation.latitude);
  drive.tripBoundary = thumbUtil.TripBoundary.calculateBoundaryAroundPoints(startPoint, endPoint, 32186.9);
}

DriveSchema.methods.saveDrive = function(drive){
  return drivesDB.saveDrive(drive);
};

module.exports = mongoose.model('drive', DriveSchema);
