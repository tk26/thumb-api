var middleware = require('extensions/middleware.js');
var user = require('controllers/user.controller.js');

module.exports = function(app) {
    app.post('/user/create', user.submitUser);

    app.get('/user/verify/:verificationId', user.verifyUser);

    app.post('/user/login', user.authenticateUser);

    app.post('/user/forgot', user.submitForgotPasswordUser);

    app.post('/user/reset', middleware('reset'), user.submitResetPasswordUser);

    app.get('/user/profile/:username', middleware('auth'), user.getUserProfile);

    app.put('/user/edit', middleware('auth'), user.editUser);

    app.put('/user/bio', middleware('auth'), user.editBio);

    app.put('/user/pic', middleware('auth'), user.editProfilePicture);

    app.get('/user/validate/username/:username', user.validateUsername);

    app.get('/user/validate/email/:email', user.validateEmail);

    app.post('/user/expo/token/save', middleware('auth'), user.saveExpoToken);

    app.post('/user/follow/', middleware('auth'), user.followUser);

    app.post('/user/unfollow/', middleware('auth'), user.unfollowUser);
}