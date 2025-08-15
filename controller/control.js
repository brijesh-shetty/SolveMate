const Question = require('../models/question');
const User = require('../models/user');
let cachedQuestions = [];

async function loadQuestionsFromDb() {
  if (cachedQuestions.length === 0) {
    try {
      cachedQuestions = await Question.find();
    } catch (err) {
      console.error('❌ Failed to load questions from DB:', err.message);
    }
  }
}
exports.getQuestion = async (req, res) => {
  await loadQuestionsFromDb();

  let solvedSet = new Set();
  if (req.user?._id) {
    const freshUser = await User.findById(req.user._id).lean();
    solvedSet = new Set(freshUser?.solvedQuestions.map(id => id.toString()) || []);
  }



  const html = cachedQuestions
    .map(q => q.renderCard(solvedSet.has(q._id.toString())))
    .join('');

  res.render('index', { questionsHtml: html, difficulty: 'All', company: 'All', tag: 'All' });
};




// POST /filter

exports.filterQuestions = async (req, res) => {
  await loadQuestionsFromDb();
  const { difficulty, company, tag } = req.body;
  console.log('req.query:', req.query);
  let solvedSet = new Set();
  if (req.user?._id) {
    const freshUser = await User.findById(req.user._id).lean();
    solvedSet = new Set(freshUser?.solvedQuestions.map(id => id.toString()) || []);
  }
  const filtered = cachedQuestions.filter(q =>
    (difficulty === 'All' || q.dif?.toLowerCase() === difficulty.toLowerCase()) &&
    (company === 'All' || q.company.toLowerCase() === company.toLowerCase()) &&
    (tag === 'All' || q.tag.toLowerCase() === tag.toLowerCase())
  );
  
  const html = filtered
    .map(q => q.renderCard(solvedSet.has(q._id.toString())))
    .join('');

  res.render('index', { questionsHtml: html || '<p>No questions found.</p>', difficulty, company, tag });
}