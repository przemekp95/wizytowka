'use client';

import { Chart as ChartJS, ArcElement, Tooltip, Legend, ChartOptions } from 'chart.js';
import { motion } from 'framer-motion';
import { Pie } from 'react-chartjs-2';
import { techStackData, type TechStack } from '@/data/skills.data';

ChartJS.register(ArcElement, Tooltip, Legend);

export interface PortfolioCategory {
  id: string;
  namePl: string;
  nameEn: string;
  percentage: number;
  color: string;
  descriptionPl: string;
  descriptionEn: string;
}

interface TechStackChartProps {
  locale: 'pl' | 'en';
  portfolioCategories?: PortfolioCategory[]; // Optional - jeśli nie przekazane, używa statycznych danych
}

export function TechStackChart({ locale, portfolioCategories }: TechStackChartProps) {
  const isEnglish = locale === 'en';
  // Use portfolio categories if available, fallback to default tech stack (will be changed to portfolio cats)
  const dataSource = portfolioCategories || [
    {
      id: 'demo-web-apps',
      namePl: 'Aplikacje webowe',
      nameEn: 'Web Applications',
      percentage: 60,
      color: 'rgba(99, 102, 241, 0.8)',
      descriptionPl: 'Pełnofunkcjonalne aplikacje internetowe',
      descriptionEn: 'Full-featured web applications',
    },
    {
      id: 'demo-api',
      namePl: 'API i usługi',
      nameEn: 'APIs & Services',
      percentage: 25,
      color: 'rgba(139, 92, 246, 0.8)',
      descriptionPl: 'Backend i usługi webowe',
      descriptionEn: 'Backend services and APIs',
    },
    {
      id: 'demo-tools',
      namePl: 'Narzędzia',
      nameEn: 'Tools & Utilities',
      percentage: 10,
      color: 'rgba(6, 182, 212, 0.8)',
      descriptionPl: 'Narzędzia i aplikacje pomocnicze',
      descriptionEn: 'Helper tools and utilities',
    },
    {
      id: 'demo-other',
      namePl: 'Inne',
      nameEn: 'Other',
      percentage: 5,
      color: 'rgba(16, 185, 129, 0.8)',
      descriptionPl: 'Pozostałe projekty',
      descriptionEn: 'Other projects',
    },
  ];

  const data = {
    labels: dataSource.map((item) => (isEnglish ? item.nameEn : item.namePl)),
    datasets: [
      {
        data: dataSource.map((item) => item.percentage),
        backgroundColor: dataSource.map((item) => item.color),
        borderColor: dataSource.map((item) => item.color.replace('0.8)', '1)')),
        borderWidth: 2,
        hoverOffset: 12,
      },
    ],
  };

  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
            weight: 500,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(99, 102, 241, 0.3)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed as number;
            return `${label}: ${value}%`;
          },
        },
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1500,
      easing: 'easeOutQuart',
    },
    elements: {
      arc: {
        borderRadius: 4,
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.8,
        delay: 0.2,
        type: 'spring',
        stiffness: 100,
      }}
      className="w-full max-w-md mx-auto"
    >
      <div className="relative">
        <motion.h3
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-lg font-semibold text-center text-slate-700 mb-6"
        >
          {isEnglish ? 'Portfolio Categories' : 'Kategorie projektów'}
        </motion.h3>

        <div className="relative h-80">
          <Pie
            data={data}
            options={options}
            aria-label={
              isEnglish
                ? 'Technology Stack Distribution Chart'
                : 'Wykres rozkładu kompetencji technologicznych'
            }
          />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="text-center text-xs text-slate-500 mt-4"
        >
          {isEnglish
            ? 'Hover over segments for details'
            : 'Najedź kursorem na segmenty dla szczegółów'}
        </motion.div>
      </div>
    </motion.div>
  );
}
