var middleware = require('extensions/middleware.js');
var ride = require('controllers/ride.controller.js');

module.exports = function(app) {
    app.post('/ride/submit', middleware('auth'), ride.submitRide);

    app.get('/ride/user/:userPublicId', ride.getRidesByUser);
    
    app.get('/ride/info/:ridePublicId', ride.getRideInfo);
}