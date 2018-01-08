var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');

var RideSchema = mongoose.Schema({
    user_id: String,
    user_publicId: String,
    user_firstName: String,
    user_lastName: String,
    from_location: String,
    to_location: String,
    travel_date: String,
    travel_time: [ {type: String} ],
    comment: String
}, {
    timestamps: true
});

RideSchema.plugin(autoIncrement.plugin, { model: 'ride', field: 'ridePublicId', startAt: 1 });

module.exports = mongoose.model('ride', RideSchema);