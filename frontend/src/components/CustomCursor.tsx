'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface CursorTrail {
  id: string;
  x: number;
  y: number;
  timestamp: number;
}

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailsRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  // Optimized spring for balanced performance - reduced stiffness for lightweight feel
  const springX = useSpring(mouseX, { stiffness: 300, damping: 45, mass: 0.05 });
  const springY = useSpring(mouseY, { stiffness: 300, damping: 45, mass: 0.05 });

  const [isVisible, setIsVisible] = useState(true);
  const [isClickable, setIsClickable] = useState(false);
  const [trails, setTrails] = useState<CursorTrail[]>([]);
  const [theme, setTheme] = useState('dark');
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateEnabledState = () => setIsEnabled(finePointer.matches && !reducedMotion.matches);

    updateEnabledState();
    finePointer.addEventListener('change', updateEnabledState);
    reducedMotion.addEventListener('change', updateEnabledState);

    return () => {
      finePointer.removeEventListener('change', updateEnabledState);
      reducedMotion.removeEventListener('change', updateEnabledState);
    };
  }, []);

  // Use useCallback for stable references
  const updateCursorPosition = useCallback(
    (x: number, y: number) => {
      mouseX.set(x);
      mouseY.set(y);
    },
    [mouseX, mouseY]
  );

  // Throttle trail point creation to keep rendering smooth.
  const lastTrailTimeRef = useRef(0);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!isEnabled) return;

    // Detect theme changes less frequently
    const handleThemeChange = () => {
      const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      if (currentTheme !== theme) {
        setTheme(currentTheme);
      }
    };

    handleThemeChange();
    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;

      // Always update cursor position for smooth movement
      updateCursorPosition(x, y);

      // Create trail points at most once per 40ms.
      const now = Date.now();
      if (now - lastTrailTimeRef.current > 40) {
        // Use single animation frame to batch updates
        if (!animationFrameRef.current) {
          animationFrameRef.current = requestAnimationFrame(() => {
            setTrails((prev) => {
              const newTrail: CursorTrail = {
                id: now.toString(),
                x,
                y,
                timestamp: now,
              };
              return [...prev.slice(-10), newTrail]; // Keep the most recent 10 trail points.
            });
            lastTrailTimeRef.current = now;
            animationFrameRef.current = undefined;
          });
        }
      }
    };

    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseLeave = () => setIsVisible(false);

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isClickableElement =
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.onclick !== null ||
        target.classList.contains('clickable') ||
        target.closest('a, button, [onclick], .clickable');

      setIsClickable(!!isClickableElement);
    };

    // Add global styles to hide native cursor and apply custom cursor class
    document.body.style.cursor = 'none';
    document.body.classList.add('custom-cursor-active');

    // Apply cursor: none to all elements via CSS injection
    const styleId = 'custom-cursor-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .custom-cursor-active,
        .custom-cursor-active *,
        .custom-cursor-active a,
        .custom-cursor-active button,
        .custom-cursor-active input,
        .custom-cursor-active textarea,
        .custom-cursor-active select,
        .custom-cursor-active [role="button"],
        .custom-cursor-active [tabindex]:focus {
          cursor: none !important;
        }
      `;
      document.head.appendChild(style);
    }

    // Use passive event listeners for better performance
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseenter', handleMouseEnter, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    document.addEventListener('mouseover', handleMouseOver, { passive: true });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseover', handleMouseOver);
      document.body.style.cursor = 'auto';
      document.body.classList.remove('custom-cursor-active');
      observer.disconnect();
    };
  }, [isEnabled, mouseX, mouseY, updateCursorPosition, theme]);

  // Periodically prune stale trail points.
  useEffect(() => {
    if (!isEnabled) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setTrails((prev) => prev.filter((trail) => now - trail.timestamp < 600)); // Keep trails visible for up to 600ms.
    }, 80); // Run often enough to avoid trail buildup.

    return () => clearInterval(interval);
  }, [isEnabled]);

  // Use separate state for trail animations to avoid Date.now in render
  const [trailAnimations, setTrailAnimations] = useState<{
    [key: string]: { opacity: number; scale: number };
  }>({});

  // Recompute trail animation state when trail data changes.
  useEffect(() => {
    if (!isEnabled) return;

    const updateAnimations = () => {
      const currentTime = Date.now();
      const newAnimations: { [key: string]: { opacity: number; scale: number } } = {};
      trails.forEach((trail) => {
        const age = currentTime - trail.timestamp;
        newAnimations[trail.id] = {
          opacity: Math.max(0, 1 - age / 500),
          scale: Math.max(0.3, 1 - (age / 500) * 0.7),
        };
      });
      setTrailAnimations(newAnimations);
    };

    updateAnimations();

    // Refresh animation interpolation at a steady interval.
    const interval = setInterval(updateAnimations, 100);
    return () => clearInterval(interval);
  }, [isEnabled, trails]);

  if (!isEnabled || !isVisible) return null;

  return (
    <>
      {/* Trail dots */}
      <div
        ref={trailsRef}
        className="fixed inset-0 pointer-events-none z-50"
        style={{ mixBlendMode: theme === 'dark' ? 'difference' : 'normal' }}
      >
        {trails.map((trail, index) => {
          const animation = trailAnimations[trail.id] || { scale: 0, opacity: 0 };
          return (
            <motion.div
              key={trail.id}
              className={`absolute w-1 h-1 rounded-full ${
                theme === 'dark' ? 'bg-white' : 'bg-gray-800'
              }`}
              style={{
                left: trail.x - 2,
                top: trail.y - 2,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: animation.scale,
                opacity: animation.opacity * 0.6,
              }}
              transition={{
                duration: 0.1,
                ease: 'easeOut',
              }}
            />
          );
        })}
      </div>

      {/* Main cursor */}
      <motion.div
        ref={cursorRef}
        className={`fixed w-6 h-6 pointer-events-none z-50 ${
          theme === 'dark' ? 'border-2 border-white' : 'border-2 border-gray-800 bg-white'
        }`}
        style={{
          left: springX,
          top: springY,
          x: '-50%',
          y: '-50%',
          mixBlendMode: theme === 'dark' ? 'difference' : 'normal',
        }}
        animate={{
          scale: isClickable ? 1.5 : 1,
          rotate: isClickable ? 45 : 0,
        }}
        transition={{
          scale: { duration: 0.2, ease: 'easeOut' },
          rotate: { duration: 0.2, ease: 'easeOut' },
        }}
      >
        {/* Inner dot for clickable elements */}
        <motion.div
          className={`absolute inset-1 rounded-full ${
            theme === 'dark' ? 'bg-white' : 'bg-black'
          } ${isClickable ? 'opacity-100' : 'opacity-0'}`}
          animate={{ scale: isClickable ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />
      </motion.div>
    </>
  );
}
