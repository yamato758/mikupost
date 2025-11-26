import {
  TwitterTokens,
  TwitterMediaUploadResponse,
  TwitterTweetResponse,
  TwitterUserResponse,
  TwitterApiError,
} from './types';
import { loadTokens } from './token-manager-kv';
import { fetchImageAsBuffer } from './image-generator';
import { TWITTER_API_BASE, ERROR_MESSAGES, MEDIA_PROCESSING_WAIT_TIME } from './constants';
import { uploadMediaWithOAuth1, isOAuth1Available } from './oauth1-upload';

/**
 * X APIでメディアをアップロード
 * OAuth 1.0aを使用（OAuth 2.0ではv1.1メディアアップロードは利用不可）
 */
async function uploadMedia(imageBuffer: Buffer): Promise<string | null> {
  console.log('uploadMedia called, buffer size:', imageBuffer.length);
  
  // OAuth 1.0aが利用可能か確認
  if (!isOAuth1Available()) {
    console.error('OAuth 1.0a credentials not available. Media upload requires TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, and TWITTER_ACCESS_TOKEN_SECRET.');
    return null;
  }

  try {
    // OAuth 1.0aでメディアをアップロード
    const mediaId = await uploadMediaWithOAuth1(imageBuffer);
    
    if (!mediaId) {
      console.error('OAuth 1.0a media upload failed');
      return null;
    }
    
    console.log('Media upload completed, media ID:', mediaId);
    return mediaId;
  } catch (error) {
    console.error('Media upload error:', error);
    return null;
  }
}

/**
 * X API v2でツイートを作成
 */
export async function createTweet(text: string, imageUrl?: string): Promise<{ tweetId: string; tweetUrl: string } | null> {
  const tokens = await loadTokens();
  if (!tokens || !tokens.access_token) {
    throw new Error('アクセストークンがありません');
  }

  try {
    let mediaId: string | null = null;

    // 画像が提供されている場合のみアップロード
    if (imageUrl) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Image URL provided, attempting to upload media');
      }
      // 画像をダウンロードしてバッファに変換
      const imageBuffer = await fetchImageAsBuffer(imageUrl);
      if (!imageBuffer) {
        console.warn('画像のダウンロードに失敗しました。画像なしでツイートを試みます。');
      } else {
        // メディアをアップロード
        mediaId = await uploadMedia(imageBuffer);
        if (!mediaId) {
          console.warn('画像のアップロードに失敗しました。画像なしでツイートを試みます。');
        }
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('No image URL provided, creating text-only tweet');
      }
    }

    // ツイートを作成
    const tweetData: {
      text: string;
      media?: {
        media_ids: string[];
      };
    } = {
      text: text,
    };

    if (mediaId) {
      tweetData.media = {
        media_ids: [mediaId],
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
      const errorText = await tweetResponse.text();
      console.error('Tweet creation error:', errorText);
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
    console.error('Get me error:', error);
    return null;
  }
}

