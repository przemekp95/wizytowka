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

// umiejętności technologiczne
export const skillsData: Skill[] = [
  {
    id: 'nextjs-react',
    name: 'Next.js / React',
    level: 95,
    category: 'frontEnd',
  },
  {
    id: 'typescript-js',
    name: 'TypeScript / JavaScript',
    level: 90,
    category: 'frontEnd',
  },
  {
    id: 'tailwind',
    name: 'Tailwind CSS',
    level: 88,
    category: 'frontEnd',
  },
  {
    id: 'nestjs-node',
    name: 'Node.js / NestJS',
    level: 85,
    category: 'backEnd',
  },
  {
    id: 'laravel-symfony',
    name: 'Laravel / Symfony',
    level: 80,
    category: 'backEnd',
  },
  {
    id: 'mysql-postgresql',
    name: 'MySQL / PostgreSQL',
    level: 82,
    category: 'database',
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    level: 75,
    category: 'database',
  },
  {
    id: 'docker-kubernetes',
    name: 'Docker / Kubernetes',
    level: 78,
    category: 'devops',
  },
  {
    id: 'aws-render',
    name: 'AWS / Render',
    level: 70,
    category: 'devops',
  },
];

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

// Automatyczna klasyfikacja technologii na podstawie słowa kluczowych z technology stack
const createTechToCategoryMap = (): Record<string, Skill['category']> => {
  const mappings: Array<{ tech: string; category: Skill['category'] }> = [
    // Frontend (based on: Next.js, React, TypeScript, Tailwind, CSS)
    { tech: 'Next.js', category: 'frontEnd' },
    { tech: 'React', category: 'frontEnd' },
    { tech: 'JavaScript', category: 'frontEnd' },
    { tech: 'TypeScript', category: 'frontEnd' },
    { tech: 'Tailwind', category: 'frontEnd' },
    { tech: 'Tailwind CSS', category: 'frontEnd' },
    { tech: 'CSS', category: 'frontEnd' },
    { tech: 'SCSS', category: 'frontEnd' },
    { tech: 'HTML', category: 'frontEnd' },
    { tech: 'Vite', category: 'frontEnd' },
    { tech: 'Sass', category: 'frontEnd' },

    // Backend (based on: NestJS, Node.js, GraphQL, REST API)
    { tech: 'Node.js', category: 'backEnd' },
    { tech: 'NestJS', category: 'backEnd' },
    { tech: 'Laravel', category: 'backEnd' },
    { tech: 'Symfony', category: 'backEnd' },
    { tech: 'PHP', category: 'backEnd' },
    { tech: 'Express', category: 'backEnd' },
    { tech: 'GraphQL', category: 'backEnd' },
    { tech: 'REST API', category: 'backEnd' },
    { tech: 'REST', category: 'backEnd' },
    { tech: 'API', category: 'backEnd' },
    { tech: 'JWT', category: 'backEnd' },
    { tech: 'Sessions', category: 'backEnd' },

    // Databases (based on: MongoDB, PostgreSQL, Prisma ORM)
    { tech: 'MySQL', category: 'database' },
    { tech: 'PostgreSQL', category: 'database' },
    { tech: 'MongoDB', category: 'database' },
    { tech: 'Prisma', category: 'database' },
    { tech: 'Prisma ORM', category: 'database' },
    { tech: 'SQL', category: 'database' },
    { tech: 'NoSQL', category: 'database' },

    // DevOps/Deployment (based on: Docker, Kubernetes, AWS, GitHub Actions)
    { tech: 'Docker', category: 'devops' },
    { tech: 'Kubernetes', category: 'devops' },
    { tech: 'AWS', category: 'devops' },
    { tech: 'Render', category: 'devops' },
    { tech: 'GitHub Actions', category: 'devops' },
    { tech: 'CI/CD', category: 'devops' },
    { tech: 'Passenger', category: 'devops' },
    { tech: 'Github', category: 'devops' },
    { tech: 'GitHub', category: 'devops' },
    { tech: 'AWS S3', category: 'devops' },
    { tech: 'SEO', category: 'devops' },
    { tech: 'hCaptcha', category: 'devops' },
  ];

  // Konwertuj na record mapę
  return mappings.reduce((map, { tech, category }) => {
    map[tech] = category;
    return map;
  }, {} as Record<string, Skill['category']>);
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

// Dynamiczne wyliczenie dystrybucji kategorii
export const calculateDynamicTechStack = (portfolio: PortfolioItem[]) => {
  if (!portfolio.length) {
    return techStackData; // fallback do statycznych danych
  }

  const categoryCounts: Record<Skill['category'], number> = {
    frontEnd: 0,
    backEnd: 0,
    database: 0,
    devops: 0,
  };

  let totalTechCount = 0;

  portfolio.forEach((project) => {
    project.tags.forEach((tag) => {
      const category =
        techToCategoryMap[tag] ||
        techToCategoryMap[
          Object.keys(techToCategoryMap).find((tech) =>
            tag.toLowerCase().includes(tech.toLowerCase())
          ) || 'frontEnd'
        ];

      if (category) {
        categoryCounts[category]++;
        totalTechCount++;
      }
    });
  });

  if (totalTechCount === 0) {
    return techStackData;
  }

  return [
    {
      id: 'frontend',
      namePl: 'Frontend',
      nameEn: 'Frontend',
      percentage: Math.round((categoryCounts.frontEnd / totalTechCount) * 100),
      color: 'rgba(99, 102, 241, 0.8)',
    },
    {
      id: 'backend',
      namePl: 'Backend',
      nameEn: 'Backend',
      percentage: Math.round((categoryCounts.backEnd / totalTechCount) * 100),
      color: 'rgba(139, 92, 246, 0.8)',
    },
    {
      id: 'databases',
      namePl: 'Bazy danych',
      nameEn: 'Databases',
      percentage: Math.round((categoryCounts.database / totalTechCount) * 100),
      color: 'rgba(6, 182, 212, 0.8)',
    },
    {
      id: 'devops',
      namePl: 'DevOps',
      nameEn: 'DevOps',
      percentage: Math.round((categoryCounts.devops / totalTechCount) * 100),
      color: 'rgba(16, 185, 129, 0.8)',
    },
  ].sort((a, b) => b.percentage - a.percentage);
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
