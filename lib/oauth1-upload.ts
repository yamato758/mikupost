/**
 * OAuth 1.0aを使用したメディアアップロード
 */
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';

// OAuth 1.0a設定
const oauth = new OAuth({
  consumer: {
    key: process.env.TWITTER_API_KEY || '',
    secret: process.env.TWITTER_API_SECRET || '',
  },
  signature_method: 'HMAC-SHA1',
  hash_function(base_string: string, key: string) {
    return crypto.createHmac('sha1', key).update(base_string).digest('base64');
  },
});

// アクセストークン
const token = {
  key: process.env.TWITTER_ACCESS_TOKEN || '',
  secret: process.env.TWITTER_ACCESS_TOKEN_SECRET || '',
};

/**
 * OAuth 1.0aでメディアをアップロード
 */
export async function uploadMediaWithOAuth1(imageBuffer: Buffer): Promise<string | null> {
  const url = 'https://upload.twitter.com/1.1/media/upload.json';
  
  // base64エンコード
  const mediaData = imageBuffer.toString('base64');
  
  // OAuth署名を生成
  const requestData = {
    url,
    method: 'POST',
  };
  
  const authHeader = oauth.toHeader(oauth.authorize(requestData, token));
  
  console.log('OAuth1 upload - starting upload...');
  console.log('OAuth1 upload - buffer size:', imageBuffer.length);
  console.log('OAuth1 upload - base64 length:', mediaData.length);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        media_data: mediaData,
      }),
    });
    
    console.log('OAuth1 upload - response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OAuth1 upload - error:', errorText);
      return null;
    }
    
    const result = await response.json();
    console.log('OAuth1 upload - success, media_id:', result.media_id_string);
    
    return result.media_id_string;
  } catch (error) {
    console.error('OAuth1 upload - exception:', error);
    return null;
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

