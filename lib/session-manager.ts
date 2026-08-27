/**
 * OAuthセッション管理（Vercel KV使用）
 * code_verifierをKVに保存して、Cookieに依存しないセッション管理を実現
 */

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
      throw new Error('KVが利用できません'); // 開発環境でもエラーをスローしてCookieフォールバックを実行
    }

    const sessionKey = `${SESSION_KEY_PREFIX}${sessionId}`;
    await executeKvCommand(['SET', sessionKey, codeVerifier, 'EX', SESSION_TTL]);
  } catch {
    throw new Error('セッションの保存に失敗しました');
  }
}

/**
 * code_verifierをセッションから取得
 */
export async function getSession(sessionId: string): Promise<string | null> {
  try {
    if (!isKvAvailable()) {
      return null;
    }

    const sessionKey = `${SESSION_KEY_PREFIX}${sessionId}`;
    return await executeKvCommand<string>(['GET', sessionKey]);
  } catch {
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

    const sessionKey = `${SESSION_KEY_PREFIX}${sessionId}`;
    await executeKvCommand(['DEL', sessionKey]);

    // セッション削除の失敗は無視（既に期限切れの可能性があるため）
  } catch {
    // エラーは無視
  }
}
