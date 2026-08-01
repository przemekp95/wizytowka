import {
  toPublicPortfolioDeleteResponse,
  toPublicPortfolioItem,
  toPublicPortfolioListResponse,
  toPublicPortfolioMutationResponse,
} from './portfolio.public-response';

describe('portfolio public response mapping', () => {
  const portfolioItem = {
    _id: 'item-1',
    title: 'Project One',
    title_en: 'Project One EN',
    slug: 'project-one',
    href: '/portfolio/project-one',
    desc: 'Testowy opis projektu portfolio.',
    desc_en: 'English description.',
    problem: 'Problem projektu.',
    problem_en: 'Project problem.',
    role: 'Implementacja full-stack.',
    role_en: 'Full-stack implementation.',
    decisions: ['Decyzja pierwsza.', 'Decyzja druga.'],
    decisions_en: ['Decision one.', 'Decision two.'],
    result: 'Zweryfikowany wynik.',
    result_en: 'Verified result.',
    tags: ['NestJS', 'MongoDB'],
    img: 'https://example.com/image.jpg',
    isLogo: false,
    newTech: true,
    order: 1,
    status: 'published' as const,
    createdAt: new Date('2026-03-20T10:00:00.000Z'),
    updatedAt: new Date('2026-03-20T10:00:00.000Z'),
    repoUrl: 'https://github.com/user/project-one',
  };

  it('maps a portfolio domain item to the public item shape', () => {
    expect(toPublicPortfolioItem(portfolioItem)).toEqual({
      _id: 'item-1',
      title: 'Project One',
      title_en: 'Project One EN',
      slug: 'project-one',
      href: '/portfolio/project-one',
      desc: 'Testowy opis projektu portfolio.',
      desc_en: 'English description.',
      problem: 'Problem projektu.',
      problem_en: 'Project problem.',
      role: 'Implementacja full-stack.',
      role_en: 'Full-stack implementation.',
      decisions: ['Decyzja pierwsza.', 'Decyzja druga.'],
      decisions_en: ['Decision one.', 'Decision two.'],
      result: 'Zweryfikowany wynik.',
      result_en: 'Verified result.',
      tags: ['NestJS', 'MongoDB'],
      img: 'https://example.com/image.jpg',
      isLogo: false,
      newTech: true,
      order: 1,
      status: 'published',
      createdAt: new Date('2026-03-20T10:00:00.000Z'),
      updatedAt: new Date('2026-03-20T10:00:00.000Z'),
      repoUrl: 'https://github.com/user/project-one',
    });
  });

  it('maps list and mutation responses explicitly', () => {
    expect(toPublicPortfolioListResponse([portfolioItem])).toEqual({
      ok: true,
      items: [toPublicPortfolioItem(portfolioItem)],
    });
    expect(toPublicPortfolioMutationResponse(portfolioItem)).toEqual({
      ok: true,
      item: toPublicPortfolioItem(portfolioItem),
    });
  });

  it('maps delete responses explicitly', () => {
    expect(toPublicPortfolioDeleteResponse()).toEqual({
      ok: true,
      deleted: true,
    });
  });
});
