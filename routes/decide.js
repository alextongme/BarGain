const router              = require('express').Router();
const { authenticate }    = require('../lib/auth');
const { findCurrentLocation }     = require('../services/google');
const { getLocations,
        saveLocation,
        deleteLocations } = require('../models/locations');

router.get('/', authenticate, findCurrentLocation, getLocations, (req, res) => {
  res.render('decide/index', {
    user: res.user,
    results: res.results || [],
    favorites: res.favorites || [],
    currentLocation: res.userLocation,
  });
});



// router.post('form/broadcast', authenticate, findCurrentLocation, saveLocation, (req, res) => {
//   res.redirect('/showMap');
// });

// router.delete('/favorites/:id', deleteLocations, (req, res) => {
//   res.redirect('/');
// });

// router.post('/search', authenticate, findCurrentLocation, getLocations, (req, res) => {
//   res.render('music/currentLocation', {
//     user: res.user || [],
//     results: res.results || [],
//     favorites: res.favorites || [],
//     currentLocation: res.userLocation,
//   });
// });

// router.delete('/favorites/:id', deleteLocations, (req, res) => {
//   res.redirect('/music');
// });


module.exports = router;

