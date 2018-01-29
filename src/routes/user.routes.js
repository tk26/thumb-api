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

    app.post('/user/payment/save', middleware('auth'), user.savePaymentInformation);
    
    app.put('/user/bio', middleware('auth'), user.editBio);

    app.put('/user/pic', middleware('auth'), user.editProfilePicture);
}