export type ChatTurn = {
  sender: 'user' | 'robot';
  text: string;
};

type GeminiContent = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

export class ChatError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function requestGeminiReply(messages: ChatTurn[]): Promise<string> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new ChatError(503, 'Add your Gemini key to server/.env and restart the server.');

  const contents: GeminiContent[] = [];
  for (const message of messages) {
    const role = message.sender === 'user' ? 'user' : 'model';
    const previous = contents.at(-1);
    // Failed requests can leave consecutive user messages in the history.
    if (previous?.role === role) previous.parts.push({ text: message.text });
    else contents.push({ role, parts: [{ text: message.text }] });
  }

  let response: Response;
  let data: unknown;
  try {
    response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: 2048 } }),
      signal: AbortSignal.timeout(45000),
    });
    data = await response.json();
  } catch (cause) {
    if (cause instanceof Error && (cause.name === 'TimeoutError' || cause.name === 'AbortError')) {
      throw new ChatError(504, 'Gemini took too long to reply. Please try again.');
    }
    throw new ChatError(502, 'Could not reach Gemini. Check your connection and try again.');
  }

  if (!response.ok) {
    // Use our own messages so upstream errors cannot expose credentials.
    if (response.status === 429) throw new ChatError(429, 'Gemini usage limit reached. Wait a while and try again.');
    if (response.status === 401 || response.status === 403) {
      throw new ChatError(502, 'Google rejected access. Check your Gemini key and its API permissions.');
    }
    if (response.status === 404) throw new ChatError(502, 'This Gemini model is unavailable for your account.');
    throw new ChatError(502, 'Gemini could not process this request. Please try again.');
  }

  const candidates = isRecord(data) ? data.candidates : undefined;
  const first = Array.isArray(candidates) ? candidates[0] : undefined;
  const content = isRecord(first) ? first.content : undefined;
  const parts = isRecord(content) ? content.parts : undefined;
  const reply = Array.isArray(parts)
    ? parts.filter((part) => isRecord(part) && part.thought !== true && typeof part.text === 'string')
      .map((part) => part.text).join('').trim()
    : '';

  if (!reply) throw new ChatError(502, 'Gemini returned no text reply. Try rephrasing your message.');
  return reply;
}
