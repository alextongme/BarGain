const fetch = require('node-fetch');

const API_URL = 'https://www.googleapis.com/geolocation/v1/geolocate?key=';
const API_KEY = process.env.GOOGLE_KEY;

function findCurrentLocation(req, res, next) {
  fetch(`${API_URL}${API_KEY}`, {
    method: 'post' })
  .then(r => r.json())
  .then((result) => {
    res.userLocation = result;
    next();
  })
  .catch((err) => {
    res.error = err;
    next();
  });
}

module.exports = { findCurrentLocation };
