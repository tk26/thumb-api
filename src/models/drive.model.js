let mongoose = require('mongoose');
let locationTypes = require('./types/location.type.js');
let Location = mongoose.Schema.Types.Location;
let drivesDB = require('../db/drives.js');

var DriveSchema = mongoose.Schema({
    /* Neo4j Properties */
    userId: String,
    startLocation: Location,
    endLocation: Location,
    travelDate: Date,
    travelTime: String,
    availableSeats: Number,
    travelDescription: String
}, {
    timestamps: true
});

DriveSchema.methods.saveDrive = function(drive){
  return drivesDB.saveDrive(drive);
};

module.exports = mongoose.model('drive', DriveSchema);
