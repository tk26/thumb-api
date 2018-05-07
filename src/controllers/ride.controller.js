const Ride = require('models/ride.model.js');
const config = require('config');
const exceptions = require('../constants/exceptions.js');
const successResponses = require('../constants/success_responses.js');
const logger = require('thumb-logger').getLogger(config.API_LOGGER_NAME);

/*exports.getRidesByUser = function(req, res) {

};

exports.getRideInfo = function(req, res) {

};*/

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

    let ride = new Ride(req.body);
    ride.userId = req.decoded.userId;

    ride.saveRide(ride)
      .then((ride) => {
        res.send({ message: successResponses.ride.RIDE_CREATED, ride: ride});
      })
      .catch((err) => {
        logger.error('Error saving ride: ' + err);
        res.status(500).send({message: exceptions.ride.INTERNAL_ERROR});
      });
};
