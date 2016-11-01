const router = require('express').Router();
const { authenticate } = require('../lib/auth');
const { saveFavToUser,
        saveUserToFav,
        deleteFavorite } = require('../models/favorites');

router.post('/', authenticate, saveFavToUser, saveUserToFav, (req, res) => { // ROUTE TO SAVE FAVORITES TO BOTH USER AND USER TO FAVORITES IN MONGO
  res.redirect('/users/profile');
});

router.delete('/delete/:id', deleteFavorite, (req, res) => { // ROUTE TO DELETE YOUR LISTING THAT YOU ARE SELLING
  res.redirect('/users/profile');
});

module.exports = router;
