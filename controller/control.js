const Question = require('../models/question');
const User = require('../models/user');
let cachedQuestions = [];

const PAGE_SIZE = 25;

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

  const page = Math.max(1, parseInt(req.query.page) || 1);

  let solvedSet = new Set();
  if (req.user?._id) {
    const freshUser = await User.findById(req.user._id).lean();
    solvedSet = new Set(freshUser?.solvedQuestions.map(id => id.toString()) || []);
  }

  const totalQuestions = cachedQuestions.length;
  const totalPages = Math.ceil(totalQuestions / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const paged = cachedQuestions.slice(start, start + PAGE_SIZE);

  const html = paged
    .map(q => q.renderCard(solvedSet.has(q._id.toString())))
    .join('');

  const companies = [...new Set(cachedQuestions.map(q => q.company).filter(Boolean))].sort();
  const tags = [...new Set(cachedQuestions.map(q => q.tag).filter(Boolean))].sort();

  res.render('index', { 
    questionsHtml: html, 
    difficulty: 'All', 
    company: 'All', 
    tag: 'All',
    companies,
    tags,
    currentPage: page,
    totalPages,
    totalQuestions
  });
};

// POST /filter

exports.filterQuestions = async (req, res) => {
  await loadQuestionsFromDb();
  const { difficulty, company, tag } = req.body;
  const page = Math.max(1, parseInt(req.body.page) || 1);

  console.log('req.query:', req.query);
  let solvedSet = new Set();
  if (req.user?._id) {
    const freshUser = await User.findById(req.user._id).lean();
    solvedSet = new Set(freshUser?.solvedQuestions.map(id => id.toString()) || []);
  }
  const filtered = cachedQuestions.filter(q =>
    (difficulty === 'All' || q.dif?.toLowerCase() === difficulty.toLowerCase()) &&
    (company === 'All' || q.company?.toLowerCase() === company.toLowerCase()) &&
    (tag === 'All' || q.tag?.toLowerCase() === tag.toLowerCase())
  );

  const totalQuestions = filtered.length;
  const totalPages = Math.ceil(totalQuestions / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const paged = filtered.slice(start, start + PAGE_SIZE);
  
  const html = paged
    .map(q => q.renderCard(solvedSet.has(q._id.toString())))
    .join('');

  const companies = [...new Set(cachedQuestions.map(q => q.company).filter(Boolean))].sort();
  const tags = [...new Set(cachedQuestions.map(q => q.tag).filter(Boolean))].sort();

  res.render('index', { 
    questionsHtml: html || '<p>No questions found.</p>', 
    difficulty, 
    company, 
    tag,
    companies,
    tags,
    currentPage: page,
    totalPages,
    totalQuestions
  });
};

exports.clearCache = () => {
  cachedQuestions = [];
};