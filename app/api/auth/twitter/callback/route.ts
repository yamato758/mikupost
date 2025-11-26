import { NextRequest, NextResponse } from 'next/server';
import { saveTokens } from '@/lib/token-manager-kv';
import { TwitterTokens, TwitterTokenResponse } from '@/lib/types';
import { TWITTER_API_BASE, ERROR_MESSAGES, OAUTH_STATE } from '@/lib/constants';
import { validateEnvVars } from '@/lib/utils';
import { getSession, deleteSession } from '@/lib/session-manager';
import { cookies } from 'next/headers';

/**
 * X OAuth 2.0コールバックエンドポイント
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  // ベースURLを正しく構築
  const getBaseUrl = () => {
    if (process.env.NEXTAUTH_URL) {
      return process.env.NEXTAUTH_URL;
    }
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || 'localhost:3000';
    return `${proto}://${host}`;
  };
  const baseUrl = getBaseUrl();

  // エラーチェック
  if (error) {
    const errorUrl = new URL('/', baseUrl);
    errorUrl.searchParams.set('error', ERROR_MESSAGES.AUTH_FAILED);
    return NextResponse.redirect(errorUrl.toString());
  }

  if (!code) {
    const errorUrl = new URL('/', baseUrl);
    errorUrl.searchParams.set('error', ERROR_MESSAGES.AUTH_CODE_MISSING);
    return NextResponse.redirect(errorUrl.toString());
  }

  // 環境変数の検証
  const envValidation = validateEnvVars(['TWITTER_CLIENT_ID', 'TWITTER_CLIENT_SECRET', 'TWITTER_REDIRECT_URI']);
  if (!envValidation.valid) {
    const errorUrl = new URL('/', baseUrl);
    errorUrl.searchParams.set('error', ERROR_MESSAGES.AUTH_CONFIG_INCOMPLETE);
    return NextResponse.redirect(errorUrl.toString());
  }

  const clientId = process.env.TWITTER_CLIENT_ID!;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET!;
  const redirectUri = process.env.TWITTER_REDIRECT_URI!;

  // stateパラメータからセッションIDを取得
  let sessionId: string | null = null;
  if (state && state.startsWith(`${OAUTH_STATE}:`)) {
    sessionId = state.split(':')[1];
  } else if (state) {
    // stateが存在するが、期待される形式でない場合
    console.warn('Unexpected state format:', state);
  }

  // KVからcode_verifierを取得（優先）
  let codeVerifier: string | null = null;
  if (sessionId) {
    try {
      codeVerifier = await getSession(sessionId);
      if (codeVerifier) {
        // 使用済みのセッションを削除
        await deleteSession(sessionId);
        if (process.env.NODE_ENV === 'development' || process.env.VERCEL) {
          console.log('Code verifier retrieved from KV');
        }
      }
    } catch (error) {
      console.error('Failed to get session from KV:', error);
    }
  }

  // フォールバック: Cookieから取得
  if (!codeVerifier) {
    const cookieStore = await cookies();
    const codeVerifierCookie = cookieStore.get('oauth_code_verifier');
    codeVerifier = codeVerifierCookie?.value || null;
    
    if (codeVerifier) {
      // 使用済みのCookieを削除
      cookieStore.delete('oauth_code_verifier');
      if (process.env.NODE_ENV === 'development' || process.env.VERCEL) {
        console.log('Code verifier retrieved from Cookie');
      }
    }
  }

  // デバッグ用
  if (process.env.NODE_ENV === 'development' || process.env.VERCEL) {
    console.log('Session check:', {
      hasState: !!state,
      stateValue: state,
      sessionId,
      hasCodeVerifier: !!codeVerifier,
      codeVerifierLength: codeVerifier?.length || 0,
      requestUrl: request.url,
    });
  }

  if (!codeVerifier) {
    console.error('code_verifier not found', {
      hasState: !!state,
      sessionId,
      requestUrl: request.url,
    });
    
    const errorUrl = new URL('/', baseUrl);
    errorUrl.searchParams.set('error', '認証セッションが無効です。再度連携してください。');
    
    return NextResponse.redirect(errorUrl.toString());
  }

  try {
    // アクセストークンを取得
    const tokenResponse = await fetch(`${TWITTER_API_BASE}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange error:', errorText);
      const errorUrl = new URL('/', baseUrl);
      errorUrl.searchParams.set('error', ERROR_MESSAGES.TOKEN_EXCHANGE_FAILED);
      return NextResponse.redirect(errorUrl.toString());
    }

    const tokenData = (await tokenResponse.json()) as TwitterTokenResponse;
    
    // トークンを保存
    const tokens: TwitterTokens = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: tokenData.expires_in 
        ? Math.floor(Date.now() / 1000) + tokenData.expires_in 
        : undefined,
      token_type: tokenData.token_type || 'bearer',
    };

    await saveTokens(tokens);

    const successUrl = new URL('/', baseUrl);
    successUrl.searchParams.set('success', '認証が完了しました');
    return NextResponse.redirect(successUrl.toString());
  } catch (error) {
    console.error('OAuth callback error:', error);
    const errorUrl = new URL('/', baseUrl);
    errorUrl.searchParams.set('error', '認証処理中にエラーが発生しました');
    return NextResponse.redirect(errorUrl.toString());
  }
}

