import { createServer } from 'node:http';
import { ChatError, requestGeminiReply } from './gemini.ts';
import type { ChatTurn } from './gemini.ts';

const port = Number(process.env.PORT ?? 3001);
const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY?.trim());

function parseMessages(body: unknown): ChatTurn[] {
  if (typeof body !== 'object' || body === null || !('messages' in body) ||
    !Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > 80) {
    throw new ChatError(400, 'Send between 1 and 80 messages.');
  }

  const messages = body.messages.map((message: unknown): ChatTurn => {
    if (typeof message !== 'object' || message === null ||
      !('sender' in message) || (message.sender !== 'user' && message.sender !== 'robot') ||
      !('text' in message) || typeof message.text !== 'string' ||
      !message.text.trim() || message.text.length > 12000) {
      throw new ChatError(400, 'Each message needs a valid sender and 1–12,000 characters of text.');
    }
    return { sender: message.sender, text: message.text.trim() };
  });
  if (messages[0].sender !== 'user' || messages.at(-1)?.sender !== 'user') {
    throw new ChatError(400, 'The conversation must start and end with a user message.');
  }
  return messages;
}

const server = createServer(async (request, response) => {
  response.setHeader('Content-Type', 'application/json');

  if (request.url !== '/api/chat') {
    response.writeHead(404);
    response.end(JSON.stringify({ error: 'Endpoint not found.' }));
    return;
  }
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.writeHead(405);
    response.end(JSON.stringify({ error: 'Use POST to send a chat message.' }));
    return;
  }
  if (!request.headers['content-type']?.includes('application/json')) {
    response.writeHead(415);
    response.end(JSON.stringify({ error: 'Send the request as application/json.' }));
    return;
  }

  try {
    const chunks: Buffer[] = [];
    let bytes = 0;
    for await (const chunk of request.iterator({ destroyOnReturn: false })) {
      const buffer = Buffer.from(chunk);
      bytes += buffer.length;
      if (bytes > 128 * 1024) throw new ChatError(413, 'The conversation is too large. Start a new chat.');
      chunks.push(buffer);
    }
    let body: unknown;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      throw new ChatError(400, 'The request body must be valid JSON.');
    }
    const messages = parseMessages(body);
    const reply = await requestGeminiReply(messages);
    response.writeHead(200);
    response.end(JSON.stringify({ reply }));
  } catch (cause) {
    request.resume();
    response.writeHead(cause instanceof ChatError ? cause.status : 500);
    response.end(JSON.stringify({
      error: cause instanceof ChatError ? cause.message : 'The server could not process this request.',
    }));
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Chat server listening at http://127.0.0.1:${port}`);
  console.log(hasGeminiKey
    ? 'Gemini key loaded. Chat requests will now be sent to Google.'
    : 'Gemini key missing. Add it to server/.env and restart the server.');
});
