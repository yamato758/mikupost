'use client';

import { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { PostResponse, ErrorResponse } from '@/lib/types';

interface PostFormProps {
  isConnected: boolean;
}

export default function PostForm({ isConnected }: PostFormProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ tweetUrl: string; imageUrl: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      setError('Xアカウントが連携されていません。先に連携を行ってください。');
      return;
    }

    if (text.trim().length === 0) {
      setError('テキストを入力してください');
      return;
    }

    if (text.length > 280) {
      setError('テキストは280文字以内で入力してください');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      const data: PostResponse | ErrorResponse = await response.json();

      if (data.success && 'tweetUrl' in data) {
        setSuccess({
          tweetUrl: data.tweetUrl!,
          imageUrl: data.imageUrl!,
        });
        setText('');
      } else {
        setError(data.error || '投稿に失敗しました');
      }
    } catch (error) {
      console.error('Post error:', error);
      setError('ネットワークエラーが発生しました。接続を確認してください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">
          投稿テキスト
        </label>
        <textarea
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="初音ミクの画像と一緒に投稿するテキストを入力..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm resize-none"
          rows={5}
          maxLength={280}
          disabled={loading || !isConnected}
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-gray-500">
            {text.length} / 280 文字
          </span>
          {!isConnected && (
            <span className="text-sm text-red-600">
              X連携が必要です
            </span>
          )}
        </div>
      </div>

      {error && (
        <ErrorMessage message={error} onClose={() => setError(null)} />
      )}

      {success && (
        <div className="bg-green-50/80 backdrop-blur-sm border border-green-200 rounded-lg p-4 shadow-lg">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="text-green-800 font-medium mb-2">ポスト完了！</p>
              <div className="space-y-2">
                <div>
                  <a
                    href={success.tweetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline text-sm"
                  >
                    ツイートを確認する
                  </a>
                </div>
                {success.imageUrl && (
                  <div className="mt-2">
                    <img
                      src={success.imageUrl}
                      alt="生成された画像"
                      className="max-w-full h-auto rounded-lg shadow-md"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !isConnected || text.trim().length === 0}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-lg"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <LoadingSpinner />
            <span className="ml-2">処理中...</span>
          </div>
        ) : (
          'ポストする'
        )}
      </button>
    </form>
  );
}

