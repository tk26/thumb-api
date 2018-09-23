const User = require('../models/user.model.js');
var jwt = require('jsonwebtoken');
var config = require('config.js');
const exceptions = require('../constants/exceptions.js');
const successResponses = require('../constants/success_responses.js');
const logger = require('thumb-logger').getLogger(config.API_LOGGER_NAME);
const thumbUtil = require('thumb-utilities');

var stripe = require('stripe')(config.STRIPE_SECRET);
const randomstring = require('randomstring');


var Twilio = require('twilio');
var twilio = new Twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);

exports.submitUser = function(req, res) {
    if(!req.body.firstName){
        return res.status(400).send({ message: exceptions.user.MISSING_FIRST_NAME });
    }

    if(!req.body.lastName){
        return res.status(400).send({ message: exceptions.user.MISSING_LAST_NAME });
    }

    if(!req.body.email){
        return res.status(400).send({ message: exceptions.user.MISSING_EMAIL });
    }

    if(!req.body.school){
        return res.status(400).send({ message: exceptions.user.MISSING_SCHOOL });
    }

    if(!req.body.password){
        return res.status(400).send({ message: exceptions.user.MISSING_PASSWORD });
    }

    if(!req.body.username){
        return res.status(400).send({ message: exceptions.user.MISSING_USERNAME });
    }

    if(!req.body.birthday){
        return res.status(400).send({ message: exceptions.user.MISSING_BIRTHDAY });
    }

    let user = User.createUserFromRequest(req);

    user.createNewUser()
      .then(() => {
        return res.json({ message: successResponses.user.USER_CREATED });
      })
      .catch((err) => {
        logger.error('Error creating user: ' + err);
        return res.status(500).send({ message: exceptions.user.INTERNAL_ERROR });
      });
};

exports.verifyUser = function(req, res, next) {
    User.verifyUser(req.params.verificationId)
    .then(() => {
        res.redirect(config.BASE_URL_WEBAPP);
    })
    .catch((err) => {
      logger.error('Error verifying user: ' + err);
      return res.status(500).send({ message: exceptions.common.INTERNAL_ERROR });
    });
};

exports.authenticateUser = function(req, res) {
    if(!req.body.email){
        return res.status(400).send({ message: exceptions.user.MISSING_EMAIL });
    }

    if(!req.body.password){
        return res.status(400).send({ message: exceptions.user.MISSING_PASSWORD });
    }

    User.findUser(req.body.email)
    .then(user => {
        if (!User.validatePassword(req.body.password, user.password)) {
            return res.status(400).send({ message: exceptions.user.INVALID_PASSWORD });
        } else if (!user.verified) {
            // resend user verification email
            User.sendVerificationEmail(user.userId, req.body.email, user.verificationId)
              .then(() => {
                return res.status(403).send({ message: exceptions.user.UNVERIFIED_USER });
              })
              .catch(() => {
                return res.status(500).send({ message: exceptions.common.INTERNAL_ERROR });
              });

        } else {
            const payload = {
                userId: user.userId,
                email: user.email,
                username: user.username,
            };
            const _token = jwt.sign(payload, config.AUTH_SECRET, {
                expiresIn: 18000
            });
            res.json({
                message: successResponses.user.USER_AUTHENTICATED,
                token: _token,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                school: user.school || "",
                birthday: user.birthday,
                profilePicture: user.profilePicture || "",
                bio: user.bio || ""
            });
        }
    })
    .catch((err) => {
        logger.error('Error retrieving user: ' + err);
        return res.status(500).send({ message: exceptions.common.INTERNAL_ERROR });
    });
};

exports.submitForgotPasswordUser = function(req, res) {
    if(!req.body.email){
        return res.status(400).send({ message: exceptions.user.MISSING_EMAIL });
    }

    let email = req.body.email.toLowerCase();
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/ ;

    if (!regex.test(email)) {
        return res.status(422).send({ message: exceptions.user.INVALID_EMAIL });
    }

    // check if ends in .edu
    if (email.substr(email.length - 4) !== '.edu') {
        return res.status(422).send({ message: exceptions.user.NON_STUDENT_EMAIL });
    }

    User.findUser(email)
    .then(user => {
        if (!user.verified) {
            return res.status(403).send({ message: exceptions.user.UNVERIFIED_USER });
        } else {
            const payload = {
                userId: user.userId,
                email: user.email,
                username: user.username,
            };
            const resetToken = jwt.sign(payload, config.RESET_SECRET, {
                expiresIn: 300
            });

            User.updatePasswordResetToken(user.userId, resetToken, user.email)
              .then(() => {
                return res.json({ message: successResponses.user.USER_PASSWORD_RESET_EMAIL_SENT });
              })
              .catch((err) => {
                return next(err);
              });
        }
    })
    .catch((err) => {
        logger.error('Error retrieving user: ' + err);
        return res.status(500).send({ message: exceptions.common.INTERNAL_ERROR });
    });
};

exports.submitResetPasswordUser = function(req, res) {
    if(!req.decoded.userId) {
      return res.status(400).send({ message: exceptions.user.UNAUTHORIZED_USER });
    }

    if(!req.body.password) {
      return res.status(400).send({ message: exceptions.user.MISSING_PASSWORD });
    }
    User.updatePassword(req.decoded.userId, User.generateHash(req.body.password), req.decoded.email)
    .then(() => {
      res.json({ message: successResponses.user.USER_PASSWORD_RESET });
    })
    .catch((err) => {
      logger.error('Error resetting password: ' + err);
      return res.status(500).send({ message: exceptions.common.INTERNAL_ERROR });
    });
};

