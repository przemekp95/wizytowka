import { render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CustomCursor } from '../CustomCursor';

vi.mock('framer-motion', () => ({
  motion: { div: (props: React.HTMLAttributes<HTMLDivElement>) => <div {...props} /> },
  useMotionValue: () => ({ set: vi.fn() }),
  useSpring: () => 0,
}));

function mockMedia({
  finePointer,
  reducedMotion,
}: {
  finePointer: boolean;
  reducedMotion: boolean;
}) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? reducedMotion : finePointer,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

afterEach(() => {
  document.body.classList.remove('custom-cursor-active');
  document.body.style.cursor = '';
  document.getElementById('custom-cursor-styles')?.remove();
  vi.unstubAllGlobals();
});

describe('CustomCursor', () => {
  it('activates only for a fine hover pointer without reduced motion', async () => {
    mockMedia({ finePointer: true, reducedMotion: false });
    render(<CustomCursor />);

    await waitFor(() => expect(document.body).toHaveClass('custom-cursor-active'));
    expect(document.body.style.cursor).toBe('none');
  });

  it.each([
    { finePointer: false, reducedMotion: false },
    { finePointer: true, reducedMotion: true },
  ])('keeps the native cursor for $finePointer/$reducedMotion media settings', async (media) => {
    mockMedia(media);
    render(<CustomCursor />);

    await waitFor(() => expect(document.body).not.toHaveClass('custom-cursor-active'));
    expect(document.body.style.cursor).not.toBe('none');
  });
});
