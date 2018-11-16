const Auth = require('../models/auth.model.js');
const config = require('../config.js');

const exceptions = require('../constants/exceptions.js');
const successResponses = require('../constants/success_responses.js');
const logger = require('thumb-logger').getLogger(config.API_LOGGER_NAME);


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
