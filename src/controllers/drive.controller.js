const Drive = require('models/drive.model.js');
const exceptions = require('../constants/exceptions.js');
const successResponses = require('../constants/success_responses.js');

/*exports.getDrivesByUser = function(req, res) {

};

exports.getDriveInfo = function(req, res) {

};*/

exports.createDrive = function(req, res) {
    if(!req.body.startLocation) {
        return res.status(400).send({ message: exceptions.drive.MISSING_START_LOCATION});
    }

    if(!req.body.endLocation) {
        return res.status(400).send({ message: exceptions.drive.MISSING_END_LOCATION});
    }

    if(!req.body.travelDate) {
        return res.status(400).send({ message: exceptions.drive.MISSING_TRAVEL_DATE});
    }

    if(!req.body.travelTime || req.body.travelTime.length !== 2) {
        return res.status(400).send({ message: exceptions.drive.MISSING_TRAVEL_TIME});
    }

    if(!req.body.availableSeats) {
        return res.status(400).send({ message: exceptions.drive.MISSING_AVAILABLE_SEATS});
    }

    if(!req.body.travelDescription) {
        return res.status(400).send({ message: exceptions.drive.MISSING_TRAVEL_DESCRIPTION});
    }

    let drive = new Drive(req.body);
    drive.userId = req.decoded.userId;

    drive.saveDrive(drive)
      .then((drive) => {
        res.send({ message: successResponses.drive.DRIVE_CREATED, drive: drive});
      })
      .catch((err) => {
        res.status(500).send({message: exceptions.drive.INTERNAL_ERROR});
      });
};