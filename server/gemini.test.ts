import assert from 'node:assert/strict';
import test from 'node:test';
import { ChatError, requestGeminiReply } from './gemini.ts';

test('Gemini requests and errors', async (t) => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-key';

  try {
    await t.test('sends history, merges repeated roles, and excludes thought text', async () => {
      globalThis.fetch = async (_url, options) => {
        assert.equal(options?.method, 'POST');
        assert.equal((options?.headers as Record<string, string>)['x-goog-api-key'], 'test-key');
        const payload = JSON.parse(String(options?.body));
        assert.deepEqual(payload.contents, [
          { role: 'user', parts: [{ text: 'Hello' }, { text: 'Try again' }] },
          { role: 'model', parts: [{ text: 'Hi' }] },
          { role: 'user', parts: [{ text: 'What next?' }] },
        ]);
        return Response.json({ candidates: [{ content: { parts: [
          { thought: true, text: 'Internal thought' }, { text: 'A real ' }, { text: 'reply.' },
        ] } }] });
      };
      assert.equal(await requestGeminiReply([
        { sender: 'user', text: 'Hello' }, { sender: 'user', text: 'Try again' },
        { sender: 'robot', text: 'Hi' }, { sender: 'user', text: 'What next?' },
      ]), 'A real reply.');
    });

    await t.test('quota errors are useful and do not expose upstream secrets', async () => {
      globalThis.fetch = async () => Response.json({ error: { message: 'test-key' } }, { status: 429 });
      await assert.rejects(() => requestGeminiReply([{ sender: 'user', text: 'Hello' }]),
        (error: unknown) => error instanceof ChatError && error.status === 429 &&
          error.message.includes('usage limit') && !error.message.includes('test-key'));
    });

    await t.test('missing keys are handled before contacting Google', async () => {
      delete process.env.GEMINI_API_KEY;
      globalThis.fetch = async () => { throw new Error('Should not fetch'); };
      await assert.rejects(() => requestGeminiReply([{ sender: 'user', text: 'Hello' }]),
        (error: unknown) => error instanceof ChatError && error.status === 503);
      process.env.GEMINI_API_KEY = 'test-key';
    });

    await t.test('empty responses are handled', async () => {
      globalThis.fetch = async () => Response.json({ candidates: [] });
      await assert.rejects(() => requestGeminiReply([{ sender: 'user', text: 'Hello' }]), /no text reply/);
    });

    await t.test('timeouts are handled', async () => {
      globalThis.fetch = async () => {
        const error = new Error('Timeout');
        error.name = 'TimeoutError';
        throw error;
      };
      await assert.rejects(() => requestGeminiReply([{ sender: 'user', text: 'Hello' }]),
        (error: unknown) => error instanceof ChatError && error.status === 504);
    });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
  }
});
