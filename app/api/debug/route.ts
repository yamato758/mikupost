import { NextResponse } from 'next/server';

/**
 * デバッグ用エンドポイント - 環境変数とKV接続の確認
 */
export async function GET() {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_KV_REST_API_TOKEN;
  
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
      
      // その他
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || '(not set)',
      VERCEL: !!process.env.VERCEL,
      NODE_ENV: process.env.NODE_ENV,
    },
    kv: {
      status: kvStatus,
      testResult: kvTestResult,
    },
  });
}

