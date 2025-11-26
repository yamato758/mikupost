/**
 * OAuth 1.0aを使用したメディアアップロード
 * twitter-api-v2ライブラリを使用
 */
import { TwitterApi } from 'twitter-api-v2';

/**
 * Twitter APIクライアントを取得
 */
function getTwitterClient(): TwitterApi | null {
  const appKey = process.env.TWITTER_API_KEY;
  const appSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;
  
  if (!appKey || !appSecret || !accessToken || !accessSecret) {
    console.error('Missing Twitter OAuth 1.0a credentials');
    return null;
  }
  
  return new TwitterApi({
    appKey,
    appSecret,
    accessToken,
    accessSecret,
  });
}

/**
 * OAuth 1.0aでメディアをアップロード
 */
export async function uploadMediaWithOAuth1(imageBuffer: Buffer): Promise<{ mediaId: string | null; error?: string; status?: number; details?: string }> {
  console.log('OAuth1 upload - starting...');
  console.log('OAuth1 upload - buffer size:', imageBuffer.length);
  
  // 認証情報の確認
  console.log('OAuth1 upload - credentials check:');
  console.log('  API Key:', process.env.TWITTER_API_KEY ? `${process.env.TWITTER_API_KEY.substring(0, 5)}...` : 'MISSING');
  console.log('  API Secret:', process.env.TWITTER_API_SECRET ? 'SET' : 'MISSING');
  console.log('  Access Token:', process.env.TWITTER_ACCESS_TOKEN ? `${process.env.TWITTER_ACCESS_TOKEN.substring(0, 15)}...` : 'MISSING');
  console.log('  Access Token Secret:', process.env.TWITTER_ACCESS_TOKEN_SECRET ? 'SET' : 'MISSING');
  
  const client = getTwitterClient();
  if (!client) {
    return {
      mediaId: null,
      error: 'Failed to create Twitter client - missing credentials',
    };
  }
  
  try {
    // twitter-api-v2のuploadMediaメソッドを使用
    const mediaId = await client.v1.uploadMedia(imageBuffer, {
      mimeType: 'image/png',
    });
    
    console.log('OAuth1 upload - success, media_id:', mediaId);
    
    return { mediaId };
  } catch (error: any) {
    console.error('OAuth1 upload - error:', error);
    
    // エラーの詳細を取得
    let details = '';
    if (error.data) {
      details = JSON.stringify(error.data);
    } else if (error.message) {
      details = error.message;
    }
    
    return {
      mediaId: null,
      error: 'Upload failed',
      status: error.code || error.statusCode,
      details,
    };
  }
}

/**
 * 環境変数が設定されているか確認
 */
export function isOAuth1Available(): boolean {
  return !!(
    process.env.TWITTER_API_KEY &&
    process.env.TWITTER_API_SECRET &&
    process.env.TWITTER_ACCESS_TOKEN &&
    process.env.TWITTER_ACCESS_TOKEN_SECRET
  );
}

