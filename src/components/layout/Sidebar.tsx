import type { Conversation } from '../../types/chat';

type SidebarProps = {
  conversations: Conversation[];
  activeId: string;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  animationPaused: boolean;
  onToggleAnimation: () => void;
};

export function Sidebar({ conversations, activeId, onNewChat, onSelect, animationPaused, onToggleAnimation }: SidebarProps) {
  return (
    <aside className="sidebar" aria-label="Chat navigation">
      <a className="brand" href="#main-chat"><span className="brand-mark" aria-hidden="true">✦</span> Orbit <span className="brand-tag">CHAT</span></a>
      <button className="new-chat-btn" onClick={onNewChat}><span aria-hidden="true">＋</span> New chat</button>
      <div className="history-heading">YOUR CONVERSATIONS</div>
      <nav className="conversation-list" aria-label="Conversations">
        {conversations.map((chat) => (
          <button key={chat.id} className={`conversation-btn ${chat.id === activeId ? 'active' : ''}`}
            aria-current={chat.id === activeId ? 'page' : undefined} onClick={() => onSelect(chat.id)}>
            <span aria-hidden="true">◌</span><span className="conversation-title">{chat.title}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button className="motion-btn" aria-pressed={animationPaused} onClick={onToggleAnimation}>
          {animationPaused ? 'Resume background' : 'Pause background'}
        </button>
        <p>Chats stay in this session.<br />Refresh starts a fresh workspace.</p>
      </div>
    </aside>
  );
}
