// Typy

export interface Skill {
  id: string;
  name: string;
  level: number;
  category: 'frontEnd' | 'backEnd' | 'database' | 'devops';
  experienceMonths?: number;
}

export interface TechStack {
  id: string;
  namePl: string;
  nameEn: string;
  percentage: number;
  color: string;
}

type PortfolioItem = {
  _id: string;
  title: string;
  title_en?: string;
  slug: string;
  href: string;
  desc: string;
  desc_en?: string;
  tags: string[];
  img: string;
  isLogo?: boolean;
  category?: string;
  repoUrl?: string | null;
  dateFrom?: Date;
  dateTo?: Date;
};

// Trendy technologii rok do roku
export const calculateTechTrends = (portfolio: PortfolioItem[]) => {
  console.log('⚡ Tech trends calculation: portfolio items =', portfolio.length);

  if (!portfolio.length) {
    console.log('📋 Using hardcoded fallback tech trends');
    return [
      {
        id: 'trend1',
        name: 'React/Next.js',
        yearOverYearChange: 15,
        category: 'frontEnd' as const,
        isTrend: 'rising' as const,
      },
      {
        id: 'trend2',
        name: 'Node.js',
        yearOverYearChange: 8,
        category: 'backEnd' as const,
        isTrend: 'stable' as const,
      },
    ];
  }

  console.log('📊 Calculating dynamic tech trends from portfolio data');

  // Wróć do porównania rok do roku: ostatnie 12 miesięcy vs poprzednie 12 miesięcy
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000); // ~12 miesięcy temu
  const twentyFourMonthsAgo = new Date(now.getTime() - 24 * 30 * 24 * 60 * 60 * 1000); // ~24 miesiące temu

  const projectsLast12Months = portfolio.filter(
    (p) => p.dateFrom && new Date(p.dateFrom) >= twelveMonthsAgo
  );

  const projectsPrevious12Months = portfolio.filter(
    (p) =>
      p.dateFrom && new Date(p.dateFrom) >= twentyFourMonthsAgo && new Date(p.dateFrom) < twelveMonthsAgo
  );

  console.log(`📅 Last 12 months: ${projectsLast12Months.length} projects`);
  console.log(`📅 Previous 12 months: ${projectsPrevious12Months.length} projects`);

  // Jeśli nie ma bieżących projektów, nie ma czego pokazać
  if (projectsLast12Months.length === 0) {
    return [];
  }

  // Jeśli mamy mniej niż minimalną liczbę projektów, pokaż podstawowe statystyki ale bez ekstremalnych procentów
  const totalProjectsForTrends = projectsLast12Months.length + projectsPrevious12Months.length;
  const hasLimitedData = totalProjectsForTrends < 4;

  // Funkcja do zliczania technologii w projektach
  const countTechInProjects = (projects: PortfolioItem[]): Record<string, number> => {
    const techCounts: Record<string, number> = {};
    projects.forEach((project) => {
      project.tags.forEach((tag) => {
        // Skip MDX technology
        if (tag.toLowerCase().includes('mdx')) {
          return; // skip this tag
        }
        techCounts[tag] = (techCounts[tag] || 0) + 1;
      });
    });
    return techCounts;
  };

  // Zlicz technologie w obu okresach
  const last12MonthsTech = countTechInProjects(projectsLast12Months);
  const previous12MonthsTech = countTechInProjects(projectsPrevious12Months);

  // Wszystkie technologie używane w ostatnim okresie
  const allTechs = new Set([...Object.keys(last12MonthsTech), ...Object.keys(previous12MonthsTech)]);

  const trends: Array<{
    id: string;
    name: string;
    yearOverYearChange: number;
    category: Skill['category'];
    isTrend: 'rising' | 'falling' | 'stable';
  }> = [];

  Array.from(allTechs).forEach((tech, index) => {
    const currentCount = last12MonthsTech[tech] || 0;
    const previousCount = previous12MonthsTech[tech] || 0;

    let change = 0;
    if (previousCount > 0) {
      change = Math.round(((currentCount - previousCount) / previousCount) * 100);

      // Debug dla ekstremalnych zmian procentowych
      if (Math.abs(change) > 200) {
        console.log(`🚨 HIGH CHANGE ALERT: ${tech} - prev:${previousCount}, curr:${currentCount}, change:${change}%`);
      }
    } else if (currentCount > 0) {
      // Nowe technologie bez historii otrzymują +100% za każdy projekt
      change = currentCount * 100;
    }

    // Use centralized category mapping
    const category = techToCategoryMap[tech] || 'frontEnd';

    let isTrend: 'rising' | 'falling' | 'stable' = 'stable';
    if (change >= 10) isTrend = 'rising';
    else if (change <= -10) isTrend = 'falling';
    // 0% change (bez zmian) też może być pokazane jako stable

    trends.push({
      id: `${tech.toLowerCase().replace(/\s+/g, '-')}-${index}`,
      name: tech,
      yearOverYearChange: change,
      category,
      isTrend,
    });
  });

  // Filtruj tylko technologie frontEnd i backEnd
  const filteredTrends = trends.filter(trend => trend.category === 'frontEnd' || trend.category === 'backEnd');

  // Nowa polityka sortowania: wzrosty + spadki na końcu
  const risingTrends = filteredTrends.filter(trend => trend.yearOverYearChange >= 0);
  const fallingTrends = filteredTrends.filter(trend => trend.yearOverYearChange < 0);

  // Sortuj wzrosty po wartości malejąco (od największych)
  risingTrends.sort((a, b) => b.yearOverYearChange - a.yearOverYearChange);

  // Sortuj spadki po absolutnej wartości malejąco (od największych spadków)
  fallingTrends.sort((a, b) => Math.abs(b.yearOverYearChange) - Math.abs(a.yearOverYearChange));

  // Weź maksymalnie 8 pozycji: wzrosty + max 2 spadki (o ile występują)
  const maxRisingCount = 8 - Math.min(2, fallingTrends.length); // pozostałość po spadkach
  const selectedRising = risingTrends.slice(0, maxRisingCount);
  const selectedFalling = fallingTrends.slice(0, 2); // maksymalnie 2 spadki

  // Debugowanie Dockerfile - sprawdź dlaczego może się pojawiać
  const dockerfileTrend = filteredTrends.find(trend =>
    trend.name.toLowerCase().includes('dockerfile') || trend.name.toLowerCase().includes('docker')
  );
  if (dockerfileTrend) {
    console.log('🐳 ❌ Dockerfile trend still showing:', dockerfileTrend.name, 'category:', dockerfileTrend.category, 'change:', dockerfileTrend.yearOverYearChange);
  }

  return [...selectedRising, ...selectedFalling].slice(0, 8); // ostatecznie max 8 pozycji
};

