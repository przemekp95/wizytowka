import { Injectable, Logger } from '@nestjs/common';
import { OpenAI } from 'openai';
import { PortfolioService } from '../portfolio/portfolio.service';
import { PortfolioItem } from '../portfolio/portfolio.service';
import { v4 as uuidv4 } from 'uuid';

// Define proper types for chat messages
type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private openai: OpenAI;

  private sessions: Map<
    string,
    { messages: ChatMessage[]; lastActivity: Date }
  > = new Map();

  constructor(private readonly portfolioService: PortfolioService) {
    try {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      this.logger.log('OpenAI client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize OpenAI client:', error);
      throw new Error('Invalid OPENAI_API_KEY configuration');
    }
  }

  async sendMessage(
    message: string,
    sessionId?: string,
  ): Promise<{ response: string; sessionId: string }> {
    // Generate session if not provided
    const currentSessionId = sessionId || uuidv4();

    // Clean up old sessions (older than 24 hours)
    this.cleanupOldSessions();

    // Get or create session
    let session = this.sessions.get(currentSessionId);
    if (!session) {
      session = {
        messages: [
          {
            role: 'system',
            content: await this.buildSystemPrompt(),
          },
        ],
        lastActivity: new Date(),
      };
    }

    // Update last activity
    session.lastActivity = new Date();

    // Add user message
    session.messages.push({
      role: 'user',
      content: message,
    });

    try {
      // Get response from OpenAI
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: session.messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      const response =
        completion.choices[0]?.message?.content ||
        'Przepraszam, nie mogę odpowiedzieć w tej chwili.';

      // Add assistant response to session
      session.messages.push({
        role: 'assistant',
        content: response,
      });

      // Store session
      this.sessions.set(currentSessionId, session);

      return {
        response,
        sessionId: currentSessionId,
      };
    } catch (error) {
      this.logger.error('Error communicating with OpenAI:', error);
      return {
        response:
          'Przepraszam, wystąpił błąd podczas przetwarzania Twojej wiadomości.',
        sessionId: currentSessionId,
      };
    }
  }

  private async buildSystemPrompt(): Promise<string> {
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

  private cleanupOldSessions(): void {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now.getTime() - session.lastActivity.getTime() > maxAge) {
        this.sessions.delete(sessionId);
      }
    }
  }
}
