'use client';

import * as Progress from '@radix-ui/react-progress';
import { motion } from 'framer-motion';
import React from 'react';

export interface TechTrend {
  id: string;
  name: string;
  yearOverYearChange: number;
  category: 'frontEnd' | 'backEnd' | 'database' | 'devops';
  isTrend: 'rising' | 'falling' | 'stable';
}

interface SkillProgressProps {
  trend: TechTrend;
  monthsLabel?: string;
}

const colorMap = {
  frontEnd: {
    indicator: 'bg-indigo-500',
    text: 'text-indigo-600',
  },
  backEnd: {
    indicator: 'bg-purple-500',
    text: 'text-purple-600',
  },
  database: {
    indicator: 'bg-cyan-500',
    text: 'text-cyan-600',
  },
  devops: {
    indicator: 'bg-emerald-500',
    text: 'text-emerald-600',
  },
} as const;

const getTrendIndicator = (isTrend: TechTrend['isTrend']) => {
  switch (isTrend) {
    case 'rising':
      return { symbol: '↗', color: 'text-green-600', bgColor: 'bg-green-500' };
    case 'falling':
      return { symbol: '↘', color: 'text-red-600', bgColor: 'bg-red-500' };
    default:
      return { symbol: '→', color: 'text-gray-600', bgColor: 'bg-gray-500' };
  }
};

export function SkillProgress({ trend, monthsLabel = 'mies.' }: SkillProgressProps) {
  const [progress, setProgress] = React.useState(0);

  const changeValue = trend.yearOverYearChange;
  React.useEffect(() => {
    const timer = setTimeout(() => {
      // Use absolute value for progress visualization, but show actual change
      setProgress(Math.abs(changeValue));
    }, 300);
    return () => clearTimeout(timer);
  }, [changeValue]);

  const colors = colorMap[trend.category];
  const trendIndicator = getTrendIndicator(trend.isTrend);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="mb-4"
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">{trend.name}</span>
          <span className={`text-sm font-semibold ${trendIndicator.color}`}>
            {trendIndicator.symbol}
          </span>
        </div>
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.8 }}
          className={`text-sm font-semibold ${changeValue >= 0 ? 'text-green-600' : 'text-red-600'}`}
        >
          {changeValue >= 0 ? '+' : ''}
          {changeValue}%
        </motion.span>
      </div>
      <Progress.Root
        value={progress}
        className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden"
        aria-label={`Year over year change for ${trend.name}`}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
          className={`h-full ${changeValue >= 0 ? trendIndicator.bgColor : 'bg-red-500'} rounded-full`}
        />
      </Progress.Root>
      <div className="text-xs text-slate-500 mt-1">
        Zmiana rok do roku
      </div>
    </motion.div>
  );
}
