'use client';

import * as Progress from '@radix-ui/react-progress';
import { motion } from 'framer-motion';
import React from 'react';

interface SkillBarProps {
  skill: {
    id: string;
    name: string;
    projectCount: number;
    category: 'frontEnd' | 'backEnd' | 'database' | 'devops';
    experienceMonths?: number;
  };
  locale?: 'pl' | 'en';
  maxProjects?: number;
}

const colorMap = {
  frontEnd: {
    indicator: 'bg-indigo-500',
    text: 'text-indigo-300',
  },
  backEnd: {
    indicator: 'bg-purple-500',
    text: 'text-purple-300',
  },
  database: {
    indicator: 'bg-cyan-500',
    text: 'text-cyan-300',
  },
  devops: {
    indicator: 'bg-emerald-500',
    text: 'text-emerald-300',
  },
} as const;

export function SkillBar({ skill, locale = 'pl', maxProjects }: SkillBarProps) {
  const [progress, setProgress] = React.useState(0);

  // Width based on project count (0-100% relative to max)
  const barWidth = Math.min(100, (skill.projectCount / (maxProjects || 10)) * 100);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(barWidth);
    }, 300);
    return () => clearTimeout(timer);
  }, [barWidth]);

  const colors = colorMap[skill.category];

  const pluralizeProjects = (count: number, locale: string = 'pl'): string => {
    if (locale === 'en') {
      return count === 1 ? '1 project' : `${count} projects`;
    } else {
      if (count === 1) return '1 projekt';
      if (count >= 2 && count <= 4) return `${count} projekty`;
      return `${count} projektów`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="mb-4"
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-100">{skill.name}</span>
          <span className={`text-xs font-semibold ${colors.text}`}>{skill.projectCount}</span>
        </div>
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.8 }}
          className={`text-xs font-medium ${colors.text}`}
        >
          {pluralizeProjects(skill.projectCount, locale)}
        </motion.span>
      </div>
      <Progress.Root
        value={progress}
        className="relative w-full h-3 bg-slate-200 dark:bg-slate-300 rounded-full overflow-hidden"
        aria-label={`${skill.name}: ${pluralizeProjects(skill.projectCount, locale)}`}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
          className={`h-full ${colors.indicator} rounded-full`}
        />
      </Progress.Root>
      <div className="text-xs text-slate-300 mt-1">
        {locale === 'en'
          ? `Used in ${pluralizeProjects(skill.projectCount, locale).toLowerCase()}`
          : pluralizeProjects(skill.projectCount, locale)}
      </div>
    </motion.div>
  );
}
