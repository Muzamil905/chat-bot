import { useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import type { Message } from '../types/chat';

type ChatMessagesProps = {
  chatMessages: Message[];
};

export function ChatMessages({ chatMessages }: ChatMessagesProps) {
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = chatMessagesRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [chatMessages]);

  return (
    <div className="chat-messages-container" ref={chatMessagesRef} role="log" aria-label="Conversation">
      {chatMessages.map((message) => (
        <ChatMessage text={message.text} sender={message.sender} key={message.id} />
      ))}
    </div>
  );
}
