export type Message = {
  id: string;
  sender: 'user' | 'robot';
  text: string;
};

export type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  error: string | null;
};
