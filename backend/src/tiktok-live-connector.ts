import { TikTokApi } from '@tobyg74/tiktok-api-live';

export class TikTokLiveConnector {
  private uniqueId: string;
  private api: TikTokApi | null = null;
  private broadcastCallback: (data: any) => void;

  constructor(uniqueId: string, broadcastCallback: (data: any) => void) {
    this.uniqueId = uniqueId;
    this.broadcastCallback = broadcastCallback;
  }

  async connect(): Promise<void> {
    try {
      console.log(`🔗 Connexion au live de ${this.uniqueId}...`);
      
      this.api = new TikTokApi(this.uniqueId, {
        enableExtendedGiftInfo: true,
      });

      // Event: Chat messages
      this.api.on('chat', (data) => {
        console.log(`💬 Message de ${data.nickname}: ${data.comment}`);
        this.broadcastCallback({
          type: 'chat',
          timestamp: new Date().toISOString(),
          data: {
            userId: data.userId,
            nickname: data.nickname,
            comment: data.comment,
            profilePictureUrl: data.profilePictureUrl,
            uniqueId: data.uniqueId,
          },
        });
      });

      // Event: Gifts
      this.api.on('gift', (data) => {
        console.log(`🎁 Cadeau reçu: ${data.giftName} de ${data.nickname}`);
        this.broadcastCallback({
          type: 'gift',
          timestamp: new Date().toISOString(),
          data: {
            userId: data.userId,
            nickname: data.nickname,
            giftName: data.giftName,
            giftId: data.giftId,
            repeatCount: data.repeatCount,
            profilePictureUrl: data.profilePictureUrl,
          },
        });
      });

      // Event: Followers
      this.api.on('follow', (data) => {
        console.log(`👤 Nouveau follower: ${data.nickname}`);
        this.broadcastCallback({
          type: 'follow',
          timestamp: new Date().toISOString(),
          data: {
            userId: data.userId,
            nickname: data.nickname,
            profilePictureUrl: data.profilePictureUrl,
          },
        });
      });

      // Event: Likes
      this.api.on('like', (data) => {
        this.broadcastCallback({
          type: 'like',
          timestamp: new Date().toISOString(),
          data: {
            userId: data.userId,
            nickname: data.nickname,
            likeCount: data.likeCount,
            profilePictureUrl: data.profilePictureUrl,
          },
        });
      });

      // Event: Share
      this.api.on('share', (data) => {
        console.log(`📤 Partage par ${data.nickname}`);
        this.broadcastCallback({
          type: 'share',
          timestamp: new Date().toISOString(),
          data: {
            userId: data.userId,
            nickname: data.nickname,
            profilePictureUrl: data.profilePictureUrl,
          },
        });
      });

      // Event: Stream end
      this.api.on('streamEnd', () => {
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
      this.api.on('error', (error) => {
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
      await this.api.connect();
      console.log(`✅ Connecté au live de ${this.uniqueId}`);
    } catch (error: any) {
      console.error(`❌ Erreur de connexion:`, error);
      throw error;
    }
  }

  disconnect(): void {
    if (this.api) {
      console.log(`🔌 Déconnexion du live de ${this.uniqueId}`);
      this.api.disconnect();
      this.api = null;
    }
  }
}

