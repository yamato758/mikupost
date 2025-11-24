import { NextResponse } from 'next/server';
import { loadTokens, isTokenValid } from '@/lib/token-manager-kv';
import { getMe } from '@/lib/twitter-client';
import { TwitterStatusResponse } from '@/lib/types';

/**
 * X連携状態確認エンドポイント
 */
export async function GET(): Promise<NextResponse<TwitterStatusResponse>> {
  const tokens = await loadTokens();
  
  if (!isTokenValid(tokens)) {
    return NextResponse.json({
      connected: false,
    });
  }

  // 実際にAPIを呼び出して認証状態を確認
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
}

