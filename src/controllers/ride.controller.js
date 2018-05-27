const Ride = require('models/ride.model.js');
const config = require('config');
const exceptions = require('../constants/exceptions.js');
const successResponses = require('../constants/success_responses.js');
const logger = require('thumb-logger').getLogger(config.API_LOGGER_NAME);
const GeoPoint = require('thumb-utilities').GeoPoint;

exports.createRide = function (req, res) {
    if(!req.body.startLocation) {
        return res.status(400).send({ message: exceptions.ride.MISSING_START_LOCATION});
    }

    if(!req.body.endLocation) {
        return res.status(400).send({ message: exceptions.ride.MISSING_END_LOCATION});
    }

    if(!req.body.travelDate) {
        return res.status(400).send({ message: exceptions.ride.MISSING_TRAVEL_DATE});
    }

    if(!req.body.travelTime || req.body.travelTime.length !== 2) {
        return res.status(400).send({ message: exceptions.ride.MISSING_TRAVEL_TIME});
    }

    if(!req.body.travelDescription) {
        return res.status(400).send({ message: exceptions.ride.MISSING_TRAVEL_DESCRIPTION});
    }

    let ride = Ride.createRideFromRequest(req);

    ride.save()
      .then((rideResult) => {
        res.send({ message: successResponses.ride.RIDE_CREATED, ride: ride});
      })
      .catch((err) => {
        logger.error('Error saving ride: ' + err);
        res.status(500).send({message: exceptions.ride.INTERNAL_ERROR});
      });
};

exports.getTripMatches = function(req, res) {
  if(!req.query.startPoint) {
      return res.status(400).send({ message: exceptions.ride.MISSING_START_POINT});
  }

  if(!req.query.endPoint) {
      return res.status(400).send({ message: exceptions.ride.MISSING_END_POINT});
  }

  if(!req.query.travelDate) {
    return res.status(400).send({ message: exceptions.ride.MISSING_TRAVEL_DATE});
  }

  const rawStartPoint = JSON.parse(req.query.startPoint);
  const rawEndPoint = JSON.parse(req.query.endPoint);
  const startPoint = new GeoPoint(rawStartPoint.longitude, rawStartPoint.latitude);
  const endPoint = new GeoPoint(rawEndPoint.longitude, rawEndPoint.latitude);

  let rides = Ride.findRideMatchesForTrip(startPoint, endPoint, req.query.travelDate)
    .then((rides) => {
      res.send(rides);
    })
    .catch((err) => {
      logger.error('Error retrieving rides: ' + err);
      res.status(500).send({message: exceptions.ride.INTERNAL_GETTRIPMATCHES_ERROR});
    });
}
