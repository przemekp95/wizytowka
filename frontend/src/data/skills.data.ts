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

// Mapowanie technologii na kategorie umiejętności
const techToCategoryMap: Record<string, Skill['category']> = {
  // Frontend
  'Next.js': 'frontEnd',
  'React': 'frontEnd',
  'JavaScript': 'frontEnd',
  'TypeScript': 'frontEnd',
  'Tailwind': 'frontEnd',
  'CSS': 'frontEnd',
  'SCSS': 'frontEnd',
  'HTML': 'frontEnd',
  'Vite': 'frontEnd',

  // Backend
  'Node.js': 'backEnd',
  'NestJS': 'backEnd',
  'Laravel': 'backEnd',
  'Symfony': 'backEnd',
  'PHP': 'backEnd',
  'Express': 'backEnd',
  'GraphQL': 'backEnd',
  'REST API': 'backEnd',
  'API': 'backEnd',

  // Databases
  'MySQL': 'database',
  'PostgreSQL': 'database',
  'MongoDB': 'database',
  'Prisma': 'database',
  'SQL': 'database',
  'NoSQL': 'database',

  // DevOps
  'Docker': 'devops',
  'Kubernetes': 'devops',
  'AWS': 'devops',
  'Render': 'devops',
  'GitHub Actions': 'devops',
  'CI/CD': 'devops',
  'Passenger': 'devops',
};

type PortfolioItem = {
  tags: string[];
  dateFrom?: Date;
  dateTo?: Date;
};

// Oblicz miesiące doświadczenia na podstawie projektów
const calculateExperienceMonths = (portfolio: PortfolioItem[]): number => {
  if (!portfolio.length) {
    return 30; // fallback dla ~2.5 roku doświadczenia
  }

  let totalMonths = 0;
  const now = new Date();

  portfolio.forEach(project => {
    if (project.dateFrom) {
      const startDate = new Date(project.dateFrom);
      const endDate = project.dateTo ? new Date(project.dateTo) : now;

      if (startDate < endDate) {
        const diffMs = endDate.getTime() - startDate.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)); // zaokrąglij dni w górę
        const diffMonths = Math.ceil(diffDays / 30.44); // zaokrąglij miesiące w górę
        totalMonths += Math.max(1, diffMonths); // minimum 1 miesiąc dla projektu + rounding up
      }
    }
  });

  return Math.max(1, totalMonths);
};

// Dynamiczne wyliczenie umiejętności na podstawie portfolo
export const calculateDynamicSkills = (portfolio: PortfolioItem[]): Skill[] => {
  if (!portfolio.length) {
    return skillsData; // fallback do statycznych danych
  }

  // Zlicz wystąpienia technologii w portfolio
  const techCounts: Record<string, number> = {};

  portfolio.forEach(project => {
    project.tags.forEach(tag => {
      // Normalize tag names for counting
      const normalizedTag = Object.keys(techToCategoryMap).find(
        tech => tech.toLowerCase() === tag.toLowerCase() || tag.toLowerCase().includes(tech.toLowerCase())
      ) || tag;

      techCounts[normalizedTag] = (techCounts[normalizedTag] || 0) + 1;
    });
  });

  // Convert to skills with dynamic levels and experience months
  const totalProjects = portfolio.length;
  const totalMonthsExperience = calculateExperienceMonths(portfolio);
  const skills: Skill[] = Object.entries(techCounts).map(([techName, count]) => {
    const category = techToCategoryMap[techName] || 'frontEnd';
    // Procent wystąpienia w projektach + minimalny offset
    const projectPercentage = (count / totalProjects) * 100;
    const level = Math.round(Math.max(10, projectPercentage)); // Min 10% + procent projektów
    // Szacowane miesiące doświadczenia: ~3 miesiące per projekt + wczesniejsze doświadczenie
    const experienceMonths = Math.round(count * 3 + (totalMonthsExperience * 0.1));

    return {
      id: techName.toLowerCase().replace(/\s+/g, '-'),
      name: techName,
      level,
      category,
      experienceMonths
    };
  }).sort((a, b) => b.level - a.level); // Sort by level descending

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
    devops: 0
  };

  let totalTechCount = 0;

  portfolio.forEach(project => {
    project.tags.forEach(tag => {
      const category = techToCategoryMap[tag] || techToCategoryMap[
        Object.keys(techToCategoryMap).find(
          tech => tag.toLowerCase().includes(tech.toLowerCase())
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
  return data.filter(skill => skill.category === category);
};

export const getSkillCategories = (): Skill['category'][] => {
  return ['frontEnd', 'backEnd', 'database', 'devops'];
};

export const getTotalSkillCategories = (skills?: Skill[]): Record<string, number> => {
  const data = skills || skillsData;
  return data.reduce((acc, skill) => {
    acc[skill.category] = (acc[skill.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};
