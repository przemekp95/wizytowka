'use client';

import * as Progress from '@radix-ui/react-progress';
import { motion } from 'framer-motion';
import React from 'react';
import type { Skill } from '@/data/skills.data';
import { formatExperienceTime } from '@/data/skills.data';
import { useTranslations } from 'next-intl';

interface SkillProgressProps {
  skill: Skill;
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

export function SkillProgress({ skill, monthsLabel = 'mies.' }: SkillProgressProps) {
  const [progress, setProgress] = React.useState(0);
  const t = useTranslations();

  React.useEffect(() => {
    const timer = setTimeout(() => setProgress(skill.level), 300);
    return () => clearTimeout(timer);
  }, [skill.level]);

  // Get current locale for formatting
  const locale = t('language.polish') === 'Polski' ? 'en' : 'pl'; // Quick way to detect locale

  const colors = colorMap[skill.category];

  // Format experience time with proper localization
  const formattedExperienceTime = React.useMemo(() => {
    if (!skill.experienceMonths) return null;
    return formatExperienceTime(skill.experienceMonths, locale);
  }, [skill.experienceMonths, locale]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="mb-4"
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-slate-700">
          {skill.name}
          {formattedExperienceTime && (
            <span className="text-xs text-slate-500 ml-1">
              ({formattedExperienceTime})
            </span>
          )}
        </span>
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.8 }}
          className={`text-sm font-semibold ${colors.text}`}
        >
          {skill.level}%
        </motion.span>
      </div>
      <Progress.Root
        value={progress}
        className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden"
        aria-label={`Skill level for ${skill.name}`}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
          className={`h-full ${colors.indicator} rounded-full`}
        />
      </Progress.Root>
    </motion.div>
  );
}
