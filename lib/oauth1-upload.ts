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
 * BufferからMIMEタイプを検出
 */
function detectMimeType(buffer: Buffer): string {
  // マジックナンバーで判定
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
    return 'image/jpeg';
  }
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'image/png';
  }
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return 'image/gif';
  }
  if (buffer[0] === 0x57 && buffer[1] === 0x45 && buffer[2] === 0x42 && buffer[3] === 0x50) {
    return 'image/webp';
  }
  // デフォルトはPNG
  return 'image/png';
}

/**
 * OAuth 1.0aでメディアをアップロード
 */
export async function uploadMediaWithOAuth1(
  imageBuffer: Buffer,
  mimeType?: string
): Promise<{ mediaId: string | null; error?: string; status?: number; details?: string }> {
  const client = getTwitterClient();
  if (!client) {
    return {
      mediaId: null,
      error: 'Failed to create Twitter client - missing credentials',
    };
  }
  
  try {
    // MIMEタイプが指定されていない場合は自動検出
    const detectedMimeType = mimeType || detectMimeType(imageBuffer);
    
    const mediaId = await client.v1.uploadMedia(imageBuffer, {
      mimeType: detectedMimeType,
    });
    
    return { mediaId };
  } catch (error: any) {
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

