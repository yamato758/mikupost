import { NextRequest, NextResponse } from 'next/server';
import { deleteTokens } from '@/lib/token-manager';
import { ERROR_MESSAGES } from '@/lib/constants';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils';

/**
 * X連携解除エンドポイント
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // トークンを削除
    deleteTokens();
    
    return NextResponse.json(
      createSuccessResponse({ message: 'X連携を解除しました' })
    );
  } catch (error) {
    console.error('Disconnect error:', error);
    return NextResponse.json(
      createErrorResponse(ERROR_MESSAGES.DISCONNECT_FAILED, 'auth', 500),
      { status: 500 }
    );
  }
}

