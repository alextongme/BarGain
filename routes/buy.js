const router              = require('express').Router();
const { authenticate }    = require('../lib/auth');
const { getLocations } = require('../models/locations');

router.get('/', authenticate, getLocations, (req, res) => {
  res.render('buy/index', {
    mapMarkers: res.allListings,
  });
});

module.exports = router;

