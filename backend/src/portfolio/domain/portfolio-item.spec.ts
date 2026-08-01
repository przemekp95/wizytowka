import { PortfolioItemAggregate } from './portfolio-item';

describe('PortfolioItemAggregate', () => {
  it('rejects a published item without a complete evidence-backed case study', () => {
    expect(() =>
      PortfolioItemAggregate.createNew({
        title: 'Incomplete project',
        slug: 'incomplete-project',
        href: '',
        desc: 'Opis niekompletnego projektu.',
        tags: ['TypeScript'],
        img: 'https://example.com/image.jpg',
        status: 'published',
      }),
    ).toThrow('complete case-study fields');
  });

  it('creates a normalized new portfolio item', () => {
    const item = PortfolioItemAggregate.createNew({
      title: '  Project One  ',
      title_en: '  Project One EN  ',
      slug: '  project-one  ',
      href: '  /portfolio/project-one  ',
      desc: '  Testowy opis projektu.  ',
      desc_en: '  English description.  ',
      problem: '  Problem projektu.  ',
      problem_en: '  Project problem.  ',
      role: '  Implementacja full-stack.  ',
      role_en: '  Full-stack implementation.  ',
      decisions: [' Decyzja pierwsza. ', ' Decyzja druga. '],
      decisions_en: [' Decision one. ', ' Decision two. '],
      result: '  Zweryfikowany wynik.  ',
      result_en: '  Verified result.  ',
      tags: [' React ', 'TypeScript', '   '],
      img: '  https://example.com/image.jpg  ',
      isLogo: false,
      newTech: true,
      order: 1,
      status: 'published',
      repoUrl: '  https://github.com/user/project-one  ',
    }).toObject();

    expect(item).toEqual(
      expect.objectContaining({
        title: 'Project One',
        title_en: 'Project One EN',
        slug: 'project-one',
        href: '/portfolio/project-one',
        desc: 'Testowy opis projektu.',
        desc_en: 'English description.',
        problem: 'Problem projektu.',
        problem_en: 'Project problem.',
        role: 'Implementacja full-stack.',
        role_en: 'Full-stack implementation.',
        decisions: ['Decyzja pierwsza.', 'Decyzja druga.'],
        decisions_en: ['Decision one.', 'Decision two.'],
        result: 'Zweryfikowany wynik.',
        result_en: 'Verified result.',
        tags: ['React', 'TypeScript'],
        img: 'https://example.com/image.jpg',
        repoUrl: 'https://github.com/user/project-one',
      }),
    );
    expect(item._id).toBeTruthy();
    expect(item.createdAt).toBeInstanceOf(Date);
    expect(item.updatedAt).toBeInstanceOf(Date);
  });

  it('applies partial updates while preserving identity and creation time', () => {
    const existing = PortfolioItemAggregate.fromPersistence({
      _id: 'item-1',
      title: 'Project One',
      slug: 'project-one',
      href: '/portfolio/project-one',
      desc: 'Opis projektu.',
      tags: ['NestJS'],
      img: 'https://example.com/image.jpg',
      createdAt: new Date('2026-03-20T12:00:00.000Z'),
      updatedAt: new Date('2026-03-20T12:00:00.000Z'),
      status: 'draft',
    });

    const updated = existing
      .applyUpdate({
        title: '  Updated title  ',
        tags: [' React ', ' TypeScript '],
        repoUrl: '  https://github.com/user/project-one  ',
      })
      .toObject();

    expect(updated).toEqual(
      expect.objectContaining({
        _id: 'item-1',
        title: 'Updated title',
        tags: ['React', 'TypeScript'],
        repoUrl: 'https://github.com/user/project-one',
        createdAt: new Date('2026-03-20T12:00:00.000Z'),
      }),
    );
    expect(updated.updatedAt).toBeInstanceOf(Date);
  });
});
