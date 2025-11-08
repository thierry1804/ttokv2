import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';
import MessageList from './components/MessageList';
import ControlPanel from './components/ControlPanel';
import { Message } from './types';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3002';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [uniqueId, setUniqueId] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [viewerCount, setViewerCount] = useState<number | null>(null);
  const [likeCount, setLikeCount] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ Connecté au serveur WebSocket');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Gérer les statistiques séparément
        if (data.type === 'stats') {
          if (data.data.viewerCount !== undefined) {
            setViewerCount(data.data.viewerCount);
          }
          if (data.data.totalLikeCount !== undefined) {
            setLikeCount(data.data.totalLikeCount);
          }
          return; // Ne pas ajouter les stats aux messages
        }
        
        const newMessage: Message = {
          id: `${data.type}-${Date.now()}-${Math.random()}`,
          type: data.type,
          timestamp: data.timestamp,
          data: data.data,
        };
        setMessages((prev) => [...prev, newMessage]);
      } catch (error) {
        console.error('Erreur lors du parsing du message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('Erreur WebSocket:', error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('❌ Déconnecté du serveur WebSocket');
      setIsConnected(false);
    };
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  };

  const startListening = async () => {
    if (!uniqueId.trim()) {
      alert('Veuillez entrer un uniqueId TikTok');
      return;
    }

    try {
      await axios.post(`${API_URL}/api/tiktok/start`, { uniqueId });
      setIsListening(true);
      connectWebSocket();
    } catch (error: any) {
      console.error('Erreur lors du démarrage:', error);
      alert(`Erreur: ${error.response?.data?.error || error.message}`);
    }
  };

  const stopListening = async () => {
    if (!uniqueId.trim()) {
      return;
    }

    try {
      await axios.post(`${API_URL}/api/tiktok/stop`, { uniqueId });
      setIsListening(false);
      setViewerCount(null);
      setLikeCount(null);
      disconnectWebSocket();
    } catch (error: any) {
      console.error('Erreur lors de l\'arrêt:', error);
      alert(`Erreur: ${error.response?.data?.error || error.message}`);
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setViewerCount(null);
    setLikeCount(null);
  };

  useEffect(() => {
    // Auto-connect on mount
    connectWebSocket();

    return () => {
      disconnectWebSocket();
    };
  }, []);

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>🎵 TikTok Live Messages</h1>
          <p className="subtitle">Affichage en temps réel des messages de live TikTok</p>
        </header>

        <ControlPanel
          uniqueId={uniqueId}
          setUniqueId={setUniqueId}
          isConnected={isConnected}
          isListening={isListening}
          viewerCount={viewerCount}
          likeCount={likeCount}
          onStart={startListening}
          onStop={stopListening}
          onClear={clearMessages}
        />

        <MessageList messages={messages} messagesEndRef={messagesEndRef} />
      </div>
    </div>
  );
}

export default App;

