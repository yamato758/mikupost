/**
 * OAuth 1.0aを使用したメディアアップロード
 * 手動でOAuth署名を生成
 */
import crypto from 'crypto';

/**
 * URLエンコード（RFC 3986準拠）
 */
function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/\*/g, '%2A')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
}

/**
 * OAuth署名を生成
 */
function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  // パラメータをソートしてエンコード
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${percentEncode(key)}=${percentEncode(params[key])}`)
    .join('&');

  // 署名ベース文字列を作成
  const signatureBase = [
    method.toUpperCase(),
    percentEncode(url),
    percentEncode(sortedParams),
  ].join('&');

  // 署名キーを作成
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;

  // HMAC-SHA1で署名を生成
  const signature = crypto
    .createHmac('sha1', signingKey)
    .update(signatureBase)
    .digest('base64');

  return signature;
}

/**
 * OAuth Authorizationヘッダーを生成
 */
function generateOAuthHeader(
  method: string,
  url: string,
  consumerKey: string,
  consumerSecret: string,
  accessToken: string,
  accessTokenSecret: string
): string {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString('hex');

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_token: accessToken,
    oauth_version: '1.0',
  };

  // 署名を生成
  const signature = generateOAuthSignature(
    method,
    url,
    oauthParams,
    consumerSecret,
    accessTokenSecret
  );

  oauthParams.oauth_signature = signature;

  // Authorizationヘッダーを作成
  const authHeader = 'OAuth ' + Object.keys(oauthParams)
    .sort()
    .map(key => `${percentEncode(key)}="${percentEncode(oauthParams[key])}"`)
    .join(', ');

  return authHeader;
}

/**
 * OAuth 1.0aでメディアをアップロード
 */
export async function uploadMediaWithOAuth1(imageBuffer: Buffer): Promise<{ mediaId: string | null; error?: string; status?: number; details?: string }> {
  const url = 'https://upload.twitter.com/1.1/media/upload.json';
  
  const consumerKey = process.env.TWITTER_API_KEY || '';
  const consumerSecret = process.env.TWITTER_API_SECRET || '';
  const accessToken = process.env.TWITTER_ACCESS_TOKEN || '';
  const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET || '';
  
  // 認証情報の確認
  console.log('OAuth1 upload - credentials check:');
  console.log('  Consumer Key:', consumerKey ? `${consumerKey.substring(0, 5)}...` : 'MISSING');
  console.log('  Consumer Secret:', consumerSecret ? 'SET' : 'MISSING');
  console.log('  Access Token:', accessToken ? `${accessToken.substring(0, 15)}...` : 'MISSING');
  console.log('  Access Token Secret:', accessTokenSecret ? 'SET' : 'MISSING');
  
  if (!consumerKey || !consumerSecret || !accessToken || !accessTokenSecret) {
    return {
      mediaId: null,
      error: 'Missing OAuth credentials',
    };
  }
  
  // base64エンコード
  const mediaData = imageBuffer.toString('base64');
  
  // OAuth Authorizationヘッダーを生成
  const authHeader = generateOAuthHeader(
    'POST',
    url,
    consumerKey,
    consumerSecret,
    accessToken,
    accessTokenSecret
  );
  
  console.log('OAuth1 upload - starting upload...');
  console.log('OAuth1 upload - buffer size:', imageBuffer.length);
  console.log('OAuth1 upload - base64 length:', mediaData.length);
  console.log('OAuth1 upload - auth header preview:', authHeader.substring(0, 80) + '...');
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        media_data: mediaData,
      }),
    });
    
    console.log('OAuth1 upload - response status:', response.status);
    
    const responseText = await response.text();
    console.log('OAuth1 upload - response body:', responseText.substring(0, 500));
    
    if (!response.ok) {
      return {
        mediaId: null,
        error: 'Upload failed',
        status: response.status,
        details: responseText,
      };
    }
    
    const result = JSON.parse(responseText);
    console.log('OAuth1 upload - success, media_id:', result.media_id_string);
    
    return { mediaId: result.media_id_string };
  } catch (error) {
    console.error('OAuth1 upload - exception:', error);
    return {
      mediaId: null,
      error: String(error),
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

