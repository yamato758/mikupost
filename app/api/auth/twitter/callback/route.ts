import { NextRequest, NextResponse } from 'next/server';
import { saveTokens } from '@/lib/token-manager';
import { TwitterTokens, TwitterTokenResponse } from '@/lib/types';
import { TWITTER_API_BASE, ERROR_MESSAGES, OAUTH_STATE } from '@/lib/constants';
import { validateEnvVars } from '@/lib/utils';

/**
 * X OAuth 2.0コールバックエンドポイント
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // エラーチェック
  if (error) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(ERROR_MESSAGES.AUTH_FAILED)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(ERROR_MESSAGES.AUTH_CODE_MISSING)}`, request.url)
    );
  }

  // 環境変数の検証
  const envValidation = validateEnvVars(['TWITTER_CLIENT_ID', 'TWITTER_CLIENT_SECRET', 'TWITTER_REDIRECT_URI']);
  if (!envValidation.valid) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(ERROR_MESSAGES.AUTH_CONFIG_INCOMPLETE)}`, request.url)
    );
  }

  const clientId = process.env.TWITTER_CLIENT_ID!;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET!;
  const redirectUri = process.env.TWITTER_REDIRECT_URI!;

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
        code_verifier: 'challenge', // PKCE用（簡易実装）
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange error:', errorText);
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(ERROR_MESSAGES.TOKEN_EXCHANGE_FAILED)}`, request.url)
      );
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

    saveTokens(tokens);

    return NextResponse.redirect(
      new URL('/?success=認証が完了しました', request.url)
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent('認証処理中にエラーが発生しました')}`, request.url)
    );
  }
}