// Rozkład kategorii projektów
export const calculatePortfolioCategories = (portfolio: PortfolioItem[]) => {
  console.log('📊 Portfolio categories calculation: portfolio items =', portfolio.length);

  if (!portfolio.length) {
    console.log('📋 Using hardcoded fallback portfolio categories');
    return [
      {
        id: 'web-app',
        namePl: 'Aplikacje webowe',
        nameEn: 'Web Applications',
        percentage: 60,
        color: 'rgba(99, 102, 241, 0.8)', // indigo
        descriptionPl: 'Pełnofunkcjonalne aplikacje internetowe',
        descriptionEn: 'Full-featured web applications',
      },
      {
        id: 'api',
        namePl: 'API i usługi',
        nameEn: 'APIs & Services',
        percentage: 25,
        color: 'rgba(139, 92, 246, 0.8)', // purple
        descriptionPl: 'Backend i usługi webowe',
        descriptionEn: 'Backend services and APIs',
      },
      {
        id: 'tools',
        namePl: 'Narzędzia',
        nameEn: 'Tools & Utilities',
        percentage: 10,
        color: 'rgba(6, 182, 212, 0.8)', // cyan
        descriptionPl: 'Narzędzia i aplikacje pomocnicze',
        descriptionEn: 'Helper tools and utilities',
      },
      {
        id: 'other',
        namePl: 'Inne',
        nameEn: 'Other',
        percentage: 5,
        color: 'rgba(16, 185, 129, 0.8)', // emerald
        descriptionPl: 'Pozostałe projekty',
        descriptionEn: 'Other projects',
      },
    ];
  }

  // Kategoryzacja projektów na podstawie pola category z bazy danych
  const categories: Record<
    string,
    {
      count: number;
      color: string;
      namePl: string;
      nameEn: string;
      descriptionPl: string;
      descriptionEn: string;
    }
  > = {
    'web-app': {
      count: 0,
      color: 'rgba(99, 102, 241, 0.8)',
      namePl: 'Aplikacje webowe',
      nameEn: 'Web Applications',
      descriptionPl: 'Pełnofunkcjonalne aplikacje internetowe',
      descriptionEn: 'Full-featured web applications',
    },
    ecommerce: {
      count: 0,
      color: 'rgba(34, 197, 94, 0.8)', // green
      namePl: 'E-commerce',
      nameEn: 'E-commerce',
      descriptionPl: 'Sklepy internetowe i rozwiązania sprzedażowe',
      descriptionEn: 'E-commerce stores and sales solutions',
    },
    api: {
      count: 0,
      color: 'rgba(139, 92, 246, 0.8)',
      namePl: 'API i usługi',
      nameEn: 'APIs & Services',
      descriptionPl: 'Backend i usługi webowe',
      descriptionEn: 'Backend services and APIs',
    },
    tools: {
      count: 0,
      color: 'rgba(6, 182, 212, 0.8)',
      namePl: 'Narzędzia',
      nameEn: 'Tools & Utilities',
      descriptionPl: 'Narzędzia i aplikacje pomocnicze',
      descriptionEn: 'Helper tools and utilities',
    },
    'mobile-apps': {
      count: 0,
      color: 'rgba(34, 197, 94, 0.8)', // green
      namePl: 'Aplikacje mobilne',
      nameEn: 'Mobile Apps',
      descriptionPl: 'Aplikacje mobilne i PWA',
      descriptionEn: 'Mobile applications and PWAs',
    },
    landing: {
      count: 0,
      color: 'rgba(16, 185, 129, 0.8)',
      namePl: 'Landing page',
      nameEn: 'Landing Pages',
      descriptionPl: 'Strony wizytówki i prezentacji',
      descriptionEn: 'Presentation and landing pages',
    },
    ai: {
      count: 0,
      color: 'rgba(147, 51, 234, 0.8)', // purple/violet for AI
      namePl: 'AI & Machine Learning',
      nameEn: 'AI & Machine Learning',
      descriptionPl: 'Rozwiązania z zakresu sztucznej inteligencji',
      descriptionEn: 'Artificial intelligence and machine learning solutions',
    },
    other: {
      count: 0,
      color: 'rgba(245, 158, 11, 0.8)',
      namePl: 'Inne',
      nameEn: 'Other',
      descriptionPl: 'Pozostałe projekty',
      descriptionEn: 'Other projects',
    },
  };

  portfolio.forEach((project) => {
    // Support multiple categories separated by commas
    const categoryString = project.category?.toString() || 'other';
    const categoryParts = categoryString.split(',').map(cat => cat.trim().toLowerCase());

    // Debug kategorii projektach - sprawdź jakie kategorie są używane
    console.log('📂 Project categories analysis - project:', project.title, 'categories:', categoryParts);

    // Raw count: każdy projekt dodaje +1 do KAŻDEJ swojej kategorii (bez dzielenia)
    console.log(`🎯 Project "${project.title}" adds +1 to each of ${categoryParts.length} categories`);

    categoryParts.forEach((category) => {
      // Mapowanie polskich nazw na angielskie identyfikatory
      const categoryMapping: Record<string, keyof typeof categories> = {
        'web-app': 'web-app',
        webapp: 'web-app',
        web: 'web-app', // dla polskiego "web"
        ecommerce: 'ecommerce',
        'e-commerce': 'ecommerce',
        ekomercyjny: 'ecommerce',
        sklep: 'ecommerce',
        api: 'api',
        services: 'api',
        usługi: 'api',
        tools: 'tools',
        narzędzia: 'tools',
        utilities: 'tools',
        landing: 'landing',
        portfolio: 'landing',
        wizytówka: 'landing',
        mobile: 'mobile-apps',
        mobilne: 'mobile-apps',
        'mobile-apps': 'mobile-apps',
        'mobile apps': 'mobile-apps',
        mob: 'mobile-apps',
        ai: 'ai',
        other: 'other',
        inne: 'other',
      };

      const targetCategory = categoryMapping[category] || 'other';
      // Raw count: +1 dla KAŻDEJ kategorii (nie dziel przez liczbę kategorii)
      categories[targetCategory].count += 1;

      // Debugowanie mapowania kategorii
      if (categoryParts.includes('mobile') || categoryParts.includes('mobilne') || categoryString.includes('mobile-apps')) {
        console.log('📱 Mobile app category detected! Project:', project.title, 'original:', category, 'mapped to:', targetCategory);
      }
    });
  });



  // Oblicz procenty na podstawie sumy wszystkich wystąpisk kategorii (raw counts)
  const totalCategoryMentions = Object.values(categories).reduce((sum, cat) => sum + cat.count, 0);

  console.log(`📊 Total category mentions: ${totalCategoryMentions} (from ${portfolio.length} projects)`);

  // Normalizuj procenty aby zawsze sumowały się do 100%
  const categoryPercentages = Object.entries(categories)
    .map(([key, data]) => ({
      id: key,
      namePl: data.namePl,
      nameEn: data.nameEn,
      percentage: (data.count / totalCategoryMentions) * 100, // procent bazuje na wystąpiskach wszystkich kategorii
      rawPercentage: (data.count / totalCategoryMentions) * 100,
      rawCount: data.count, // zachowaj ilość wystąpisks dla debugowania
      color: data.color,
      descriptionPl: data.descriptionPl,
      descriptionEn: data.descriptionEn,
    }))
    .filter((cat) => cat.percentage >= 0.01); // pokaż tylko kategorie z co najmniej 1%

  // Zaokrągli procenty tak aby sumowały się do 100
  // Najpierw zaokrąglic_doc pozostałe w dół
  const roundedSum = categoryPercentages.reduce((sum, cat) => sum + Math.floor(cat.percentage), 0);
  const remainder = 100 - roundedSum;

  // Rozdaj pozostałe procenty do największych kategorii
  let remainderToDistribute = remainder;
  categoryPercentages
    .sort((a, b) => (b.percentage % 1) - (a.percentage % 1)) // sortuj wg części dziesiętnych malejąco
    .forEach((cat, index) => {
      if (index < remainderToDistribute) {
        cat.percentage = Math.floor(cat.percentage) + 1;
      } else {
        cat.percentage = Math.floor(cat.percentage);
      }
    });

  // Debug final percentages
  console.log('✅ Final category percentages:', categoryPercentages.map(c => `${c.namePl}: ${c.percentage}%`).join(', '));
  console.log('📊 Total sum:', categoryPercentages.reduce((sum, cat) => sum + cat.percentage, 0), '%');

  return categoryPercentages.filter((cat) => cat.percentage > 0);
};

