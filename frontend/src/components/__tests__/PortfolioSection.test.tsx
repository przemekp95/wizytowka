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
    expect(screen.getByText('Private project description')).toHaveClass('text-slate-300');
  });

  it('renders a localized case study as goal, scope, decisions, outcome, stack, and evidence', () => {
    const caseStudyFields = {
      problem: 'Polski problem.',
      problem_en: 'An English problem.',
      role: 'Polska rola.',
      role_en: 'An English role.',
      decisions: ['Polska decyzja 1.', 'Polska decyzja 2.'],
      decisions_en: ['English decision one.', 'English decision two.'],
      result: 'Polski wynik.',
      result_en: 'An English result.',
    };

    render(
      <PortfolioSection
        locale="en"
        translations={{ title: 'Selected case studies' }}
        items={[
          {
            _id: 'case-study',
            title: 'Studium przypadku',
            title_en: 'Case study',
            slug: 'case-study',
            href: 'https://example.com',
            repoUrl: 'https://github.com/example/case-study',
            desc: 'Polski opis.',
            desc_en: 'English summary.',
            tags: ['TypeScript'],
            img: '/project.png',
            ...caseStudyFields,
          },
        ]}
      />
    );

    expect(screen.getByRole('heading', { name: 'Case study' })).toBeInTheDocument();
    expect(screen.getByText('Project goal')).toBeInTheDocument();
    expect(screen.getByText('An English problem.')).toBeInTheDocument();
    expect(screen.getByText('My scope')).toBeInTheDocument();
    expect(screen.getByText('An English role.')).toBeInTheDocument();
    expect(screen.getByText('What I did')).toBeInTheDocument();
    expect(screen.getByText('English decision one.')).toBeInTheDocument();
    expect(screen.getByText('Outcome')).toBeInTheDocument();
    expect(screen.getByText('An English result.')).toBeInTheDocument();
    expect(screen.getByText('Stack')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View project' })).toHaveAttribute(
      'href',
      'https://example.com'
    );
    expect(screen.getByRole('link', { name: 'Code on GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/example/case-study'
    );
  });
});
