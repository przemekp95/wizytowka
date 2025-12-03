// Typy
export interface Skill {
  id: string;
  name: string;
  level: number;
  projectCount: number;
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

// Lookup table dla standardowych nazw technologii (zachowaj oryginalną kapitalizację)
// Stałe statyczna mapa technologii na kategorie
// Zakodowane mapowanie na podstawie tłumaczeń pl.json dla reliability
const techMap: Record<string, Skill['category']> = {
  // Frontend
  'Next.js': 'frontEnd',
  Nextjs: 'frontEnd',
  React: 'frontEnd',
  TypeScript: 'frontEnd',
  JavaScript: 'frontEnd',
  'Tailwind CSS': 'frontEnd',
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

  // DevOps
  Docker: 'devops',
  Dockerfile: 'devops',
  Kubernetes: 'devops',
  AWS: 'devops',
  'Google Cloud': 'devops',
  Azure: 'devops',
  Vercel: 'devops',
  Render: 'devops',
  Heroku: 'devops',
  Trivy: 'devops',
};

// Funkcja helper do stworzenia techToCategoryMap
const createTechToCategoryMap = (): Record<string, Skill['category']> => {
  return techMap;
};

// Lookup table dla standardowych nazw technologii (zachowaj oryginalną kapitalizację)
const techNameMap: Record<string, string> = {
  // Frontend
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  'next.js': 'Next.js',
  nextjs: 'Next.js',
  NextJS: 'Next.js',
  js: 'JavaScript',
  ts: 'TypeScript',
  react: 'React',
  vue: 'Vue.js',
  angular: 'Angular',
  svelte: 'Svelte',
  jquery: 'jQuery',
  'jQuery': 'jQuery',
  tailwind: 'Tailwind CSS',
  tailwindcss: 'Tailwind CSS',
  TailwindCSS: 'Tailwind CSS',
  'Tailwind CSS': 'Tailwind CSS',
  bootstrap: 'Bootstrap',
  sass: 'SCSS',
  scss: 'SCSS',
  SCSS: 'SCSS',
  css: 'CSS',
  CSS: 'CSS',
  html: 'HTML',
  HTML: 'HTML',
  threejs: 'Three.js',
  'three.js': 'Three.js',
  gsap: 'GSAP',
  framer: 'Framer Motion',
  'framer-motion': 'Framer Motion',
  mui: 'MUI',
  'Material-UI': 'MUI',

  // Backend
  php: 'PHP',
  PHP: 'PHP',
  'node.js': 'Node.js',
  nodejs: 'Node.js',
  Nodejs: 'Node.js',
  'Node.js': 'Node.js',
  node: 'Node.js',
  nestjs: 'NestJS',
  NestJS: 'NestJS',
  'nest.js': 'NestJS',
  express: 'Express',
  laravel: 'Laravel',
  Laravel: 'Laravel',
  symfony: 'Symfony',
  python: 'Python',
  Python: 'Python',
  java: 'Java',
  kotlin: 'Kotlin',

  // Databases
  mysql: 'MySQL',
  MySQL: 'MySQL',
  postgresql: 'PostgreSQL',
  PostgreSQL: 'PostgreSQL',
  postgres: 'PostgreSQL',
  mongodb: 'MongoDB',
  MongoDB: 'MongoDB',
  redis: 'Redis',
  Redis: 'Redis',
  sqlite: 'SQLite',
  firebase: 'Firebase',
  supabase: 'Supabase',
  prisma: 'Prisma',
  drizzle: 'Drizzle',
  typeorm: 'TypeORM',
  sequelize: 'Sequelize',
  mongoose: 'Mongoose',
  nosql: 'NoSQL',
  NoSQL: 'NoSQL',
  sql: 'SQL',
  SQL: 'SQL',

  // DevOps/Cloud
  docker: 'Docker',
  Dockerfile: 'Dockerfile',
  kubernetes: 'Kubernetes',
  k8s: 'Kubernetes',
  aws: 'AWS',
  azure: 'Azure',
  gcp: 'GCP',
  'Google Cloud': 'GCP',
  vercel: 'Vercel',
  render: 'Render',
  heroku: 'Heroku',
  gitlab: 'GitLab',
  github: 'GitHub',
  'github actions': 'GitHub Actions',
  'ci/cd': 'CI/CD',
  cicd: 'CI/CD',
  'CI/CD': 'CI/CD',
  jenkins: 'Jenkins',
  cypress: 'Cypress',
  Cypress: 'Cypress',
  playwright: 'Playwright',
  Playwright: 'Playwright',
  jest: 'Jest',
  Jest: 'Jest',
  vitest: 'Vitest',
  'testing library': 'Testing Library',
  'react testing library': 'React Testing Library',
  trivy: 'Trivy',
  Trivy: 'Trivy',

  // Other
  graphql: 'GraphQL',
  'GraphQL API': 'GraphQL',
  'REST API': 'REST',
  rest: 'REST',
  websockets: 'WebSockets',
  oauth: 'OAuth',
  oath2: 'OAuth2',
  OAuth2: 'OAuth2',
  jwt: 'JWT',
  JWT: 'JWT',
  wordpress: 'WordPress',
  WordPress: 'WordPress',
  woocommerce: 'WooCommerce',
  shopify: 'Shopify',
  figma: 'Figma',
  sketch: 'Sketch',
  'adobe xd': 'Adobe XD',
  photoshop: 'Photoshop',
  illustrator: 'Illustrator',
  seo: 'SEO',
  SEO: 'SEO',
  analytics: 'Analytics',
  redux: 'Redux',
  Redux: 'Redux',
  'redux saga': 'Redux Saga',
  'Redux Saga': 'Redux Saga',
  'redux toolkit': 'Redux Toolkit',
  'Redux Toolkit': 'Redux Toolkit',
  blockchain: 'Blockchain',
  bullmq: 'BullMQ',
  bullMQ: 'BullMQ',
  BullMQ: 'BullMQ',
  'ui components': 'UI Components',
  'ui Components': 'UI Components',
  'UI Components': 'UI Components',
  'open graph': 'Open Graph',
  'Open Graph': 'Open Graph',
  nodemailer: 'Nodemailer',
  twig: 'Twig',
  Twig: 'Twig',
  vite: 'Vite',
  Vite: 'Vite',
  blade: 'Blade',
  Blade: 'Blade',
  mdx: 'MDX',
  MDX: 'MDX',
  microservices: 'Microservices',
  Microservices: 'Microservices',
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
    const uniqueTags = new Set(project.tags);

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
        name: techName, // Use exact tag name from portfolio
        level, // Keeping level as percentage for backward compatibility
        projectCount: count, // Number of projects using this technology
        category,
        experienceMonths,
      };
    })
    .sort((a, b) => b.level - a.level); // Sort by level descending

  return skills;
};

