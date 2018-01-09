var Drive = require('models/drive.model.js');
var User = require('models/user.model.js');

exports.submitDrive = function(req, res) {
    if(!req.decoded.userId) {
        res.status(400).send({ message: "userId not decoded" });
        next();
    }

    if(!req.body.from_location) {
        res.status(400).send({ message: "Missing Drive's From Location" });
        next();
    }

    if(!req.body.to_location) {
        res.status(400).send({ message: "Missing Drive's To Location" });
        next();
    }

    if(!req.body.travel_date) {
        res.status(400).send({ message: "Missing Drive's Travel Date" });
        next();
    }

    if(!req.body.travel_time) {
        res.status(400).send({ message: "Missing Drive's Travel Times" });
        next();
    }

    if(!req.body.seats_available) {
        res.status(400).send({ message: "Missing Drive's Seats Available" });
        next();
    }

    var drive = new Drive(req.body);
    drive.user_id = req.decoded.userId;
    drive.user_publicId = req.decoded.userPublicId;
    drive.user_firstName = req.decoded.userFirstName;
    drive.user_lastName = req.decoded.userLastName;
    drive.comment = req.body.comment || "";

    drive.save(function(err, drive) {
        if(err) {
            res.status(500).send(err);
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
                        res.send({ message: "Drive Details Saved Successfully" });
                    }
                });
            });
        }
    });
};

exports.getDrivesByUser = function(req, res) {
    User.findOne({
        'userPublicId' : req.params.userPublicId,
        'verified' : true
    }, function(err, user) {
        if(err || !user) {
            res.status(500).send({ message: "Incorrect publicId of user" });
        }
        else{
            Drive.find({ 'user_id': user._id }, function(err, drives) {
                if(err) {
                    res.status(500).send({ message: "Incorrect userId" });
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
        }
    });
};

exports.getDriveInfo = function(req, res) {
    Drive.findOne({
        'drivePublicId' : req.params.drivePublicId
    }, function(err, drive) {
        if(err || !drive) {
            res.status(500).send({ message: "Incorrect publicId of drive" });
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