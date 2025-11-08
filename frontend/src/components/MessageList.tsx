import './MessageList.css';
import { Message } from '../types';
import MessageItem from './MessageItem';

interface MessageListProps {
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

function MessageList({ messages, messagesEndRef }: MessageListProps) {
  // Fonction pour détecter si un message correspond au pattern
  const matchesPattern = (comment: string | undefined): boolean => {
    if (!comment) return false;
    // Pattern: "jp" suivi de chiffres (jp1, jp2, jp10, etc.) ou juste des chiffres (1, 2, 10, etc.)
    const jpPattern = /\bjp\d+\b/i; // "jp" suivi de chiffres
    const numberPattern = /^\d+$/; // Juste des chiffres
    return jpPattern.test(comment) || numberPattern.test(comment.trim());
  };

  // Trouver l'index du premier message qui correspond au pattern
  const firstMatchIndex = messages.findIndex(
    (msg) => msg.type === 'chat' && matchesPattern(msg.data.comment)
  );

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
            {messages.map((message, index) => (
              <MessageItem 
                key={message.id} 
                message={message} 
                isMarked={index === firstMatchIndex}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
    </div>
  );
}

export default MessageList;

