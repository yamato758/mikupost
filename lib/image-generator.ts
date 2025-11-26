import { ImageGenerationResponse, GeminiApiResponse } from './types';
import { GEMINI_API_URL, ERROR_MESSAGES } from './constants';

/**
 * 画像生成用のプロンプトを生成
 */
function buildPrompt(userText: string): string {
  return `Create an ultra cute chibi Hatsune Miku illustration themed around "${userText}".

Character: super deformed chibi style, oversized head, tiny adorable body, big sparkling eyes with star and heart highlights, long flowing twintails with soft gradients, rosy pink cheeks, sweet innocent smile, small cute hands.

Style: kawaii, soft anime, pastel fantasy, fairy kei inspired, cotton candy aesthetic.

Atmosphere: dreamy ethereal glow, soft fluffy clouds, floating pastel bubbles, magical sparkles and glitter, scattered stars and hearts, rainbow light rays, bokeh effect, soft gradient background in pink, lavender and mint colors.

Lighting: soft diffused lighting, gentle glow around character, iridescent highlights.

Quality: masterpiece, best quality, ultra-detailed, 8k resolution, professional illustration, pixiv ranking, trending on artstation.

Mood: pure, innocent, angelic, heartwarming, magical girl vibes.

No text, no letters, no writing, no words, no signs, no symbols in the image.`;
}

/**
 * Nano Banana (Gemini 2.5 Flash Image) APIを使用して画像を生成
 */
export async function generateImage(userText: string): Promise<ImageGenerationResponse> {
  const apiKey = process.env.NANO_BANANA_API_TOKEN;
  
  if (!apiKey) {
    return {
      success: false,
      error: ERROR_MESSAGES.NO_API_KEY,
    };
  }

  const prompt = buildPrompt(userText);

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt }
          ]
        }]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText,
      });
      
      let errorMessage = `画像生成APIへのリクエストに失敗しました (${response.status}: ${response.statusText})`;
      
      try {
        const errorData = JSON.parse(errorText);
        
        // クォータ制限エラー（429）の場合は分かりやすいメッセージを表示
        if (response.status === 429) {
          const quotaError = errorData.error;
          if (quotaError?.message) {
            // リトライ時間を抽出
            const retryMatch = quotaError.message.match(/Please retry in ([\d.]+)s/);
            const retrySeconds = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : null;
            
            if (retrySeconds) {
              errorMessage = `APIの利用制限に達しました。約${retrySeconds}秒後に再試行してください。\n\n詳細: フリープランの利用制限に達している可能性があります。有料プランへのアップグレード、または時間をおいてから再度お試しください。`;
            } else {
              errorMessage = `APIの利用制限に達しました。しばらく時間をおいてから再度お試しください。\n\n詳細: ${quotaError.message.split('\n')[0]}`;
            }
          } else {
            errorMessage = 'APIの利用制限に達しました。しばらく時間をおいてから再度お試しください。';
          }
        } else {
          errorMessage = errorData.error?.message || errorData.message || errorMessage;
        }
      } catch {
        if (errorText) {
          // クォータ制限の場合は簡潔なメッセージ
          if (response.status === 429) {
            errorMessage = 'APIの利用制限に達しました。しばらく時間をおいてから再度お試しください。';
          } else {
            errorMessage = errorText.substring(0, 200);
          }
        }
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }

    const data = (await response.json()) as GeminiApiResponse;
    
    // デバッグ用: レスポンス構造をログに出力（本番環境では削除推奨）
    if (process.env.NODE_ENV === 'development') {
      console.log('Gemini API response structure:', JSON.stringify(data, null, 2).substring(0, 1000));
    }
    
    // レスポンス形式: candidates[0].content.parts[0].inlineData.data (base64)
    if (!data.candidates || !data.candidates[0]) {
      console.error('Unexpected response format - no candidates:', data);
      return {
        success: false,
        error: '画像生成のレスポンス形式が予期しない形式でした（candidatesが見つかりません）',
      };
    }

    const candidate = data.candidates[0];
    if (!candidate.content) {
      console.error('Unexpected response format - no content:', data);
      return {
        success: false,
        error: '画像生成のレスポンス形式が予期しない形式でした（contentが見つかりません）',
      };
    }

    const parts = candidate.content.parts;
    if (!parts || !Array.isArray(parts) || parts.length === 0) {
      console.error('No parts in response:', data);
      return {
        success: false,
        error: '画像データがレスポンスに含まれていませんでした（partsが見つかりません）',
      };
    }

    // parts配列から画像データを探す
    let base64Image: string | null = null;
    let mimeType: string = 'image/png';
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Searching for image data in parts array, length:', parts.length);
    }
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Part ${i}:`, part.text ? `text: ${part.text.substring(0, 50)}...` : part.inlineData ? `inlineData: ${part.inlineData.mimeType}` : 'unknown');
      }
      
      if (part.inlineData && part.inlineData.data) {
        base64Image = part.inlineData.data;
        mimeType = part.inlineData.mimeType || 'image/png';
        if (process.env.NODE_ENV === 'development' && base64Image) {
          console.log('Found image data in part', i, 'mimeType:', mimeType, 'data length:', base64Image.length);
        }
        break;
      }
    }

    if (!base64Image) {
      // partsの内容を詳しく確認
      console.error('No image data in response parts:', JSON.stringify(parts, null, 2));
      
      // テキストメッセージが含まれている場合（エラーメッセージの可能性）
      const textParts = parts.filter((p: any) => p.text);
      if (textParts.length > 0) {
        const errorText = textParts.map((p: any) => p.text).join(' ');
        console.error('Text message in response:', errorText);
        return {
          success: false,
          error: `画像生成がブロックされました: ${errorText.substring(0, 200)}`,
        };
      }
      
      return {
        success: false,
        error: '画像データがレスポンスに含まれていませんでした。プロンプトの内容を確認するか、しばらく時間をおいてから再度お試しください。',
      };
    }
    
    // base64データをdata URL形式に変換
    const imageUrl = `data:${mimeType};base64,${base64Image}`;
    if (process.env.NODE_ENV === 'development') {
      console.log('Image URL created, length:', imageUrl.length);
    }

    return {
      success: true,
      imageUrl: imageUrl,
    };
  } catch (error) {
    console.error('Image generation error:', error);
    return {
      success: false,
      error: '画像生成中にエラーが発生しました',
    };
  }
}

/**
 * 画像URLからバイナリデータを取得
 */
export async function fetchImageAsBuffer(imageUrl: string): Promise<Buffer | null> {
  try {
    // base64データURLの場合は直接変換
    if (imageUrl.startsWith('data:')) {
      const base64Data = imageUrl.split(',')[1];
      if (base64Data) {
        return Buffer.from(base64Data, 'base64');
      }
      return null;
    }
    
    // 通常のURLの場合はfetch
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Failed to fetch image:', error);
    return null;
  }
}

