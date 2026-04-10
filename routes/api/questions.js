// routes/api/questions.js
// REST API for questions
const express = require('express');
const router = express.Router();
const Question = require('../../models/question');
const User = require('../../models/user');
const { isAuthenticatedAPI } = require('../../middleware/auth');

// GET /api/v1/questions - List all questions with optional filters
router.get('/', async (req, res) => {
  try {
    const { difficulty, company, tag, page = 1, limit = 20 } = req.query;

    // Build filter object
    const filter = {};
    if (difficulty && difficulty !== 'All') {
      filter.dif = { $regex: new RegExp(`^${difficulty}$`, 'i') };
    }
    if (company && company !== 'All') {
      filter.company = { $regex: new RegExp(`^${company}$`, 'i') };
    }
    if (tag && tag !== 'All') {
      filter.tag = { $regex: new RegExp(`^${tag}$`, 'i') };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Question.countDocuments(filter);
    const questions = await Question.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: questions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/questions/stats - Get question statistics
router.get('/stats', async (req, res) => {
  try {
    const totalQuestions = await Question.countDocuments();

    const difficultyStats = await Question.aggregate([
      { $group: { _id: { $toLower: '$dif' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const companyStats = await Question.aggregate([
      { $group: { _id: '$company', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const tagStats = await Question.aggregate([
      { $group: { _id: '$tag', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalQuestions,
        byDifficulty: difficultyStats,
        byCompany: companyStats,
        byTag: tagStats
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/questions/search?q=keyword - Search questions
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters'
      });
    }

    const regex = new RegExp(q.trim(), 'i');
    const questions = await Question.find({
      $or: [
        { qunname: regex },
        { company: regex },
        { tag: regex }
      ]
    }).limit(50).lean();

    res.json({
      success: true,
      query: q,
      count: questions.length,
      data: questions
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/questions/:id - Get single question by ID
router.get('/:id', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id).lean();
    if (!question) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }
    res.json({ success: true, data: question });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/questions/:id/solve - Toggle solved status (requires auth)
router.post('/:id/solve', isAuthenticatedAPI, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const questionId = req.params.id;
    const isSolved = user.solvedQuestions.some(
      id => id.toString() === questionId
    );

    if (isSolved) {
      user.solvedQuestions = user.solvedQuestions.filter(
        id => id.toString() !== questionId
      );
    } else {
      user.solvedQuestions.push(questionId);
    }

    await user.save();

    res.json({
      success: true,
      solved: !isSolved,
      message: !isSolved ? 'Question marked as solved' : 'Question unmarked'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
