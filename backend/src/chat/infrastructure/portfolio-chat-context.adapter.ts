import { Injectable, Logger } from '@nestjs/common';
import {
  PortfolioItem,
  PortfolioService,
} from '../../portfolio/portfolio.service';
import type { ChatContextPort } from '../application/ports/chat-context.port';

@Injectable()
export class PortfolioChatContextAdapter implements ChatContextPort {
  private readonly logger = new Logger(PortfolioChatContextAdapter.name);

  constructor(private readonly portfolioService: PortfolioService) {}

  async buildSystemPrompt(): Promise<string> {
    let portfolioData: PortfolioItem[] = [];

    try {
      portfolioData = await this.portfolioService.listPublished();
    } catch (error) {
      this.logger.warn('Could not load portfolio data:', error);
    }

    return `
Jesteś AI asystentem na stronie portfolio Przemysława Pietrzaka, polskiego developera oprogramowania.

Twoje zadania:
- Odpowiadać na pytania o umiejętności i doświadczenie techniczne
- Opisywać projekty z portfolio
- Pomagać użytkownikom w nawiązywaniu kontaktu
- Rozmawiać wyłącznie w języku polskim (chyba że użytkownik zapyta po angielsku)
- Być profesjonalnym, ale przyjaznym
- Jeśli nie wiesz odpowiedzi, skierować do sekcji kontaktowej

DANE PORTFOLIO:

PROJEKTY:
${this.formatPortfolioForPrompt(portfolioData)}

TECHNOLOGIE POTWIERDZONE W OPUBLIKOWANYCH PROJEKTACH:
${this.formatTechnologiesForPrompt(portfolioData)}

Nie podawaj procentów, stażu ani czasu trwania projektów, jeśli nie wynikają wprost z danych portfolio.

INFORMACJE DODATKOWE:
- Lokalizacja: Polska (Warszawa/Powiat Włoszakowicki)
- Specjalizacja: Full-stack web development
- Technologie wspólne: Docker dla konteneryzacji, Git dla kontroli wersji
- Kontakt: w razie pytań spoza danych portfolio skieruj użytkownika do formularza kontaktowego

Odpowiedzi powinny być krótkie, profesjonalne i oparte wyłącznie na powyższych danych.
    `;
  }

  private formatPortfolioForPrompt(projects: PortfolioItem[]): string {
    if (projects.length === 0) {
      return 'Brak danych portfolio.';
    }

    return projects
      .map(
        (project) =>
          `- ${project.title}: ${project.desc} (Technologie: ${project.tags.join(', ')})`,
      )
      .join('\n');
  }

  private formatTechnologiesForPrompt(projects: PortfolioItem[]): string {
    const technologies = [
      ...new Set(projects.flatMap((project) => project.tags)),
    ]
      .map((technology) => technology.trim())
      .filter(Boolean)
      .sort((left, right) => left.localeCompare(right));

    return technologies.length > 0
      ? technologies.join(', ')
      : 'Brak potwierdzonych danych o technologiach.';
  }
}
