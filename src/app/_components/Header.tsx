// app/_components/Header.tsx
'use client';
import { useEffect, useState } from "react";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`site-header fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        scrolled ? "bg-white border-b shadow-sm" : "bg-slate-900"
      }`}
    >
      <nav className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <a href="#home" className={`text-xl font-bold tracking-tight ${scrolled ? "text-slate-900" : "text-white"}`}>
          Przemysław Pietrzak
        </a>
        <div className="hidden sm:flex items-center gap-6 text-sm">
          <a className={scrolled ? "text-slate-800 hover:text-black" : "text-slate-100 hover:text-white"} href="#portfolio">Portfolio</a>
          <a className={scrolled ? "text-slate-800 hover:text-black" : "text-slate-100 hover:text-white"} href="#about">O mnie</a>
        </div>
        <a
          href="#contact"
          className={`px-4 py-2 rounded-xl font-semibold ${
            scrolled ? "bg-black text-white hover:bg-slate-800" : "bg-white text-black hover:bg-slate-200"
          }`}
        >
          Napisz do mnie
        </a>
      </nav>
    </header>
  );
}
