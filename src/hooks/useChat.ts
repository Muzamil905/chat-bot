import { useRef, useState } from 'react';
import { getChatReply } from '../services/chatApi';
import type { Conversation, Message } from '../types/chat';

function makeConversation(): Conversation {
  return { id: crypto.randomUUID(), title: 'New conversation', messages: [], error: null };
}

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>(() => [makeConversation()]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const requestPending = useRef(false);
  const activeConversation = conversations.find((chat) => chat.id === activeId) ?? conversations[0];

  function newConversation() {
    const conversation = makeConversation();
    setConversations((previous) => [conversation, ...previous]);
    setActiveId(conversation.id);
  }

  function selectConversation(id: string) {
    setActiveId(id);
  }

  async function sendMessage(input: string): Promise<boolean> {
    const text = input.trim();
    if (!text || requestPending.current) return false;

    const conversationId = activeConversation.id;
    const userMessage: Message = { id: crypto.randomUUID(), sender: 'user', text };
    const replyId = crypto.randomUUID();
    const loadingMessage: Message = { id: replyId, sender: 'robot', text: 'Thinking…' };
    const history = [...activeConversation.messages, userMessage];

    requestPending.current = true;
    setIsLoading(true);
    setConversations((previous) => previous.map((chat) => chat.id === conversationId ? {
      ...chat,
      title: chat.messages.length === 0 ? text.slice(0, 40) : chat.title,
      messages: [...history, loadingMessage],
      error: null,
    } : chat));

    try {
      const reply = await getChatReply(history);
      setConversations((previous) => previous.map((chat) => chat.id === conversationId ? {
        ...chat,
        messages: chat.messages.map((message) => message.id === replyId ? { ...message, text: reply } : message),
      } : chat));
      return true;
    } catch (cause) {
      setConversations((previous) => previous.map((chat) => chat.id === conversationId ? {
        ...chat,
        messages: chat.messages.filter((message) => message.id !== replyId),
        error: cause instanceof Error ? cause.message : 'Could not get a reply. Please try again.',
      } : chat));
      return false;
    } finally {
      requestPending.current = false;
      setIsLoading(false);
    }
  }

  return {
    conversations, activeConversation, isLoading, sendMessage,
    newConversation, selectConversation,
  };
}
