import './MessageItem.css';
import { Message } from '../types';

interface MessageItemProps {
  message: Message;
  isMarked?: boolean;
}

function MessageItem({ message, isMarked = false }: MessageItemProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const timeString = date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    // Ajouter les centièmes de seconde
    const centiseconds = Math.floor(date.getMilliseconds() / 10)
      .toString()
      .padStart(2, '0');
    return `${timeString}.${centiseconds}`;
  };

  return (
    <div className={`message-item message-${message.type} ${isMarked ? 'message-marked' : ''}`}>
      <div className="message-header">
        {isMarked && <span className="message-badge">⭐ Premier match</span>}
        {message.data.nickname && (
          <div className="message-user">
            {message.data.profilePictureUrl && (
              <img
                src={message.data.profilePictureUrl}
                alt={message.data.nickname}
                className="user-avatar"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <span className="user-name">
              {message.data.nickname}
              {message.data.uniqueId && message.data.uniqueId !== message.data.nickname && (
                <span className="user-pseudo"> @{message.data.uniqueId}</span>
              )}
            </span>
          </div>
        )}
        <span className="message-time">{formatTime(message.timestamp)}</span>
      </div>

      <div className="message-content">
        {message.type === 'chat' && message.data.comment && (
          <p className="comment-text">{message.data.comment}</p>
        )}
        
        {message.type === 'gift' && (
          <div className="gift-info">
            <p><strong>{message.data.giftName}</strong></p>
            {message.data.repeatCount && message.data.repeatCount > 1 && (
              <p className="repeat-count">x{message.data.repeatCount}</p>
            )}
          </div>
        )}

        {message.type === 'like' && message.data.likeCount && (
          <p className="like-count">{message.data.likeCount} likes</p>
        )}

        {message.type === 'error' && message.data.error && (
          <p className="error-text">{message.data.error}</p>
        )}

        {message.type === 'streamEnd' && (
          <p className="stream-end-text">Le stream est terminé</p>
        )}
      </div>
    </div>
  );
}

export default MessageItem;