// Stan umiejętności - fallback do pracy jako prezentacja gdy nie ma portfolio
// Wszystkie umiejętności są generowane dynamicznie z danych portfolio
export const skillsData: Skill[] = [];

// dane do wykresu kołowego rozkładu kompetencji
export const techStackData: TechStack[] = [
  {
    id: 'frontend',
    namePl: 'Frontend',
    nameEn: 'Frontend',
    percentage: 35,
    color: 'rgba(99, 102, 241, 0.8)', // indigo
  },
  {
    id: 'backend',
    namePl: 'Backend',
    nameEn: 'Backend',
    percentage: 30,
    color: 'rgba(139, 92, 246, 0.8)', // purple
  },
  {
    id: 'mobile-apps',
    namePl: 'Aplikacje mobilne',
    nameEn: 'Mobile Apps',
    percentage: 20,
    color: 'rgba(34, 197, 94, 0.8)', // green
  },
  {
    id: 'databases',
    namePl: 'Bazy danych',
    nameEn: 'Databases',
    percentage: 10,
    color: 'rgba(6, 182, 212, 0.8)', // cyan
  },
  {
    id: 'devops',
    namePl: 'DevOps',
    nameEn: 'DevOps',
    percentage: 5,
    color: 'rgba(16, 185, 129, 0.8)', // emerald
  },
];

