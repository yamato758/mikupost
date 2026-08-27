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
 * Upstash Redis REST APIのコマンド形式でKVを操作する
 */
async function executeKvCommand<T>(command: unknown[]): Promise<T | null> {
  const kvUrl = getKvRestApiUrl();
  const kvToken = getKvRestApiToken();

  if (!kvUrl || !kvToken) {
    throw new Error('KV credentials are incomplete');
  }

  const response = await fetch(kvUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${kvToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    throw new Error(`KV request failed with status ${response.status}`);
  }

  const data = await response.json();
  return (data.result ?? null) as T | null;
}

/**
 * アクセストークンを読み込む
 */
export async function loadTokens(): Promise<TwitterTokens | null> {
  try {
    // Vercel KVまたはUpstash KVが利用可能な場合
    if (isKvAvailable()) {
      const result = await executeKvCommand<string>(['GET', TOKEN_KEY]);

      if (result) {
        return JSON.parse(result) as TwitterTokens;
      }
      return null;
    }

    // フォールバック: ファイルシステム（開発環境用のみ）
    // 注意: Vercelの本番環境ではファイルシステムへの書き込みはできません
    // KVが利用できない場合はエラーを返す（開発環境でもKVの使用を推奨）
    if (process.env.NODE_ENV === 'development') {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const TOKENS_FILE_PATH = path.join(process.cwd(), 'data', 'tokens.json');
        
        if (fs.existsSync(TOKENS_FILE_PATH)) {
          const fileContent = fs.readFileSync(TOKENS_FILE_PATH, 'utf-8');
          return JSON.parse(fileContent) as TwitterTokens;
        }
      } catch {
      }
    }
    
    return null;
  } catch (error) {
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
      const tokenJson = JSON.stringify(tokens);
      await executeKvCommand(['SET', TOKEN_KEY, tokenJson]);
      return;
    }

    // フォールバック: ファイルシステム（開発環境用のみ）
    // 注意: Vercelの本番環境ではファイルシステムへの書き込みはできません
    if (process.env.NODE_ENV === 'development') {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const TOKENS_FILE_PATH = path.join(process.cwd(), 'data', 'tokens.json');
        const dataDir = path.dirname(TOKENS_FILE_PATH);
        
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        
        fs.writeFileSync(TOKENS_FILE_PATH, JSON.stringify(tokens, null, 2), 'utf-8');
        return;
      } catch {
        // フォールバックが失敗した場合はエラーをスロー
        throw new Error('KVが利用できず、ファイルシステムへの書き込みも失敗しました。KVの設定を確認してください。');
      }
    }
    
    // 本番環境でKVが利用できない場合はエラー
    throw new Error('KVが利用できません。Vercel KVまたはUpstash KVの設定を確認してください。');
  } catch {
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
      await executeKvCommand(['DEL', TOKEN_KEY]);
      // 削除の失敗は無視（既に存在しない可能性があるため）
      return;
    }

    // フォールバック: ファイルシステム（開発環境用のみ）
    if (process.env.NODE_ENV === 'development') {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const TOKENS_FILE_PATH = path.join(process.cwd(), 'data', 'tokens.json');
        
        if (fs.existsSync(TOKENS_FILE_PATH)) {
          fs.unlinkSync(TOKENS_FILE_PATH);
        }
        return;
      } catch (fsError) {
        // ファイルシステムフォールバックが失敗した場合は無視
      }
    }
  } catch (error) {
    // エラーは無視（トークンが既に存在しない可能性があるため）
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

