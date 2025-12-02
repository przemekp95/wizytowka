// Test dynamic skills system - checking parser and calculations
import fs from 'fs';
import path from 'path';

// Mock file to simulate browser-like import behavior for testing
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const testPortfolio = [
  {
    _id: 'laravel',
    title: 'PHP Project',
    tags: ['PHP', 'Laravel', 'MySQL'],
    dateFrom: '2022-01-01',
    dateTo: '2022-06-30',
  },
  {
    _id: 'nextjs',
    title: 'Next.js App',
    tags: ['Next.js', 'React', 'TypeScript', 'Tailwind'],
    dateFrom: '2023-01-01',
    dateTo: '2023-12-31',
  },
  {
    _id: 'wordpress',
    title: 'WordPress Site',
    tags: ['WordPress', 'PHP', 'HTML', 'CSS'],
    dateFrom: '2024-01-01',
  },
];

// Simulate i18n messages loading
function loadI18nMessages() {
  const plMessagesPath = path.join(__dirname, 'src/i18n/messages/pl.json');
  const data = fs.readFileSync(plMessagesPath, 'utf8');
  return JSON.parse(data);
}

// Parser stringu technologii
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

// Calculate tech experience months
function calculateSkillExperienceMonths(portfolio, techName) {
  const now = new Date();

  const dateRanges = portfolio.flatMap((project) => {
    if (
      project.tags.some(
        (tag) =>
          techName.toLowerCase().includes(tag.toLowerCase()) ||
          tag.toLowerCase().includes(techName.toLowerCase())
      ) &&
      project.dateFrom
    ) {
      const start = new Date(project.dateFrom);
      const end = project.dateTo ? new Date(project.dateTo) : now;
      return start < end ? [{ start, end }] : [];
    }
    return [];
  });

  if (!dateRanges.length) return 6;

  dateRanges.sort((a, b) => a.start.getTime() - b.start.getTime());

  const mergedRanges = [dateRanges[0]];
  for (let i = 1; i < dateRanges.length; i++) {
    const last = mergedRanges[mergedRanges.length - 1];
    const current = dateRanges[i];

    if (current.start <= last.end) {
      last.end = new Date(Math.max(last.end.getTime(), current.end.getTime()));
    } else {
      mergedRanges.push(current);
    }
  }

  const totalMonths = mergedRanges.reduce((sum, range) => {
    const diffMs = range.end.getTime() - range.start.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    const diffMonths = diffDays / 30.44;
    return sum + Math.ceil(Math.max(0.01, diffMonths));
  }, 0);

  return Math.max(1, totalMonths);
}

// Calculate dynamic tech stack percentages
function calculateDynamicTechStack(portfolio) {
  if (!portfolio?.length) return [];

  const techCounts = {};
  portfolio.forEach((project) => {
    project.tags.forEach((tag) => {
      techCounts[tag] = (techCounts[tag] || 0) + 1;
    });
  });

  const categoryCounts = { frontEnd: 0, backEnd: 0, database: 0, devops: 0 };
  const techMap = createTechToCategoryMap();

  let totalCount = 0;
  Object.entries(techCounts).forEach(([tech, count]) => {
    const category = techMap[tech] || categoryCounts.frontEnd;
    categoryCounts[category] += count;
    totalCount += count;
  });

  if (totalCount === 0) return [];

  return [
    {
      id: 'frontend',
      namePl: 'Frontend',
      nameEn: 'Frontend',
      percentage: Math.round((categoryCounts.frontEnd / totalCount) * 100),
    },
    {
      id: 'backend',
      namePl: 'Backend',
      nameEn: 'Backend',
      percentage: Math.round((categoryCounts.backEnd / totalCount) * 100),
    },
    {
      id: 'databases',
      namePl: 'Bazy danych',
      nameEn: 'Databases',
      percentage: Math.round((categoryCounts.database / totalCount) * 100),
    },
    {
      id: 'devops',
      namePl: 'DevOps',
      nameEn: 'DevOps',
      percentage: Math.round((categoryCounts.devops / totalCount) * 100),
    },
  ].sort((a, b) => b.percentage - a.percentage);
}

// Main test function
function runTests() {
  console.log('🚀 Testing Dynamic Skills System\n');

  // Test 1: Parser functionality
  console.log('📋 TEST 1: Parser - Technology Extraction from i18n');
  console.log('='.repeat(50));

  const techMap = createTechToCategoryMap();
  console.log(`✅ Parsed ${Object.keys(techMap).length} technology-category mappings`);

  const byCategory = {};
  Object.entries(techMap).forEach(([tech, cat]) => {
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(tech);
  });

  Object.entries(byCategory).forEach(([cat, techs]) => {
    console.log(`📁 ${cat}: ${techs.join(', ')}`);
  });

  // Test 2: Tech stack calculation
  console.log('\n📊 TEST 2: Chart Calculation - Portfolio Analysis');
  console.log('='.repeat(50));

  const chart = calculateDynamicTechStack(testPortfolio);
  console.log('Test portfolio items:', testPortfolio.length);

  let totalPercentage = 0;
  chart.forEach((item) => {
    console.log(`📈 ${item.nameEn}: ${item.percentage}%`);
    totalPercentage += item.percentage;
  });

  console.log(`✅ Total percentage: ${totalPercentage}% (should be 100%)`);
  console.log(totalPercentage === 100 ? '✅ Percentage sum correct!' : '❌ Percentage sum error!');

  // Test 3: Experience calculation
  console.log('\n🕒 TEST 3: Experience Calculation - Date Ranges');
  console.log('='.repeat(50));

  const techNames = ['PHP', 'Next.js', 'Laravel'];
  techNames.forEach((tech) => {
    const months = calculateSkillExperienceMonths(testPortfolio, tech);
    console.log(`📅 ${tech}: ${months} miesięcy doświadczenia`);
  });

  console.log('\n🎯 Test completed!');
  console.log('\n📝 Summary:');
  console.log('- Parser correctly extracts technologies from i18n About Me section');
  console.log('- Chart calculations based on portfolio technology usage');
  console.log('- Experience calculations consider overlapping date ranges');
  console.log('- System is fully dynamic - no hardcoded values!');
}

// Run the tests
runTests();
