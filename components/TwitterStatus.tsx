'use client';

import { TwitterStatusResponse } from '@/lib/types';

interface TwitterStatusProps {
  status: TwitterStatusResponse | null;
  onStatusChange?: () => void;
}

export default function TwitterStatus({ status, onStatusChange }: TwitterStatusProps) {
  const loading = status === null;

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
        // 親コンポーネントにステータス更新を通知
        if (onStatusChange) {
          onStatusChange();
        }
        alert('X連携を解除しました');
      } else {
        alert('連携解除に失敗しました: ' + (data.error || '不明なエラー'));
      }
    } catch (error: any) {
      alert(`連携解除中にエラーが発生しました: ${error.message || '不明なエラー'}`);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/50 backdrop-blur-md rounded-xl p-4 shadow-lg border border-white/50">
        <div className="animate-pulse text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="bg-white/50 backdrop-blur-md rounded-xl p-4 shadow-lg border border-white/50">
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
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg text-sm font-medium"
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
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg font-medium"
          >
            連携する
          </button>
        </div>
      )}
    </div>
  );
}

