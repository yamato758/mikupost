import { NextRequest, NextResponse } from 'next/server';

/**
 * Giphy APIを使用してGIFを検索
 * 注意: Giphy APIキーが必要です（環境変数 GIPHY_API_KEY）
 * 無料APIキーは https://developers.giphy.com/ で取得できます
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const limit = parseInt(searchParams.get('limit') || '20');

  // Giphy APIキー（環境変数から取得、なければデフォルトの公開キーを使用）
  // 注意: デフォルトキーは制限があるため、本番環境では独自のAPIキーを設定してください
  const apiKey = process.env.GIPHY_API_KEY || 'dc6zaTOxFJmzC'; // Giphyのデフォルト公開キー（制限あり）

  try {
    // クエリが空の場合はトレンドGIFを取得、そうでなければ検索
    const isTrending = !query.trim();
    const endpoint = isTrending 
      ? `https://api.giphy.com/v1/gifs/trending?api_key=${apiKey}&limit=${limit}&rating=g`
      : `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query.trim())}&limit=${limit}&rating=g&lang=ja`;
    
    const response = await fetch(endpoint, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      
      // エラーレスポンスをパースして詳細を取得
      let errorMessage = 'GIF検索に失敗しました';
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.meta?.msg) {
          errorMessage = `GIF検索エラー: ${errorData.meta.msg}`;
        } else if (errorData.message) {
          errorMessage = `GIF検索エラー: ${errorData.message}`;
        }
      } catch {
        // パースに失敗した場合はデフォルトメッセージを使用
      }
      
      // 403エラーの場合、APIキーの問題の可能性
      if (response.status === 403) {
        errorMessage = 'GIF検索に失敗しました。APIキーの設定を確認してください。';
      }
      
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // データが存在しない場合
    if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
      return NextResponse.json({
        success: true,
        gifs: [],
        message: 'GIFが見つかりませんでした',
      });
    }
    
    // Giphyのレスポンスを整形
    const gifs = data.data.map((gif: any) => {
      // 画像URLのフォールバック処理
      const fixedHeight = gif.images?.fixed_height;
      const previewGif = gif.images?.preview_gif;
      const original = gif.images?.original;
      const downsized = gif.images?.downsized;
      
      return {
        id: gif.id,
        title: gif.title || 'GIF',
        url: fixedHeight?.url || original?.url || downsized?.url || previewGif?.url || '',
        preview: previewGif?.url || fixedHeight?.url || downsized?.url || original?.url || '',
        width: fixedHeight?.width || original?.width || downsized?.width || 200,
        height: fixedHeight?.height || original?.height || downsized?.height || 200,
      };
    }).filter((gif: any) => gif.url && gif.preview); // URLが存在するもののみ

    if (gifs.length === 0) {
      return NextResponse.json({
        success: true,
        gifs: [],
        message: 'GIFが見つかりませんでした',
      });
    }

    return NextResponse.json({ success: true, gifs });
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: `GIF検索に失敗しました: ${error.message || '不明なエラー'}` 
      },
      { status: 500 }
    );
  }
}

