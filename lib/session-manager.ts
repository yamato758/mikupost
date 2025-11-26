/**
 * OAuthセッション管理（Vercel KV使用）
 * code_verifierをKVに保存して、Cookieに依存しないセッション管理を実現
 */

import { ERROR_MESSAGES } from './constants';

const SESSION_KEY_PREFIX = 'oauth_session:';
const SESSION_TTL = 600; // 10分（秒）

/**
 * Vercel KVまたはUpstash KVが利用可能かどうかをチェック
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
 * セッションIDを生成
 */
export function generateSessionId(): string {
  return crypto.randomUUID();
}

/**
 * code_verifierをセッションとして保存
 */
export async function saveSession(sessionId: string, codeVerifier: string): Promise<void> {
  try {
    if (!isKvAvailable()) {
      // Vercel環境でKVが利用できない場合はエラーをスロー（Cookieフォールバックを実行させるため）
      if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
        throw new Error('KVが利用できません。Vercel KVまたはUpstash KVの設定を確認してください。');
      }
      // 開発環境では警告のみ
      console.warn('KVが利用できません。開発環境ではCookieフォールバックを使用します。');
      throw new Error('KVが利用できません'); // 開発環境でもエラーをスローしてCookieフォールバックを実行
    }

    const kvUrl = getKvRestApiUrl();
    const kvToken = getKvRestApiToken();
    
    if (!kvUrl || !kvToken) {
      throw new Error('KV credentials are incomplete');
    }

    const sessionKey = `${SESSION_KEY_PREFIX}${sessionId}`;
    // Upstash Redis REST API: SET key value EX ttl
    // 形式: POST /set/key/value/ex/ttl または POST / with body ["SET", "key", "value", "EX", ttl]
    const response = await fetch(
      `${kvUrl}/set/${encodeURIComponent(sessionKey)}/${encodeURIComponent(codeVerifier)}/ex/${SESSION_TTL}`,
      {
        method: 'GET', // Upstash REST APIはGETでコマンドを実行
        headers: {
          'Authorization': `Bearer ${kvToken}`,
        },
      }
    );
    
    if (process.env.NODE_ENV === 'development' || process.env.VERCEL) {
      console.log('KV SET response:', {
        status: response.status,
        ok: response.ok,
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to save session to KV: ${errorText}`);
    }
  } catch (error) {
    console.error('Failed to save session:', error);
    throw new Error('セッションの保存に失敗しました');
  }
}

/**
 * code_verifierをセッションから取得
 */
export async function getSession(sessionId: string): Promise<string | null> {
  try {
    if (!isKvAvailable()) {
      console.warn('KVが利用できません。セッションを取得できません。');
      return null;
    }

    const kvUrl = getKvRestApiUrl();
    const kvToken = getKvRestApiToken();
    
    if (!kvUrl || !kvToken) {
      console.error('KV credentials are incomplete');
      return null;
    }

    const sessionKey = `${SESSION_KEY_PREFIX}${sessionId}`;
    // Upstash Redis REST API: GET key
    const response = await fetch(
      `${kvUrl}/get/${encodeURIComponent(sessionKey)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${kvToken}`,
        },
      }
    );
    
    if (process.env.NODE_ENV === 'development' || process.env.VERCEL) {
      console.log('KV GET response:', {
        status: response.status,
        ok: response.ok,
      });
    }

    if (!response.ok) {
      console.error('Failed to load session from KV:', response.statusText);
      return null;
    }

    const data = await response.json();
    if (data.result) {
      return data.result as string;
    }
    return null;
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
}

/**
 * セッションを削除
 */
export async function deleteSession(sessionId: string): Promise<void> {
  try {
    if (!isKvAvailable()) {
      return;
    }

    const kvUrl = getKvRestApiUrl();
    const kvToken = getKvRestApiToken();
    
    if (!kvUrl || !kvToken) {
      return;
    }

    const sessionKey = `${SESSION_KEY_PREFIX}${sessionId}`;
    // Upstash Redis REST API: DEL key
    const response = await fetch(
      `${kvUrl}/del/${encodeURIComponent(sessionKey)}`,
      {
        method: 'GET', // Upstash REST APIはGETでコマンドを実行
        headers: {
          'Authorization': `Bearer ${kvToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to delete session from KV:', response.statusText);
    }
  } catch (error) {
    console.error('Failed to delete session:', error);
  }
}
