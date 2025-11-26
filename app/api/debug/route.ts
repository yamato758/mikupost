import { NextRequest, NextResponse } from 'next/server';

/**
 * デバッグ用エンドポイント - 環境変数とKV接続の確認
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');
  
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_KV_REST_API_TOKEN;
  
  // トークン削除アクション
  if (action === 'delete_token' && kvUrl && kvToken) {
    try {
      const delResponse = await fetch(
        `${kvUrl}/del/twitter_tokens`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${kvToken}`,
          },
        }
      );
      const delResult = await delResponse.json();
      return NextResponse.json({
        action: 'delete_token',
        success: delResponse.ok,
        result: delResult,
      });
    } catch (error) {
      return NextResponse.json({
        action: 'delete_token',
        success: false,
        error: String(error),
      });
    }
  }
  
  // トークンが保存されているか確認
  let tokenStatus = 'unknown';
  let tokenData = null;
  
  if (kvUrl && kvToken) {
    try {
      const tokenResponse = await fetch(
        `${kvUrl}/get/${encodeURIComponent('twitter_tokens')}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${kvToken}`,
          },
          cache: 'no-store', // キャッシュを無効化
        }
      );
      
      const tokenResult = await tokenResponse.json();
      tokenStatus = tokenResult.result ? 'saved' : 'not_found';
      
      if (tokenResult.result) {
        try {
          const parsed = JSON.parse(tokenResult.result);
          tokenData = {
            hasAccessToken: !!parsed.access_token,
            hasRefreshToken: !!parsed.refresh_token,
            tokenType: parsed.token_type,
            expiresAt: parsed.expires_at,
          };
        } catch {
          tokenData = { raw: tokenResult.result };
        }
      }
    } catch (error) {
      tokenStatus = 'error';
      tokenData = { error: String(error) };
    }
  }
  
  // KV接続テスト
  let kvStatus = 'not_configured';
  let kvTestResult = null;
  
  if (kvUrl && kvToken) {
    try {
      // テスト用のキーを設定
      const testKey = 'debug_test_key';
      const testValue = 'test_value_' + Date.now();
      
      // SET
      const setResponse = await fetch(
        `${kvUrl}/set/${testKey}/${testValue}/ex/60`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${kvToken}`,
          },
        }
      );
      
      const setResult = await setResponse.json();
      
      // GET
      const getResponse = await fetch(
        `${kvUrl}/get/${testKey}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${kvToken}`,
          },
        }
      );
      
      const getResult = await getResponse.json();
      
      kvStatus = setResponse.ok && getResponse.ok ? 'ok' : 'error';
      kvTestResult = {
        set: { status: setResponse.status, result: setResult },
        get: { status: getResponse.status, result: getResult },
        valueMatch: getResult.result === testValue,
      };
    } catch (error) {
      kvStatus = 'error';
      kvTestResult = { error: String(error) };
    }
  }
  
  return NextResponse.json({
    env: {
      // KV関連
      KV_REST_API_URL: !!process.env.KV_REST_API_URL,
      KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
      UPSTASH_KV_REST_API_URL: !!process.env.UPSTASH_KV_REST_API_URL,
      UPSTASH_KV_REST_API_TOKEN: !!process.env.UPSTASH_KV_REST_API_TOKEN,
      
      // Twitter関連
      TWITTER_CLIENT_ID: !!process.env.TWITTER_CLIENT_ID,
      TWITTER_CLIENT_SECRET: !!process.env.TWITTER_CLIENT_SECRET,
      TWITTER_REDIRECT_URI: process.env.TWITTER_REDIRECT_URI || '(not set)',
      
      // 画像生成API
      NANO_BANANA_API_TOKEN: !!process.env.NANO_BANANA_API_TOKEN,
      
      // その他
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || '(not set)',
      VERCEL: !!process.env.VERCEL,
      NODE_ENV: process.env.NODE_ENV,
    },
    kv: {
      status: kvStatus,
      testResult: kvTestResult,
    },
    token: {
      status: tokenStatus,
      data: tokenData,
    },
    // loadTokens関数のテスト
    loadTokensTest: await testLoadTokens(),
    // getMe関数のテスト
    getMeTest: await testGetMe(),
    // OAuth 1.0a認証情報
    oauth1: {
      hasApiKey: !!process.env.TWITTER_API_KEY,
      hasApiSecret: !!process.env.TWITTER_API_SECRET,
      hasAccessToken: !!process.env.TWITTER_ACCESS_TOKEN,
      hasAccessTokenSecret: !!process.env.TWITTER_ACCESS_TOKEN_SECRET,
      apiKeyPrefix: process.env.TWITTER_API_KEY?.substring(0, 5) || 'N/A',
      accessTokenPrefix: process.env.TWITTER_ACCESS_TOKEN?.substring(0, 15) || 'N/A',
    },
  });
}

// loadTokens関数をテスト
async function testLoadTokens() {
  try {
    const { loadTokens, isTokenValid } = await import('@/lib/token-manager-kv');
    const tokens = await loadTokens();
    return {
      success: true,
      hasTokens: !!tokens,
      hasAccessToken: !!tokens?.access_token,
      isValid: isTokenValid(tokens),
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

// getMe関数をテスト
async function testGetMe() {
  try {
    const { loadTokens } = await import('@/lib/token-manager-kv');
    const tokens = await loadTokens();
    
    if (!tokens || !tokens.access_token) {
      return {
        success: false,
        error: 'No access token',
      };
    }
    
    // X APIを直接呼び出し
    const response = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });
    
    const responseText = await response.text();
    let responseJson = null;
    try {
      responseJson = JSON.parse(responseText);
    } catch {
      // JSON解析失敗
    }
    
    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      responseJson,
      responseText: responseText.substring(0, 300),
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

