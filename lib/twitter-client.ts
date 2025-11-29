import {
  TwitterTweetResponse,
  TwitterUserResponse,
} from './types';
import { loadTokens } from './token-manager-kv';
import { fetchImageAsBuffer } from './image-generator';
import { TWITTER_API_BASE } from './constants';
import { uploadMediaWithOAuth1, isOAuth1Available } from './oauth1-upload';

/**
 * X APIでメディアをアップロード
 * OAuth 1.0aを使用（OAuth 2.0ではv1.1メディアアップロードは利用不可）
 */
async function uploadMedia(imageBuffer: Buffer, mimeType?: string): Promise<string | null> {
  if (!isOAuth1Available()) {
    return null;
  }

  try {
    const result = await uploadMediaWithOAuth1(imageBuffer, mimeType);
    
    if (!result.mediaId) {
      return null;
    }
    
    return result.mediaId;
  } catch (error) {
    return null;
  }
}

/**
 * 複数の画像をアップロード
 */
async function uploadMultipleMedia(
  imageBuffers: Buffer[],
  mimeTypes?: string[]
): Promise<string[]> {
  const mediaIds: string[] = [];
  
  for (let i = 0; i < imageBuffers.length; i++) {
    const mimeType = mimeTypes && mimeTypes[i] ? mimeTypes[i] : undefined;
    const mediaId = await uploadMedia(imageBuffers[i], mimeType);
    if (mediaId) {
      mediaIds.push(mediaId);
    }
  }
  
  return mediaIds;
}

/**
 * X API v2でツイートを作成
 */
export async function createTweet(
  text: string, 
  imageUrl?: string,
  additionalImageBuffers?: Buffer[]
): Promise<{ tweetId: string; tweetUrl: string } | null> {
  const tokens = await loadTokens();
  if (!tokens || !tokens.access_token) {
    throw new Error('アクセストークンがありません');
  }

  try {
    const mediaIds: string[] = [];

    // 生成された画像をアップロード
    if (imageUrl) {
      const imageBuffer = await fetchImageAsBuffer(imageUrl);
      if (imageBuffer) {
        const mediaId = await uploadMedia(imageBuffer);
        if (mediaId) {
          mediaIds.push(mediaId);
        }
      }
    }

    // 追加画像をアップロード（MIMEタイプも渡す）
    if (additionalImageBuffers && additionalImageBuffers.length > 0) {
      // MIMEタイプが渡されていない場合はundefinedを渡す（自動検出）
      const additionalMediaIds = await uploadMultipleMedia(
        additionalImageBuffers,
        undefined // MIMEタイプはoauth1-upload.tsで自動検出される
      );
      mediaIds.push(...additionalMediaIds);
    }

    // 最大4枚まで
    const finalMediaIds = mediaIds.slice(0, 4);

    // ツイートを作成
    const tweetData: {
      text: string;
      media?: {
        media_ids: string[];
      };
    } = {
      text: text,
    };

    if (finalMediaIds.length > 0) {
      tweetData.media = {
        media_ids: finalMediaIds,
      };
    }

    const tweetResponse = await fetch(`${TWITTER_API_BASE}/tweets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tweetData),
    });

    if (!tweetResponse.ok) {
      return null;
    }

    const tweet = (await tweetResponse.json()) as TwitterTweetResponse;
    const tweetId = tweet.data.id;
    const tweetUrl = `https://twitter.com/i/web/status/${tweetId}`;

    return {
      tweetId,
      tweetUrl,
    };
  } catch (error) {
    console.error('Create tweet error:', error);
    return null;
  }
}

/**
 * ユーザー情報を取得（認証状態確認用）
 */
export async function getMe(): Promise<{ id: string; username: string } | null> {
  const tokens = await loadTokens();
  if (!tokens || !tokens.access_token) {
    return null;
  }

  try {
    const response = await fetch(`${TWITTER_API_BASE}/users/me`, {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as TwitterUserResponse;
    return {
      id: data.data.id,
      username: data.data.username,
    };
  } catch (error) {
    return null;
  }
}

