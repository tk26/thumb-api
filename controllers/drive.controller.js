var Drive = require('models/drive.model.js');
var User = require('models/user.model.js');

exports.submitDrive = function(req, res) {
    if(!req.decoded.userId) {
        res.status(400).send({ message: "A drive should have a userId" });
    }

    //validate request body parameters
    if(!req.body.from_location) {
        res.status(400).send({ message: "A drive should have a from location" });
    }

    if(!req.body.to_location) {
        res.status(400).send({ message: "A drive should have a to location" });
    }

    if(!req.body.travel_date) {
        res.status(400).send({ message: "A drive should have a travel date" });
    }

    if(!req.body.travel_time) {
        res.status(400).send({ message: "A drive should have travel times" });
    }

    if(!req.body.seats_available) {
        res.status(400).send({ message: "A drive should have seats available" });
    }

    var drive = new Drive({ 
        user_id: req.decoded.userId,
        user_publicId: req.decoded.userPublicId,
        user_firstName: req.decoded.userFirstName,
        user_lastName: req.decoded.userLastName,
        from_location: req.body.from_location, 
        to_location: req.body.to_location,
        travel_date: req.body.travel_date,
        travel_time: req.body.travel_time,
        seats_available: req.body.seats_available,
        comment: req.body.comment || "",
    });

    drive.save(function(err, drive) {
        console.log(drive);
        if(err) {
            console.log(err);
            res.status(500).send({ message: "Some error occured during drive creation. Please try again." });
        } else {
            User.findOne({ '_id': req.decoded.userId }, function(err, user) {
                if(err || !user) {
                    return next(err);
                }
            }).then( (user) => {
                user.drives.push(drive._id);
                User.findOneAndUpdate({ '_id': user._id }, user, function(err, result) {
                    if(err) {
                        return next(err);
                    } else {
                        res.send({ message: "Drive Created Successfully." });
                    }
                });
            });
        }
    });
};

exports.getDrivesByUser = function(req, res) {
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
        Drive.find({ 'user_id': user._id }, function(err, drives) {
            if(err) {
                res.status(500).send({ message: "Failed to find drives. Please try again" });
            }
            else {
                res.send(drives.map(drive => {
                    return {
                        "drivePublicId" : drive.drivePublicId,
                        "driveFrom": drive.from_location,
                        "driveTo": drive.to_location,
                        "driveDate": drive.travel_date,
                        "driveTime": drive.travel_time,
                        "driveComment" : drive.comment,
                        "driveSeatsAvailable" : drive.seats_available
                    }
                }));
            }
        });
    });
};

exports.getDriveInfo = function(req, res) {
    if(!req.params.drivePublicId) {
        res.status(400).send({ message: "A publicId of drive should be present" });
    }

    Drive.findOne({
        'drivePublicId' : req.params.drivePublicId
    }, function(err, drive) {
        if(err || !drive) {
            res.status(500).send({ message: "Incorrect publicId of drive. Please try again" });
        }
        else {
            res.send({
                "driveFrom": drive.from_location,
                "driveTo": drive.to_location,
                "driveDate": drive.travel_date,
                "driveTime": drive.travel_time,
                "driveComment" : drive.comment,
                "driveSeatsAvailable" : drive.seats_available,
                "driveUserPublicId" : drive.user_publicId,
                "driveUserFirstName" : drive.user_firstName,
                "driveUserLastName": drive.user_lastName
            });
        }
    });
};