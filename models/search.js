// const { ObjectID } = require('mongodb');
const { getDB } = require('../lib/dbConnect.js');

function searchListings(req, res, next) { // finds all listings on the global map
  const filterObj = {};
  const qs = req.query;

  if ('searchTerm' in qs) filterObj.title = new RegExp(`\\b${qs.searchTerm}`, 'i');

  getDB().then((db) => {
    db.collection('listings')
      .find(filterObj)
      .toArray((toArrErr, data) => {
        if (toArrErr) return next(toArrErr);
        res.filteredListings = data;
        db.close();
        next();
        return false;
      });
    return false;
  });
  return false;
}

function searchOneListing(req, res, next) {
  const filterObj = { _id: parseInt(req.params.id, 10) };

  getDB().then((db) => {
    db.collection('listings')
      .find(filterObj)
      .toArray((arrayError, data) => {
        if (arrayError) return next(arrayError);
        res.singleListing = data;
        return next();
      });
    return false;
  });
  return false;
}

module.exports = { searchOneListing, searchListings };
