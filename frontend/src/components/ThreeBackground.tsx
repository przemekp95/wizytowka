'use client';

import { useRef, useEffect } from 'react';

interface ThreeBackgroundProps {
  className?: string;
}

export function ThreeBackground({ className = '' }: ThreeBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Mniejsza liczba kafelków dla płynniejszego ruchu + automatyczne animacje zamiast ruchu myszki
    const isMobile = window.innerWidth < 768;
    const shapeCount = isMobile ? 18 : 30; // Mniej kafelków dla płynności!
    const shapes: HTMLDivElement[] = [];

    // Główna pętla tworzenia obiektów
    for (let i = 0; i < shapeCount; i++) {
      // Hierarchia rozmiarów: główne duże, pozostałe średnie/małe
      let size;
      if (i < 3) {
        // 3 główne duże kształty
        size = Math.random() * 120 + 100; // 100-220px
      } else if (i < 8) {
        // kolejne duże i średnie
        size = Math.random() * 60 + 60; // 60-120px
      } else {
        // pozostałe małe dla rozmycia
        size = Math.random() * 40 + 20; // 20-60px
      }
      const shape = document.createElement('div');
      shape.className = `absolute rounded-lg opacity-40 hover:opacity-70 transition-all duration-700 hover:scale-110 cursor-pointer ${
        i % 6 === 0
          ? 'bg-indigo-500/60'
          : i % 6 === 1
            ? 'bg-fuchsia-500/60'
            : i % 6 === 2
              ? 'bg-cyan-500/60'
              : i % 6 === 3
                ? 'bg-violet-500/60'
                : i % 6 === 4
                  ? 'bg-emerald-500/60'
                  : 'bg-pink-500/60'
      }`;
      shape.style.width = `${size}px`;
      shape.style.height = `${size}px`;
      shape.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)';

      // Losowe pozycje w przestrzeni 3D - skoncentrowane w WIDOCZNYM centrum strony
      const centerOffsetX = 750; // Dodatkowe 100 dalej w prawo!
      const centerOffsetY = 400; // Dodatkowe 200 w dół!
      const spreadX = 1200; // Jeszcze bardziej szeroko rozrzucone!
      const spreadY = 600; // Jeszcze bardziej wysoko rozrzucone!

      const randomX = (Math.random() - 0.5) * spreadX; // ±150px od centrum
      const randomY = (Math.random() - 0.5) * spreadY; // ±75px od centrum

      const x = centerOffsetX + randomX;
      const y = centerOffsetY + randomY;
      const z = Math.random() * -100;
      const rotationX = Math.random() * 360;
      const rotationY = Math.random() * 360;
      const rotationZ = Math.random() * 360;

      shape.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rotationX}deg) rotateY(${rotationY}deg) rotateZ(${rotationZ}deg)`;

      // Animacja
      shape.style.animation = `float${(i % 3) + 1} ${4 + Math.random() * 4}s ease-in-out infinite alternate`;

      container.appendChild(shape);
      shapes.push(shape);
    }

    // Dodajemy różnorodne automatyczne animacje animowanym objekcie prezentującym cały model.
    shapes.forEach((shape, index) => {
      // Diverse automatyčne animacje dla różnych kształtów
      const animationType = index % 6;
      let animationName = '';

      switch (animationType) {
        case 0:
          animationName = 'floatUpSlow'; // Powolne unnoszenie w górę
          break;
        case 1:
          animationName = 'floatDownSlow'; // Powolne opadanie w dół
          break;
        case 2:
          animationName = 'floatUpFast'; // Szybkie unnoszenie
          break;
        case 3:
          animationName = 'floatDownFast'; // Szybkie opadanie
          break;
        case 4:
          animationName = 'rotateSlow'; // Powolny obrót
          break;
        case 5:
          animationName = 'rotateWithFloat'; // Obrót z unoszeniem
          break;
      }

      const animationDuration = `${8 + Math.random() * 12}s`; // Dłuższe animacje 8-20s

      shape.style.animation = `${animationName} ${animationDuration} ease-in-out infinite alternate`;
    });

    // Brak słuchacza ruchu myszki - kafelki poruszają się samodzielnie!
    // To jest spokojnieszep East, bardziej płynne i less obciążające procesor.

    return () => {
      shapes.forEach((shape) => {
        if (container.contains(shape)) {
          container.removeChild(shape);
        }
      });
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`fixed top-14 bottom-20 left-0 right-0 z-[-1] ${className}`}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Dodatkowe rozmycia dla głębi */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute bottom-20 right-20 w-96 h-96 bg-fuchsia-200/20 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: '1s' }}
      />
      <div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-200/20 rounded-full blur-2xl animate-pulse"
        style={{ animationDelay: '2s' }}
      />

      {/* Geometryczne kształty dla dodatkowego efektu */}
      <div
        className="absolute top-1/4 right-1/4 w-32 h-32 border-2 border-indigo-300/30 rotate-45 animate-spin"
        style={{ animationDuration: '20s' }}
      />
      <div
        className="absolute bottom-1/3 left-1/4 w-24 h-24 border-2 border-fuchsia-300/30 rounded-full animate-ping"
        style={{ animationDuration: '8s' }}
      />
    </div>
  );
}
