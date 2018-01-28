var Ride = require('models/ride.model.js');
var User = require('models/user.model.js');

exports.submitRide = function(req, res) {
    if(!req.decoded.userId) {
        res.status(400).send({ message: "userId not decoded" });
        next();
    }

    if(!req.body.from_location) {
        res.status(400).send({ message: "Missing Ride's From Location" });
        next();
    }

    if(!req.body.to_location) {
        res.status(400).send({ message: "Missing Ride's To Location" });
        next();
    }

    if(!req.body.travel_date) {
        res.status(400).send({ message: "Missing Ride's Travel Date" });
        next();
    }

    if(!req.body.travel_time) {
        res.status(400).send({ message: "Missing Ride's Travel Times" });
        next();
    }

    var ride = new Ride(req.body); 
    ride.user_id = req.decoded.userId;
    ride.user_publicId = req.decoded.userPublicId;
    ride.user_firstName = req.decoded.userFirstName;
    ride.user_lastName = req.decoded.userLastName;
    ride.comment = req.body.comment || "";

    ride.save(function(err, ride) {
        if(err) {
            res.status(500).send(err);
        } else {
            User.findOne({ '_id': req.decoded.userId }, function(err, user) {
                if(err || !user) {
                    return next(err);
                }
            }).then( (user) => {
                user.rides.push(ride._id);
                User.findOneAndUpdate({ '_id': user._id }, user, function(err, result) {
                    if(err) {
                        return next(err);
                    } else {
                        res.send({ message: "Ride Details Saved Successfully" });
                    }
                });
            });
        }
    });
};

exports.getRidesByUser = function(req, res) {
    User.findOne({
        'userPublicId' : req.params.userPublicId,
        'verified' : true   
    }, function(err, user) {
        if(err || !user) {
            res.status(500).send({ message: "Incorrect publicId of user" });
        }
        else {
            Ride.find({ 'user_id': user._id }, function(err, rides) {
                if(err) {
                    res.status(500).send({ message: "Incorrect userId" });
                }
                else {
                    res.send(rides.map(ride => {
                        return {
                            "ridePublicId" : ride.ridePublicId,
                            "rideFrom": ride.from_location,
                            "rideTo": ride.to_location,
                            "rideDate": ride.travel_date,
                            "rideTime": ride.travel_time,
                            "rideComment" : ride.comment
                        }
                    }));
                }
            });
        }
    });
};

exports.getRideInfo = function(req, res) {
    Ride.findOne({
        'ridePublicId' : req.params.ridePublicId
    }, function(err, ride) {
        if(err || !ride) {
            res.status(500).send({ message: "Incorrect publicId of ride" });
        }
        else {
            res.send({
                "rideFrom": ride.from_location,
                "rideTo": ride.to_location,
                "rideDate": ride.travel_date,
                "rideTime": ride.travel_time,
                "rideComment" : ride.comment,
                "rideUserPublicId" : ride.user_publicId,
                "rideUserFirstName" : ride.user_firstName,
                "rideUserLastName": ride.user_lastName
            });
        }
    });
};