// ====================
// Load environment variables
// ====================
require('dotenv').config();
// Core Modules (built into Node.js)
// ====================
const path = require('path');

// ====================
// External Modules (installed via npm)
// ====================
const express = require('express');
const bodyParser = require('body-parser');
const { default: mongoose } = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

// ====================
// Local Modules (your own files)
// ====================
const requestHandler = require('./routes/requestHandler'); // Main app routes
const authRouter = require('./routes/authHandler');        // Authentication routes
const userRouter = require('./routes/user');              // User-related routes
// ====================
// App Initialization
// ====================
const app = express();

// ====================
// Database Connection String (MongoDB Atlas)
// ====================
const DB_PATH = process.env.DB_PATH;

// ====================
// Middleware Setup
// ====================

// Parse form data from requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// Set EJS as the view engine
app.set('view engine', 'ejs');

// Serve static files from "public" folder

// ====================
// Session Store Configuration
// ====================
const store = new MongoDBStore({
  uri: DB_PATH,         // MongoDB URI
  collection: 'sessions' // Session collection name
});

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,      // Used to sign the session ID cookie
    resave: false,           // Prevents unnecessary session save
    saveUninitialized: true, // Save new sessions even if not modified
    store                    // Store session data in MongoDB
  })
);

// Custom middleware to attach login status to each request
app.use((req, res, next) => {
  req.isLoggedIn = req.session.isLoggedIn;
  req.user = req.session.user; // Attach user info to request
   console.log(req.isLoggedIn); 
  next();
});

// ====================
// Route Handling
// ====================

// Authentication routes (signup, login, logout)
app.use(authRouter);

// Dashboard landing route
app.get('/', (req, res) => {
  res.render('auth/dashboard',{isLoggedIn: req.isLoggedIn});
});

// Protect /filter route (only logged-in users can access)
app.use('/', (req, res, next) => {
  if (req.isLoggedIn) {
    return next(); // ✅ Logged in, proceed
  }
  console.log('Redirecting to signuppage');
  return res.redirect('/login'); // ❌ Not logged in, go to signup
});
app.use('/', requestHandler);
app.use('/', userRouter); // User-related routes (e.g., toggle solved status)
// Main application routes


// ====================
// Server Start
// ====================
const PORT = process.env.PORT || 3000;

mongoose
  .connect(DB_PATH)
  .then(() => {
    console.log('Connected to Mongo');
    app.listen(PORT, () => {
      console.log(`Server running on address http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.log('Error while connecting to Mongo: ', err);
  });
