const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Question = require('../models/question');

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

async function runSeed(importAll = false) {
  const pathsToTry = [
    path.join(__dirname, '..', '..', 'leetcode_company_wise.json'),
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
    throw new Error(`leetcode_company_wise.json not found in checked paths: ${pathsToTry.join(', ')}`);
  }
  
  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const data = JSON.parse(rawData);
  
  const companiesInJson = Object.keys(data);
  const targetCompanies = importAll 
    ? companiesInJson 
    : DEFAULT_TARGET_COMPANIES.filter(c => companiesInJson.includes(c));
    
  const questionsToInsert = [];
  const processedKeys = new Set();
  
  for (const company of targetCompanies) {
    const companyData = data[company];
    if (!companyData) continue;
    
    const timeframes = ['thirty_days', 'three_months', 'six_months', 'more_than_six_months', 'all_time'];
    
    for (const timeframe of timeframes) {
      const questionsList = companyData[timeframe];
      if (!questionsList || !Array.isArray(questionsList)) continue;
      
      for (const q of questionsList) {
        if (!q.title || !q.link) continue;
        
        // Get topics — if empty, use ['Other']
        const topics = (q.topics && Array.isArray(q.topics) && q.topics.length > 0)
          ? q.topics
          : ['Other'];
        
        // Create one entry per topic tag
        for (const topic of topics) {
          const tag = topic.charAt(0).toUpperCase() + topic.slice(1);
          // Unique key includes tag so same question can appear with different tags
          const uniqueKey = `${company.toLowerCase()}_${q.title.toLowerCase()}_${tag.toLowerCase()}`;
          if (processedKeys.has(uniqueKey)) continue;
          processedKeys.add(uniqueKey);
          
          questionsToInsert.push({
            company: company,
            qunname: q.title,
            tag: tag,
            qunlink: q.link,
            dif: q.difficulty ? q.difficulty.toLowerCase() : 'easy'
          });
        }
      }
    }
  }
  
  if (questionsToInsert.length === 0) {
    return { success: true, count: 0, message: 'No questions parsed.' };
  }
  
  // Check for duplicates in DB (now unique key includes tag)
  const existingQuestions = await Question.find({}, { company: 1, qunname: 1, tag: 1 }).lean();
  const existingKeys = new Set(
    existingQuestions.map(q => `${q.company.toLowerCase()}_${q.qunname.toLowerCase()}_${(q.tag || '').toLowerCase()}`)
  );
  
  const newQuestions = questionsToInsert.filter(q => {
    const key = `${q.company.toLowerCase()}_${q.qunname.toLowerCase()}_${q.tag.toLowerCase()}`;
    return !existingKeys.has(key);
  });
  
  if (newQuestions.length > 0) {
    // Insert in batches of 500
    const batchSize = 500;
    for (let i = 0; i < newQuestions.length; i += batchSize) {
      const batch = newQuestions.slice(i, i + batchSize);
      await Question.insertMany(batch);
    }
  }
  
  return {
    success: true,
    totalParsed: questionsToInsert.length,
    insertedCount: newQuestions.length,
    skippedCount: questionsToInsert.length - newQuestions.length
  };
}

module.exports = { runSeed };
