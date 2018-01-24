var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
const bcrypt = require('bcrypt');

var UserSchema = mongoose.Schema({
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
    },
    password : {
        type: String,
        required: true
    },
    verified: Boolean,
    verificationId : String,
    password_reset_token : String,
    rides: Array,
    drives: Array,
    stripeCustomerId: String,
    bio: String
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

autoIncrement.initialize(mongoose.connection);

UserSchema.plugin(autoIncrement.plugin, { model: 'user', field: 'userPublicId', startAt: 1 });

module.exports = mongoose.model('user', UserSchema);