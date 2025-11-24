import { NextRequest, NextResponse } from 'next/server';
import { TWITTER_AUTH_BASE, TWITTER_OAUTH_SCOPES, OAUTH_STATE, ERROR_MESSAGES } from '@/lib/constants';
import { validateEnvVars } from '@/lib/utils';
import { generatePKCEParams } from '@/lib/oauth-pkce';
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
  
  // code_verifierをCookieに保存（コールバックで使用するため）
  const cookieStore = await cookies();
  cookieStore.set('oauth_code_verifier', verifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10分
    path: '/',
  });

  // OAuth 2.0認証URLを生成
  const authUrl = new URL(`${TWITTER_AUTH_BASE}/authorize`);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', TWITTER_OAUTH_SCOPES.join(' '));
  authUrl.searchParams.set('state', OAUTH_STATE); // CSRF対策用（本番環境ではランダム値推奨）
  authUrl.searchParams.set('code_challenge', challenge);
  authUrl.searchParams.set('code_challenge_method', 'S256'); // SHA256を使用

  return NextResponse.redirect(authUrl.toString());
}

