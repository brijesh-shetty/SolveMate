// routes/api/index.js
// Main API router - mounts all versioned API routes
const express = require('express');
const router = express.Router();

const questionRoutes = require('./questions');
const authRoutes = require('./auth');
const answerRoutes = require('./answers');

// API Info endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'SolveMate API',
    version: '1.0.0',
    description: 'DSA Practice Platform REST API',
    endpoints: {
      health: 'GET /health',
      questions: {
        list: 'GET /api/v1/questions',
        getById: 'GET /api/v1/questions/:id',
        filter: 'GET /api/v1/questions?difficulty=&company=&tag=',
        search: 'GET /api/v1/questions/search?q=',
        stats: 'GET /api/v1/questions/stats'
      },
      answers: {
        listByQuestion: 'GET /api/v1/questions/:questionId/answers',
        create: 'POST /api/v1/questions/:questionId/answers',
        upvote: 'POST /api/v1/answers/:id/upvote'
      },
      auth: {
        login: 'POST /api/v1/auth/login',
        signup: 'POST /api/v1/auth/signup',
        logout: 'POST /api/v1/auth/logout',
        me: 'GET /api/v1/auth/me'
      }
    },
    timestamp: new Date().toISOString()
  });
});

router.use('/questions', questionRoutes);
router.use('/auth', authRoutes);
router.use('/answers', answerRoutes);

module.exports = router;
