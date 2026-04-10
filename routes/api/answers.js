// routes/api/answers.js
// REST API for answers
const express = require('express');
const router = express.Router();
const Answer = require('../../models/answer');
const Question = require('../../models/question');
const { isAuthenticatedAPI } = require('../../middleware/auth');

// GET /api/v1/answers/question/:questionId - Get all answers for a question
router.get('/question/:questionId', async (req, res) => {
  try {
    const answers = await Answer.find({ questionId: req.params.questionId })
      .populate('userId', 'firstName lastName')
      .sort({ upvotes: -1, createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: answers.length,
      data: answers
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/answers/question/:questionId - Create an answer (requires auth)
router.post('/question/:questionId', isAuthenticatedAPI, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Answer must be at least 10 characters long'
      });
    }

    // Verify question exists
    const question = await Question.findById(req.params.questionId);
    if (!question) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }

    const answer = new Answer({
      questionId: req.params.questionId,
      userId: req.user._id,
      content: content.trim()
    });

    await answer.save();

    // Populate user info before returning
    const populated = await Answer.findById(answer._id)
      .populate('userId', 'firstName lastName')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Answer posted successfully',
      data: populated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/answers/:id/upvote - Upvote an answer (requires auth)
router.post('/:id/upvote', isAuthenticatedAPI, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) {
      return res.status(404).json({ success: false, error: 'Answer not found' });
    }

    const userId = req.user._id.toString();
    const alreadyVoted = answer.upvotedBy.some(id => id.toString() === userId);

    if (alreadyVoted) {
      // Remove upvote (toggle)
      answer.upvotedBy = answer.upvotedBy.filter(id => id.toString() !== userId);
      answer.upvotes = Math.max(0, answer.upvotes - 1);
    } else {
      // Add upvote
      answer.upvotedBy.push(req.user._id);
      answer.upvotes += 1;
    }

    await answer.save();

    res.json({
      success: true,
      upvotes: answer.upvotes,
      voted: !alreadyVoted,
      message: alreadyVoted ? 'Upvote removed' : 'Answer upvoted'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/v1/answers/:id - Delete an answer (owner only)
router.delete('/:id', isAuthenticatedAPI, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) {
      return res.status(404).json({ success: false, error: 'Answer not found' });
    }

    if (answer.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own answers'
      });
    }

    await Answer.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Answer deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
