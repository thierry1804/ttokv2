export interface Message {
  id: string;
  type: 'chat' | 'gift' | 'follow' | 'like' | 'share' | 'streamEnd' | 'error';
  timestamp: string;
  data: {
    userId?: string;
    nickname?: string;
    comment?: string;
    giftName?: string;
    giftId?: string;
    repeatCount?: number;
    likeCount?: number;
    profilePictureUrl?: string;
    uniqueId?: string;
    error?: string;
  };
}

