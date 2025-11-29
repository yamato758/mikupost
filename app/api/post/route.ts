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
    // FormDataまたはJSONのリクエストを処理
    const contentType = request.headers.get('content-type') || '';
    let text: string;
    let additionalImageBuffers: Buffer[] = [];
    let additionalMimeTypes: string[] = [];

    if (contentType.includes('multipart/form-data')) {
      // FormDataの場合
      const formData = await request.formData();
      text = formData.get('text') as string;

      // 追加画像を取得（image0, image1, image2）
      for (let i = 0; i < 3; i++) {
        const imageFile = formData.get(`image${i}`) as File | null;
        if (imageFile) {
          const arrayBuffer = await imageFile.arrayBuffer();
          additionalImageBuffers.push(Buffer.from(arrayBuffer));
          // MIMEタイプを取得（Fileオブジェクトから）
          additionalMimeTypes.push(imageFile.type || 'image/png');
        }
      }
    } else {
      // JSONの場合（後方互換性のため）
      const body = await request.json();
      text = body.text;
    }

    // バリデーション
    const validation = validateTweetText(text);
    if (!validation.valid) {
      return NextResponse.json(
        createErrorResponse(validation.error || ERROR_MESSAGES.VALIDATION_REQUIRED, 'validation', 400),
        { status: 400 }
      );
    }

    // 追加画像の枚数チェック
    if (additionalImageBuffers.length > 3) {
      return NextResponse.json(
        createErrorResponse('追加できる画像は最大3枚までです', 'validation', 400),
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
      // 画像生成に失敗した場合は、画像なしでツイートを試みる
    } else {
      imageUrl = imageResult.imageUrl;
    }

    // Xに投稿（生成画像 + 追加画像）
    const tweetResult = await createTweet(
      text, 
      imageUrl, 
      additionalImageBuffers.length > 0 ? additionalImageBuffers : undefined
    );
    if (!tweetResult) {
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
    return NextResponse.json(
      createErrorResponse(ERROR_MESSAGES.NETWORK_ERROR, 'network', 500),
      { status: 500 }
    );
  }
}

