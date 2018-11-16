var middleware = require('extensions/middleware.js');
var auth = require('controllers/auth.controller.js');

module.exports = function(app) {
  app.post('/auth/token', auth.refreshToken);
}
