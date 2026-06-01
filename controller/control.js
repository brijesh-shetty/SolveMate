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

// Helper to extract unique tags from all questions (tag is now an array)
function getUniqueTags(questions) {
  const tagSet = new Set();
  questions.forEach(q => {
    const tags = Array.isArray(q.tag) ? q.tag : [q.tag];
    tags.filter(Boolean).forEach(t => tagSet.add(t));
  });
  return [...tagSet].sort();
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

  const companies = [...new Set(cachedQuestions.map(q => q.company).filter(Boolean))].sort();
  const tags = getUniqueTags(cachedQuestions);

  res.render('index', { 
    questionsHtml: html, 
    difficulty: 'All', 
    company: 'All', 
    tag: 'All',
    companies,
    tags
  });
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
  const filtered = cachedQuestions.filter(q => {
    const diffMatch = difficulty === 'All' || q.dif?.toLowerCase() === difficulty.toLowerCase();
    const companyMatch = company === 'All' || q.company?.toLowerCase() === company.toLowerCase();
    // Tag is now an array — check if any tag in the array matches the selected tag
    let tagMatch = true;
    if (tag !== 'All') {
      const qTags = Array.isArray(q.tag) ? q.tag : [q.tag];
      tagMatch = qTags.some(t => t?.toLowerCase() === tag.toLowerCase());
    }
    return diffMatch && companyMatch && tagMatch;
  });
  
  const html = filtered
    .map(q => q.renderCard(solvedSet.has(q._id.toString())))
    .join('');

  const companies = [...new Set(cachedQuestions.map(q => q.company).filter(Boolean))].sort();
  const tags = getUniqueTags(cachedQuestions);

  res.render('index', { 
    questionsHtml: html || '<p>No questions found.</p>', 
    difficulty, 
    company, 
    tag,
    companies,
    tags
  });
};

exports.clearCache = () => {
  cachedQuestions = [];
};