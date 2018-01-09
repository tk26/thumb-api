var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');

var RideSchema = mongoose.Schema({
    user_id: String,
    user_publicId: String,
    user_firstName: String,
    user_lastName: String,
    from_location: {
        type: String,
        required: true
    },
    to_location: {
        type: String,
        required: true
    },
    travel_date: {
        type: String,
        required: true
    },
    travel_time: [{
        type: String, required: true
    }],
    comment: String
}, {
    timestamps: true
});

autoIncrement.initialize(mongoose.connection);

RideSchema.plugin(autoIncrement.plugin, { model: 'ride', field: 'ridePublicId', startAt: 1 });

module.exports = mongoose.model('ride', RideSchema);