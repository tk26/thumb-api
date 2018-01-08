var middleware = require('extensions/middleware.js');
var drive = require('controllers/drive.controller.js');

module.exports = function(app) {
    app.post('/drive/submit', middleware('auth'), drive.submitDrive);

    app.get('/drive/user/:userPublicId', drive.getDrivesByUser);
    
    app.get('/drive/:drivePublicId', drive.getDriveInfo);
}