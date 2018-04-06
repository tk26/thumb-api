var middleware = require('extensions/middleware.js');
var feedback = require('controllers/feedback.controller.js');

module.exports = function(app) {
    app.post('/feedback/submit', middleware('auth'), feedback.submitFeedback);
}