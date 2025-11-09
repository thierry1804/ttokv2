import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { TikTokLiveConnector } from './tiktok-live-connector';

const app = express();
const PORT = process.env.PORT || 3001;
const WS_PORT = process.env.WS_PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// WebSocket Server
const wss = new WebSocketServer({ port: Number(WS_PORT) });

// Store active connections
const clients = new Set<WebSocket>();

wss.on('connection', (ws: WebSocket) => {
  console.log('Nouveau client WebSocket connecté');
  clients.add(ws);

  ws.on('close', () => {
    console.log('Client WebSocket déconnecté');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('Erreur WebSocket:', error);
  });
});

// Broadcast function to send messages to all connected clients
function broadcastMessage(data: any) {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Store active TikTok connections
const tiktokConnections = new Map<string, TikTokLiveConnector>();

// Fonction pour démarrer automatiquement l'écoute
async function startTikTokConnection(uniqueId: string) {
  try {
    // Stop existing connection if any
    if (tiktokConnections.has(uniqueId)) {
      const existingConnector = tiktokConnections.get(uniqueId);
      existingConnector?.disconnect();
      tiktokConnections.delete(uniqueId);
    }

    // Create new connection
    const connector = new TikTokLiveConnector(uniqueId, broadcastMessage);
    tiktokConnections.set(uniqueId, connector);

    await connector.connect();
    console.log(`✅ Écoute automatique démarrée pour ${uniqueId}`);
  } catch (error: any) {
    console.error(`❌ Erreur lors du démarrage automatique pour ${uniqueId}:`, error);
  }
}

// API Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start listening to a TikTok live
app.post('/api/tiktok/start', async (req, res) => {
  try {
    const { uniqueId } = req.body;

    if (!uniqueId) {
      return res.status(400).json({ error: 'uniqueId est requis' });
    }

    // Stop existing connection if any
    if (tiktokConnections.has(uniqueId)) {
      const existingConnector = tiktokConnections.get(uniqueId);
      existingConnector?.disconnect();
      tiktokConnections.delete(uniqueId);
    }

    // Create new connection
    const connector = new TikTokLiveConnector(uniqueId, broadcastMessage);
    tiktokConnections.set(uniqueId, connector);

    await connector.connect();

    res.json({ 
      success: true, 
      message: `Écoute du live de ${uniqueId} démarrée`,
      uniqueId 
    });
  } catch (error: any) {
    console.error('Erreur lors du démarrage:', error);
    res.status(500).json({ 
      error: 'Erreur lors du démarrage de l\'écoute',
      details: error.message 
    });
  }
});

// Stop listening to a TikTok live
app.post('/api/tiktok/stop', (req, res) => {
  try {
    const { uniqueId } = req.body;

    if (!uniqueId) {
      return res.status(400).json({ error: 'uniqueId est requis' });
    }

    const connector = tiktokConnections.get(uniqueId);
    if (connector) {
      connector.disconnect();
      tiktokConnections.delete(uniqueId);
      res.json({ 
        success: true, 
        message: `Écoute du live de ${uniqueId} arrêtée` 
      });
    } else {
      res.status(404).json({ error: 'Aucune connexion active pour cet uniqueId' });
    }
  } catch (error: any) {
    console.error('Erreur lors de l\'arrêt:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'arrêt de l\'écoute',
      details: error.message 
    });
  }
});

// Get active connections
app.get('/api/tiktok/active', (req, res) => {
  const activeIds = Array.from(tiktokConnections.keys());
  res.json({ activeConnections: activeIds });
});

// Start HTTP server
app.listen(PORT, async () => {
  console.log(`🚀 Serveur HTTP démarré sur le port ${PORT}`);
  console.log(`🔌 Serveur WebSocket démarré sur le port ${WS_PORT}`);
  console.log(`📡 Prêt à écouter les lives TikTok`);
  
  // Auto-start si TIKTOK_UNIQUE_ID est configuré
  const defaultUniqueId = process.env.TIKTOK_UNIQUE_ID;
  if (defaultUniqueId) {
    console.log(`🔄 Démarrage automatique de l'écoute pour ${defaultUniqueId}...`);
    await startTikTokConnection(defaultUniqueId);
  } else {
    console.log(`ℹ️  Aucun TIKTOK_UNIQUE_ID configuré, démarrage manuel requis`);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur...');
  tiktokConnections.forEach((connector) => {
    connector.disconnect();
  });
  wss.close();
  process.exit(0);
});

