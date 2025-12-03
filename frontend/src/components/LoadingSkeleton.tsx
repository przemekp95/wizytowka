'use client';

import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function SkeletonCard() {
  return (
    <motion.div
      className="card animate-pulse"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative overflow-hidden rounded-xl h-64 sm:h-72 lg:h-80 bg-slate-200 dark:bg-gray-700">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      </div>

      <div className="mt-4 space-y-3">
        <div className="h-5 bg-slate-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
        <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-full animate-pulse" />
        <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />

        <div className="mt-4">
          <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-1/3 mb-2 animate-pulse" />
          <div className="flex flex-wrap gap-2">
            <div className="h-6 bg-slate-200 dark:bg-gray-700 rounded-full w-16 animate-pulse" />
            <div className="h-6 bg-slate-200 dark:bg-gray-700 rounded-full w-20 animate-pulse" />
            <div className="h-6 bg-slate-200 dark:bg-gray-700 rounded-full w-14 animate-pulse" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function SkeletonSkillBar() {
  return (
    <motion.div
      className="space-y-2 animate-pulse"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-center">
        <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
        <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-8 animate-pulse" />
      </div>
      <div className="h-8 bg-slate-200 dark:bg-gray-700 rounded-full w-full animate-pulse">
        <div className="h-full bg-slate-300 dark:bg-gray-600 rounded-full animate-pulse w-3/4" />
      </div>
    </motion.div>
  );
}

export function SkeletonText({ className = '', lines = 3 }: SkeletonProps) {
  return (
    <div className={`space-y-2 animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-slate-200 dark:bg-gray-700 rounded animate-pulse"
          style={{
            width: i === lines - 1 ? '70%' : '100%',
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

export function LoadingPortfolio() {
  return (
    <section className="py-20 md:py-28 bg-transparent">
      <div className="mx-auto max-w-6xl px-4">
        <div className="h-12 bg-slate-200 dark:bg-gray-700 rounded-lg w-1/3 mx-auto mb-12 animate-pulse" />

        {/* Filter buttons skeleton */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-10 bg-slate-200 dark:bg-gray-700 rounded-full w-20 animate-pulse"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>

        {/* Portfolio grid skeleton */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ animationDelay: `${i * 0.2}s` }}>
              <SkeletonCard />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LoadingSkills() {
  return (
    <section className="py-20 md:py-28 bg-transparent">
      <div className="mx-auto max-w-6xl px-4">
        <div className="h-12 bg-slate-200 dark:bg-gray-700 rounded-lg w-1/2 mx-auto mb-16 animate-pulse" />

        <div className="flex flex-col items-center">
          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                <SkeletonSkillBar />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
