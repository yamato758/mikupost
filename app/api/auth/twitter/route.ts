import { NextRequest, NextResponse } from 'next/server';
import { TWITTER_AUTH_BASE, TWITTER_OAUTH_SCOPES, OAUTH_STATE, ERROR_MESSAGES } from '@/lib/constants';
import { validateEnvVars } from '@/lib/utils';
import { generatePKCEParams } from '@/lib/oauth-pkce';
import { generateSessionId, saveSession } from '@/lib/session-manager';

/**
 * X OAuth 2.0認証開始エンドポイント
 */
export async function GET(request: NextRequest) {
  const envValidation = validateEnvVars(['TWITTER_CLIENT_ID', 'TWITTER_REDIRECT_URI']);
  if (!envValidation.valid) {
    return NextResponse.json(
      { error: ERROR_MESSAGES.AUTH_CONFIG_INCOMPLETE },
      { status: 500 }
    );
  }

  const clientId = process.env.TWITTER_CLIENT_ID!;
  const redirectUri = process.env.TWITTER_REDIRECT_URI!;
  const { verifier, challenge } = generatePKCEParams();
  const sessionId = generateSessionId();

  try {
    await saveSession(sessionId, verifier);
  } catch {
    // KVが使えなくても state / Cookie で継続する
  }

  const authUrl = new URL(`${TWITTER_AUTH_BASE}/authorize`);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', TWITTER_OAUTH_SCOPES.join(' '));
  authUrl.searchParams.set('state', `${OAUTH_STATE}:${sessionId}:${verifier}`);
  authUrl.searchParams.set('code_challenge', challenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  const isProduction = !!process.env.VERCEL || process.env.NODE_ENV === 'production';
  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set('oauth_code_verifier', verifier, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });
  return response;
}
