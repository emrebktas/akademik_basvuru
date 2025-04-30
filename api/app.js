require('dotenv').config();

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
const cors = require('cors');
const admin = require("firebase-admin");

const bodyParser = require('body-parser');
const userRoutes = require('./routes/users');

var logger = require('morgan');

var app = express();

// CORS configuration
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.json());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', require('./routes/index'));
app.use('/api/users', userRoutes);
// Mount publication routes (ensure this is done *after* Firebase init)
const publicationRoutes = require('./routes/publications');
app.use('/api/publications', publicationRoutes); 

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// --- Firebase Admin Initialization ---
const serviceAccountPath = "./akademik-basvuru-firebase-adminsdk-fbsvc-0379fe325b.json";

try {
  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "akademik-basvuru.firebasestorage.app" 
  });

  console.log("Firebase Admin SDK initialized successfully with correct bucket.");

} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND') {
    console.error(`ERROR: Could not find the service account file at ${serviceAccountPath}`);
  } else {
    console.error("ERROR initializing Firebase Admin SDK:", error);
  }
  // Consider exiting if Firebase init fails
  // process.exit(1); 
}
// --- End Firebase Admin Initialization ---

// Export only the app
module.exports = app;
