const { createTechToCategoryMap } = require('./src/data/skills.data.ts');

// Test what parser extracts from translations
try {
  const techMap = createTechToCategoryMap();
  console.log('Tech-to-category mapping:');
  console.log(JSON.stringify(techMap, null, 2));
  
  console.log('\\nParsed technologies by category:');
  const byCategory = {};
  Object.entries(techMap).forEach(([tech, category]) => {
    if (!byCategory[category]) byCategory[category] = [];
    byCategory[category].push(tech);
  });
  
  Object.entries(byCategory).forEach(([cat, techs]) => {
    console.log(`${cat}: ${techs.join(', ')}`);
  });
  
} catch (err) {
  console.error('Error:', err.message);
}
