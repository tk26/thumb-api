var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');

var DriveSchema = mongoose.Schema({
    user_id: String,
    user_publicId: String,
    user_firstName: String,
    user_lastName: String,
    from_location: String,
    to_location: String,
    travel_date: String,
    travel_time : [ {type: String} ],
    seats_available: Number,
    comment: String
}, {
    timestamps: true
});

DriveSchema.plugin(autoIncrement.plugin, { model: 'drive', field: 'drivePublicId', startAt: 1 });

module.exports = mongoose.model('drive', DriveSchema);