'use client';

import { Chart as ChartJS, ArcElement, Tooltip, Legend, ChartOptions, ChartEvent, LegendItem, LegendElement, PieController } from 'chart.js';
import { motion } from 'framer-motion';
import { Pie } from 'react-chartjs-2';
import { useState, useMemo } from 'react';


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

  // Debug - log what data source we're using
  console.log('📊 TechStackChart - portfolioCategories:', portfolioCategories?.length || 0, 'categories provided');

  // Use portfolio categories if available, fallback to default tech stack
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

  // State for managing which categories are visible (interactive chart filtering)
  const [visibleCategoryIds, setVisibleCategoryIds] = useState<string[]>(() =>
    dataSource.map(cat => cat.id) // Start with all categories visible
  );

  // Filter visible categories and renormalize their percentages to sum to 100%
  const visibleCategories = useMemo(() => {
    const filtered = dataSource.filter(cat => visibleCategoryIds.includes(cat.id));
    if (filtered.length === 0) return dataSource; // Fallback if no categories visible

    // Calculate new percentages for visible categories (sum to 100%)
    const totalVisiblePercentage = filtered.reduce((sum, cat) => sum + cat.percentage, 0);
    const renormalized = filtered.map(cat => ({
      ...cat,
      percentage: Math.round((cat.percentage / totalVisiblePercentage) * 100)
    }));

    // Fix rounding errors to ensure sum equals 100%
    const sum = renormalized.reduce((acc, cat) => acc + cat.percentage, 0);
    const diff = 100 - sum;
    if (diff !== 0 && renormalized.length > 0) {
      renormalized[0].percentage += diff; // Add/subtract difference to first category
    }

    return renormalized;
  }, [dataSource, visibleCategoryIds]);

  // Toggle category visibility on legend click
  const handleLegendClick = (e: ChartEvent, legendItem: LegendItem, legend: LegendElement<'pie'>) => {
    const allCategories = dataSource || [];
    const index = legendItem.index;
    if (typeof index !== 'number' || !allCategories[index]) return;

    const category = allCategories[index];
    setVisibleCategoryIds(prev =>
      prev.includes(category.id)
        ? prev.filter(id => id !== category.id) // Hide category
        : [...prev, category.id] // Show category
    );
  };

  // Generate legend labels - show all categories in legend
  const generateLegendLabels = (chart: ChartJS<'pie', number[], unknown>) => {
    const labels: LegendItem[] = [];
    if (chart.config.data.labels) {
      for (let index = 0; index < chart.config.data.labels.length; index++) {
        const label = chart.config.data.labels[index] as string;
        const category = dataSource[index];
        const isVisible = visibleCategoryIds.includes(category?.id);

        labels.push({
          text: label,
          fillStyle: isVisible ? category?.color : 'rgba(128, 128, 128, 0.5)',
          strokeStyle: isVisible ? category?.color : 'rgba(128, 128, 128, 0.5)',
          lineWidth: isVisible ? 0 : 2,
          hidden: !isVisible, // Show/cross out based on visibility
          index,
        });
      }
    }
    return labels;
  };

  const data = {
    labels: dataSource.map((category) => (isEnglish ? category.nameEn : category.namePl)),
    datasets: [
      {
        data: visibleCategories.map((item) => item.percentage),
        backgroundColor: visibleCategories.map((item) => item.color),
        borderColor: visibleCategories.map((item) => item.color.replace('0.8)', '1)')),
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
          usePointStyle: true, // Use colorful circle point styles
          font: {
            size: 12,
            weight: 500,
          },
          generateLabels: generateLegendLabels,
        },
        onClick: handleLegendClick,
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
            return `${label}: ${value.toFixed(0)}%`;
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
