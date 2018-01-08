var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');

var PotentialUserSchema = mongoose.Schema({
    firstName: String,
    lastName: String,
    email: {
        type: String,
        unique: true 
    },
    school: String
}, {
    timestamps: true
});

PotentialUserSchema.plugin(autoIncrement.plugin, { model: 'potentialUser', field: 'potentialUserPublicId', startAt: 1 });

module.exports = mongoose.model('potentialUser', PotentialUserSchema);