import {
  TwitterTokens,
  TwitterMediaUploadResponse,
  TwitterTweetResponse,
  TwitterUserResponse,
  TwitterApiError,
} from './types';
import { loadTokens } from './token-manager';
import { fetchImageAsBuffer } from './image-generator';
import { TWITTER_API_BASE, ERROR_MESSAGES, MEDIA_PROCESSING_WAIT_TIME } from './constants';

/**
 * X API v2でメディアをアップロード
 * OAuth 2.0のBearerトークンを使用
 * v2ではmultipart/form-data形式で単一リクエストでアップロード
 */
async function uploadMedia(imageBuffer: Buffer): Promise<string | null> {
  const tokens = loadTokens();
  if (!tokens || !tokens.access_token) {
    throw new Error('アクセストークンがありません');
  }

  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('Starting media upload, buffer size:', imageBuffer.length);
      console.log('Access token present:', !!tokens.access_token);
    }
    
    // v2 APIではmultipart/form-data形式で単一リクエストでアップロード
    // Node.js 18以降のネイティブFormDataとBlobを使用
    const formData = new FormData();
    // Blobとして画像データを追加（BufferをUint8Arrayに変換）
    const uint8Array = new Uint8Array(imageBuffer);
    const blob = new Blob([uint8Array], { type: 'image/png' });
    formData.append('media', blob, 'image.png');
    formData.append('media_category', 'tweet_image');

    const uploadResponse = await fetch('https://api.twitter.com/2/media/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        // FormDataを使用する場合、Content-Typeは自動設定されるため明示的に指定しない
      },
      body: formData,
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('Media upload response status:', uploadResponse.status, uploadResponse.statusText);
      console.log('Media upload response headers:', Object.fromEntries(uploadResponse.headers.entries()));
    }

    if (!uploadResponse.ok) {
      let errorText = '';
      try {
        const responseText = await uploadResponse.text();
        errorText = responseText || '(empty response body)';
        if (process.env.NODE_ENV === 'development') {
          console.log('Error response text length:', responseText.length);
          console.log('Error response text:', errorText);
        }
      } catch (e) {
        errorText = `Failed to read error response: ${e}`;
        console.error('Error reading response:', e);
      }
      
      // 403エラーの場合は、スコープやエンドポイントの問題を示す
      let detailedError = errorText;
      if (uploadResponse.status === 403) {
        detailedError = 'メディアアップロードが拒否されました。`media.write`スコープが含まれているか、またはエンドポイントが正しいか確認してください。';
      }
      
      console.error('Media upload error:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        errorText: detailedError,
        headers: Object.fromEntries(uploadResponse.headers.entries()),
      });
      return null;
    }

    const uploadData = (await uploadResponse.json()) as TwitterMediaUploadResponse;
    if (process.env.NODE_ENV === 'development') {
      console.log('Media upload response:', JSON.stringify(uploadData, null, 2));
    }
    
    // v2 APIのレスポンス形式に対応
    const mediaId =
      uploadData.media_id_string ||
      uploadData.data?.media_id ||
      uploadData.data?.id ||
      uploadData.id;
    if (!mediaId) {
      console.error('Media ID not found in response:', uploadData);
      return null;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Media ID obtained:', mediaId);
    }
    
    // 処理が完了するまで待機（必要に応じて）
    const processingInfo = uploadData.processing_info || uploadData.data?.processing_info;
    if (processingInfo) {
      const { state } = processingInfo;
      if (process.env.NODE_ENV === 'development') {
        console.log('Media processing state:', state);
      }
      if (state === 'pending' || state === 'in_progress') {
        // 簡易実装：少し待機してから返す
        // 本番環境ではポーリングを実装することを推奨
        await new Promise(resolve => setTimeout(resolve, MEDIA_PROCESSING_WAIT_TIME));
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Media upload completed, media ID:', mediaId);
    }
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
  const tokens = loadTokens();
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
  const tokens = loadTokens();
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

