/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
const dotEnv          = require('dotenv').config({ silent: true });
const express         = require('express');
const morgan          = require('morgan');
const path            = require('path');
const bodyParser      = require('body-parser');
const session         = require('express-session');
const cookieParser    = require('cookie-parser');
const methodOverride  = require('method-override');
const indexRouter     = require('./routes/index');
const authRouter      = require('./routes/auth');
const usersRouter     = require('./routes/users');
const decideRouter    = require('./routes/decide');
const buyRouter       = require('./routes/buy');
const sellRouter       = require('./routes/sell');

const app             = express();
const SECRET          = 'alextong';

app.set('view engine', 'ejs');

// log requests to STDOUT
app.use(morgan('dev'));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// parse application/json
app.use(bodyParser.json());

// middleware for method override
app.use(methodOverride('_method'));

// This is how we read the cookies sent over from the browser
app.use(cookieParser());

app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: SECRET,
}));

// Set static file root folder
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/decide', decideRouter);
app.use('/buy', buyRouter);
app.use('/sell', sellRouter);

// Listen on port for connections
// process.env.PORT is needed for when we deploy to Heroku
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening at port number ${port}`);
});
