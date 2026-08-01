import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SkillBar } from '../SkillBar';

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get:
        (_target, tag: string) =>
        ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
          const Component = tag as keyof React.JSX.IntrinsicElements;
          const domProps = Object.fromEntries(
            Object.entries(props).filter(
              ([key]) => !['initial', 'animate', 'transition'].includes(key)
            )
          );
          return <Component {...domProps}>{children}</Component>;
        },
    }
  ),
}));

describe('SkillBar', () => {
  it('uses high-contrast labels on the dark skills section', () => {
    render(
      <SkillBar
        locale="en"
        maxProjects={6}
        skill={{
          id: 'typescript',
          name: 'TypeScript',
          projectCount: 6,
          category: 'frontEnd',
        }}
      />
    );

    expect(screen.getByText('6 projects')).toHaveClass('text-indigo-300');
    expect(screen.getByText('Used in 6 projects')).toHaveClass('text-slate-300');
  });
});