// Statyczna mapa technologii na kategorie - hardcoded dla bezpieczeństwa produkcyjnego
const createTechToCategoryMap = (): Record<string, Skill['category']> => {
  // Zakodowane mapowanie na podstawie tłumaczeń pl.json dla reliability
  const techMap: Record<string, Skill['category']> = {
    // Frontend
    'Next.js': 'frontEnd',
    Nextjs: 'frontEnd',
    React: 'frontEnd',
    TypeScript: 'frontEnd',
    JavaScript: 'frontEnd',
    'Tailwind CSS': 'frontEnd',
    TailwindCSS: 'frontEnd',
    SCSS: 'frontEnd',
    CSS: 'frontEnd',
    HTML: 'frontEnd',
    'Three.js': 'frontEnd',
    GSAP: 'frontEnd',
    'Framer Motion': 'frontEnd',

    // Backend
    'Node.js': 'backEnd',
    NestJS: 'backEnd',
    Express: 'backEnd',
    PHP: 'backEnd',
    Laravel: 'backEnd',
    Django: 'backEnd',
    'Spring Boot': 'backEnd',
    'ASP.NET': 'backEnd',
    '.NET': 'backEnd',
    Ruby: 'backEnd',
    'Ruby on Rails': 'backEnd',
    Python: 'backEnd',
    Java: 'backEnd',
    Kotlin: 'backEnd',
    Scala: 'backEnd',

    // Databases
    MySQL: 'database',
    PostgreSQL: 'database',
    MongoDB: 'database',
    Redis: 'database',
    SQLite: 'database',
    Firebase: 'database',
    Supabase: 'database',
    Prisma: 'database',
    Drizzle: 'database',
    TypeORM: 'database',
    Sequelize: 'database',
    Mongoose: 'database',
    NoSQL: 'database',
    SQL: 'database',

    // DevOps (moved here from FE/BE)
    Docker: 'devops',
    Dockerfile: 'devops',
    Kubernetes: 'devops',
    AWS: 'devops',
    'Google Cloud': 'devops',
    Azure: 'devops',
    Vercel: 'devops',
    Render: 'devops',
    Heroku: 'devops',
    GitLab: 'devops',
    GitHub: 'devops',
    'CI/CD': 'devops',
    Jenkins: 'devops',
    // Testing frameworks and security tools - treating as DevOps/infrastructure
    Jest: 'devops',
    Cypress: 'devops',
    Playwright: 'devops',
    'Testing Library': 'devops',
    Vitest: 'devops',
    Trivy: 'devops',
  };

  return techMap;
};

