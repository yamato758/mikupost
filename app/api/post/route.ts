import { NextRequest, NextResponse } from 'next/server';
import { loadTokens, isTokenValid } from '@/lib/token-manager-kv';
import { generateImage } from '@/lib/image-generator';
import { createTweet } from '@/lib/twitter-client';
import { PostResponse, ErrorResponse } from '@/lib/types';
import { validateTweetText, createErrorResponse, createSuccessResponse } from '@/lib/utils';
import { ERROR_MESSAGES } from '@/lib/constants';

/**
 * 画像生成→X投稿統合エンドポイント
 */
export async function POST(request: NextRequest): Promise<NextResponse<PostResponse | ErrorResponse>> {
  try {
    // リクエストボディを取得
    const body = await request.json();
    const { text } = body;

    // バリデーション
    const validation = validateTweetText(text);
    if (!validation.valid) {
      return NextResponse.json(
        createErrorResponse(validation.error || ERROR_MESSAGES.VALIDATION_REQUIRED, 'validation', 400),
        { status: 400 }
      );
    }

    // X連携状態を確認
    const tokens = await loadTokens();
    if (!isTokenValid(tokens)) {
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.NOT_CONNECTED, 'auth', 401),
        { status: 401 }
      );
    }

    // 画像生成
    const imageResult = await generateImage(text);
    let imageUrl: string | undefined = undefined;
    
    if (!imageResult.success || !imageResult.imageUrl) {
      console.warn('Image generation failed:', imageResult.error);
      // 画像生成に失敗した場合は、画像なしでツイートを試みる
      console.log('Attempting to post without image due to image generation failure');
    } else {
      imageUrl = imageResult.imageUrl;
    }

    // Xに投稿（画像がある場合は画像付き、ない場合は画像なし）
    const tweetResult = await createTweet(text, imageUrl);
    if (!tweetResult) {
      console.error('Tweet creation failed');
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.TWEET_POST_FAILED, 'tweet_post', 500),
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tweetId: tweetResult.tweetId,
      tweetUrl: tweetResult.tweetUrl,
      imageUrl: imageUrl,
    } as PostResponse);
  } catch (error) {
    console.error('Post API error:', error);
    return NextResponse.json(
      createErrorResponse(ERROR_MESSAGES.NETWORK_ERROR, 'network', 500),
      { status: 500 }
    );
  }
}

