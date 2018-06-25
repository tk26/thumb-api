let Home = require('../models/home.model.js');

exports.refreshFeed = function(req, res) {
  const from = req.query.fromTimestamp ? req.query.fromTimestamp : '1/1/2018';
  const fromTimestamp = new Date(from);
  const userId = req.decoded.userId;

  let feed = Home.refresh(userId, fromTimestamp)
    .then((feed) => {
        res.json(feed);
    })
    .catch((err) => {
        return res.status(500).send({ message: 'Error refreshing feed.' });
    });
};
