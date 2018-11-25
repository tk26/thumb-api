var middleware = require('extensions/middleware.js');
var staticData = require('controllers/staticData.controller.js');

module.exports = function(app) {
  app.get('/universities', staticData.getUniversities);
}
