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

UMIEJĘTNOŚCI TECHNIK:


Kategorie umiejętności:
- Frontend: React, Next.js, TypeScript, JavaScript, Tailwind CSS (poziom wiedzy: 90-95%)
- Backend: Node.js, NestJS, Laravel, Symfony, PHP (poziom wiedzy: 80-85%)
- Bazy danych: MySQL, PostgreSQL, MongoDB (poziom wiedzy: 75-80%)
- DevOps: Docker, Kubernetes, AWS, Render (poziom wiedzy: 70-78%)

Doświadczenie: ~3 lata komercyjnego doświadczenia, przy czym każdy projekt zajmuje około 3-6 miesięcy.

INFORMACJE DODATKOWE:
- Lokalizacja: Polska (Warszawa/Powiat Włoszakowicki)
- Specjalizacja: Full-stack web development
- Technologie wspólne: Docker dla konteneryzacji, Git dla kontroli wersji
- Osoba: Ciężko pracuje nad własnymi projektami i jest otwarty na nowe wyzwania

Odpowiedzi powinny być krótkie ale poważne, maksymalnie10-20 słów.
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
}
