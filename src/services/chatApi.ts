import type { Message } from '../types/chat';

// The browser calls our server; only the server sends the key to Google.
export async function getChatReply(messages: Message[]): Promise<string> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });

  if (response.status === 404 || !response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('Gemini is not connected yet. Your message is here; replies will work once the server is ready.');
  }
  const data: unknown = await response.json();
  if (!response.ok) {
    const message = typeof data === 'object' && data !== null &&
      'error' in data && typeof data.error === 'string'
      ? data.error
      : 'Could not get a reply. Please try again in a moment.';
    throw new Error(message);
  }
  if (
    typeof data !== 'object' || data === null ||
    !('reply' in data) || typeof data.reply !== 'string' || !data.reply.trim()
  ) {
    throw new Error('The server returned an invalid reply. Please try again.');
  }
  return data.reply;
}
