// This is the index controller. It handles all three of the routes located in the index controller.

const express = require('express');

const indexRouter = express.Router();

// This is the route that serves your '/' homepage
indexRouter.get('/', (req, res) => {
  res.render('index/index');
});

// This route serves your `/login` form
indexRouter.get('/login', (req, res) => {
  res.render('index/existingUser');
});

// This route serves your `/signup` form
indexRouter.get('/signup', (req, res) => {
  res.render('index/newUser');
});

indexRouter.get('/about', (req, res) => {
  res.render('index/about');
});

module.exports = indexRouter;
