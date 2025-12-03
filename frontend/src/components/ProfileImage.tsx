'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import Image from 'next/image';

interface ProfileImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

export default function ProfileImage({ src, alt, className, priority }: ProfileImageProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';

  return (
    <div className={`relative overflow-hidden rounded-xl ${mounted ? 'dark:bg-gradient-to-br dark:from-indigo-900/20 dark:to-purple-900/20 dark:border dark:border-indigo-500/20' : ''}`}>
      <Image
        src={src}
        alt={alt}
        fill
        className={`object-cover transition-all duration-500 ${mounted && isDark ? 'filter brightness-110 contrast-110' : ''} ${className || ''}`}
        priority={priority}
        style={{
          filter: mounted && isDark ? 'brightness(1.2) contrast(1.1) saturate(1.1)' : 'none'
        }}
      />
      {mounted && isDark && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />
      )}
    </div>
  );
}
