var Feedback = require('models/feedback.model.js');
var User = require('models/user.model.js');

exports.submitFeedback = function(req, res) {
    if (!req.decoded.userId) {
        return res.status(400).send({ message: "userId not decoded" });
    }

    if (!req.body.feedbackType) {
        return res.status(400).send({ message: "Missing feedback type" });
    }

    if (!req.body.feedbackDescription) {
        return res.status(400).send({ message: "Missing feedback description" });
    }

    User.findOne({
        '_id' : req.decoded.userId,
        'verified' : true
    }, function(err, user) {
        if(err || !user) {
            return res.status(500).send({ message: "Incorrect userId" });
        }
    }).then( (user) => {
        if (!user.email) {
            return res.status(500).send({ message: "Incorrect user email" });
        }

        let feedback = new Feedback();
        feedback.type = req.body.feedbackType;
        feedback.description = req.body.feedbackDescription;
        feedback.userId = req.decoded.userId;
        feedback.userEmail = user.email;

        feedback.save((err, data) => {
            if(err) {
                return res.status(500).send(err);
            } else {
                res.json({ message: "Feedback Submitted Successfully" });
            }
        });
    });
};