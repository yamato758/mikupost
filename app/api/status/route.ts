import { NextResponse } from 'next/server';
import { loadTokens, isTokenValid } from '@/lib/token-manager-kv';
import { getMe } from '@/lib/twitter-client';
import { TwitterStatusResponse } from '@/lib/types';

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

    // 実際にAPIを呼び出して認証状態を確認
    try {
      const userInfo = await getMe();
      
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

