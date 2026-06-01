const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

// Load the Question model
// Since this script is run from SolveMate root, require './models/question'
const Question = require('./models/question');

// Top tech companies to import by default
const DEFAULT_TARGET_COMPANIES = [
  'Google',
  'Amazon',
  'Microsoft',
  'Facebook',
  'Meta',
  'Apple',
  'Netflix',
  'Uber',
  'Bloomberg',
  'Adobe',
  'Twitter',
  'Oracle',
  'Salesforce'
];

// Helper to normalize topics array for consistent storage
function normalizeTopics(topics) {
  if (!topics || !Array.isArray(topics) || topics.length === 0) {
    return ['Other'];
  }
  // Capitalize each topic consistently
  return topics.map(t => t.charAt(0).toUpperCase() + t.slice(1));
}

async function seed() {
  // Determine DB Path
  let dbUri = process.env.DB_PATH;
  
  // Check for DB URI in command line arguments (e.g. node seed.js mongodb://...)
  const args = process.argv.slice(2);
  const importAllCompanies = args.includes('--all');
  
  const uriArg = args.find(arg => arg.startsWith('mongodb://') || arg.startsWith('mongodb+srv://'));
  if (uriArg) {
    dbUri = uriArg;
  }
  
  if (!dbUri) {
    console.error('❌ Error: MongoDB connection string not found.');
    console.error('Please specify DB_PATH in .env or pass it as an argument:');
    console.error('   node seed.js "mongodb+srv://..."');
    process.exit(1);
  }
  
  // Find JSON file
  const pathsToTry = [
    path.join(__dirname, '..', 'leetcode_company_wise.json'),
    path.join(__dirname, 'leetcode_company_wise.json')
  ];
  
  let jsonPath = null;
  for (const p of pathsToTry) {
    if (fs.existsSync(p)) {
      jsonPath = p;
      break;
    }
  }
  
  if (!jsonPath) {
    console.error('❌ Error: leetcode_company_wise.json file not found.');
    console.error(`Checked paths:\n - ${pathsToTry.join('\n - ')}`);
    process.exit(1);
  }
  
  console.log(`📖 Reading ${jsonPath}...`);
  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const data = JSON.parse(rawData);
  
  const companiesInJson = Object.keys(data);
  console.log(`🔍 Found ${companiesInJson.length} companies in JSON file.`);
  
  // Determine which companies to import
  const targetCompanies = importAllCompanies 
    ? companiesInJson 
    : DEFAULT_TARGET_COMPANIES.filter(c => companiesInJson.includes(c));
    
  console.log(`🚀 Starting seed for companies: ${importAllCompanies ? 'ALL' : targetCompanies.join(', ')}`);
  
  // Connect to DB
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(dbUri);
  console.log('✅ Connected to MongoDB.');
  
  const questionsToInsert = [];
  const processedKeys = new Set(); // to avoid duplicates
  
  for (const company of targetCompanies) {
    const companyData = data[company];
    if (!companyData) continue;
    
    // Timeframes in JSON: thirty_days, three_months, six_months, more_than_six_months, all_time
    const timeframes = ['thirty_days', 'three_months', 'six_months', 'more_than_six_months', 'all_time'];
    
    for (const timeframe of timeframes) {
      const questionsList = companyData[timeframe];
      if (!questionsList || !Array.isArray(questionsList)) continue;
      
      for (const q of questionsList) {
        if (!q.title || !q.link) continue;
        
        // Define unique key to avoid adding the same question for the same company twice
        const uniqueKey = `${company.toLowerCase()}_${q.title.toLowerCase()}`;
        if (processedKeys.has(uniqueKey)) continue;
        processedKeys.add(uniqueKey);
        
        // Map fields
        questionsToInsert.push({
          company: company,
          qunname: q.title,
          tag: normalizeTopics(q.topics),
          qunlink: q.link,
          dif: q.difficulty ? q.difficulty.toLowerCase() : 'easy'
        });
      }
    }
  }
  
  console.log(`📊 Parsed ${questionsToInsert.length} unique company-question combinations.`);
  
  if (questionsToInsert.length === 0) {
    console.log('⚠️ No new questions found to seed.');
    await mongoose.connection.close();
    return;
  }
  
  console.log('🔄 Checking for existing questions in database to avoid duplicate records...');
  // Retrieve all existing questions from the database to build a cache
  const existingQuestions = await Question.find({}, { company: 1, qunname: 1 }).lean();
  const existingKeys = new Set(
    existingQuestions.map(q => `${q.company.toLowerCase()}_${q.qunname.toLowerCase()}`)
  );
  
  // Filter out questions that are already in the DB
  const newQuestions = questionsToInsert.filter(q => {
    const key = `${q.company.toLowerCase()}_${q.qunname.toLowerCase()}`;
    return !existingKeys.has(key);
  });
  
  console.log(`✨ Found ${newQuestions.length} new questions to insert (${questionsToInsert.length - newQuestions.length} already exist in database).`);
  
  if (newQuestions.length > 0) {
    // Insert in batches of 500
    const batchSize = 500;
    for (let i = 0; i < newQuestions.length; i += batchSize) {
      const batch = newQuestions.slice(i, i + batchSize);
      await Question.insertMany(batch);
      console.log(`📥 Inserted batch ${Math.floor(i / batchSize) + 1} (${batch.length} questions)...`);
    }
    console.log('🎉 Database seeding complete!');
  } else {
    console.log('ℹ️ All parsed questions already exist in the database. Nothing to insert.');
  }
  
  await mongoose.connection.close();
  console.log('🔌 MongoDB connection closed.');
}

seed().catch(err => {
  console.error('❌ Seeding failed with error:', err);
  mongoose.connection.close();
});
