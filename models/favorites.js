const { ObjectID } = require('mongodb');
const { getDB } = require('../lib/dbConnect.js');

function saveFavToUser(req, res, next) { // saves a Favorite

  getDB().then((db) => {
    db.collection('users')
      .update({ _id: ObjectID(req.session.userId) }, { $push: { favoriteListings: req.body.listing._id } }, (insertErr, result) => {
        if (insertErr) return next(insertErr);
        res.update = result;
        db.close();
        next();
        return false;
      });
    return false;
  });
  return false;
}

function saveUserToFav(req, res, next) { // saves a Favorite
  getDB().then((db) => {
    db.collection('listings')
      .update({ _id: ObjectID(req.body.listing._id) }, { $push: { favoriteUsers: res.user.username } }, (insertErr, result) => {
        if (insertErr) return next(insertErr);
        res.saved = result;
        db.close();
        next();
        return false;
      });
    return false;
  });
  return false;
}

function deleteFavorite(req, res, next) {
  getDB().then((db) => {
    db.collection('users')
      .update({ _id: ObjectID(req.session.userId) }, { $pull: { favoriteListings: req.params.id } }, (removeErr, result) => {
        if (removeErr) return next(removeErr);
        res.removed = result;
        db.close();
        next();
        return false;
      });
    return false;
  });
  return false;
}

function getMyFavorites(req, res, next) { // find listings USER has favorited.
  getDB().then((db) => {
    db.collection('users')
      .find({ _id: ObjectID(req.session.userId) })
      .toArray((toArrErr, data) => {
        if (toArrErr) return next(toArrErr);
        res.favorites = data;
        db.close();
        next();
        return false;
      });
    return false;
  });
  return false;
}

module.exports = { saveFavToUser, saveUserToFav, deleteFavorite, getMyFavorites };
