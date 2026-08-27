/**
 * X連携トークンの保存
 * 本番のVercel KVホストが無効な場合でも動くよう、Cookieを優先する
 */

import { cookies } from 'next/headers';
import { TwitterTokens } from './types';

const TOKEN_KEY = 'twitter_tokens';
export const TOKEN_COOKIE_NAME = 'mikupost_twitter_tokens';
const TOKEN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function isKvAvailable(): boolean {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return true;
  }
  if (process.env.UPSTASH_KV_REST_API_URL && process.env.UPSTASH_KV_REST_API_TOKEN) {
    return true;
  }
  return false;
}

function getKvRestApiUrl(): string | undefined {
  return process.env.KV_REST_API_URL || process.env.UPSTASH_KV_REST_API_URL;
}

function getKvRestApiToken(): string | undefined {
  return process.env.KV_REST_API_TOKEN || process.env.UPSTASH_KV_REST_API_TOKEN;
}

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
  if (data.error) {
    throw new Error(String(data.error));
  }
  return (data.result ?? null) as T | null;
}

function parseTokens(raw: string): TwitterTokens | null {
  try {
    const tokens = JSON.parse(raw) as TwitterTokens;
    if (!tokens?.access_token) {
      return null;
    }
    return tokens;
  } catch {
    return null;
  }
}

export function getTokenCookieOptions() {
  const isProduction = !!process.env.VERCEL || process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: TOKEN_COOKIE_MAX_AGE,
  };
}

export function serializeTokenCookie(tokens: TwitterTokens): string {
  return JSON.stringify(tokens);
}

async function loadTokensFromCookie(): Promise<TwitterTokens | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
    if (!raw) {
      return null;
    }
    return parseTokens(raw);
  } catch {
    return null;
  }
}

async function saveTokensToKv(tokens: TwitterTokens): Promise<void> {
  if (!isKvAvailable()) {
    return;
  }
  await executeKvCommand(['SET', TOKEN_KEY, JSON.stringify(tokens)]);
}

async function loadTokensFromKv(): Promise<TwitterTokens | null> {
  if (!isKvAvailable()) {
    return null;
  }
  const result = await executeKvCommand<string>(['GET', TOKEN_KEY]);
  if (!result) {
    return null;
  }
  return parseTokens(result);
}

/**
 * アクセストークンを読み込む
 */
export async function loadTokens(): Promise<TwitterTokens | null> {
  const fromCookie = await loadTokensFromCookie();
  if (fromCookie) {
    return fromCookie;
  }

  try {
    const fromKv = await loadTokensFromKv();
    if (fromKv) {
      return fromKv;
    }
  } catch {
    // KVが死んでいてもCookieで継続できるようにする
  }

  if (process.env.NODE_ENV === 'development') {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const TOKENS_FILE_PATH = path.join(process.cwd(), 'data', 'tokens.json');
      if (fs.existsSync(TOKENS_FILE_PATH)) {
        return parseTokens(fs.readFileSync(TOKENS_FILE_PATH, 'utf-8'));
      }
    } catch {
      // ignore
    }
  }

  return null;
}

/**
 * アクセストークンを保存する
 * Cookieは呼び出し側のレスポンスにも付ける
 */
export async function saveTokens(tokens: TwitterTokens): Promise<void> {
  try {
    await saveTokensToKv(tokens);
  } catch {
    // KVは任意。Cookieが保存できていれば連携は成立する
  }

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
    } catch {
      // ignore
    }
  }
}

/**
 * トークンを削除する
 */
export async function deleteTokens(): Promise<void> {
  try {
    if (isKvAvailable()) {
      await executeKvCommand(['DEL', TOKEN_KEY]);
    }
  } catch {
    // ignore
  }

  if (process.env.NODE_ENV === 'development') {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const TOKENS_FILE_PATH = path.join(process.cwd(), 'data', 'tokens.json');
      if (fs.existsSync(TOKENS_FILE_PATH)) {
        fs.unlinkSync(TOKENS_FILE_PATH);
      }
    } catch {
      // ignore
    }
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
