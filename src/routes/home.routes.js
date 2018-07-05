var middleware = require('extensions/middleware.js');
var home = require('controllers/home.controller.js');

module.exports = function(app) {
    app.get('/home/feed', middleware('auth'), home.refreshFeed);
}
