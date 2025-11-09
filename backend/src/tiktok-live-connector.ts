import { WebcastPushConnection } from 'tiktok-live-connector';

export class TikTokLiveConnector {
  private uniqueId: string;
  private connection: WebcastPushConnection | null = null;
  private broadcastCallback: (data: any) => void;

  constructor(uniqueId: string, broadcastCallback: (data: any) => void) {
    this.uniqueId = uniqueId;
    this.broadcastCallback = broadcastCallback;
  }

  async connect(): Promise<void> {
    // Normaliser le nom d'utilisateur (enlever @ si présent)
    const normalizedUniqueId = this.uniqueId.replace(/^@/, '').trim();
    
    try {
      console.log(`🔗 Connexion au live de ${normalizedUniqueId}...`);
      console.log(`   Nom d'utilisateur original: "${this.uniqueId}"`);
      console.log(`   Nom d'utilisateur normalisé: "${normalizedUniqueId}"`);
      
      this.connection = new WebcastPushConnection(normalizedUniqueId, {
        enableExtendedGiftInfo: true,
        processInitialData: true,
      });

      // Event: Room stats (viewers)
      this.connection.on('roomUser', (data) => {
        this.broadcastCallback({
          type: 'stats',
          timestamp: new Date().toISOString(),
          data: {
            viewerCount: data.viewerCount || data.viewer || 0,
            uniqueId: this.uniqueId,
          },
        });
      });

      // Event: Like stats (total likes)
      this.connection.on('like', (data) => {
        this.broadcastCallback({
          type: 'stats',
          timestamp: new Date().toISOString(),
          data: {
            totalLikeCount: data.totalLikeCount || data.likeCount || 0,
            uniqueId: this.uniqueId,
          },
        });
      });

      // Event: Chat messages
      this.connection.on('chat', (data) => {
        console.log(`💬 Message de ${data.uniqueId}: ${data.comment}`);
        this.broadcastCallback({
          type: 'chat',
          timestamp: new Date().toISOString(),
          data: {
            userId: data.userId,
            nickname: data.nickname || data.uniqueId,
            comment: data.comment,
            profilePictureUrl: data.profilePictureUrl,
            uniqueId: data.uniqueId,
          },
        });
      });

      // Event: Gifts - Désactivé (uniquement les messages)
      // this.connection.on('gift', (data) => { ... });

      // Event: Followers - Désactivé (uniquement les messages)
      // this.connection.on('follow', (data) => { ... });

      // Event: Likes - Désactivé (uniquement les messages)
      // this.connection.on('like', (data) => { ... });

      // Event: Share - Désactivé (uniquement les messages)
      // this.connection.on('share', (data) => { ... });

      // Event: Stream end
      this.connection.on('streamEnd', () => {
        console.log(`⏹️ Stream terminé pour ${this.uniqueId}`);
        this.broadcastCallback({
          type: 'streamEnd',
          timestamp: new Date().toISOString(),
          data: {
            uniqueId: this.uniqueId,
          },
        });
      });

      // Event: Error
      this.connection.on('error', (error) => {
        console.error(`❌ Erreur TikTok API:`, error);
        this.broadcastCallback({
          type: 'error',
          timestamp: new Date().toISOString(),
          data: {
            error: error.message || 'Erreur inconnue',
            uniqueId: this.uniqueId,
          },
        });
      });

      // Connect to the live stream
      const state = await this.connection.connect();
      console.log(`✅ Connecté au live de ${normalizedUniqueId}`, state);
    } catch (error: any) {
      // Log détaillé de l'erreur pour débogage
      console.error(`❌ Erreur brute capturée:`, JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      
      // Si l'erreur est encapsulée dans error.exception, utiliser celle-ci en priorité
      const actualError = error.exception || error;
      
      // Extraire le message d'erreur
      const errorMessage = actualError.message || 
                          error.message ||
                          (typeof error.exception === 'string' ? error.exception : null) ||
                          error.toString();
      
      // Détecter le type d'erreur (priorité à error.exception si elle existe)
      // Vérifier plusieurs niveaux pour être sûr de capturer InitialFetchError
      let errorName = 'UnknownError';
      if (error.exception) {
        errorName = error.exception.name || 
                   error.exception.constructor?.name ||
                   (error.exception.constructor && error.exception.constructor.name) ||
                   'UnknownError';
      } else if (actualError.name) {
        errorName = actualError.name;
      } else if (actualError.constructor?.name) {
        errorName = actualError.constructor.name;
      } else if (error.constructor?.name) {
        errorName = error.constructor.name;
      }
      
      // Vérifier aussi dans la stack trace
      if (errorName === 'UnknownError' || errorName === 'Error') {
        const stack = error.stack || error.exception?.stack || '';
        if (stack.includes('InitialFetchError')) {
          errorName = 'InitialFetchError';
        }
      }
      
      // Extraire retryAfter (peut être dans error.retryAfter ou error.exception.retryAfter)
      const retryAfter = (error.exception && error.exception.retryAfter) || 
                        error.retryAfter || 
                        actualError.retryAfter || 
                        null;
      
      console.error(`❌ Erreur de connexion pour ${this.uniqueId}:`, errorMessage);
      console.error(`   Type d'erreur détecté: ${errorName}`);
      console.error(`   error.name: ${error.name || 'undefined'}`);
      console.error(`   error.exception?.name: ${error.exception?.name || 'undefined'}`);
      console.error(`   actualError.name: ${actualError.name || 'undefined'}`);
      
      // Log supplémentaire pour InitialFetchError
      const isInitialFetchError = errorName === 'InitialFetchError' || 
                                  errorMessage.includes('Failed to retrieve the initial room data');
      
      if (isInitialFetchError) {
        console.error(`   ⚠️  Cette erreur indique généralement que:`);
        console.error(`      - L'utilisateur "${this.uniqueId}" n'est pas en live actuellement`);
        console.error(`      - Le nom d'utilisateur est incorrect`);
        console.error(`      - Le live n'est pas accessible publiquement`);
        if (retryAfter) {
          console.error(`   ⏱️  TikTok suggère d'attendre ${retryAfter}ms avant de réessayer`);
        } else {
          console.error(`   ℹ️  Aucun délai de retry suggéré par TikTok`);
        }
      }
      
      // Ajouter retryAfter et exception à l'erreur pour qu'elle soit accessible dans index.ts
      if (retryAfter && !error.retryAfter) {
        error.retryAfter = retryAfter;
      }
      // S'assurer que exception est accessible
      if (error.exception && !error.name) {
        error.name = errorName;
      }
      
      // Nettoyer la connexion en cas d'échec
      if (this.connection) {
        try {
          this.connection.disconnect();
        } catch (e) {
          // Ignorer les erreurs de déconnexion
        }
        this.connection = null;
      }
      
      throw error;
    }
  }

  disconnect(): void {
    if (this.connection) {
      console.log(`🔌 Déconnexion du live de ${this.uniqueId}`);
      this.connection.disconnect();
      this.connection = null;
    }
  }
}

