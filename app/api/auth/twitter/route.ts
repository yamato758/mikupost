import { NextRequest, NextResponse } from 'next/server';
import { TWITTER_AUTH_BASE, TWITTER_OAUTH_SCOPES, OAUTH_STATE, ERROR_MESSAGES } from '@/lib/constants';
import { validateEnvVars } from '@/lib/utils';
import { generatePKCEParams } from '@/lib/oauth-pkce';
import { generateSessionId, saveSession } from '@/lib/session-manager';
import { cookies } from 'next/headers';

/**
 * X OAuth 2.0認証開始エンドポイント
 */
export async function GET(request: NextRequest) {
  // 環境変数の検証
  const envValidation = validateEnvVars(['TWITTER_CLIENT_ID', 'TWITTER_REDIRECT_URI']);
  if (!envValidation.valid) {
    return NextResponse.json(
      { error: ERROR_MESSAGES.AUTH_CONFIG_INCOMPLETE },
      { status: 500 }
    );
  }

  const clientId = process.env.TWITTER_CLIENT_ID!;
  const redirectUri = process.env.TWITTER_REDIRECT_URI!;

  // PKCEパラメータを生成
  const { verifier, challenge } = generatePKCEParams();
  
  // セッションIDを生成
  const sessionId = generateSessionId();
  
  // code_verifierをKVに保存（優先）、失敗した場合はCookieに保存
  const cookieStore = await cookies();
  const isProduction: boolean = !!process.env.VERCEL || process.env.NODE_ENV === 'production';
  
  let kvSaved = false;
  try {
    await saveSession(sessionId, verifier);
    kvSaved = true;
    if (process.env.NODE_ENV === 'development' || process.env.VERCEL) {
      console.log('Session saved to KV successfully');
    }
  } catch (error) {
    console.error('Failed to save session to KV:', error);
    // KV保存に失敗した場合は、Cookieに保存（フォールバック）
    kvSaved = false;
  }
  
  // KVに保存できなかった場合、または念のためCookieにも保存
  // Vercel環境ではCookieが確実に動作するとは限らないため、両方に保存
  try {
    cookieStore.set('oauth_code_verifier', verifier, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 600,
      path: '/',
    });
    if (process.env.NODE_ENV === 'development' || process.env.VERCEL) {
      console.log('Session saved to Cookie as fallback');
    }
  } catch (cookieError) {
    console.error('Failed to save session to Cookie:', cookieError);
    // Cookie保存にも失敗した場合は、エラーをスロー
    if (!kvSaved) {
      throw new Error('Failed to save session to both KV and Cookie');
    }
  }
  
  // デバッグ用
  if (process.env.NODE_ENV === 'development' || process.env.VERCEL) {
    console.log('Session created:', {
      sessionId,
      hasVerifier: !!verifier,
      verifierLength: verifier.length,
    });
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.debug('OAuth code_verifier saved to cookie');
  }

  // OAuth 2.0認証URLを生成
  const authUrl = new URL(`${TWITTER_AUTH_BASE}/authorize`);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', TWITTER_OAUTH_SCOPES.join(' '));
  // stateパラメータにセッションIDを含める（CSRF対策 + セッション識別）
  authUrl.searchParams.set('state', `${OAUTH_STATE}:${sessionId}`);
  authUrl.searchParams.set('code_challenge', challenge);
  authUrl.searchParams.set('code_challenge_method', 'S256'); // SHA256を使用

  // デバッグログ（開発環境のみ）
  if (process.env.NODE_ENV === 'development') {
    console.debug('OAuth authorization URL:', {
      url: authUrl.toString(),
      clientId: clientId.substring(0, 10) + '...',
      redirectUri,
      scopes: TWITTER_OAUTH_SCOPES,
      hasCodeChallenge: !!challenge,
    });
  }

  return NextResponse.redirect(authUrl.toString());
}

