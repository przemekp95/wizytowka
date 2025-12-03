'use client';

import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

export function AOSInitializer() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: true,
      offset: 50,
      delay: 0,
    });

    // Refresh AOS on route changes
    const handleRouteChange = () => {
      setTimeout(() => {
        AOS.refresh();
      }, 100);
    };

    // Listen for navigation events if applicable
    window.addEventListener('resize', () => AOS.refresh());

    return () => {
      window.removeEventListener('resize', () => AOS.refresh());
    };
  }, []);

  return null;
}
