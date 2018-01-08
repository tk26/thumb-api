var Ride = require('models/ride.model.js');
var User = require('models/user.model.js');

exports.submitRide = function(req, res) {
    if(!req.decoded.userId) {
        res.status(400).send({ message: "A ride should have a userId" });
    }

    //validate request body parameters
    if(!req.body.from_location) {
        res.status(400).send({ message: "A ride should have a from location" });
    }

    if(!req.body.to_location) {
        res.status(400).send({ message: "A ride should have a to location" });
    }

    if(!req.body.travel_date) {
        res.status(400).send({ message: "A ride should have a travel date" });
    }

    if(!req.body.travel_time) {
        res.status(400).send({ message: "A ride should have travel times" });
    }

    var ride = new Ride({ 
        user_id: req.decoded.userId,
        user_publicId: req.decoded.userPublicId,
        user_firstName: req.decoded.userFirstName,
        user_lastName: req.decoded.userLastName,
        from_location: req.body.from_location,
        to_location: req.body.to_location,
        travel_date: req.body.travel_date,
        travel_time: req.body.travel_time,
        comment: req.body.comment || "",
    });

    ride.save(function(err, ride) {
        console.log(ride);
        if(err) {
            console.log(err);
            res.status(500).send({ message: "Some error occured during ride creation. Please try again." });
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
                        res.send({ message: "Ride Created Successfully." });
                    }
                });
            });
        }
    });
};

exports.getRidesByUser = function(req, res) {
    if(!req.params.userPublicId) {
        res.status(400).send({ message: "A publicId of user should be present" });
    }

    User.findOne({
        'userPublicId' : req.params.userPublicId,
        'verified' : true   
    }, function(err, user) {
        if(err || !user) {
            res.status(500).send({ message: "Incorrect publicId of user. Please try again" });
        }
        Ride.find({ 'user_id': user._id }, function(err, rides) {
            if(err) {
                res.status(500).send({ message: "Failed to find rides. Please try again" });
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
    });
};

exports.getRideInfo = function(req, res) {
    if(!req.params.ridePublicId) {
        res.status(400).send({ message: "A publicId of ride should be present" });
    }

    Ride.findOne({
        'ridePublicId' : req.params.ridePublicId
    }, function(err, ride) {
        if(err || !ride) {
            res.status(500).send({ message: "Incorrect publicId of ride. Please try again" });
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