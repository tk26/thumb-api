const Ride = require('models/ride.model.js');
const exceptions = require('../constants/exceptions.js');
const successResponses = require('../constants/success_responses.js');

/*exports.getRidesByUser = function(req, res) {

};

exports.getRideInfo = function(req, res) {

};*/

exports.createRide = function (req, res) {
    if(!req.body.startAddress) {
        return res.status(400).send({ message: exceptions.ride.MISSING_START_ADDRESS});
    }

    if(!req.body.endAddress) {
        return res.status(400).send({ message: exceptions.ride.MISSING_END_ADDRESS});
    }

    if(!req.body.travelDate) {
        return res.status(400).send({ message: exceptions.ride.MISSING_TRAVEL_DATE});
    }

    if(!req.body.travelTime || req.body.travelTime.length !== 2) {
        return res.status(400).send({ message: exceptions.ride.MISSING_TRAVEL_TIME});
    }

    let ride = new Ride(req.body);
    ride.userId = req.decoded.userId;

    ride.saveRide(ride)
      .then((ride) => {
        res.send({ message: successResponses.ride.RIDE_CREATED, ride: ride});
      })
      .catch((err) => {
        res.status(500).send({message: exceptions.ride.INTERNAL_ERROR});
      });
};
