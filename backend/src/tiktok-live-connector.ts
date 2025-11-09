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
    try {
      console.log(`🔗 Connexion au live de ${this.uniqueId}...`);
      
      this.connection = new WebcastPushConnection(this.uniqueId, {
        enableExtendedGiftInfo: true,
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
      console.log(`✅ Connecté au live de ${this.uniqueId}`, state);
    } catch (error: any) {
      const errorMessage = error.message || error.toString();
      const errorName = error.name || error.constructor?.name || 'UnknownError';
      
      console.error(`❌ Erreur de connexion pour ${this.uniqueId}:`, errorMessage);
      console.error(`   Type d'erreur: ${errorName}`);
      
      // Log supplémentaire pour InitialFetchError
      if (errorName === 'InitialFetchError' || errorMessage.includes('Failed to retrieve the initial room data')) {
        console.error(`   ⚠️  Cette erreur indique généralement que:`);
        console.error(`      - L'utilisateur "${this.uniqueId}" n'est pas en live actuellement`);
        console.error(`      - Le nom d'utilisateur est incorrect`);
        console.error(`      - Le live n'est pas accessible publiquement`);
        if (error.retryAfter) {
          console.error(`   ⏱️  Retry après: ${error.retryAfter}ms`);
        }
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

