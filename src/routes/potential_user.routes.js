var potentialUser = require('controllers/potential_user.controller.js');

module.exports = function(app) {
    app.post('/user/potential/create', potentialUser.submitPotentialUser);
}