'use client';


import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { motion } from 'framer-motion';
import { Pie } from 'react-chartjs-2';
import { techStackData, type TechStack } from '@/data/skills.data';

ChartJS.register(ArcElement, Tooltip, Legend);

interface TechStackChartProps {
  locale: 'pl' | 'en';
  techStack?: TechStack[]; // Optional - jeśli nie przekazane, używa statycznych danych
}

export function TechStackChart({ locale, techStack }: TechStackChartProps) {
  const isEnglish = locale === 'en';
  const dataSource = techStack || techStackData; // Use dynamic data if available, fallback to static

  const data = {
    labels: dataSource.map(stack => isEnglish ? stack.nameEn : stack.namePl),
    datasets: [
      {
        data: dataSource.map(stack => stack.percentage),
        backgroundColor: dataSource.map(stack => stack.color),
        borderColor: dataSource.map(stack => stack.color.replace('0.8)', '1)')),
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
          {isEnglish ? 'Technology Stack Distribution' : 'Rozkład kompetencji'}
        </motion.h3>

        <div className="relative h-80">
          <Pie
            data={data}
            options={options}
            aria-label={isEnglish ? 'Technology Stack Distribution Chart' : 'Wykres rozkładu kompetencji technologicznych'}
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
            : 'Najedź kursorem na segmenty dla szczegółów'
          }
        </motion.div>
      </div>
    </motion.div>
  );
}
