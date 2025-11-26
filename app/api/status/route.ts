import { NextResponse } from 'next/server';
import { loadTokens, isTokenValid } from '@/lib/token-manager-kv';
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
    
    if (!isTokenValid(tokens)) {
      return NextResponse.json({
        connected: false,
      });
    }

    // APIを呼び出して認証状態を確認
    try {
      const userInfo = await getMe();
      
      // userInfoがnullでも、トークンが有効なら連携済みとして扱う
      // （レート制限などで一時的に取得できない場合のため）
      return NextResponse.json({
        connected: true,
        username: userInfo?.username,
      });
    } catch {
      // getMe()でエラーが発生しても、トークンが有効なら連携済みとして扱う
      return NextResponse.json({
        connected: true,
        username: undefined,
      });
    }
  } catch {
    return NextResponse.json({
      connected: false,
    });
  }
}