// Lookup table dla standardowych nazw technologii (zachowaj oryginalną kapitalizację)
const techNameMap: Record<string, string> = {
  // Frontend
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  'next.js': 'Next.js',
  nextjs: 'Next.js',
  js: 'JavaScript',
  ts: 'TypeScript',
  react: 'React',
  vue: 'Vue.js',
  angular: 'Angular',
  svelte: 'Svelte',
  jquery: 'jQuery',
  tailwind: 'Tailwind CSS',
  tailwindcss: 'Tailwind CSS',
  bootstrap: 'Bootstrap',
  sass: 'SCSS',
  scss: 'SCSS',
  css: 'CSS',
  html: 'HTML',
  threejs: 'Three.js',
  'three.js': 'Three.js',
  gsap: 'GSAP',
  framer: 'Framer Motion',
  'framer-motion': 'Framer Motion',

  // Backend
  php: 'PHP',
  'node.js': 'Node.js',
  nodejs: 'Node.js',
  node: 'Node.js',
  nestjs: 'NestJS',
  'nest.js': 'NestJS',
  express: 'Express',
  laravel: 'Laravel',
  symfony: 'Symfony',
  django: 'Django',
  flask: 'Flask',
  spring: 'Spring Boot',
  springboot: 'Spring Boot',
  'asp.net': 'ASP.NET',
  dotnet: 'ASP.NET',
  '.net': '.NET',
  ruby: 'Ruby',
  rails: 'Ruby on Rails',
  ror: 'Ruby on Rails',
  go: 'Go',
  golang: 'Go',
  python: 'Python',
  java: 'Java',
  kotlin: 'Kotlin',
  scala: 'Scala',

  // Databases
  mysql: 'MySQL',
  postgresql: 'PostgreSQL',
  postgres: 'PostgreSQL',
  mongodb: 'MongoDB',
  redis: 'Redis',
  sqlite: 'SQLite',
  firebase: 'Firebase',
  supabase: 'Supabase',
  prisma: 'Prisma',
  drizzle: 'Drizzle',
  typeorm: 'TypeORM',
  sequelize: 'Sequelize',
  mongoose: 'Mongoose',
  nosql: 'NoSQL',
  sql: 'SQL',

  // DevOps/Cloud
  docker: 'Docker',
  kubernetes: 'Kubernetes',
  k8s: 'Kubernetes',
  aws: 'AWS',
  azure: 'Azure',
  gcp: 'Google Cloud',
  'google cloud': 'Google Cloud',
  vercel: 'Vercel',
  render: 'Render',
  heroku: 'Heroku',
  gitlab: 'GitLab',
  github: 'GitHub',
  'github actions': 'GitHub Actions',
  'ci/cd': 'CI/CD',
  cicd: 'CI/CD',
  jenkins: 'Jenkins',
  webdriver: 'Wetherby Driver',
  selenium: 'Selenium',
  cypress: 'Cypress',
  playwright: 'Playwright',
  jest: 'Jest',
  vitest: 'Vitest',
  'testing-library': 'Testing Library',
  'react testing library': 'React Testing Library',

  // Other
  graphql: 'GraphQL',
  rest: 'REST',
  websockets: 'WebSockets',
  oauth: 'OAuth',
  jwt: 'JWT',
  wordpress: 'WordPress',
  woocommerce: 'WooCommerce',
  shopify: 'Shopify',
  figma: 'Figma',
  sketch: 'Sketch',
  'adobe xd': 'Adobe XD',
  photoshop: 'Photoshop',
  illustrator: 'Illustrator',
};

