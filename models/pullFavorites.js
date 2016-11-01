// WORKING ONE
const { ObjectID } = require('mongodb');
const { getDB } = require('../lib/dbConnect.js');

var favorites;
var a;

function getMyFavorites(req, res, next) { // find listings USER has favorited.
  getDB().then((db) => {
    db.collection('users')
      .find({ _id: ObjectID(req.session.userId) })
      .toArray((toArrErr, data) => {
        if (toArrErr) return next(toArrErr);
        res.favorites = data[0];
        favorites = res.favorites;
        a = favorites.favoriteListings;
        console.log(a);
        db.close();
        next();
        return false;
      });
    return false;
  });
  return false;
}

// function findFavoriteListings(req, res, next) {
//   favorites.forEach((listing) => {
//     getDB().then((db) => {
//       db.collection('listings')
//         .find({ _id: listing })
//         .toArray((toArrErr, data) => {
//           if (toArrErr) return next(toArrErr);
//           res.results = data;
//           db.close();
//           next();
//           return false;
//         });
//       return false;
//     });
//     return false;
//   });
// }

module.exports = { getMyFavorites };
