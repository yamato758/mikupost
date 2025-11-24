/**
 * Vercel KVを使用したトークン管理
 * Vercelのサーバーレス環境でトークンを永続化するために使用
 */

import { TwitterTokens } from './types';
import { ERROR_MESSAGES } from './constants';

const TOKEN_KEY = 'twitter_tokens';

/**
 * Vercel KVまたはUpstash KVが利用可能かどうかをチェック
 * Upstash KVの環境変数名にも対応
 */
function isKvAvailable(): boolean {
  // Vercel KVの環境変数名
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return true;
  }
  // Upstash KVの環境変数名
  if (process.env.UPSTASH_KV_REST_API_URL && process.env.UPSTASH_KV_REST_API_TOKEN) {
    return true;
  }
  return false;
}

/**
 * KV REST APIのURLを取得
 */
function getKvRestApiUrl(): string | undefined {
  return process.env.KV_REST_API_URL || process.env.UPSTASH_KV_REST_API_URL;
}

/**
 * KV REST APIのトークンを取得
 */
function getKvRestApiToken(): string | undefined {
  return process.env.KV_REST_API_TOKEN || process.env.UPSTASH_KV_REST_API_TOKEN;
}

/**
 * アクセストークンを読み込む
 */
export async function loadTokens(): Promise<TwitterTokens | null> {
  try {
    // Vercel KVまたはUpstash KVが利用可能な場合
    if (isKvAvailable()) {
      const kvUrl = getKvRestApiUrl();
      const kvToken = getKvRestApiToken();
      
      if (!kvUrl || !kvToken) {
        console.error('KV credentials are incomplete');
        return null;
      }

      const response = await fetch(
        `${kvUrl}/get/${TOKEN_KEY}`,
        {
          headers: {
            'Authorization': `Bearer ${kvToken}`,
          },
        }
      );

      if (!response.ok) {
        console.error('Failed to load tokens from KV:', response.statusText);
        return null;
      }

      const data = await response.json();
      if (data.result) {
        return JSON.parse(data.result) as TwitterTokens;
      }
      return null;
    }

    // フォールバック: ファイルシステム（開発環境用）
    // 注意: Vercelの本番環境では動作しません
    const fs = await import('fs');
    const path = await import('path');
    const TOKENS_FILE_PATH = path.join(process.cwd(), 'data', 'tokens.json');
    
    if (fs.existsSync(TOKENS_FILE_PATH)) {
      const fileContent = fs.readFileSync(TOKENS_FILE_PATH, 'utf-8');
      return JSON.parse(fileContent) as TwitterTokens;
    }
    
    return null;
  } catch (error) {
    console.error(ERROR_MESSAGES.TOKEN_LOAD_FAILED, error);
    return null;
  }
}

/**
 * アクセストークンを保存する
 */
export async function saveTokens(tokens: TwitterTokens): Promise<void> {
  try {
    // Vercel KVまたはUpstash KVが利用可能な場合
    if (isKvAvailable()) {
      const kvUrl = getKvRestApiUrl();
      const kvToken = getKvRestApiToken();
      
      if (!kvUrl || !kvToken) {
        throw new Error('KV credentials are incomplete');
      }

      const response = await fetch(
        `${kvUrl}/set/${TOKEN_KEY}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${kvToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            value: JSON.stringify(tokens),
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save tokens to KV: ${errorText}`);
      }
      return;
    }

    // フォールバック: ファイルシステム（開発環境用）
    const fs = await import('fs');
    const path = await import('path');
    const TOKENS_FILE_PATH = path.join(process.cwd(), 'data', 'tokens.json');
    const dataDir = path.dirname(TOKENS_FILE_PATH);
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(TOKENS_FILE_PATH, JSON.stringify(tokens, null, 2), 'utf-8');
  } catch (error) {
    console.error(ERROR_MESSAGES.TOKEN_SAVE_FAILED, error);
    throw new Error(ERROR_MESSAGES.TOKEN_SAVE_FAILED);
  }
}

/**
 * トークンを削除する
 */
export async function deleteTokens(): Promise<void> {
  try {
    // Vercel KVまたはUpstash KVが利用可能な場合
    if (isKvAvailable()) {
      const kvUrl = getKvRestApiUrl();
      const kvToken = getKvRestApiToken();
      
      if (!kvUrl || !kvToken) {
        console.error('KV credentials are incomplete');
        return;
      }

      const response = await fetch(
        `${kvUrl}/del/${TOKEN_KEY}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${kvToken}`,
          },
        }
      );

      if (!response.ok) {
        console.error('Failed to delete tokens from KV:', response.statusText);
      }
      return;
    }

    // フォールバック: ファイルシステム（開発環境用）
    const fs = await import('fs');
    const path = await import('path');
    const TOKENS_FILE_PATH = path.join(process.cwd(), 'data', 'tokens.json');
    
    if (fs.existsSync(TOKENS_FILE_PATH)) {
      fs.unlinkSync(TOKENS_FILE_PATH);
    }
  } catch (error) {
    console.error(ERROR_MESSAGES.TOKEN_DELETE_FAILED, error);
  }
}

/**
 * トークンが有効かどうかをチェック
 */
export function isTokenValid(tokens: TwitterTokens | null): boolean {
  if (!tokens || !tokens.access_token) {
    return false;
  }
  
  if (tokens.expires_at) {
    const now = Math.floor(Date.now() / 1000);
    return tokens.expires_at > now;
  }
  
  return true;
}

