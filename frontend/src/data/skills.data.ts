// Types
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

// Lookup table for standardized technology names (preserve canonical capitalization).
// Static mapping of technologies to skill categories.
// Hardcoded map derived from localization data for stable behavior.
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

// Helper function used to expose the tech-to-category mapping.
const createTechToCategoryMap = (): Record<string, Skill['category']> => {
  return techMap;
};

// Lookup table for canonical technology display names.
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
  jQuery: 'jQuery',
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

// Normalize technology names using the lookup table with a Title Case fallback.
const normalizeTechName = (tech: string): string => {
  const lowerTech = tech.toLowerCase().replace(/\s+/g, ' ').trim();

  // 1) Try the canonical lookup table first.
  if (techNameMap[lowerTech]) {
    return techNameMap[lowerTech];
  }

  // 2) For unknown technologies, apply smart Title Case normalization.
  // Convert each token to Title Case, keeping suffixes like .js or .net intact.
  const words = tech.trim().split(/\s+/);

  const normalizedWords = words.map((word) => {
    // Handle single-dot tokens (.js, .net): capitalize only the prefix.
    if (
      word.includes('.') &&
      word.indexOf('.') === word.lastIndexOf('.') &&
      !word.startsWith('.')
    ) {
      // Example: Next.js -> capitalize only the "Next" prefix.
      const [prefix, suffix] = word.split('.');
      return prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase() + '.' + suffix;
    } else {
      // Default Title Case path.
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
  });

  return normalizedWords.join(' ');
};

const techToCategoryMap = createTechToCategoryMap();

// Calculate real experience months from project date ranges.
const calculateSkillExperienceMonths = (portfolio: PortfolioItem[], techName: string): number => {
  if (!portfolio.length) {
    return 6; // Fallback: assume ~6 months when no portfolio data is available.
  }

  // Collect all date ranges where this technology appears.
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

  if (dateRanges.length === 0) return 6; // Fallback when no matching date ranges are found.

  // Sort ranges by start date.
  dateRanges.sort((a, b) => a.start.getTime() - b.start.getTime());

  // Merge overlapping ranges.
  const mergedRanges: Array<{ start: Date; end: Date }> = [];
  for (const range of dateRanges) {
    if (mergedRanges.length === 0) {
      mergedRanges.push(range);
    } else {
      const lastMerged = mergedRanges[mergedRanges.length - 1];
      if (range.start <= lastMerged.end) {
        // Ranges overlap -> merge into one.
        lastMerged.end = new Date(Math.max(lastMerged.end.getTime(), range.end.getTime()));
      } else {
        // Non-overlapping range -> append.
        mergedRanges.push(range);
      }
    }
  }

  // Sum months across merged ranges and round up.
  let totalMonths = 0;
  for (const range of mergedRanges) {
    const diffMs = range.end.getTime() - range.start.getTime();
    const diffDays = Math.max(0, diffMs / (1000 * 60 * 60 * 24));
    const diffMonths = diffDays / 30.44;
    totalMonths += Math.ceil(Math.max(0.01, diffMonths)); // Round up; enforce minimum non-zero duration.
  }

  return Math.max(1, totalMonths);
};

// Build skills dynamically from portfolio data.
export const calculateDynamicSkills = (portfolio: PortfolioItem[]): Skill[] => {
  if (!portfolio.length) {
    return skillsData; // Fallback to static data.
  }

  // Count technology usage; each technology is counted once per project.
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
      // Percentage of projects using this technology (no minimum clamp).
      const projectPercentage = (count / totalProjects) * 100;
      const level = Math.round(projectPercentage); // Bez minimalnego progu, zawsze <= 100
      // Real experience months inferred from date ranges.
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

// Build portfolio categories dynamically from project tags.
export const calculatePortfolioCategories = (portfolio: PortfolioItem[]) => {
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

  // Collect category mentions from portfolio records.
  const categoryCounts: Record<string, number> = {};
  portfolio.forEach((project) => {
    const categoryString = project.category?.toString() || '';
    if (categoryString) {
      const categoryParts = categoryString.split(',').map((cat) => cat.trim().toLowerCase());
      categoryParts.forEach((category) => {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });
    }
  });

  // Color mapping for known category keys.
  const categoryColors: Record<string, string> = {
    'web-app': 'rgba(236, 72, 153, 0.8)', // vivid pink
    'web app': 'rgba(236, 72, 153, 0.8)', // vivid pink
    webapp: 'rgba(236, 72, 153, 0.8)', // vivid pink
    web: 'rgba(236, 72, 153, 0.8)', // vivid pink
    'landing page': 'rgba(34, 197, 94, 0.8)', // green
    landing: 'rgba(34, 197, 94, 0.8)', // green
    ai: 'rgba(168, 85, 247, 0.8)', // violet
    'mobile-apps': 'rgba(6, 182, 212, 0.8)', // cyan
    'mobile apps': 'rgba(6, 182, 212, 0.8)', // cyan
    mobile: 'rgba(6, 182, 212, 0.8)', // cyan
    'mobile-app': 'rgba(6, 182, 212, 0.8)', // cyan
    services: 'rgba(251, 191, 36, 0.8)', // yellow
    ecommerce: 'rgba(59, 130, 246, 0.8)', // blue
    'web app, services': 'rgba(16, 185, 129, 0.8)', // turquoise for mixed web/service projects
  };

  // Fallback palette for unknown categories.
  const fallbackColors = [
    'rgba(156, 163, 175, 0.8)', // gray
    'rgba(245, 158, 11, 0.8)', // dark yellow
    'rgba(59, 130, 246, 0.8)', // light blue
    'rgba(16, 185, 129, 0.8)', // dark green
    'rgba(236, 72, 153, 0.8)', // pink
    'rgba(139, 69, 19, 0.8)', // brown
  ];

  // Canonical translations for most common category names.
  const categoryTranslations: Record<
    string,
    { namePl: string; nameEn: string; descriptionPl: string; descriptionEn: string }
  > = {
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

  const totalCategoryMentions = Object.values(categoryCounts).reduce(
    (sum: number, count: number) => sum + count,
    0
  );

  // Build category entries for each discovered key.
  const categories = Object.entries(categoryCounts).map(([categoryKey, count], index) => {
    const normalizedKey = categoryKey.toLowerCase();

    // Resolve color from predefined mapping, then fallback palette.
    const color = categoryColors[normalizedKey] || fallbackColors[index % fallbackColors.length];

    // Resolve translations from predefined mapping, then generate generic labels.
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

  // Sort by percentage descending.
  return categories
    .filter((cat: any) => cat.percentage >= 0.01)
    .sort((a, b) => b.percentage - a.percentage);
};

// Fallback placeholder for builds with no computed skills.
export const skillsData: Skill[] = [];

// Helper functions for category/skill formatting.
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