// Normalizuj nazwę technologii używając lookup table i automatycznego Title Case jako fallback
const normalizeTechName = (tech: string): string => {
  const lowerTech = tech.toLowerCase().replace(/\s+/g, ' ').trim();

  // 1. Najpierw sprawdź lookup table dla standardowych nazw
  if (techNameMap[lowerTech]) {
    return techNameMap[lowerTech];
  }

  // 2. Dla technologii nieznanych w mapie, zastosuj inteligentne tytuły Case
  // Zamień wszystkie słowa na Title Case, chyba że to specjalne części jak .js, .net, etc.
  const words = tech.trim().split(/\s+/);

  const normalizedWords = words.map((word) => {
    // Obsługa specjalnych przypadków (.js, .net) - zamień tylko przed kropką
    if (
      word.includes('.') &&
      word.indexOf('.') === word.lastIndexOf('.') &&
      !word.startsWith('.')
    ) {
      // Dla pojedynczych kropek (Next.js) - zamień tylko przed kropką
      const [prefix, suffix] = word.split('.');
      return prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase() + '.' + suffix;
    } else {
      // Standardowy Title Case dla każdego słowa
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
  });

  return normalizedWords.join(' ');
};

// Parser stringu technologii: "Next.js / React / Tailwind / SCSS / JavaScript, TypeScript"
const parseTechStackString = (techString: string): string[] => {
  // Podziel po: "/" (slash), "," (przecinek), "(" (nawias otwarty)
  const parts = techString
    .split(/[\(\)]/) // Najpierw usuń content w nawiasach
    .filter((part) => !part.includes('(') && part.trim().length > 0)
    .join(' ')
    .split(/[/,]/) // Potem dziel po slash/przecinek
    .map((tech) => tech.trim())
    .filter((tech) => tech.length > 0)

    // Normalizacja używając lookup table (zachowaj właściwą kapitalizację)
    .map(normalizeTechName)

    // Czyść spacje i filtry
    .filter((tech) => tech.length > 1 && !/^\s*$/.test(tech));

  return parts;
};

const techToCategoryMap = createTechToCategoryMap();

// Oblicz rzeczywiste miesiące doświadczenia dla technologii na podstawie zakresów dat
const calculateSkillExperienceMonths = (portfolio: PortfolioItem[], techName: string): number => {
  if (!portfolio.length) {
    return 6; // fallback ~6 miesięcy na start
  }

  // Zbierz wszystkie zakresy dat, gdzie technologia była używana
  const dateRanges: Array<{ start: Date; end: Date }> = [];

  const now = new Date();
  portfolio.forEach((project) => {
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
      if (start < end) {
        dateRanges.push({ start, end });
      }
    }
  });

  if (dateRanges.length === 0) return 6; // fallback jeśli brak danych

  // Sortuj zakresy po dacie rozpoczęcia
  dateRanges.sort((a, b) => a.start.getTime() - b.start.getTime());

  // Połącz overlapping zakresy
  const mergedRanges: Array<{ start: Date; end: Date }> = [];
  for (const range of dateRanges) {
    if (mergedRanges.length === 0) {
      mergedRanges.push(range);
    } else {
      const lastMerged = mergedRanges[mergedRanges.length - 1];
      if (range.start <= lastMerged.end) {
        // zakresy się pokrywają - połącz
        lastMerged.end = new Date(Math.max(lastMerged.end.getTime(), range.end.getTime()));
      } else {
        // nowy zakres
        mergedRanges.push(range);
      }
    }
  }

  // Policzy miesiące dla każdego połączonego zakresu i zaokrągli w górę
  let totalMonths = 0;
  for (const range of mergedRanges) {
    const diffMs = range.end.getTime() - range.start.getTime();
    const diffDays = Math.max(0, diffMs / (1000 * 60 * 60 * 24));
    const diffMonths = diffDays / 30.44;
    totalMonths += Math.ceil(Math.max(0.01, diffMonths)); // zaokrągli w górę, minimum 1 dzień
  }

  return Math.max(1, totalMonths);
};

