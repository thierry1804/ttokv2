import './MessageList.css';
import { Message } from '../types';
import MessageItem from './MessageItem';

interface MessageListProps {
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

function MessageList({ messages, messagesEndRef }: MessageListProps) {
  return (
    <div className="message-list-container">
      <div className="message-list-header">
        <h2>Messages ({messages.length})</h2>
      </div>
      <div className="message-list">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>📭 Aucun message pour le moment</p>
            <p className="hint">Démarrez l'écoute d'un live TikTok pour voir les messages apparaître ici</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageItem key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
    </div>
  );
}

export default MessageList;

