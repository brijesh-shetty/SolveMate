// ====================
// Load environment variables
// ====================
require('dotenv').config();

// ====================
// Core Modules
// ====================
const path = require('path');

// ====================
// External Modules
// ====================
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// ====================
// Local Modules
// ====================
const requestHandler = require('./routes/requestHandler');
const authRouter = require('./routes/authHandler');
const userRouter = require('./routes/user');
const apiRouter = require('./routes/api');
const { globalErrorHandler, notFoundHandler } = require('./middleware/errorHandler');
const logger = require('./config/logger');

// ====================
// App Initialization
// ====================
const app = express();
const DB_PATH = process.env.DB_PATH;
const isProduction = process.env.NODE_ENV === 'production';

// Trust reverse proxy (Render.com, Heroku, etc.)
// Required for secure session cookies to work behind a load balancer
app.set('trust proxy', 1);

// ====================
// Security Middleware
// ====================

// Helmet - Sets various HTTP headers for security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "https://img.icons8.com", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
    },
  },
}));

// CORS - Cross-Origin Resource Sharing
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Rate Limiting - Prevent brute-force and DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter rate limit for auth endpoints (POST only — don't block viewing the forms)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 login/signup attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    // Render proper EJS error pages instead of raw JSON
    if (req.path === '/login' || req.originalUrl === '/login') {
      return res.status(429).render('auth/login', {
        errors: ['Too many login attempts. Please try again after 15 minutes.'],
        oldInput: { email: '' }
      });
    }
    return res.status(429).render('auth/signin', {
      errors: ['Too many signup attempts. Please try again after 15 minutes.'],
      oldInput: { firstName: '', lastName: '', email: '', password: '' }
    });
  },
});
// Only rate-limit POST requests (form submissions), not GET (viewing the page)
app.post('/login', authLimiter);
app.post('/signup', authLimiter);

// ====================
// General Middleware
// ====================

// Compression - Gzip responses for better performance
app.use(compression());

// Request Logging
app.use(morgan(isProduction ? 'combined' : 'dev'));

// Body Parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// ====================
// Session Store Configuration
// ====================
const store = new MongoDBStore({
  uri: DB_PATH,
  collection: 'sessions'
});

store.on('error', (error) => {
  logger.error('Session store error:', error);
});

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-change-me',
    resave: false,
    saveUninitialized: false, // Changed: Don't save empty sessions
    store,
    cookie: {
      secure: isProduction,       // HTTPS only in production
      httpOnly: true,             // Prevent XSS access to cookies
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax'             // CSRF protection
    }
  })
);

// Attach login status to each request
app.use((req, res, next) => {
  req.isLoggedIn = req.session.isLoggedIn || false;
  req.user = req.session.user || null;
  // Make isLoggedIn available in all EJS views
  res.locals.isLoggedIn = req.isLoggedIn;
  next();
});

// ====================
// Health Check & Monitoring Endpoints
// ====================
app.get('/health', (req, res) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    version: require('./package.json').version,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    }
  };

  const statusCode = healthData.database === 'connected' ? 200 : 503;
  res.status(statusCode).json(healthData);
});

// Metrics endpoint (basic observability)
app.get('/metrics', (req, res) => {
  res.json({
    uptime: process.uptime(),
    responseTime: process.hrtime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    pid: process.pid,
    nodeVersion: process.version,
    platform: process.platform,
    timestamp: Date.now()
  });
});

// ====================
// API Routes (JSON responses for external consumers)
// ====================
app.use('/api/v1', apiRouter);

// ====================
// View Routes (EJS templates)
// ====================

// Authentication routes (signup, login, logout)
app.use(authRouter);

// Dashboard landing route
app.get('/', (req, res) => {
  res.render('auth/dashboard', { isLoggedIn: req.isLoggedIn });
});

// Auth guard for protected routes
app.use('/', (req, res, next) => {
  if (req.isLoggedIn) {
    return next();
  }
  return res.redirect('/login');
});

app.use('/', requestHandler);
app.use('/', userRouter);

// ====================
// Error Handling
// ====================
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ====================
// Server Start
// ====================
const PORT = process.env.PORT || 3000;

mongoose
  .connect(DB_PATH)
  .then(() => {
    logger.info('✅ Connected to MongoDB Atlas');
    app.listen(PORT, () => {
      logger.info(`🚀 SolveMate running on http://localhost:${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`📡 API: http://localhost:${PORT}/api/v1`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch(err => {
    logger.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  mongoose.connection.close().then(() => {
    logger.info('MongoDB connection closed.');
    process.exit(0);
  });
});

module.exports = app;
