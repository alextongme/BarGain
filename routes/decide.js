const router = require('express').Router();
const { authenticate } = require('../lib/auth');
const { findCurrentLocation } = require('../services/google');
const { getLocations } = require('../models/locations');

router.get('/', authenticate, findCurrentLocation, getLocations, (req, res) => { // FIRST LANDING PAGE AFTER LOGIN. BUY OR SELL?
  res.render('decide/index', {
    user: res.user,
    results: res.results || [],
    favorites: res.favorites || [],
    currentLocation: res.userLocation,
  });
});

module.exports = router;

