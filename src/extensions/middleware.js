var config = require('config.js');
var jwt = require('jsonwebtoken');

const map = {
    'auth': config.AUTH_SECRET,
    'reset': config.RESET_SECRET
}

module.exports = function(type) {
    return function(req, res, next) {
        // Implement the middleware function based on the options object
        // check header or url parameters or post parameters for token
        let token;
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            token = req.headers.authorization.split(' ')[1];
        }
        else {
            token = req.body.token;
        }
        // decode token
        if (token) {
            // verifies secret and checks exp
            jwt.verify(token, map[type], function(err, decoded) {
                if (err) {
                    //return res.json({ success: false, message: 'Failed to authenticate token' });
                    return res.status(403).send({ success: false, message: 'Invalid token provided' });
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
                message: 'No token provided'
            });
        }
    }
}
