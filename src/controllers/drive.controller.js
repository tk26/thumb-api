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

exports.inviteRider = function(req, res){
  if(!req.body.toUserId) {
    return res.status(400).send({ message: exceptions.common.MISSING_INVITE_TOUSER});
  }

  if(!req.body.driveId) {
    return res.status(400).send({ message: exceptions.drive.MISSING_INVITE_DRIVE});
  }

  if(!req.body.requestedTimes) {
    return res.status(400).send({ message: exceptions.common.MISSING_INVITE_REQUESTEDTIME});
  }

  let fromUserId = req.decoded.userId;
  let requestedTimes = req.body.requestedTimes.join();

  let result = Drive.inviteRider(fromUserId, req.body.toUserId, req.body.driveId, requestedTimes, req.body.rideId, req.body.comment)
    .then((result) => {
      res.send({ message: successResponses.common.INVITE_SENT, invitation: result});
    })
    .catch((error) => {
      logger.error('Error sending invitation: ' + error);
      if (error.message === exceptions.drive.INVITATION_ALREADY_SENT){
        res.status(400).send({message: error.message});
      } else {
        res.status(500).send({message: exceptions.common.INTERNAL_INVITE_ERROR});
      }
    });
}
