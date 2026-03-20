import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatBot } from '../ChatBot';

const translations = {
  openButtonLabel: 'Open chat with AI assistant',
  closeButtonLabel: 'Close chat',
  sendButtonLabel: 'Send message',
  welcomeMessage: 'Hello!',
  errorMessage: 'Chat error',
  placeholder: 'Type a message...',
  title: 'AI Assistant',
  subtitle: 'Portfolio',
  tooltip: 'Talk with AI',
};

describe('ChatBot', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      value: vi.fn(),
      configurable: true,
    });
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('uses the same-origin /api/chat route for messages', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ response: 'Cześć', sessionId: 'session-123' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    render(<ChatBot locale="en" translations={translations} />);

    await userEvent.click(screen.getByLabelText(/open chat with ai assistant/i));

    const input = screen.getByPlaceholderText('Type a message...');
    await userEvent.type(input, 'Hello there');
    await userEvent.click(screen.getByLabelText(/send message/i));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/chat',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    expect(await screen.findByText('Cześć')).toBeInTheDocument();
  });
});
