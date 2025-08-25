'use client';
import { useEffect, useRef } from 'react';

export default function Header() {
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const onScroll = () => {
      const scrolled = window.scrollY > 8;
      el.classList.toggle('scrolled', scrolled);
    };

    onScroll(); // stan początkowy po odświeżeniu
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header ref={headerRef} className="site-header sticky top-0 z-40">
      <nav className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <a className="brand" href="#home">Przemysław Pietrzak</a>
        <div className="hidden sm:flex items-center gap-6 text-sm">
          <a className="nav-link" href="#portfolio">Portfolio</a>
          <a className="nav-link" href="#about">O mnie</a>
          <a className="nav-link" href="#contact">Kontakt</a>
        </div>
        <a className="nav-btn" href="#contact">Napisz do mnie</a>
      </nav>
    </header>
  );
}
