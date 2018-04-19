let mongoose = require('mongoose');
let locationTypes = require('./types/location.type.js');
let Location = mongoose.Schema.Types.Location;
let ridesDB = require('../db/rides.js');

var RideSchema = mongoose.Schema({
    /* Neo4j Properties */
    userId: String,
    startLocation: Location,
    endLocation: Location,
    travelDate: Date,
    travelTime: String,
    pickupNotes: String
}, {
    timestamps: true
});

RideSchema.methods.saveRide = function(ride){
  return ridesDB.saveRide(ride);
};

module.exports = mongoose.model('ride', RideSchema);
