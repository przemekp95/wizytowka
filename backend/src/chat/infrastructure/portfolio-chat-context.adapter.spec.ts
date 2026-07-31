import { PortfolioService } from '../../portfolio/portfolio.service';
import { PortfolioChatContextAdapter } from './portfolio-chat-context.adapter';

describe('PortfolioChatContextAdapter', () => {
  it('uses published portfolio facts without inventing proficiency or experience numbers', async () => {
    const portfolioService = {
      listPublished: jest.fn().mockResolvedValue([
        {
          title: 'Wizytówka',
          desc: 'Publiczne portfolio',
          tags: ['Next.js', 'NestJS'],
        },
      ]),
    } as unknown as PortfolioService;
    const adapter = new PortfolioChatContextAdapter(portfolioService);

    const prompt = await adapter.buildSystemPrompt();

    expect(prompt).toContain('Wizytówka: Publiczne portfolio');
    expect(prompt).not.toMatch(/\d+\s*%|~?3 lata|3-6 miesięcy|poziom wiedzy/i);
    expect(prompt).not.toContain('Ciężko pracuje');
  });
});
