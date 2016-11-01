const router = require('express').Router();
const { authenticate } = require('../lib/auth');
const { getLocations } = require('../models/locations');
const { findCurrentLocation } = require('../services/google');
const { searchListings } = require('../models/search');
const { getListing } = require('../models/locations');

router.get('/', findCurrentLocation, getLocations, (req, res) => { // ROUTE TO GRAB ALL CURRENT ACTIVE LISTINGS
  res.render('buy/index', {
    mapMarkers: res.allListings,
    currentLocation: res.userLocation,
  });
});

router.get('/allListings', getLocations, (req, res) => { // ROUTE TO GRAB ALL CURRENT ACTIVE LISTINGS
  res.json(res.allListings);
});

router.get('/search', authenticate, findCurrentLocation, searchListings, (req, res) => { // ROUTE TO SEARCH THROUGH LISTINGS BY KEYWORD
  res.render('buy/listings', {
    user: res.user,
    filteredListings: res.filteredListings || [],
    currentLocation: res.userLocation,
  });
});

router.get('/:id', searchListings, getListing, (req, res) => { // ROUTE TO SEE SPECIFIC LISTING BASED ON ITS OBJECT _ID
  res.render('buy/item', {
    listing: res.oneListing,
  });
});

module.exports = router;

