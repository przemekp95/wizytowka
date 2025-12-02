import fs from 'fs';
import path from 'path';

// Load i18n messages
function loadI18nMessages() {
  const plMessagesPath = path.join(process.cwd(), 'src/i18n/messages/pl.json');
  const data = fs.readFileSync(plMessagesPath, 'utf8');
  return JSON.parse(data);
}

// Parse technology string from about me section
function parseTechStackString(techString) {
  if (!techString) return [];

  const parts = techString
    .split(/[\(\)]/)
    .filter((part) => !part.includes('(') && part.trim().length > 0)
    .join(' ')
    .split(/[/,]/)
    .map((tech) => tech.trim())
    .filter((tech) => tech.length > 1)
    .map((tech) => tech.charAt(0).toUpperCase() + tech.slice(1).toLowerCase())
    .filter((tech) => tech.length > 0 && !/^\s*$/.test(tech));

  return parts;
}

// Create tech to category mapping from i18n
function createTechToCategoryMap() {
  try {
    const messages = loadI18nMessages();

    const categoryMapping = {
      frontend: 'frontEnd',
      backend: 'backEnd',
      databases: 'database',
      devops: 'devops',
    };

    const map = {};

    Object.entries(categoryMapping).forEach(([translationKey, categoryType]) => {
      const techStackText = messages.about?.[translationKey];
      if (techStackText) {
        const technologies = parseTechStackString(techStackText);
        technologies.forEach((tech) => {
          map[tech] = categoryType;
        });
      }
    });

    return map;
  } catch (error) {
    console.error('Error loading i18n:', error.message);
    return {};
  }
}

// Test what parser extracts from translations
try {
  const techMap = createTechToCategoryMap();
  console.log('Tech-to-category mapping:');
  console.log(JSON.stringify(techMap, null, 2));

  console.log('\nParsed technologies by category:');
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
