var config = require('config.js');
var jwt = require('jsonwebtoken');
const exceptions = require('../constants/exceptions.js');

const map = {
    'auth': config.AUTH_SECRET,
    'reset': config.RESET_SECRET
}

module.exports = function(type) {
    return function(req, res, next) {
        // Implement the middleware function based on the options object
        // check header for token
        let token;
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            token = req.headers.authorization.split(' ')[1];
        }
        // decode token
        if (token) {
            // verifies secret and checks exp
            jwt.verify(token, map[type], function(err, decoded) {
                if (err) {
                  if(err.name === 'TokenExpiredError'){
                    return res.status(401).send({ success: false, message: exceptions.auth.EXPIRED_TOKEN });
                  }
                  return res.status(403).send({ success: false, message: exceptions.user.INVALID_USER_TOKEN });
                } else {
                    // if everything is good, save to request for use in other routes
                    req.decoded = decoded;
                    next();
                }
            });

        } else {
            // if there is no token
            // return an error
            return res.status(403).send({
                success: false,
                message: exceptions.user.MISSING_USER_TOKEN
            });
        }
    }
}
