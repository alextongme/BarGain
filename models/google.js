// const { MongoClient } = require('mongodb');
// // const { ObjectID } = require('mongodb');
// const dbConnection = 'mongodb://localhost:27017/FindMyFriends';

// function getLocations(req, res, next) { // THIS FUNCTION GETS ALL OF THE CURRENTLY EXISTING USER MARKERS FROM THE DATABASE
//   MongoClient.connect(dbConnection, (err, db) => {
//     if (err) return next(err);

//     db.collection('users')
//     .find({})
//     .toArray((insertErr, result) => {
//       if (insertErr) return next(insertErr);

//       res.showUsers = result;
//       db.close();
//       return next();
//     });
//     return false;
//   });
//   return false;
// }

// function saveLocation(req, res, next) {  // THIS FUNCTION SAVES & BROADCASTS THE CURRENT USER'S LOCATION ONTO THE WORLD MAP
//   MongoClient.connect(dbConnection, (err, db) => {
//     if (err) return next(err);

//     db.collection('users')
//     .insert(req.body, (insertErr, result) => {
//       if (insertErr) return next(insertErr);

//       res.saved = result;
//       db.close();
//       return next();
//     });
//     return false;
//   });
//   return false;
// }

// // function deleteUsers(req, res, next) { // THIS FUNCTION STOPS BROADCASTING THE CURRENT USERS LOCATION FROM THE WORLD MAP
// //   MongoClient.connect(dbConnection, (err, db) => {
// //     if (err) return next(err);

// //     db.collection('albums')
// //     .findAndRemove({ id: ObjectID(req.params.id) }, (removeErr, doc) => {
// //       if (removeErr) return next(removeErr);

// //       res.removed = doc;
// //       db.close();
// //       return next();
// //     });
// //     return false;
// //   });
// //   return false;
// // }

// module.exports = { // EXPORT ALL OF THE FUNCTIONS FOR USE IN THE ROUTES
//   getLocations,
//   saveLocation,
// };
