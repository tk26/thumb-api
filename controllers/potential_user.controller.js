var PotentialUser = require('models/potential_user.model.js');

exports.submitPotentialUser = function(req, res) {
    if(!req.body.firstName){
        res.status(400).send({ message: "Missing Potential User's First Name"});
        next();
    }

    if(!req.body.lastName){
        res.status(400).send({ message: "Missing Potential User's Last Name"});
        next();
    }

    if(!req.body.email){
        res.status(400).send({ message: "Missing Potential User's Email"});
        next();
    }

    if(!req.body.school){
        res.status(400).send({ message: "Missing Potential User's School"});
        next();
    }

    var potentialUser = new PotentialUser(req.body);

    potentialUser.save((err, data) => {
        if(err) {
            res.status(500).send(err);
        } else {
            res.send({ message: "Potential User Details Saved Successfully" });
        }
    });
};