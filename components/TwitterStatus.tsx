'use client';

import { useEffect, useState } from 'react';
import { TwitterStatusResponse } from '@/lib/types';

export default function TwitterStatus() {
  const [status, setStatus] = useState<TwitterStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  const handleConnect = () => {
    window.location.href = '/api/auth/twitter';
  };

  const handleDisconnect = async () => {
    if (!confirm('X連携を解除しますか？')) {
      return;
    }

    try {
      const response = await fetch('/api/auth/twitter/disconnect', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        // ステータスを更新
        await checkStatus();
        alert('X連携を解除しました');
      } else {
        alert('連携解除に失敗しました: ' + (data.error || '不明なエラー'));
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
      alert('連携解除中にエラーが発生しました');
    }
  };

  if (loading) {
    return (
      <div className="bg-white/30 backdrop-blur-sm rounded-lg p-4 shadow-lg">
        <div className="animate-pulse text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="bg-white/30 backdrop-blur-sm rounded-lg p-4 shadow-lg">
      {status?.connected ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-green-600 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-gray-800 font-medium">
              X連携済み {status.username && `(@${status.username})`}
            </span>
          </div>
          <button
            onClick={handleDisconnect}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors shadow-md text-sm"
          >
            連携解除
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-red-600 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-gray-800 font-medium">X未連携</span>
          </div>
          <button
            onClick={handleConnect}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors shadow-md"
          >
            連携する
          </button>
        </div>
      )}
    </div>
  );
}

