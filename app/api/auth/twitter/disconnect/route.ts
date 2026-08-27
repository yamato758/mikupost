import { NextRequest, NextResponse } from 'next/server';
import { deleteTokens, TOKEN_COOKIE_NAME } from '@/lib/token-manager-kv';
import { ERROR_MESSAGES } from '@/lib/constants';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils';

/**
 * X連携解除エンドポイント
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // トークンを削除
    await deleteTokens();

    const response = NextResponse.json(
      createSuccessResponse({ message: 'X連携を解除しました' })
    );
    response.cookies.set(TOKEN_COOKIE_NAME, '', { path: '/', maxAge: 0 });
    return response;
  } catch (error) {
    return NextResponse.json(
      createErrorResponse(ERROR_MESSAGES.DISCONNECT_FAILED, 'auth', 500),
      { status: 500 }
    );
  }
}

