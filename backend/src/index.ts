import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { TikTokLiveConnector } from './tiktok-live-connector';

const app = express();
const PORT = Number(process.env.PORT || 3001);
const WS_PORT = Number(process.env.WS_PORT || 3002);

// Middleware
app.use(cors());
app.use(express.json());

// WebSocket Server
const wss = new WebSocketServer({ 
  port: Number(WS_PORT),
  host: '0.0.0.0' // Écouter sur toutes les interfaces réseau
});

// Store active connections
const clients = new Set<WebSocket>();

wss.on('listening', () => {
  console.log(`🔌 Serveur WebSocket démarré sur ws://0.0.0.0:${WS_PORT}`);
});

wss.on('error', (error) => {
  console.error('❌ Erreur serveur WebSocket:', error);
});

wss.on('connection', (ws: WebSocket, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`✅ Nouveau client WebSocket connecté depuis ${clientIp}`);
  clients.add(ws);

  ws.on('close', () => {
    console.log(`🔌 Client WebSocket déconnecté (${clientIp})`);
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error(`❌ Erreur WebSocket client (${clientIp}):`, error);
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

// Gestion du rate limiting : tracker des dernières tentatives
const rateLimitTracker = new Map<string, {
  lastAttempt: number;
  attemptCount: number;
  backoffUntil: number;
}>();

// Configuration du rate limiting
const RATE_LIMIT_CONFIG = {
  minDelayBetweenAttempts: 2000, // 2 secondes minimum entre tentatives pour le même utilisateur
  maxRetries: 5, // Augmenté à 5 tentatives
  baseDelay: 1000, // Délai de base : 1 seconde
  maxDelay: 60000, // Délai maximum : 60 secondes
  jitter: true, // Ajouter de l'aléatoire pour éviter les collisions
};

// Fonction pour calculer le délai avec backoff exponentiel et jitter
function calculateRetryDelay(retryCount: number, retryAfter?: number | null): number {
  // Si TikTok suggère un délai, l'utiliser en priorité (avec un petit buffer)
  if (retryAfter && retryAfter > 0) {
    return Math.min(retryAfter + 500, RATE_LIMIT_CONFIG.maxDelay); // Buffer de 500ms
  }
  
  // Sinon, utiliser backoff exponentiel avec jitter
  const exponentialDelay = Math.min(
    RATE_LIMIT_CONFIG.baseDelay * Math.pow(2, retryCount),
    RATE_LIMIT_CONFIG.maxDelay
  );
  
  // Ajouter du jitter (variation aléatoire de ±20%) pour éviter les collisions
  if (RATE_LIMIT_CONFIG.jitter) {
    const jitterAmount = exponentialDelay * 0.2 * (Math.random() * 2 - 1); // ±20%
    return Math.max(1000, Math.floor(exponentialDelay + jitterAmount));
  }
  
  return exponentialDelay;
}

// Fonction pour vérifier si on peut faire une tentative (rate limiting)
function canAttemptConnection(uniqueId: string): { canAttempt: boolean; waitTime: number } {
  const now = Date.now();
  const tracker = rateLimitTracker.get(uniqueId);
  
  if (tracker) {
    // Vérifier le délai minimum entre tentatives
    const timeSinceLastAttempt = now - tracker.lastAttempt;
    if (timeSinceLastAttempt < RATE_LIMIT_CONFIG.minDelayBetweenAttempts) {
      const waitTime = RATE_LIMIT_CONFIG.minDelayBetweenAttempts - timeSinceLastAttempt;
      return { canAttempt: false, waitTime };
    }
    
    // Vérifier si on est en période de backoff
    if (now < tracker.backoffUntil) {
      const waitTime = tracker.backoffUntil - now;
      return { canAttempt: false, waitTime };
    }
  }
  
  return { canAttempt: true, waitTime: 0 };
}

// Fonction pour démarrer automatiquement l'écoute avec retry intelligent
async function startTikTokConnection(uniqueId: string, retryCount = 0, maxRetries = RATE_LIMIT_CONFIG.maxRetries) {
  try {
    // Vérifier le rate limiting avant de tenter
    const { canAttempt, waitTime } = canAttemptConnection(uniqueId);
    if (!canAttempt) {
      console.log(`⏳ Rate limiting actif pour ${uniqueId}, attente de ${Math.ceil(waitTime / 1000)}s...`);
      setTimeout(() => {
        startTikTokConnection(uniqueId, retryCount, maxRetries);
      }, waitTime);
      return;
    }
    
    // Mettre à jour le tracker
    const now = Date.now();
    const tracker = rateLimitTracker.get(uniqueId) || { lastAttempt: 0, attemptCount: 0, backoffUntil: 0 };
    tracker.lastAttempt = now;
    tracker.attemptCount = retryCount + 1;
    rateLimitTracker.set(uniqueId, tracker);
    
    // Stop existing connection if any
    if (tiktokConnections.has(uniqueId)) {
      const existingConnector = tiktokConnections.get(uniqueId);
      existingConnector?.disconnect();
      tiktokConnections.delete(uniqueId);
    }

    // Délai initial avant la première tentative pour éviter les requêtes trop rapides
    if (retryCount === 0) {
      const initialDelay = 1000; // 1 seconde avant la première tentative
      console.log(`⏱️  Délai initial de ${initialDelay / 1000}s pour ${uniqueId}...`);
      await new Promise(resolve => setTimeout(resolve, initialDelay));
    }

    // Create new connection
    const connector = new TikTokLiveConnector(uniqueId, broadcastMessage);
    tiktokConnections.set(uniqueId, connector);

    await connector.connect();
    console.log(`✅ Écoute automatique démarrée pour ${uniqueId}`);
    
    // Réinitialiser le tracker en cas de succès
    rateLimitTracker.delete(uniqueId);
  } catch (error: any) {
    // Nettoyer la connexion en cas d'échec
    if (tiktokConnections.has(uniqueId)) {
      tiktokConnections.delete(uniqueId);
    }

    const errorMessage = error.message || error.toString();
    const actualError = error.exception || error;
    const retryAfter = (error.exception && error.exception.retryAfter) || 
                      error.retryAfter || 
                      actualError.retryAfter || 
                      null;

    console.error(`❌ Erreur lors du démarrage automatique pour ${uniqueId}:`, errorMessage);

    // Détecter les erreurs de rate limiting
    const isRateLimitError = errorMessage.includes('rate limit') || 
                             errorMessage.includes('too many requests') ||
                             errorMessage.includes('429') ||
                             (retryAfter && retryAfter > 5000); // Si retryAfter > 5s, probablement rate limit

    if (isRateLimitError) {
      console.warn(`⚠️  Rate limiting détecté pour ${uniqueId}`);
      const tracker = rateLimitTracker.get(uniqueId) || { lastAttempt: 0, attemptCount: 0, backoffUntil: 0 };
      // Appliquer un backoff plus long en cas de rate limiting
      const backoffTime = retryAfter || (30000 * (retryCount + 1)); // 30s, 60s, 90s...
      tracker.backoffUntil = Date.now() + backoffTime;
      rateLimitTracker.set(uniqueId, tracker);
      console.log(`🛑 Backoff appliqué jusqu'à ${new Date(tracker.backoffUntil).toLocaleTimeString()}`);
    }

    // Messages d'erreur plus explicites
    if (errorMessage.includes('Failed to retrieve the initial room data')) {
      console.error(`⚠️  Raison probable : L'utilisateur "${uniqueId}" n'est pas en live actuellement ou le nom d'utilisateur est incorrect.`);
    }

    // Retry avec backoff exponentiel intelligent
    if (retryCount < maxRetries) {
      const delay = calculateRetryDelay(retryCount, retryAfter);
      console.log(`🔄 Nouvelle tentative dans ${Math.ceil(delay / 1000)}s... (${retryCount + 1}/${maxRetries})`);
      if (retryAfter) {
        console.log(`   ⏱️  Délai suggéré par TikTok: ${retryAfter}ms`);
      }
      
      setTimeout(() => {
        startTikTokConnection(uniqueId, retryCount + 1, maxRetries);
      }, delay);
    } else {
      console.error(`❌ Échec définitif après ${maxRetries} tentatives pour ${uniqueId}`);
      console.log(`ℹ️  Le serveur continue de fonctionner. Vous pouvez démarrer manuellement via l'API.`);
      // Nettoyer le tracker après échec définitif
      rateLimitTracker.delete(uniqueId);
    }
  }
}

// API Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start listening to a TikTok live
app.post('/api/tiktok/start', async (req, res) => {
  // Récupérer uniqueId avant le try pour qu'il soit accessible dans le catch
  const { uniqueId } = req.body;

  if (!uniqueId) {
    return res.status(400).json({ error: 'uniqueId est requis' });
  }

  try {
    // Vérifier le rate limiting avant de tenter
    const { canAttempt, waitTime } = canAttemptConnection(uniqueId);
    if (!canAttempt) {
      return res.status(429).json({
        error: 'Rate limiting actif',
        message: `Veuillez attendre ${Math.ceil(waitTime / 1000)} seconde(s) avant de réessayer`,
        retryAfter: waitTime,
        uniqueId
      });
    }
    
    // Mettre à jour le tracker
    const now = Date.now();
    const tracker = rateLimitTracker.get(uniqueId) || { lastAttempt: 0, attemptCount: 0, backoffUntil: 0 };
    tracker.lastAttempt = now;
    rateLimitTracker.set(uniqueId, tracker);
    
    // Stop existing connection if any
    if (tiktokConnections.has(uniqueId)) {
      const existingConnector = tiktokConnections.get(uniqueId);
      existingConnector?.disconnect();
      tiktokConnections.delete(uniqueId);
    }
    
    // Délai initial pour éviter les requêtes trop rapides
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create new connection
    const connector = new TikTokLiveConnector(uniqueId, broadcastMessage);
    tiktokConnections.set(uniqueId, connector);

    await connector.connect();
    
    // Réinitialiser le tracker en cas de succès
    rateLimitTracker.delete(uniqueId);

    res.json({ 
      success: true, 
      message: `Écoute du live de ${uniqueId} démarrée`,
      uniqueId 
    });
  } catch (error: any) {
    console.error('Erreur lors du démarrage:', error);
    
    // Si l'erreur est encapsulée dans error.exception, utiliser celle-ci en priorité
    const actualError = error.exception || error;
    
    // Extraire les informations d'erreur
    const errorMessage = actualError.message || 
                        error.message ||
                        (typeof error.exception === 'string' ? error.exception : null) ||
                        error.toString();
    
    // Détecter le type d'erreur (priorité à error.exception si elle existe)
    const errorName = (error.exception && error.exception.name) ||
                     (error.exception && error.exception.constructor?.name) ||
                     actualError.name ||
                     actualError.constructor?.name ||
                     error.constructor?.name || 
                     '';
    
    const retryAfter = (error.exception && error.exception.retryAfter) || 
                      error.retryAfter || 
                      actualError.retryAfter || 
                      null;
    
    // Détecter les erreurs de rate limiting
    const isRateLimitError = errorMessage.includes('rate limit') || 
                             errorMessage.includes('too many requests') ||
                             errorMessage.includes('429') ||
                             (retryAfter && retryAfter > 5000);
    
    if (isRateLimitError) {
      console.warn(`⚠️  Rate limiting détecté pour ${uniqueId}`);
      const tracker = rateLimitTracker.get(uniqueId) || { lastAttempt: 0, attemptCount: 0, backoffUntil: 0 };
      // Appliquer un backoff plus long en cas de rate limiting
      const backoffTime = retryAfter || 30000; // 30 secondes par défaut
      tracker.backoffUntil = Date.now() + backoffTime;
      rateLimitTracker.set(uniqueId, tracker);
      console.log(`🛑 Backoff appliqué jusqu'à ${new Date(tracker.backoffUntil).toLocaleTimeString()}`);
      
      return res.status(429).json({
        error: 'Rate limiting détecté',
        message: `TikTok limite les requêtes. Veuillez attendre ${Math.ceil(backoffTime / 1000)} seconde(s) avant de réessayer`,
        retryAfter: backoffTime,
        uniqueId
      });
    }
    
    // Messages d'erreur plus explicites
    let userMessage = 'Erreur lors du démarrage de l\'écoute';
    let suggestions: string[] = [];
    
    const isInitialFetchError = errorName === 'InitialFetchError' || 
                               errorMessage.includes('Failed to retrieve the initial room data');
    
    if (isInitialFetchError) {
      userMessage = 'Impossible de récupérer les données du live';
      suggestions = [
        `Vérifiez que l'utilisateur "${uniqueId}" est actuellement en live sur TikTok`,
        `Vérifiez que le nom d'utilisateur "${uniqueId}" est correct (sans le @)`,
        `Assurez-vous que le live est accessible publiquement`,
        `Attendez quelques secondes et réessayez si le live vient de commencer`
      ];
      
      // Ajouter une suggestion spécifique si retryAfter est disponible
      if (retryAfter) {
        const retrySeconds = Math.ceil(retryAfter / 1000);
        suggestions.push(`⏱️ TikTok suggère d'attendre ${retrySeconds} seconde(s) avant de réessayer`);
      }
    } else if (errorMessage.includes('User not found') || errorMessage.includes('Invalid user')) {
      userMessage = 'Utilisateur introuvable';
      suggestions = [
        `Le nom d'utilisateur "${uniqueId}" n'existe pas ou est incorrect`,
        `Vérifiez l'orthographe du nom d'utilisateur (sans le @)`
      ];
    } else if (errorMessage.includes('Connection timeout') || errorMessage.includes('timeout')) {
      userMessage = 'Timeout de connexion';
      suggestions = [
        `La connexion à TikTok a expiré`,
        `Vérifiez votre connexion internet`,
        `Réessayez dans quelques instants`
      ];
    }
    
    res.status(500).json({ 
      error: userMessage,
      details: errorMessage,
      errorName: errorName,
      retryAfter: retryAfter || undefined,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
      uniqueId
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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur HTTP démarré sur http://0.0.0.0:${PORT}`);
  console.log(`📡 Prêt à écouter les lives TikTok`);
  
  // Auto-start si TIKTOK_UNIQUE_ID est configuré (en asynchrone pour ne pas bloquer)
  const defaultUniqueId = process.env.TIKTOK_UNIQUE_ID;
  if (defaultUniqueId) {
    console.log(`🔄 Démarrage automatique de l'écoute pour ${defaultUniqueId}...`);
    console.log(`ℹ️  Note: Assurez-vous que l'utilisateur est en live avant de démarrer.`);
    // Démarrer en asynchrone sans bloquer
    setImmediate(() => {
      startTikTokConnection(defaultUniqueId).catch((error) => {
        // Erreur déjà gérée dans la fonction, juste pour éviter les warnings
        console.error('Erreur lors du démarrage automatique:', error.message);
      });
    });
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

