import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { ComponentProps } from 'react';
import LanguageSwitcher from '../LanguageSwitcher';

// Mock next/navigation
const mockPush = vi.fn();
const mockReplace = vi.fn();
let mockPathnameValue = '/';

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathnameValue,
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: vi.fn(),
  }),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<{ [key: string]: unknown }>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

// Mock UI components
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick, disabled, ...props }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; [key: string]: unknown }) => (
    <div
      onClick={disabled ? undefined : onClick}
      data-testid="dropdown-item"
      data-disabled={disabled}
      {...props}
    >
      {children}
    </div>
  ),
  DropdownMenuTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
    asChild ? children : <div>{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, variant, size, disabled, className, 'aria-label': ariaLabel, ...props }: { children: React.ReactNode; variant?: string; size?: string; disabled?: boolean; className?: string; 'aria-label'?: string; [key: string]: unknown }) => (
    <button
      className={className}
      disabled={disabled}
      aria-label={ariaLabel}
      data-testid="language-button"
      {...props}
    >
      {children}
    </button>
  ),
}));

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Reset to default
    mockPathnameValue = '/';
  });

  describe('Current Language Detection', () => {
    it('should display Polish when pathname starts with /pl', () => {
      mockPathnameValue = '/pl/portfolio';
      render(<LanguageSwitcher />);

      expect(screen.getByTestId('language-button')).toHaveAttribute('aria-label', 'Current language: Polski');
      expect(screen.getByText('🇵🇱')).toBeInTheDocument();
    });

    it('should display English when pathname starts with /en', () => {
      mockPathnameValue = '/en/about';
      render(<LanguageSwitcher />);

      expect(screen.getByTestId('language-button')).toHaveAttribute('aria-label', 'Current language: English');
      expect(screen.getByText('🇬🇧')).toBeInTheDocument();
    });

    it('should default to English when pathname has no locale prefix', () => {
      mockPathnameValue = '/contact';
      render(<LanguageSwitcher />);

      expect(screen.getByTestId('language-button')).toHaveAttribute('aria-label', 'Current language: English');
      expect(screen.getByText('🇬🇧')).toBeInTheDocument();
    });
  });

  describe('Language Switching', () => {
    it('should switch from Polish to English when clicked', () => {
      mockPathnameValue = '/pl/portfolio';
      const mockWindow = { location: { href: '' } };
      Object.defineProperty(window, 'location', {
        value: mockWindow.location,
        writable: true,
      });

      render(<LanguageSwitcher />);

      const dropdownItem = screen.getByTestId('dropdown-item');
      fireEvent.click(dropdownItem);

      expect(mockWindow.location.href).toBe('/en/portfolio');
    });

    it('should switch from English to Polish when clicked', () => {
      mockPathnameValue = '/en/about';
      const mockWindow = { location: { href: '' } };
      Object.defineProperty(window, 'location', {
        value: mockWindow.location,
        writable: true,
      });

      render(<LanguageSwitcher />);

      const dropdownItem = screen.getByTestId('dropdown-item');
      fireEvent.click(dropdownItem);

      expect(mockWindow.location.href).toBe('/pl/about');
    });

    it('should switch from root path to Polish when clicked', () => {
      mockPathnameValue = '/contact';
      const mockWindow = { location: { href: '' } };
      Object.defineProperty(window, 'location', {
        value: mockWindow.location,
        writable: true,
      });

      render(<LanguageSwitcher />);

      const dropdownItem = screen.getByTestId('dropdown-item');
      fireEvent.click(dropdownItem);

      expect(mockWindow.location.href).toBe('/pl/contact');
    });

    it('should add Polish prefix when switching from empty path', () => {
      mockPathnameValue = '/';
      const mockWindow = { location: { href: '' } };
      Object.defineProperty(window, 'location', {
        value: mockWindow.location,
        writable: true,
      });

      render(<LanguageSwitcher />);

      const dropdownItem = screen.getByTestId('dropdown-item');
      fireEvent.click(dropdownItem);

      expect(mockWindow.location.href).toBe('/pl/');
    });
  });



  describe('UI Elements', () => {
    it('should render dropdown menu structure', () => {
      mockPathnameValue = '/en/test';
      render(<LanguageSwitcher />);

      expect(screen.getByTestId('language-button')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-content')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-item')).toBeInTheDocument();
    });

    it('should show full language name on larger screens', () => {
      mockPathnameValue = '/en/test';
      render(<LanguageSwitcher />);

      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-item')).toHaveTextContent('Polski');
    });

    it('should display correct flag icons', () => {
      mockPathnameValue = '/pl/test';
      render(<LanguageSwitcher />);

      expect(screen.getByText('🇵🇱')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-item')).toHaveTextContent('🇬🇧');
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label for button', () => {
      mockPathnameValue = '/pl/test';
      render(<LanguageSwitcher />);

      expect(screen.getByTestId('language-button')).toHaveAttribute('aria-label', 'Current language: Polski');
    });

    it('should be keyboard navigable', () => {
      mockPathnameValue = '/en/test';
      render(<LanguageSwitcher />);

      const button = screen.getByTestId('language-button');
      button.focus();
      expect(document.activeElement).toBe(button);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty pathname gracefully', () => {
      mockPathnameValue = '';
      const mockWindow = { location: { href: '' } };
      Object.defineProperty(window, 'location', {
        value: mockWindow.location,
        writable: true,
      });

      render(<LanguageSwitcher />);

      const dropdownItem = screen.getByTestId('dropdown-item');
      fireEvent.click(dropdownItem);

      expect(mockWindow.location.href).toBe('/pl');
    });

    it('should handle complex path with parameters', () => {
      mockPathnameValue = '/en/portfolio?tab=projects';
      const mockWindow = { location: { href: '' } };
      Object.defineProperty(window, 'location', {
        value: mockWindow.location,
        writable: true,
      });

      render(<LanguageSwitcher />);

      const dropdownItem = screen.getByTestId('dropdown-item');
      fireEvent.click(dropdownItem);

      expect(mockWindow.location.href).toBe('/pl/portfolio?tab=projects');
    });
  });
});