// Dynamiczne wyliczenie umiejętności na podstawie portfolo
export const calculateDynamicSkills = (portfolio: PortfolioItem[]): Skill[] => {
  if (!portfolio.length) {
    return skillsData; // fallback do statycznych danych
  }

  // Zlicz wystąpienia technologii w portfolio - każdą technologię liczymy tylko raz per projekt
  const techCounts: Record<string, number> = {};

  portfolio.forEach((project) => {
    // Use Set to ensure each technology is counted only once per project (ignore duplicates in tags)
    const uniqueTags = new Set(project.tags.map(tag =>
      // Normalize tag names for counting
      Object.keys(techToCategoryMap).find(
        (tech) =>
          tech.toLowerCase() === tag.toLowerCase() ||
          tag.toLowerCase().includes(tech.toLowerCase())
      ) || tag
    ));

    uniqueTags.forEach((normalizedTag) => {
      techCounts[normalizedTag] = (techCounts[normalizedTag] || 0) + 1;
    });
  });

  // Convert to skills with dynamic levels and experience months
  const totalProjects = portfolio.length;
  const skills: Skill[] = Object.entries(techCounts)
    .map(([techName, count]) => {
      const category = techToCategoryMap[techName] || 'frontEnd';
      // Procent wystąpienia w projektach (bez minimum) - teraz count oznacza liczbę projektów używających danej technologii
      const projectPercentage = (count / totalProjects) * 100;
      const level = Math.round(projectPercentage); // Bez minimalnego progu, zawsze <= 100
      // Rzeczywiste miesiące doświadczenia na podstawie zakresów dat
      const experienceMonths = calculateSkillExperienceMonths(portfolio, techName);

      return {
        id: techName.toLowerCase().replace(/\s+/g, '-'),
        name: techName,
        level,
        category,
        experienceMonths,
      };
    })
    .sort((a, b) => b.level - a.level); // Sort by level descending

  return skills;
};

// Dynamiczne wyliczenie dystrybucji technologii (te same co w paskach umiejętności)
export const calculateDynamicTechStack = (portfolio: PortfolioItem[]) => {
  if (!portfolio.length) {
    return techStackData; // fallback do statycznych danych
  }

  // Use same time window as trends: last 12 months vs previous 12 months for accurate comparison
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000); // ~12 miesięcy temu

  const recentProjects = portfolio.filter(
    (p) => p.dateFrom && new Date(p.dateFrom) >= twelveMonthsAgo
  );

  if (recentProjects.length === 0) {
    return techStackData; // fallback if no recent projects
  }

  // Filter out MDX and collect project counts for each technology
  const techCounts: Record<string, number> = {};
  const totalRecentProjects = recentProjects.length;

  recentProjects.forEach((project) => {
    project.tags.forEach((tag) => {
      // Skip MDX technology
      if (tag.toLowerCase().includes('mdx')) {
        return; // skip this tag
      }

      // Normalize tag names for counting
      const normalizedTag =
        Object.keys(techToCategoryMap).find(
          (tech) =>
            tech.toLowerCase() === tag.toLowerCase() ||
            tag.toLowerCase().includes(tech.toLowerCase())
        ) || tag;

      techCounts[normalizedTag] = (techCounts[normalizedTag] || 0) + 1;
    });
  });

  // Convert to chart data - top 6 most used technologies by project count
  const chartData = Object.entries(techCounts)
    .map(([techName, projectCount], index) => {
      // Filter to only frontend and backend technologies for display
      const category = techToCategoryMap[techName] || 'frontEnd';
      const shouldShow = category === 'frontEnd' || category === 'backEnd';

      if (!shouldShow) return null;

      const percentage = Math.round((projectCount / totalRecentProjects) * 100);
      const colors = [
        'rgba(99, 102, 241, 0.8)', // indigo (blue) - Frontend
        'rgba(139, 92, 246, 0.8)', // purple - Backend
        'rgba(6, 182, 212, 0.8)', // cyan - Frontend
        'rgba(16, 185, 129, 0.8)', // emerald - Backend
        'rgba(245, 158, 11, 0.8)', // amber (yellow) - Frontend
        'rgba(244, 63, 94, 0.8)', // rose (pink) - Backend
      ];
      const color = colors[index % colors.length];

      return {
        id: techName.toLowerCase().replace(/\s+/g, '-'),
        namePl: techName,
        nameEn: techName,
        percentage,
        color,
      };
    })
    .filter(Boolean) as Array<{
      id: string;
      namePl: string;
      nameEn: string;
      percentage: number;
      color: string;
    }>;

  // Sort by percentage (most used first) and take top 10 (not just 6, to see more technologies properly)
  const sortedData = chartData
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 10); // Increased from 6 to 10 to show more technologies

  return sortedData.length > 0 ? sortedData : techStackData;
};

