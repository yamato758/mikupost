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
    
    // デバッグログ
    console.log('Status check - tokens loaded:', {
      hasTokens: !!tokens,
      hasAccessToken: !!tokens?.access_token,
      tokenType: tokens?.token_type,
    });
    
    if (!isTokenValid(tokens)) {
      console.log('Status check - tokens invalid');
      return NextResponse.json({
        connected: false,
      });
    }

    // 実際にAPIを呼び出して認証状態を確認
    try {
      const userInfo = await getMe();
      
      console.log('Status check - getMe result:', {
        hasUserInfo: !!userInfo,
        username: userInfo?.username,
      });
      
      if (!userInfo) {
        return NextResponse.json({
          connected: false,
        });
      }

      return NextResponse.json({
        connected: true,
        username: userInfo.username,
      });
    } catch (error) {
      // getMe()でエラーが発生した場合も未連携として扱う
      console.error('Failed to get user info:', error);
      return NextResponse.json({
        connected: false,
      });
    }
  } catch (error) {
    // トークン読み込みエラーなど
    console.error('Failed to check status:', error);
    return NextResponse.json({
      connected: false,
    });
  }
}

