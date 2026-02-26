import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import Header from '../Header';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<{ [key: string]: any }>) => (
      <div {...props}>{children}</div>
    ),

    nav: ({ children, ...props }: React.PropsWithChildren<{ [key: string]: any }>) => (
      <nav {...props}>{children}</nav>
    ),

    ul: ({ children, ...props }: React.PropsWithChildren<{ [key: string]: any }>) => (
      <ul {...props}>{children}</ul>
    ),

    li: ({ children, ...props }: React.PropsWithChildren<{ [key: string]: any }>) => (
      <li {...props}>{children}</li>
    ),
  },
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
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
  it('renders navigation links', () => {
    render(<Header translations={navTranslations} />);

    expect(screen.getByRole('navigation')).toBeInTheDocument();

    // Check for main navigation links
    const brandLink = screen.getByRole('link', { name: /Przemysław Pietrzak/ });
    const portfolioLink = screen.getByRole('link', { name: /portfolio/i });
    const aboutLink = screen.getByRole('link', { name: /about/i });
    const contactLink = screen.getByRole('link', { name: /^contact$/i });

    expect(brandLink).toBeInTheDocument();
    expect(portfolioLink).toBeInTheDocument();
    expect(aboutLink).toBeInTheDocument();
    expect(contactLink).toBeInTheDocument();
  });

  it('renders contact me button', () => {
    render(<Header translations={navTranslations} />);

    const contactButton = screen.getByRole('link', { name: /contact me/i });
    expect(contactButton).toBeInTheDocument();
    expect(contactButton).toHaveAttribute('href', '/#contact');
  });

  it('renders brand link pointing to home', () => {
    render(<Header translations={navTranslations} />);

    const brandLink = screen.getByRole('link', { name: /Przemysław Pietrzak/ });
    expect(brandLink).toHaveAttribute('href', '/');
  });

  it('has proper header structure', () => {
    render(<Header translations={navTranslations} />);

    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('site-header', 'sticky', 'top-0', 'z-40');
  });
});
