const Home = require('../models/home.model.js');
const config = require('../config.js');
const exceptions = require('../constants/exceptions.js');
const logger = require('thumb-logger').getLogger(config.API_LOGGER_NAME);

exports.refreshFeed = function(req, res) {
  const from = req.query.fromTimestamp ? req.query.fromTimestamp : '1/1/2018';
  const fromTimestamp = new Date(from);
  const userId = req.decoded.userId;

  Home.refresh(userId, fromTimestamp)
    .then((feed) => {
        res.json(feed);
    })
    .catch((err) => {
      logger.error(err);
      return res.status(500).send({ message: exceptions.common.INTERNAL_ERROR });
    });
};
