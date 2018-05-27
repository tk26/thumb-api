var middleware = require('extensions/middleware.js');
var drive = require('controllers/drive.controller.js');

module.exports = function(app) {
    /*app.post('/drive/submit', middleware('auth'), drive.submitRide);

    app.get('/drive/user/:userPublicId', drive.getDrivesByUser);

    app.get('/drive/info/:drivePublicId', drive.getDriveInfo);*/
    app.get('/drive/tripmatches', middleware('auth'), drive.getTripMatches);

    app.post('/drive/create', middleware('auth'), drive.createDrive);
}
