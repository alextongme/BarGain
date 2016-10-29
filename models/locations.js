// const { ObjectID } = require('mongodb');
const { getDB } = require('../lib/dbConnect.js');
const mongo = require('mongodb');

function getLocations(req, res, next) {
  // find all favorites for your userId
  getDB().then((db) => {
    db.collection('listings')
      .find({})
      // userId: { $eq: req.session.userId}
      .toArray((toArrErr, data) => {
        if (toArrErr) return next(toArrErr);
        res.allListings = data;
        db.close();
        next();
        return false;
      });
    return false;
  });
  return false;
}



function saveLocation(req, res, next) {
  // creating an empty object for the location
  const ID = new mongo.ObjectID(req.session.userId);
  const a = req.body.user.latitude;
  const b = req.body.user.longitude;
  const c = req.body.user.accuracy;
  const d = req.body.user.quantity;
  const e = req.body.user.tel;
  const f = req.body.user.email;
  const g = req.body.user.description;
  const h = req.body.user.pic;
  const i = req.body.user.price;

  getDB().then((db) => {
    db.collection('listings')
      .insert({ sellerId: ID, latitude: a, longitude: b, accuracy: c, quantity: d, tel: e, email: f, description: g, pic: h, price: i }, (insertErr, result) => {
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

// collection.save({_id:"abc", user:"David"},{w:1}, callback)

// function modifyUser(req, res, next) {
//   getDB().then((db) => {
//     db.collection('users')
//       .update({ _id: ObjectID(id) }, { $set: { lat: '5', lng: '5' } },
//         (modifyErr, dbUser) => {
//           if (modifyErr) return next(modifyErr);

//           res.success = dbUser;
//           db.close();
//           return next();
//         });
//   });
// }

// Delete method doesn't change because we are deleting objects from the database
// based on that object's unique _id - you do not need to specify which user as
// the _id is sufficient enough
function deleteLocation(req, res, next) {
  const ID = new mongo.ObjectID(req.session.userId);
  getDB().then((db) => {
    db.collection('listings')
      .findAndRemove({ _id: ID }, (removeErr, result) => {
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

module.exports = { getLocations, saveLocation, deleteLocation };
