import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/lib/image-generator';

/**
 * 画像生成テスト用エンドポイント
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const text = searchParams.get('text') || 'テスト';
  
  console.log('Testing image generation with text:', text);
  
  const result = await generateImage(text);
  
  return NextResponse.json({
    input: text,
    success: result.success,
    hasImageUrl: !!result.imageUrl,
    imageUrlLength: result.imageUrl?.length || 0,
    error: result.error,
    // 画像データの最初の100文字だけ表示（デバッグ用）
    imagePreview: result.imageUrl?.substring(0, 100),
  });
}