// Funkcja do formatowania czasu doświadczenia z tłumaczeniami
export const formatExperienceTime = async (
  totalMonths: number,
  locale: string = 'pl'
): Promise<string> => {
  if (totalMonths <= 0) return locale === 'en' ? '0 months' : '0 mies.';

  try {
    // Dynamiczny import tłumaczeń na podstawie lokalizacji
    const messages =
      locale === 'en'
        ? await import('../i18n/messages/en.json').then((m) => m.default)
        : await import('../i18n/messages/pl.json').then((m) => m.default);

    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    if (years === 0) {
      // Tylko miesiące (<= 11)
      const monthsKey = months === 1 ? 'one' : months >= 2 && months <= 4 ? 'few' : 'many';
      const monthsForm = messages.skills.months_form[monthsKey];
      return messages.skills.experience_format.months_only
        .replace('{months}', months.toString())
        .replace('{months_form}', monthsForm);
    }

    if (months === 0) {
      // Tylko lata (bez miesięcy)
      const yearsKey = years === 1 ? 'one' : years >= 2 && years <= 4 ? 'few' : 'many';
      const yearsForm = messages.skills.years_form[yearsKey];
      return messages.skills.experience_format.years_only
        .replace('{years}', years.toString())
        .replace('{years_form}', yearsForm);
    }

    // Lata i miesiące
    const yearsKey = years === 1 ? 'one' : years >= 2 && years <= 4 ? 'few' : 'many';
    const yearsForm = messages.skills.years_form[yearsKey];

    const monthsKey = months === 1 ? 'one' : months >= 2 && months <= 4 ? 'few' : 'many';
    const monthsForm = messages.skills.months_form[monthsKey];

    return messages.skills.experience_format.years_and_months
      .replace('{years}', years.toString())
      .replace('{years_form}', yearsForm)
      .replace('{months}', months.toString())
      .replace('{months_form}', monthsForm);
  } catch (error) {
    // Fallback na angielski jeśli błędy tłumaczeń
    const fallbackYears = Math.floor(totalMonths / 12);
    const fallbackMonths = totalMonths % 12;
    if (fallbackYears === 0) return `${fallbackMonths} month${fallbackMonths !== 1 ? 's' : ''}`;
    if (fallbackMonths === 0) return `${fallbackYears} year${fallbackYears !== 1 ? 's' : ''}`;
    return `${fallbackYears} year${fallbackYears !== 1 ? 's' : ''} and ${fallbackMonths} month${fallbackMonths !== 1 ? 's' : ''}`;
  }
};

// Funkcja do formatowania procentów z zapewnieniem prawidłowego wyświetlania
export const formatPercentage = (percentage: number): string => {
  // Upewnij się że procent jest prawidłowy (0-100)
  const validPercentage = Math.max(0, Math.min(100, Math.round(percentage)));
  return `${validPercentage}%`;
};

// funkcje pomocnicze (zachowane dla kompatybilności)
export const getSkillsByCategory = (category: Skill['category'], skills?: Skill[]): Skill[] => {
  const data = skills || skillsData;
  return data.filter((skill) => skill.category === category);
};

export const getSkillCategories = (): Skill['category'][] => {
  return ['frontEnd', 'backEnd', 'database', 'devops'];
};

export const getTotalSkillCategories = (skills?: Skill[]): Record<string, number> => {
  const data = skills || skillsData;
  return data.reduce(
    (acc, skill) => {
      acc[skill.category] = (acc[skill.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
};
