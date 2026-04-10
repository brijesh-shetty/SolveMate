// routes/api/auth.js
// REST API for authentication
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const User = require('../../models/user');
const { isAuthenticatedAPI } = require('../../middleware/auth');

// POST /api/v1/auth/signup
router.post('/signup', [
  check('firstName').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  check('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  check('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map(e => e.msg)
      });
    }

    const { firstName, lastName, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered'
      });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      firstName,
      lastName: lastName || '',
      email,
      hashedPassword,
      solvedQuestions: []
    });
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        id: user._id,
        firstName: user.firstName,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    const isMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Set session
    req.session.isLoggedIn = true;
    req.session.user = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        solvedCount: user.solvedQuestions.length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// GET /api/v1/auth/me - Get current user profile
router.get('/me', isAuthenticatedAPI, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-hashedPassword')
      .populate('solvedQuestions')
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        ...user,
        solvedCount: user.solvedQuestions.length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
