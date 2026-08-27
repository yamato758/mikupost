/**
 * X連携トークンの保存
 * 本番のVercel KVホストが無効な場合でも動くよう、Cookieを優先する
 */

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { TwitterTokens, TwitterTokenResponse } from './types';
import { TWITTER_API_BASE } from './constants';

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
    const decoded = raw.includes('%') ? decodeURIComponent(raw) : raw;
    const tokens = JSON.parse(decoded) as TwitterTokens;
    if (!tokens?.access_token && !tokens?.refresh_token) {
      return null;
    }
    return tokens;
  } catch {
    try {
      const tokens = JSON.parse(raw) as TwitterTokens;
      if (!tokens?.access_token && !tokens?.refresh_token) {
        return null;
      }
      return tokens;
    } catch {
      return null;
    }
  }
}

function isAccessTokenFresh(tokens: TwitterTokens): boolean {
  if (!tokens.access_token) {
    return false;
  }
  if (!tokens.expires_at) {
    return true;
  }
  return tokens.expires_at > Math.floor(Date.now() / 1000) + 60;
}

async function refreshTwitterTokens(tokens: TwitterTokens): Promise<TwitterTokens | null> {
  if (!tokens.refresh_token) {
    return null;
  }

  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return null;
  }

  const response = await fetch(`${TWITTER_API_BASE}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token,
      client_id: clientId,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const tokenData = (await response.json()) as TwitterTokenResponse;
  if (!tokenData.access_token) {
    return null;
  }

  return {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token || tokens.refresh_token,
    expires_at: tokenData.expires_in
      ? Math.floor(Date.now() / 1000) + tokenData.expires_in
      : undefined,
    token_type: tokenData.token_type || 'bearer',
  };
}

export function getTokenCookieOptions() {
  const isProduction = !!process.env.VERCEL || process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: TOKEN_COOKIE_MAX_AGE,
    expires: new Date(Date.now() + TOKEN_COOKIE_MAX_AGE * 1000),
  };
}

export function serializeTokenCookie(tokens: TwitterTokens): string {
  return encodeURIComponent(JSON.stringify(tokens));
}

export function attachTokenCookie<T extends NextResponse>(response: T, tokens: TwitterTokens): T {
  response.cookies.set(TOKEN_COOKIE_NAME, serializeTokenCookie(tokens), getTokenCookieOptions());
  return response;
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
  let stored: TwitterTokens | null = await loadTokensFromCookie();

  if (!stored) {
    try {
      stored = await loadTokensFromKv();
    } catch {
      stored = null;
    }
  }

  if (!stored && process.env.NODE_ENV === 'development') {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const TOKENS_FILE_PATH = path.join(process.cwd(), 'data', 'tokens.json');
      if (fs.existsSync(TOKENS_FILE_PATH)) {
        stored = parseTokens(fs.readFileSync(TOKENS_FILE_PATH, 'utf-8'));
      }
    } catch {
      stored = null;
    }
  }

  if (!stored) {
    return null;
  }

  if (isAccessTokenFresh(stored)) {
    return stored;
  }

  try {
    const refreshed = await refreshTwitterTokens(stored);
    if (refreshed) {
      await saveTokens(refreshed);
      return refreshed;
    }
  } catch {
    // 更新失敗時は期限切れトークンを返す（呼び出し側で判定）
  }

  return stored;
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
  if (!tokens) {
    return false;
  }
  return isAccessTokenFresh(tokens);
}
