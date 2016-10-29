const router              = require('express').Router();
const { authenticate }    = require('../lib/auth');
const { findCurrentLocation }     = require('../services/google');
const { saveLocation,
        deleteLocations } = require('../models/locations');

router.get('/', authenticate, findCurrentLocation, (req, res) => {
  res.render('sell/index', {
    user: res.user,
    currentLocation: res.userLocation,
  });
});

router.post('/submit', authenticate, saveLocation, (req, res) => {
  res.render('sell/newPosting');
});

router.get('/continue', (req, res) => {
  res.redirect('/buy');
});

module.exports = router;
