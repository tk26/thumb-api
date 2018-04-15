var mongoose = require('mongoose');
const ridesDB = require('../db/rides.js');

var RideSchema = mongoose.Schema({
    /* Neo4j Properties */
    userId: String,
    startAddress: String,
    endAddress: String,
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
