import { NextResponse } from 'next/server';
import { loadTokens, isTokenValid, attachTokenCookie } from '@/lib/token-manager-kv';
import { getMe } from '@/lib/twitter-client';
import { TwitterStatusResponse } from '@/lib/types';

// キャッシュを無効化
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * X連携状態確認エンドポイント
 */
export async function GET(): Promise<NextResponse<TwitterStatusResponse>> {
  try {
    const tokens = await loadTokens();
    
    if (!isTokenValid(tokens) || !tokens) {
      return NextResponse.json({
        connected: false,
      });
    }

    try {
      const userInfo = await getMe();
      const response = NextResponse.json({
        connected: true,
        username: userInfo?.username,
      });
      attachTokenCookie(response, tokens);
      return response;
    } catch {
      const response = NextResponse.json({
        connected: true,
        username: undefined,
      });
      attachTokenCookie(response, tokens);
      return response;
    }
  } catch {
    return NextResponse.json({
      connected: false,
    });
  }
}

