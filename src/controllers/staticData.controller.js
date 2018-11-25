const staticData = require('../models/staticData.model.js');
const config = require('../config.js');
const exceptions = require('../constants/exceptions.js');
const logger = require('thumb-logger').getLogger(config.API_LOGGER_NAME);

exports.getUniversities = function(req, res){
  staticData.getUniversities()
    .then((result) => {
      return res.json({ universities: result });
    })
    .catch((error) => {
      logger.error(error);
      return res.status(500).send({ message: exceptions.common.INTERNAL_ERROR });
    });
}
