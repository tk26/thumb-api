var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
const bcrypt = require('bcrypt');

var UserSchema = mongoose.Schema({
    firstName: String,
    lastName: String,
    email: {
        type: String,
        unique: true 
    },
    school: String,
    password : String,
    verified: Boolean,
    verificationId : String,
    rides: Array,
    drives: Array
}, {
    timestamps: true
});

// hash the password
UserSchema.methods.generateHash = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
UserSchema.methods.validatePassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

UserSchema.plugin(autoIncrement.plugin, { model: 'user', field: 'userPublicId', startAt: 1 });

module.exports = mongoose.model('user', UserSchema);