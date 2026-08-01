import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PortfolioSection from '../PortfolioSection';

vi.mock('next/image', () => ({
  default: ({ alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  motion: new Proxy(
    {},
    {
      get:
        (_target, tag: string) =>
        ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
          const Component = tag as keyof React.JSX.IntrinsicElements;
          const domProps = Object.fromEntries(
            Object.entries(props).filter(
              ([key]) =>
                !['initial', 'animate', 'exit', 'transition', 'whileHover', 'viewport'].includes(
                  key
                )
            )
          );
          return <Component {...domProps}>{children}</Component>;
        },
    }
  ),
}));

describe('PortfolioSection', () => {
  it('renders a project with an empty href as text instead of a link', () => {
    render(
      <PortfolioSection
        locale="en"
        translations={{ title: 'Portfolio', technologies: 'Technologies' }}
        items={[
          {
            _id: 'private-project',
            title: 'Private project',
            slug: 'private-project',
            href: '',
            desc: 'Private project description',
            tags: ['TypeScript'],
            img: '/project.png',
          },
        ]}
      />
    );

    const heading = screen.getByRole('heading', { name: 'Private project' });
    expect(heading).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Private project' })).not.toBeInTheDocument();
    expect(heading.querySelector('a')).not.toBeInTheDocument();
    expect(screen.getByText('Private project description')).toHaveClass('text-slate-700');
  });
});
