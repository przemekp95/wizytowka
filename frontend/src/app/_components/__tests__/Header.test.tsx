import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Header from '../Header';

let mockPathnameValue = '/en';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<{ [key: string]: unknown }>) => (
      <div {...props}>{children}</div>
    ),

    nav: ({ children, ...props }: React.PropsWithChildren<{ [key: string]: unknown }>) => (
      <nav {...props}>{children}</nav>
    ),

    ul: ({ children, ...props }: React.PropsWithChildren<{ [key: string]: unknown }>) => (
      <ul {...props}>{children}</ul>
    ),

    li: ({ children, ...props }: React.PropsWithChildren<{ [key: string]: unknown }>) => (
      <li {...props}>{children}</li>
    ),
  },
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathnameValue,
}));

const navTranslations = {
  portfolio: 'Portfolio',
  about: 'About me',
  skills: 'Skills',
  techAnalysis: 'Analysis',
  contact: 'Contact',
  contactMe: 'Contact me',
};

describe('Header', () => {
  beforeEach(() => {
    mockPathnameValue = '/en';
  });

  it('renders locale-aware navigation links for English', () => {
    mockPathnameValue = '/en';
    render(<Header translations={navTranslations} />);

    expect(screen.getByRole('navigation')).toBeInTheDocument();

    const brandLink = screen.getByRole('link', { name: /Przemysław Pietrzak/ });
    const portfolioLink = screen.getByRole('link', { name: /portfolio/i });
    const aboutLink = screen.getByRole('link', { name: /about/i });
    const contactLink = screen.getByRole('link', { name: /^contact$/i });

    expect(brandLink).toBeInTheDocument();
    expect(brandLink).toHaveAttribute('href', '/en');
    expect(portfolioLink).toBeInTheDocument();
    expect(portfolioLink).toHaveAttribute('href', '/en#portfolio');
    expect(aboutLink).toBeInTheDocument();
    expect(aboutLink).toHaveAttribute('href', '/en#about');
    expect(contactLink).toBeInTheDocument();
    expect(contactLink).toHaveAttribute('href', '/en#contact');
  });

  it('renders locale-aware navigation links for Polish', () => {
    mockPathnameValue = '/pl';
    render(<Header translations={navTranslations} />);

    const brandLink = screen.getByRole('link', { name: /Przemysław Pietrzak/ });
    const contactButton = screen.getByRole('link', { name: /contact me/i });

    expect(brandLink).toHaveAttribute('href', '/pl');
    expect(contactButton).toHaveAttribute('href', '/pl#contact');
  });

  it('renders brand link pointing to home', () => {
    mockPathnameValue = '/pl';
    render(<Header translations={navTranslations} />);

    const brandLink = screen.getByRole('link', { name: /Przemysław Pietrzak/ });
    expect(brandLink).toHaveAttribute('href', '/pl');
  });

  it('has proper header structure', () => {
    render(<Header translations={navTranslations} />);

    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('site-header', 'sticky', 'top-0', 'z-40');
  });
});
