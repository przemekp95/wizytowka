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

// Stan umiejętności - fallback do pracy jako prezentacja gdy nie ma portfolio
// Wszystkie umiejętności są generowane dynamicznie z danych portfolio
export const skillsData: Skill[] = [];

// dane do wykresu kołowego rozkładu kompetencji
export const techStackData: TechStack[] = [
  {
    id: 'frontend',
    namePl: 'Frontend',
    nameEn: 'Frontend',
    percentage: 40,
    color: 'rgba(99, 102, 241, 0.8)', // indigo
  },
  {
    id: 'backend',
    namePl: 'Backend',
    nameEn: 'Backend',
    percentage: 35,
    color: 'rgba(139, 92, 246, 0.8)', // purple
  },
  {
    id: 'databases',
    namePl: 'Bazy danych',
    nameEn: 'Databases',
    percentage: 15,
    color: 'rgba(6, 182, 212, 0.8)', // cyan
  },
  {
    id: 'devops',
    namePl: 'DevOps',
    nameEn: 'DevOps',
    percentage: 10,
    color: 'rgba(16, 185, 129, 0.8)', // emerald
  },
];

// Dynamic mapowanie technologii z tłumaczeń About Me sekcji
const createTechToCategoryMap = (): Record<string, Skill['category']> => {
  try {
    // Czytamy tłumaczeń polskiego (source of truth)
    const plMessages = require('../i18n/messages/pl.json').default ||
                       require('../i18n/messages/pl.json');

    // Mapa kategorii: klucz_tłumaczenia -> typ_kategorii
    const categoryMapping: Record<string, Skill['category']> = {
      'frontend': 'frontEnd',
      'backend': 'backEnd',
      'databases': 'database',
      'devops': 'devops'
    };

    const result: Record<string, Skill['category']> = {};

    // Dla każdej kategorii, wyciągnij technologie z tłumaczeń
    Object.entries(categoryMapping).forEach(([translationKey, categoryType]) => {
      const techStackText = plMessages.about?.[translationKey];
      if (techStackText) {
        // Rozbij text na technologie: "Next.js / React / ... TypeScript"
        const technologies = parseTechStackString(techStackText);

        // Każda technologia -> kategoria
        technologies.forEach(tech => {
          result[tech] = categoryType;
        });
      }
    });

    return result;
  } catch (error) {
    console.warn('Could not load i18n for dynamic categorization, using empty map');
    return {};
  }
};

