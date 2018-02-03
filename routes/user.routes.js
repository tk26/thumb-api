var middleware = require('extensions/middleware.js');
var user = require('controllers/user.controller.js');

module.exports = function(app) {
    app.post('/user/create', user.submitUser);

    app.get('/user/verify/:verificationId', user.verifyUser);

    app.post('/user/login', user.authenticateUser);

    app.post('/user/forgot', user.submitForgotPasswordUser);

    app.post('/user/reset', middleware('reset'), user.submitResetPasswordUser);

    app.get('/user/profile/:publicId', user.getUserInfo);

    app.put('/user/edit', middleware('auth'), user.editUser);

<<<<<<< HEAD
    app.post('/user/payment/save', middleware('auth'), user.savePaymentInformation);
=======
    app.put('/user/bio', middleware('auth'), user.editBio);
<<<<<<< HEAD
>>>>>>> added a new endpoint to the api for saving a users bio
=======

    app.put('/user/pic', middleware('auth'), user.editProfilePicture);
>>>>>>> added endpoint for updating user profile picture, implemented as a string for now
}