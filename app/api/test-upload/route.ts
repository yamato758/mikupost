import { NextRequest, NextResponse } from 'next/server';
import { generateImage, fetchImageAsBuffer } from '@/lib/image-generator';
import { uploadMediaWithOAuth1, isOAuth1Available } from '@/lib/oauth1-upload';

/**
 * メディアアップロードテスト用エンドポイント（OAuth 1.0a）
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const text = searchParams.get('text') || 'テスト';
  
  // 1. OAuth 1.0a認証情報確認
  const oauth1Available = isOAuth1Available();
  if (!oauth1Available) {
    return NextResponse.json({
      step: 'oauth1_check',
      error: 'OAuth 1.0a認証情報がありません',
      hasApiKey: !!process.env.TWITTER_API_KEY,
      hasApiSecret: !!process.env.TWITTER_API_SECRET,
      hasAccessToken: !!process.env.TWITTER_ACCESS_TOKEN,
      hasAccessTokenSecret: !!process.env.TWITTER_ACCESS_TOKEN_SECRET,
    });
  }
  
  // 2. 画像生成
  console.log('Generating image...');
  const imageResult = await generateImage(text);
  if (!imageResult.success || !imageResult.imageUrl) {
    return NextResponse.json({
      step: 'image_generation',
      error: imageResult.error,
    });
  }
  
  // 3. 画像をバッファに変換
  console.log('Converting to buffer...');
  const imageBuffer = await fetchImageAsBuffer(imageResult.imageUrl);
  if (!imageBuffer) {
    return NextResponse.json({
      step: 'buffer_conversion',
      error: '画像のバッファ変換に失敗',
    });
  }
  
  // 4. OAuth 1.0aでメディアアップロード
  console.log('Uploading media with OAuth 1.0a, buffer size:', imageBuffer.length);
  
  try {
    const mediaId = await uploadMediaWithOAuth1(imageBuffer);
    
    if (mediaId) {
      return NextResponse.json({
        step: 'media_upload',
        success: true,
        mediaId,
        bufferSize: imageBuffer.length,
      });
    } else {
      return NextResponse.json({
        step: 'media_upload',
        success: false,
        error: 'メディアアップロードに失敗しました',
        bufferSize: imageBuffer.length,
      });
    }
  } catch (error) {
    return NextResponse.json({
      step: 'media_upload',
      success: false,
      error: String(error),
    });
  }
}

