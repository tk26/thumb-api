var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');

var PotentialUserSchema = mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true 
    },
    school: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

autoIncrement.initialize(mongoose.connection);

PotentialUserSchema.plugin(autoIncrement.plugin, { model: 'potentialUser', field: 'potentialUserPublicId', startAt: 1 });

module.exports = mongoose.model('potentialUser', PotentialUserSchema);