// Dynamiczne tworzenie kategorii na podstawie tagów z portfolio
export const calculatePortfolioCategories = (portfolio: PortfolioItem[]) => {
  // Debugowanie włączone tylko w development
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Portfolio categories calculation: portfolio items =', portfolio.length);
  }

  // Sprawdź czy jesteśmy w trybie produkcyjnym
  console.log('🚀 APP ENVIRONMENT: NODE_ENV =', process.env.NODE_ENV || 'undefined');

  if (!portfolio.length) {
    return [
      {
        id: 'web-app',
        namePl: 'Aplikacje webowe',
        nameEn: 'Web Applications',
        percentage: 60,
        color: 'rgba(99, 102, 241, 0.8)',
        descriptionPl: 'Pełnofunkcjonalne aplikacje internetowe',
        descriptionEn: 'Full-featured web applications',
      },
    ];
  }

  // Zbierz wszystkie unikalne kategorie z portfolio
  const categoryCounts: Record<string, number> = {};
  portfolio.forEach((project) => {
    const categoryString = project.category?.toString() || '';
    if (categoryString) {
      const categoryParts = categoryString.split(',').map(cat => cat.trim().toLowerCase());
      categoryParts.forEach((category) => {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });
    }
  });


  // Definiuj kolory dla wszystkich rzeczywistych kategorii z portfolio
  const categoryColors: Record<string, string> = {
    'web-app': 'rgba(236, 72, 153, 0.8)',       // FIXED! HOT PINK - SUPER ładny i żywy kolor dla web apps 🔥
    'web app': 'rgba(236, 72, 153, 0.8)',      // HOT PINK - SUPER ładny i żywy kolor dla web apps 🔥
    webapp: 'rgba(236, 72, 153, 0.8)',         // HOT PINK - SUPER ładny i żywy kolor dla web apps 🔥
    web: 'rgba(236, 72, 153, 0.8)',            // HOT PINK - SUPER ładny i żywy kolor dla web apps 🔥
    'landing page': 'rgba(34, 197, 94, 0.8)',  // zielony 🌿
    landing: 'rgba(34, 197, 94, 0.8)',         // zielony 🌿
    ai: 'rgba(168, 85, 247, 0.8)',              // fioletowy 🟣
    'mobile-apps': 'rgba(239, 68, 68, 0.8)',   // czerwony 🔥
    'mobile apps': 'rgba(239, 68, 68, 0.8)',   // czerwony 🔥
    mobile: 'rgba(239, 68, 68, 0.8)',           // czerwony 🔥
    services: 'rgba(251, 191, 36, 0.8)',        // żółty ☀️
    ecommerce: 'rgba(59, 130, 246, 0.8)',       // niebieski 🌊
    'web app, services': 'rgba(16, 185, 129, 0.8)', // turkus - dla projektów łączących web-app i services 🔗
  };

  // Palette kolorów dla nieznanych kategorii
  const fallbackColors = [
    'rgba(156, 163, 175, 0.8)', // szary
    'rgba(245, 158, 11, 0.8)',  // ciemny żółty
    'rgba(59, 130, 246, 0.8)',   // jasny niebieski
    'rgba(16, 185, 129, 0.8)',   // ciemny zielony
    'rgba(236, 72, 153, 0.8)',   // różowy
    'rgba(139, 69, 19, 0.8)',    // brązowy
  ];

  // Najpierw tłumaczenia dla najczęściej używanych kategorii
  const categoryTranslations: Record<string, { namePl: string; nameEn: string; descriptionPl: string; descriptionEn: string }> = {
    'web-app': {
      namePl: 'Aplikacje Webowe',
      nameEn: 'Web Applications',
      descriptionPl: 'Pełnofunkcjonalne aplikacje internetowe',
      descriptionEn: 'Full-featured web applications',
    },
    'web app': {
      namePl: 'Aplikacje Webowe',
      nameEn: 'Web Applications',
      descriptionPl: 'Pełnofunkcjonalne aplikacje internetowe',
      descriptionEn: 'Full-featured web applications',
    },
    webapp: {
      namePl: 'Aplikacje Webowe',
      nameEn: 'Web Applications',
      descriptionPl: 'Pełnofunkcjonalne aplikacje internetowe',
      descriptionEn: 'Full-featured web applications',
    },
    web: {
      namePl: 'Aplikacje Webowe',
      nameEn: 'Web Applications',
      descriptionPl: 'Pełnofunkcjonalne aplikacje internetowe',
      descriptionEn: 'Full-featured web applications',
    },
    'landing page': {
      namePl: 'Strony Landingowe',
      nameEn: 'Landing Pages',
      descriptionPl: 'Strony reklamowe i produktowe',
      descriptionEn: 'Promotional and product pages',
    },
    landing: {
      namePl: 'Strony Landingowe',
      nameEn: 'Landing Pages',
      descriptionPl: 'Strony reklamowe i produktowe',
      descriptionEn: 'Promotional and product pages',
    },
    'landing-page': {
      namePl: 'Strony Landingowe',
      nameEn: 'Landing Pages',
      descriptionPl: 'Strony reklamowe i produktowe',
      descriptionEn: 'Promotional and product pages',
    },
    landingpage: {
      namePl: 'Strony Landingowe',
      nameEn: 'Landing Pages',
      descriptionPl: 'Strony reklamowe i produktowe',
      descriptionEn: 'Promotional and product pages',
    },
    ai: {
      namePl: 'Rozwiązania AI',
      nameEn: 'AI Solutions',
      descriptionPl: 'Aplikacje zintegrowane ze sztuczną inteligencją',
      descriptionEn: 'Applications integrated with artificial intelligence',
    },
    'e-commerce': {
      namePl: 'E-commerce',
      nameEn: 'E-commerce',
      descriptionPl: 'Platformy handlu elektronicznego',
      descriptionEn: 'Electronic commerce platforms',
    },
    ecommerce: {
      namePl: 'E-commerce',
      nameEn: 'E-commerce',
      descriptionPl: 'Platformy handlu elektronicznego',
      descriptionEn: 'Electronic commerce platforms',
    },
    mobile: {
      namePl: 'Aplikacje Mobilne',
      nameEn: 'Mobile Applications',
      descriptionPl: 'Aplikacje na urządzenia mobilne',
      descriptionEn: 'Mobile device applications',
    },
  };

  const totalCategoryMentions = Object.values(categoryCounts)
    .reduce((sum: number, count: number) => sum + count, 0);

  // Utwórz kategorie dla każdej znalezionej kategorii
  const categories = Object.entries(categoryCounts).map(([categoryKey, count], index) => {
    const normalizedKey = categoryKey.toLowerCase();

    // Wybierz kolor - najpierw predefined, potem z palette
    const color = categoryColors[normalizedKey] ||
                  fallbackColors[index % fallbackColors.length];



    // Tłumaczenia - najpierw predefined, potem generyczne z tytułu
    const translation = categoryTranslations[normalizedKey] || {
      namePl: categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1),
      nameEn: categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1),
      descriptionPl: `Projekty w kategorii: ${categoryKey}`,
      descriptionEn: `Projects in category: ${categoryKey}`,
    };

    return {
      id: normalizedKey.replace(/\s+/g, '-'),
      namePl: translation.namePl,
      nameEn: translation.nameEn,
      percentage: (count / totalCategoryMentions) * 100,
      color: color,
      descriptionPl: translation.descriptionPl,
      descriptionEn: translation.descriptionEn,
    };
  });

  // Posortuj wg procentu (malejąco)
  return categories
    .filter((cat: any) => cat.percentage >= 0.01)
    .sort((a, b) => b.percentage - a.percentage);
};

// Stała fallback nazwa dla technologii bez doświadczeniem
export const skillsData: Skill[] = [];

// Funkcje pomocnicze dla formatowania
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
