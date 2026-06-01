const fs = require('fs');
const path = require('path');

// Target companies to import (you can add/remove from this list)
const TARGET_COMPANIES = [
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

// Helper to map topics array to a single standard tag
function mapTopicsToTag(topics) {
  if (!topics || !Array.isArray(topics) || topics.length === 0) {
    return 'Other';
  }
  
  const topicSet = new Set(topics.map(t => t.toLowerCase()));
  
  if (topicSet.has('array') || topicSet.has('matrix') || topicSet.has('prefix sum')) {
    return 'Array';
  }
  if (topicSet.has('string') || topicSet.has('string matching')) {
    return 'String';
  }
  if (topicSet.has('linked list') || topicSet.has('doubly-linked list')) {
    return 'Linked List';
  }
  if (
    topicSet.has('tree') || 
    topicSet.has('binary tree') || 
    topicSet.has('binary search tree') || 
    topicSet.has('trie') || 
    topicSet.has('binary indexed tree') || 
    topicSet.has('segment tree')
  ) {
    return 'Tree';
  }
  if (
    topicSet.has('graph') || 
    topicSet.has('depth-first search') || 
    topicSet.has('breadth-first search') || 
    topicSet.has('union find') || 
    topicSet.has('shortest path') || 
    topicSet.has('topological sort') || 
    topicSet.has('minimum spanning tree')
  ) {
    return 'Graph';
  }
  if (topicSet.has('dynamic programming') || topicSet.has('memoization')) {
    return 'Dynamic Programming';
  }
  
  // Fallback: Use the first topic capitalized
  const first = topics[0];
  return first.charAt(0).toUpperCase() + first.slice(1);
}

function convert() {
  const jsonPath = path.join(__dirname, '..', 'leetcode_company_wise.json');
  
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Error: leetcode_company_wise.json not found at: ${jsonPath}`);
    process.exit(1);
  }
  
  console.log(`📖 Reading ${jsonPath}...`);
  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const data = JSON.parse(rawData);
  
  const companiesInJson = Object.keys(data);
  const targetCompanies = TARGET_COMPANIES.filter(c => companiesInJson.includes(c));
  
  const formattedQuestions = [];
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
        
        const uniqueKey = `${company.toLowerCase()}_${q.title.toLowerCase()}`;
        if (processedKeys.has(uniqueKey)) continue;
        processedKeys.add(uniqueKey);
        
        formattedQuestions.push({
          company: company,
          qunname: q.title,
          tag: mapTopicsToTag(q.topics),
          qunlink: q.link,
          dif: q.difficulty ? q.difficulty.toLowerCase() : 'easy'
        });
      }
    }
  }
  
  const outputPath = path.join(__dirname, 'questions_formatted.json');
  fs.writeFileSync(outputPath, JSON.stringify(formattedQuestions, null, 2), 'utf8');
  
  console.log(`\n🎉 Success! Formatted ${formattedQuestions.length} questions.`);
  console.log(`💾 Saved to: ${outputPath}`);
  console.log(`\n👉 Steps to import in MongoDB Compass:`);
  console.log(`1. Open MongoDB Compass.`);
  console.log(`2. Go to the "test" database and click on the "questions" collection.`);
  console.log(`3. Click the green "ADD DATA" button and select "Import File".`);
  console.log(`4. Choose the generated "questions_formatted.json" file.`);
  console.log(`5. Click "Import"!`);
}

convert();
