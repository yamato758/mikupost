'use client';

import { useEffect, useState } from 'react';
import TwitterStatus from '@/components/TwitterStatus';
import PostForm from '@/components/PostForm';
import { TwitterStatusResponse } from '@/lib/types';

export default function Home() {
  const [status, setStatus] = useState<TwitterStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [urlMessage, setUrlMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    // URLパラメータからメッセージを取得
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');

    if (success) {
      setUrlMessage({ type: 'success', message: success });
      // URLからパラメータを削除
      window.history.replaceState({}, '', window.location.pathname);
    } else if (error) {
      setUrlMessage({ type: 'error', message: error });
      // URLからパラメータを削除
      window.history.replaceState({}, '', window.location.pathname);
    }

    // ステータスを確認
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to check status:', error);
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ミクポスト
          </h1>
          <p className="text-gray-600">
            テキストを入力するだけで、初音ミクの画像を自動生成してXにポストできます
          </p>
        </div>

        {/* URLメッセージ表示 */}
        {urlMessage && (
          <div
            className={`mb-6 p-4 rounded-lg backdrop-blur-sm shadow-lg ${
              urlMessage.type === 'success'
                ? 'bg-green-50/80 border border-green-200 text-green-800'
                : 'bg-red-50/80 border border-red-200 text-red-800'
            }`}
          >
            {urlMessage.message}
          </div>
        )}

        {/* X連携状態 */}
        <div className="mb-6 animate-fade-in">
          <TwitterStatus />
        </div>

        {/* 投稿フォーム */}
        <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-xl animate-fade-in">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-gray-600">読み込み中...</p>
            </div>
          ) : (
            <PostForm isConnected={status?.connected || false} />
          )}
        </div>

        {/* フッター */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>初音ミクのキャラクター利用ガイドラインに準拠した利用を前提としています</p>
        </div>
      </div>
    </main>
  );
}

