import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CreatePortfolioItemDto,
  UpdatePortfolioItemDto,
} from './dto/portfolio-rest.dto';

describe('Portfolio REST validation contracts', () => {
  it('accepts valid create payload and normalizes tags', async () => {
    const payload = plainToInstance(CreatePortfolioItemDto, {
      title: 'Project One',
      slug: 'project-one',
      href: '/portfolio/project-one',
      desc: 'To jest poprawny opis projektu portfolio.',
      problem: 'Problem projektu.',
      problem_en: 'Project problem.',
      role: 'Implementacja full-stack.',
      role_en: 'Full-stack implementation.',
      decisions: '["Decyzja pierwsza.", "Decyzja druga."]',
      decisions_en: 'Decision one., Decision two.',
      result: 'Zweryfikowany wynik.',
      result_en: 'Verified result.',
      tags: 'NestJS, MongoDB',
      img: 'https://example.com/image.jpg',
      status: 'published',
      order: '2',
      isLogo: 'true',
    });

    await expect(validate(payload)).resolves.toHaveLength(0);
    expect(payload.tags).toEqual(['NestJS', 'MongoDB']);
    expect(payload.order).toBe(2);
    expect(payload.isLogo).toBe(true);
    expect(payload.decisions).toEqual(['Decyzja pierwsza.', 'Decyzja druga.']);
    expect(payload.decisions_en).toEqual(['Decision one.', 'Decision two.']);
  });

  it('rejects create payload without required fields', async () => {
    const payload = plainToInstance(CreatePortfolioItemDto, {
      title: 'A',
      slug: '',
      href: '',
      desc: 'short',
      tags: [],
    });

    const errors = await validate(payload);

    expect(errors.some((error) => error.property === 'title')).toBe(true);
    expect(errors.some((error) => error.property === 'slug')).toBe(true);
    expect(errors.some((error) => error.property === 'desc')).toBe(true);
  });

  it('accepts partial update payload', async () => {
    const payload = plainToInstance(UpdatePortfolioItemDto, {
      title: 'Updated title',
      tags: 'React,TypeScript',
      newTech: 'false',
    });

    await expect(validate(payload)).resolves.toHaveLength(0);
    expect(payload.tags).toEqual(['React', 'TypeScript']);
    expect(payload.newTech).toBe(false);
  });
});
