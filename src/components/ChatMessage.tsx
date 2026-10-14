import RobotProfilePicture from '../assets/robot.png';
import UserProfilePicture from '../assets/user.png';
import type { Message } from '../types/chat';

type ChatMessageProps = Pick<Message, 'text' | 'sender'>;

export function ChatMessage({ text, sender }: ChatMessageProps) {
  return (
    <div className={sender === 'user' ? 'chat-input-user' : 'chat-input-robot'}>
      {sender === 'robot' && (
        <img src={RobotProfilePicture} alt="Chatbot" className="chat-message-profile" />
      )}
      <div className="chat-message-text">{text}</div>
      {sender === 'user' && (
        <img src={UserProfilePicture} alt="You" className="chat-message-profile" />
      )}
    </div>
  );
}
