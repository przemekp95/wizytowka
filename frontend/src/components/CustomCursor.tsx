'use client';

import { useEffect, useRef, useState } from 'react';
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
  const springX = useSpring(mouseX, { stiffness: 300, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 300, damping: 30 });

  const [isVisible, setIsVisible] = useState(true); // Show cursor by default - fixes production issue
  const [isClickable, setIsClickable] = useState(false);
  const [trails, setTrails] = useState<CursorTrail[]>([]);
  const [theme, setTheme] = useState('dark'); // Default to dark theme for app

  useEffect(() => {
    // Detect theme changes
    const handleThemeChange = () => {
      const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      setTheme(currentTheme);
    };

    handleThemeChange();
    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;

      mouseX.set(x);
      mouseY.set(y);

      // Add trail dot
      const newTrail: CursorTrail = {
        id: Math.random().toString(36).substring(7),
        x,
        y,
        timestamp: Date.now(),
      };

      setTrails(prev => [...prev.slice(-15), newTrail]); // Keep only last 15 trails
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

    // Add global styles to hide native cursor
    document.body.style.cursor = 'none';

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseover', handleMouseOver);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseover', handleMouseOver);
      document.body.style.cursor = 'auto';
      observer.disconnect();
    };
  }, [mouseX, mouseY]);

  // Clean up old trails
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTrails(prev => prev.filter(trail => now - trail.timestamp < 500)); // Keep trails for 500ms
    }, 50);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  return (
    <>
      {/* Trail dots */}
      <div
        ref={trailsRef}
        className="fixed inset-0 pointer-events-none z-50"
        style={{ mixBlendMode: theme === 'dark' ? 'difference' : 'normal' }}
      >
        {trails.map((trail, index) => {
          const age = Date.now() - trail.timestamp;
          const opacity = Math.max(0, 1 - (age / 500));
          const scale = Math.max(0.3, 1 - (age / 500) * 0.7);

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
                scale: scale,
                opacity: opacity * 0.6,
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
          theme === 'dark'
            ? 'border-2 border-white'
            : 'border-2 border-gray-800 bg-white'
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
