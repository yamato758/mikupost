import { NextRequest, NextResponse } from 'next/server';
import { TWITTER_AUTH_BASE, TWITTER_OAUTH_SCOPES, OAUTH_STATE, ERROR_MESSAGES } from '@/lib/constants';
import { validateEnvVars } from '@/lib/utils';

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

  // OAuth 2.0認証URLを生成
  const authUrl = new URL(`${TWITTER_AUTH_BASE}/authorize`);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', TWITTER_OAUTH_SCOPES.join(' '));
  authUrl.searchParams.set('state', OAUTH_STATE); // CSRF対策用（本番環境ではランダム値推奨）
  
  // TODO: PKCEの適切な実装
  // 本番環境では、code_verifierをランダムに生成し、
  // code_challengeをSHA256ハッシュ化する必要があります
  // 現在は簡易実装のため、固定値を使用しています
  authUrl.searchParams.set('code_challenge', 'challenge');
  authUrl.searchParams.set('code_challenge_method', 'plain');

  return NextResponse.redirect(authUrl.toString());
}

