var PotentialUser = require('models/potential_user.model.js');

exports.submitPotentialUser = function(req, res) {
    var potentialUser = new PotentialUser({ 
        firstName: req.body.firstName, 
        lastName: req.body.lastName, 
        email: req.body.email,
        school: req.body.school
    });

    potentialUser.save(function(err, data) {
        if(err) {
            res.status(500).send({ message: "Some error occured during user creation. Please try again." });
        } else {
            res.send({ message: "Potential User Details Saved Successfully." });
        }
    });
};