exports.getUserProfile = function(req, res) {
    if(!req.decoded.userId) {
        return res.status(400).send({ message: exceptions.user.UNAUTHORIZED_USER });
    }

    if (!thumbUtil.User.validateUsername(req.params.username)) {
        return res.status(422).send({ message: exceptions.user.INVALID_USERNAME });
    }

    User.retrieveUser(req.params.username.toLowerCase())
    .then((profile) => {
        return res.json({
            message: successResponses.user.USER_PROFILE_RETRIEVED,
            editable: profile.user.userId === req.decoded.userId,
            firstName : profile.user.firstName,
            lastName : profile.user.lastName,
            school: profile.user.school,
            profilePicture: profile.user.profilePicture || '',
            bio: profile.user.bio || '',
            follows: profile.follows,
            followedBy: profile.followedBy,
        });
    })
    .catch((err) => {
        logger.error('Error retrieving user: ' + err);
        return res.status(500).send({ message: exceptions.common.INTERNAL_ERROR });
    });
};

exports.editUser = function(req, res) {
    if(!req.decoded.userId) {
      return res.status(400).send({ message: exceptions.user.UNAUTHORIZED_USER });
    }

    User.updateUser(req.decoded.userId, req.body.profilePicture || '', req.body.bio || '')
    .then(() => {
      return res.json({ message: successResponses.user.USER_UPDATED });
    })
    .catch((err) => {
      logger.error('Error editing user: ' + err);
      return res.status(500).send({ message: exceptions.common.INTERNAL_ERROR });
    });
};

exports.editBio = function(req, res) {
    if(!req.decoded.userId) {
      return res.status(400).send({ message: exceptions.user.UNAUTHORIZED_USER });
    }

    User.updateUser(req.decoded.userId, '', req.body.bio || '')
    .then(() => {
      return res.json({ message: successResponses.user.USER_BIO_UPDATED });
    })
    .catch((err) => {
      logger.error('Error editing bio: ' + err);
      return res.status(500).send({ message: exceptions.common.INTERNAL_ERROR });
    });
}

exports.editProfilePicture = function(req, res) {
  if(!req.decoded.userId) {
    return res.status(400).send({ message: exceptions.user.UNAUTHORIZED_USER });
  }

  User.updateUser(req.decoded.userId, req.body.profilePicture || '', '')
    .then(() => {
      return res.json({ message: successResponses.user.USER_PROFILE_PICTURE_UPDATED });
    })
    .catch((err) => {
      logger.error('Error editing profile picture: ' + err);
      return res.status(500).send({ message: exceptions.common.INTERNAL_ERROR });
    });
}

exports.validateUsername = (req, res) => {
  if (!thumbUtil.User.validateUsername(req.params.username)) {
      return res.status(422).send({ message: exceptions.user.INVALID_USERNAME });
  }

  User.validateUsername(req.params.username)
    .then(isValid => {
        return isValid ? res.json({ message: successResponses.user.VALID_USERNAME })
            : res.status(409).send({ message: exceptions.user.DUPLICATE_USERNAME });
    })
    .catch((err) => {
      logger.error('Error validating username: ' + err);
      return res.status(500).send({ message: exceptions.common.INTERNAL_ERROR });
    });
}

exports.validateEmail = (req, res) => {
    let email = req.params.email.toLowerCase();
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/ ;

    if (!regex.test(email)) {
        return res.status(422).send({ message: exceptions.user.INVALID_EMAIL });
    }
    // check if ends in .edu
    if (email.substr(email.length - 4) !== '.edu') {
        return res.status(422).send({ message: exceptions.user.NON_STUDENT_EMAIL });
    }

    User.validateEmail(email)
      .then(isValid => {
          return isValid ? res.json({ message: successResponses.user.VALID_EMAIL })
              : res.status(409).send({ message: exceptions.user.DUPLICATE_EMAIL });
      })
      .catch((err) => {
        logger.error('Error validating email: ' + err);
        return res.status(500).send({ message: exceptions.common.INTERNAL_ERROR });
      });
}

exports.saveExpoToken = (req, res) => {
    if(!req.decoded.userId) {
        return res.status(400).send({ message: exceptions.user.UNAUTHORIZED_USER });
    }

    if(!req.body.expoToken) {
        return res.status(400).send({ message: exceptions.user.MISSING_EXPO_TOKEN });
    }

    User.attachExpoToken(req.decoded.userId, req.body.expoToken)
      .then(() => {
          return res.json({ message: successResponses.user.USER_EXPO_TOKEN_ATTACHED });
      })
      .catch((err) => {
        logger.error('Error saving expo token: ' + err);
        return res.status(500).send({ message: exceptions.common.INTERNAL_ERROR });
      });
}

exports.followUser = (req, res) => {
    if(!req.decoded.userId) {
        return res.status(400).send({ message: exceptions.user.UNAUTHORIZED_USER });
    }

    if(!req.body.toUsername) {
        return res.status(400).send({ message: exceptions.user.MISSING_USERNAME });
    }

    User.followUser(req.decoded.username, req.body.toUsername)
      .then(() => {
        return res.json({ message: successResponses.user.USER_FOLLOWED });
      })
      .catch((err) => {
        logger.error('Error following user: ' + err);
        return res.status(500).send({ message: exceptions.common.INTERNAL_ERROR });
      });
}

exports.unfollowUser  = (req, res) => {
    if(!req.decoded.userId) {
        return res.status(400).send({ message: exceptions.user.UNAUTHORIZED_USER });
    }

    if(!req.body.toUsername) {
        return res.status(400).send({ message: exceptions.user.MISSING_USERNAME });
    }

    User.unfollowUser(req.decoded.username, req.body.toUsername)
    .then(() => {
        res.json({ message: successResponses.user.USER_UNFOLLOWED });
    })
    .catch((err) => {
      logger.error('Error unfollowing user: ' + err);
      return next(err);
    });
}
