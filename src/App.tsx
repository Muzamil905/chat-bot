import { useState } from 'react';
import { ChatMessages } from './components/ChatMessages';
import { ChatInput } from './components/ChatInput';
import { Sidebar } from './components/layout/Sidebar';
import { AnimatedBackground } from './components/layout/AnimatedBackground';
import { useChat } from './hooks/useChat';
import './App.css';

function App() {
  const { conversations, activeConversation, isLoading, sendMessage, newConversation, selectConversation } = useChat();
  const [animationPaused, setAnimationPaused] = useState(false);

  return (
    <div className="app-shell">
      <AnimatedBackground paused={animationPaused} />
      <Sidebar conversations={conversations} activeId={activeConversation.id}
        onNewChat={newConversation} onSelect={selectConversation}
        animationPaused={animationPaused} onToggleAnimation={() => setAnimationPaused((paused) => !paused)} />
      <main className="workspace" id="main-chat">
        <header className="workspace-header">
          <span>Your workspace</span>
          <span className="connection-status"><span aria-hidden="true" />Powered by Gemini</span>
        </header>
        <div className="app-container">
          {activeConversation.messages.length === 0 ? (
            <section className="welcome-screen">
              <div className="welcome-symbol" aria-hidden="true">✦</div>
              <p className="eyebrow">A LITTLE SPACE TO THINK</p>
              <h1>Big ideas.<br /><span>One conversation away.</span></h1>
              <p className="welcome-description">A place to explore, learn, and make something new.</p>
              <div className="setup-note">Ask a question, explore an idea, or learn something new.</div>
            </section>
          ) : <ChatMessages chatMessages={activeConversation.messages} />}
          {activeConversation.error && <p className="chat-error" role="alert">{activeConversation.error}</p>}
          <ChatInput key={activeConversation.id} onSend={sendMessage} isLoading={isLoading} />
          <p className="composer-note">AI can make mistakes. Check important information.</p>
        </div>
      </main>
    </div>
  );
}

export default App;
