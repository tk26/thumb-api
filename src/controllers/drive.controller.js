const Drive = require('models/drive.model.js');
const GeoPoint = require('thumb-utilities').GeoPoint;
const config = require('config');
const exceptions = require('../constants/exceptions.js');
const successResponses = require('../constants/success_responses.js');
const logger = require('thumb-logger').getLogger(config.API_LOGGER_NAME);

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

    let drive = Drive.createDriveFromRequest(req);

    drive.save()
      .then((driveResult) => {
        res.send({ message: successResponses.drive.DRIVE_CREATED, drive: drive});
      })
      .catch((err) => {
        logger.error('Error creating drive: ' + err);
        res.status(500).send({message: exceptions.drive.INTERNAL_CREATE_ERROR});
      });
};

exports.getTripMatches = function(req, res) {
  if(!req.query.startPoint) {
      return res.status(400).send({ message: exceptions.drive.MISSING_START_POINT});
  }

  if(!req.query.endPoint) {
      return res.status(400).send({ message: exceptions.drive.MISSING_END_POINT});
  }

  if(!req.query.travelDate) {
    return res.status(400).send({ message: exceptions.drive.MISSING_TRAVEL_DATE});
  }

  const rawStartPoint = JSON.parse(req.query.startPoint);
  const rawEndPoint = JSON.parse(req.query.endPoint);
  const startPoint = new GeoPoint(rawStartPoint.longitude, rawStartPoint.latitude);
  const endPoint = new GeoPoint(rawEndPoint.longitude, rawEndPoint.latitude);

  let drives = Drive.findDriveMatchesForTrip(startPoint, endPoint, req.query.travelDate)
    .then((drives) => {
      res.send(drives);
    })
    .catch((err) => {
      logger.error('Error retrieving drives: ' + err);
      res.status(500).send({message: exceptions.drive.INTERNAL_GETTRIPMATCHES_ERROR});
    });
}
