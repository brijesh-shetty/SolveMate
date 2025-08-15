// routes/user.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');
router.post('/toggleSolved', async (req, res) => {
  try {
    const { solved, questionId } = req.body;
    const user = await User.findById(req.user._id);

    if (solved) {
      if (!user.solvedQuestions.includes(questionId)) {
        user.solvedQuestions.push(questionId);
      }
    } else {
      user.solvedQuestions = user.solvedQuestions.filter(
        id => id.toString() !== questionId
      );
    }

    await user.save();
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Failed to update solved status:', err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
