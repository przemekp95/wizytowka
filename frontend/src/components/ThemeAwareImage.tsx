'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import Image from 'next/image';

interface ThemeAwareImageProps {
  lightSrc: string;
  darkSrc?: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoadingComplete?: () => void;
  onLoad?: () => void;
  onError?: () => void;
  quality?: number;
}

export default function ThemeAwareImage({
  lightSrc,
  darkSrc,
  alt,
  width,
  height,
  className,
  style,
  fill = false,
  sizes,
  priority,
  placeholder,
  blurDataURL,
  onLoadingComplete,
  onLoad,
  onError,
  quality,
}: ThemeAwareImageProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Return light image during SSR and initial hydration to prevent mismatch
  if (!mounted) {
    return (
      <Image
        src={lightSrc}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        className={className}
        style={{
          ...style,
          // Preload dark mode version if available
          contentVisibility: darkSrc ? 'auto' : undefined,
        }}
        fill={fill}
        sizes={sizes}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        onLoadingComplete={onLoadingComplete}
        onLoad={onLoad}
        onError={onError}
        quality={quality}
      />
    );
  }

  // Choose image based on current theme
  const isDark = resolvedTheme === 'dark';
  const useDarkVersion = isDark && darkSrc;
  const currentSrc = useDarkVersion ? darkSrc : lightSrc;

  return (
    <Image
      src={currentSrc || lightSrc}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      className={`${className} transition-opacity duration-300`}
      style={{
        ...style,
        opacity: mounted ? 1 : 0,
      }}
      fill={fill}
      sizes={sizes}
      priority={priority}
      placeholder={placeholder}
      blurDataURL={blurDataURL}
      onLoadingComplete={(result) => {
        // Ensure image is visible after loading
        if (result?.naturalWidth > 0) {
          setMounted(true);
        }
        onLoadingComplete?.();
      }}
      onLoad={onLoad}
      onError={onError}
      quality={quality}
    />
  );
}
