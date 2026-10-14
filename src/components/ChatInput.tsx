import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

type ChatInputProps = {
  onSend: (text: string) => Promise<boolean>;
  isLoading: boolean;
};

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [savedInput, setSavedInput] = useState('');

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setSavedInput(event.target.value);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = savedInput.trim();
    if (!text || isLoading) return;

    setSavedInput('');
    const sent = await onSend(text);
    if (!sent) {
      // Keep any new draft the user has started typing.
      setSavedInput((draft) => draft || text);
    }
  }

  return (
    <div>
      <form className="chat-input-container" onSubmit={handleSubmit}>
        <input
          type="text"
          aria-label="Message to chatbot"
          placeholder="Send a message to chatbot"
          onChange={handleChange}
          value={savedInput}
          className="chat-input"
        />
        <button
          type="submit"
          disabled={isLoading || !savedInput.trim()}
          className="send-btn"
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
