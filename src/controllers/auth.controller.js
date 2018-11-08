const User = require('../models/user.model.js');
const Auth = require('../models/auth.model.js');
const config = require('../config.js');

const exceptions = require('../constants/exceptions.js');
const successResponses = require('../constants/success_responses.js');
const logger = require('thumb-logger').getLogger(config.API_LOGGER_NAME);

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
          const _token = Auth.createAuthToken(user.userId, user.email, user.username);
          const _refreshToken = Auth.createRefreshToken(user.userId, user.email, user.username);
          res.json({
              message: successResponses.user.USER_AUTHENTICATED,
              token: _token,
              refreshToken: _refreshToken,
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

exports.refreshToken = function(req, res){
  if(!req.body.refreshToken){
    return res.status(400).send({ message: exceptions.auth.MISSING_REFRESH_TOKEN });
  }

  const newToken = Auth.refreshToken(req.body.refreshToken)
    .then((newToken) => {
      return res.json({
        message: successResponses.user.USER_AUTHENTICATED,
        token: newToken.authToken,
        refreshToken: newToken.refreshToken
      });
    })
    .catch((error) => {
      logger.error('Error refreshing token: ' + error);
      return res.status(401).send({ message: exceptions.user.UNAUTHORIZED_USER });
    });
}
