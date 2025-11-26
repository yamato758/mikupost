import { NextRequest, NextResponse } from 'next/server';
import { generateImage, fetchImageAsBuffer } from '@/lib/image-generator';
import { loadTokens } from '@/lib/token-manager-kv';

/**
 * メディアアップロードテスト用エンドポイント
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const text = searchParams.get('text') || 'テスト';
  
  // 1. トークン確認
  const tokens = await loadTokens();
  if (!tokens || !tokens.access_token) {
    return NextResponse.json({
      step: 'token',
      error: 'アクセストークンがありません',
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
  
  // 4. メディアアップロード（base64形式）
  console.log('Uploading media, buffer size:', imageBuffer.length);
  
  try {
    // base64エンコード
    const base64Media = imageBuffer.toString('base64');
    console.log('Base64 length:', base64Media.length);

    const uploadResponse = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        media_data: base64Media,
        media_category: 'tweet_image',
      }),
    });

    const responseText = await uploadResponse.text();
    let responseJson = null;
    try {
      responseJson = JSON.parse(responseText);
    } catch {
      // JSON解析失敗
    }

    // レスポンスヘッダーも取得
    const responseHeaders: Record<string, string> = {};
    uploadResponse.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return NextResponse.json({
      step: 'media_upload',
      bufferSize: imageBuffer.length,
      base64Length: base64Media.length,
      uploadStatus: uploadResponse.status,
      uploadOk: uploadResponse.ok,
      responseHeaders,
      responseText: responseText.substring(0, 1000),
      responseJson,
    });
  } catch (error) {
    return NextResponse.json({
      step: 'media_upload',
      error: String(error),
    });
  }
}