// Lookup table dla standardowych nazw technologii (zachowaj oryginalną kapitalizację)
const techNameMap: Record<string, string> = {
  // Frontend
  'javascript': 'JavaScript',
  'typescript': 'TypeScript',
  'next.js': 'Next.js',
  'nextjs': 'Next.js',
  'js': 'JavaScript',
  'ts': 'TypeScript',
  'react': 'React',
  'vue': 'Vue.js',
  'angular': 'Angular',
  'svelte': 'Svelte',
  'jquery': 'jQuery',
  'tailwind': 'Tailwind CSS',
  'tailwindcss': 'Tailwind CSS',
  'bootstrap': 'Bootstrap',
  'sass': 'SCSS',
  'scss': 'SCSS',
  'css': 'CSS',
  'html': 'HTML',
  'threejs': 'Three.js',
  'three.js': 'Three.js',
  'gsap': 'GSAP',
  'framer': 'Framer Motion',
  'framer-motion': 'Framer Motion',

  // Backend
  'php': 'PHP',
  'node.js': 'Node.js',
  'nodejs': 'Node.js',
  'node': 'Node.js',
  'nestjs': 'NestJS',
  'nest.js': 'NestJS',
  'express': 'Express',
  'laravel': 'Laravel',
  'symfony': 'Symfony',
  'django': 'Django',
  'flask': 'Flask',
  'spring': 'Spring Boot',
  'springboot': 'Spring Boot',
  'asp.net': 'ASP.NET',
  'dotnet': 'ASP.NET',
  '.net': '.NET',
  'ruby': 'Ruby',
  'rails': 'Ruby on Rails',
  'ror': 'Ruby on Rails',
  'go': 'Go',
  'golang': 'Go',
  'python': 'Python',
  'java': 'Java',
  'kotlin': 'Kotlin',
  'scala': 'Scala',

  // Databases
  'mysql': 'MySQL',
  'postgresql': 'PostgreSQL',
  'postgres': 'PostgreSQL',
  'mongodb': 'MongoDB',
  'redis': 'Redis',
  'sqlite': 'SQLite',
  'firebase': 'Firebase',
  'supabase': 'Supabase',
  'prisma': 'Prisma',
  'drizzle': 'Drizzle',
  'typeorm': 'TypeORM',
  'sequelize': 'Sequelize',
  'mongoose': 'Mongoose',
  'nosql': 'NoSQL',
  'sql': 'SQL',

  // DevOps/Cloud
  'docker': 'Docker',
  'kubernetes': 'Kubernetes',
  'k8s': 'Kubernetes',
  'aws': 'AWS',
  'azure': 'Azure',
  'gcp': 'Google Cloud',
  'google cloud': 'Google Cloud',
  'vercel': 'Vercel',
  'render': 'Render',
  'heroku': 'Heroku',
  'gitlab': 'GitLab',
  'github': 'GitHub',
  'github actions': 'GitHub Actions',
  'ci/cd': 'CI/CD',
  'cicd': 'CI/CD',
  'jenkins': 'Jenkins',
  'webdriver': 'Wetherby Driver',
  'selenium': 'Selenium',
  'cypress': 'Cypress',
  'playwright': 'Playwright',
  'jest': 'Jest',
  'vitest': 'Vitest',
  'testing-library': 'Testing Library',
  'react testing library': 'React Testing Library',

  // Other
  'graphql': 'GraphQL',
  'rest': 'REST',
  'websockets': 'WebSockets',
  'oauth': 'OAuth',
  'jwt': 'JWT',
  'wordpress': 'WordPress',
  'woocommerce': 'WooCommerce',
  'shopify': 'Shopify',
  'figma': 'Figma',
  'sketch': 'Sketch',
  'adobe xd': 'Adobe XD',
  'photoshop': 'Photoshop',
  'illustrator': 'Illustrator'
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

  const normalizedWords = words.map(word => {
    // Obsługa specjalnych przypadków (.js, .net, numbers, etc.)
    if (word.includes('.') && word.indexOf('.') === word.lastIndexOf('.') && !word.startsWith('.')) {
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
    .filter(part => !part.includes('(') && part.trim().length > 0)
    .join(' ')
    .split(/[/,]/) // Potem dziel po slash/przecinek
    .map(tech => tech.trim())
    .filter(tech => tech.length > 0)

    // Normalizacja używając lookup table (zachowaj właściwą kapitalizację)
    .map(normalizeTechName)

    // Czyść spacje i filtry
    .filter(tech => tech.length > 1 && !/^\s*$/.test(tech));

  return parts;
};

const techToCategoryMap = createTechToCategoryMap();

type PortfolioItem = {
  tags: string[];
  dateFrom?: Date;
  dateTo?: Date;
};



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

  // Zlicz wystąpienia technologii w portfolio
  const techCounts: Record<string, number> = {};

  portfolio.forEach((project) => {
    project.tags.forEach((tag) => {
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

  // Convert to skills with dynamic levels and experience months
  const totalProjects = portfolio.length;
  const skills: Skill[] = Object.entries(techCounts)
    .map(([techName, count]) => {
      const category = techToCategoryMap[techName] || 'frontEnd';
      // Procent wystąpienia w projektach (bez minimum)
      const projectPercentage = (count / totalProjects) * 100;
      const level = Math.round(projectPercentage); // Bez minimalnego progu
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

  // Użyj tych samych umiejętności co skill bars (pierwsze 12 posortowane po level)
  const dynamicSkills = calculateDynamicSkills(portfolio);
  const skillBarSkills = dynamicSkills.slice(0, 12); // dokładnie te same co w skill bars

  if (skillBarSkills.length === 0) {
    return techStackData;
  }

  // Sumuj wszystkie miesiące doświadczenia dla proporcjonalnego podziału
  const totalExperienceMonths = skillBarSkills.reduce((sum, skill) => sum + (skill.experienceMonths || 0), 0);

  // Stwórz dane wykresu na podstawie miesięcy doświadczenia (tych samych technologii)
  return skillBarSkills.map((skill, index) => {
    const percentage = Math.round(((skill.experienceMonths || 0) / totalExperienceMonths) * 100);
    const colors = [
      'rgba(99, 102, 241, 0.8)',   // indigo (blue)
      'rgba(139, 92, 246, 0.8)',   // purple
      'rgba(6, 182, 212, 0.8)',    // cyan
      'rgba(16, 185, 129, 0.8)',   // emerald (green)
      'rgba(245, 158, 11, 0.8)',   // amber (yellow)
      'rgba(244, 63, 94, 0.8)',    // rose (pink)
      'rgba(236, 72, 153, 0.8)',   // pink
      'rgba(34, 197, 94, 0.8)',    // green
      'rgba(251, 191, 36, 0.8)',   // yellow
      'rgba(168, 85, 247, 0.8)',   // violet
      'rgba(59, 130, 246, 0.8)',   // blue
      'rgba(239, 68, 68, 0.8)',    // red
    ];
    const color = colors[index % colors.length];

    return {
      id: skill.id,
      namePl: skill.name,
      nameEn: skill.name,
      percentage,
      color,
    };
  }).sort((a, b) => b.percentage - a.percentage);
};

// Funkcja do formatowania czasu doświadczenia z tłumaczeniami
export const formatExperienceTime = (
  totalMonths: number,
  locale: string = 'pl'
): string => {
  if (totalMonths <= 0) return locale === 'en' ? '0 months' : '0 mies.';

  try {
    // Import tłumaczeń na podstawie aktualnego lokalizacji
    const messages = locale === 'en'
      ? require('../i18n/messages/en.json').default || require('../i18n/messages/en.json')
      : require('../i18n/messages/pl.json').default || require('../i18n/messages/pl.json');

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
    if (years === 0) return `${months} month${months !== 1 ? 's' : ''}`;
    if (months === 0) return `${years} year${years !== 1 ? 's' : ''}`;
    return `${years} year${years !== 1 ? 's' : ''} and ${months} month${months !== 1 ? 's' : ''}`;
  }
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
