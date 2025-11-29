'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearchQuery, setGifSearchQuery] = useState('');
  const [gifs, setGifs] = useState<any[]>([]);
  const [gifLoading, setGifLoading] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const gifPickerRef = useRef<HTMLDivElement>(null);

  // 外側をクリックしたときにピッカーを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (gifPickerRef.current && !gifPickerRef.current.contains(event.target as Node)) {
        setShowGifPicker(false);
      }
    };

    if (showEmojiPicker || showGifPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker, showGifPicker]);

  // GIF検索
  useEffect(() => {
    if (!showGifPicker) {
      // ピッカーが閉じられたら状態をリセット
      setGifs([]);
      setGifSearchQuery('');
      return;
    }

    const searchGifs = async () => {
      setGifLoading(true);
      setError(null); // エラーをクリア
      try {
        // クエリが空の場合はトレンドGIFを取得（qパラメータなし）
        const query = gifSearchQuery.trim();
        const url = query 
          ? `/api/giphy-search?q=${encodeURIComponent(query)}&limit=20`
          : '/api/giphy-search?limit=20';
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
          setGifs(data.gifs || []);
        } else {
          setError(data.error || 'GIF検索に失敗しました');
          setGifs([]);
        }
      } catch (error: any) {
        setError(`GIF検索に失敗しました: ${error.message || 'ネットワークエラー'}`);
        setGifs([]);
      } finally {
        setGifLoading(false);
      }
    };

    // デバウンス処理（検索時のみ、トレンドの場合は即座に実行）
    const timeoutId = setTimeout(() => {
      searchGifs();
    }, gifSearchQuery.trim() ? 500 : 0);

    return () => clearTimeout(timeoutId);
  }, [gifSearchQuery, showGifPicker]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // 最大3枚まで
    if (additionalImages.length + files.length > 3) {
      setError('追加できる画像は最大3枚までです');
      return;
    }

    const newImages = [...additionalImages, ...files].slice(0, 3);
    setAdditionalImages(newImages);

    // プレビュー用のURLを生成
    const newPreviews = newImages.map(file => URL.createObjectURL(file));
    setImagePreviews(newPreviews);
  };

  const removeImage = (index: number) => {
    // プレビューURLを解放
    URL.revokeObjectURL(imagePreviews[index]);
    
    const newImages = additionalImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    setAdditionalImages(newImages);
    setImagePreviews(newPreviews);
  };

  const insertEmoji = (emoji: string) => {
    const textarea = document.getElementById('text') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = text.substring(0, start) + emoji + text.substring(end);
      if (newText.length <= 280) {
        setText(newText);
        // カーソル位置を調整
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + emoji.length, start + emoji.length);
        }, 0);
      }
    }
    setShowEmojiPicker(false);
  };

  const selectGif = async (gifUrl: string) => {
    try {
      // GIF画像をダウンロードしてFileオブジェクトに変換
      const response = await fetch(gifUrl);
      const blob = await response.blob();
      const file = new File([blob], 'gif.gif', { type: 'image/gif' });

      // 画像として追加
      if (additionalImages.length < 3) {
        const newImages = [...additionalImages, file];
        setAdditionalImages(newImages);
        
        // プレビュー用のURLを生成
        const newPreviews = [...imagePreviews, gifUrl];
        setImagePreviews(newPreviews);
        
        setShowGifPicker(false);
        setGifSearchQuery('');
      } else {
        setError('追加できる画像は最大3枚までです');
      }
    } catch (error: any) {
      setError(`GIFの追加に失敗しました: ${error.message || '不明なエラー'}`);
    }
  };

  // よく使われる絵文字のリスト
  const commonEmojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
    '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
    '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
    '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
    '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
    '🤧', '🥵', '🥶', '😶‍🌫️', '😵', '😵‍💫', '🤯', '🤠', '🥳', '😎',
    '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳',
    '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖',
    '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬',
    '💙', '💚', '💛', '🧡', '❤️', '💜', '🖤', '🤍', '🤎', '💔',
    '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
    '✨', '⭐', '🌟', '💫', '💥', '💢', '💯', '🔥', '💤', '💨',
    '🎤', '🎵', '🎶', '🎧', '🎹', '🥁', '🎸', '🎺', '🎷', '🎻',
  ];

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
      // FormDataを使用して画像ファイルを送信
      const formData = new FormData();
      formData.append('text', text);
      additionalImages.forEach((file, index) => {
        formData.append(`image${index}`, file);
      });

      const response = await fetch('/api/post', {
        method: 'POST',
        body: formData,
      });

      const data: PostResponse | ErrorResponse = await response.json();

      if (data.success && 'tweetUrl' in data) {
        setSuccess({
          tweetUrl: data.tweetUrl!,
          imageUrl: data.imageUrl!,
        });
        setText('');
        // 画像をクリア
        imagePreviews.forEach(url => URL.revokeObjectURL(url));
        setAdditionalImages([]);
        setImagePreviews([]);
      } else {
        setError(data.error || '投稿に失敗しました');
      }
    } catch (error: any) {
      setError(`ネットワークエラーが発生しました: ${error.message || '接続を確認してください'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* テキストエリア */}
      <div className="relative">
        <textarea
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="初音ミクと一緒に何を投稿しますか？"
          className="w-full px-4 py-4 text-lg border-none focus:ring-0 focus:outline-none bg-transparent resize-none transition-all placeholder:text-gray-400"
          rows={4}
          maxLength={280}
          disabled={loading || !isConnected}
        />
        
        {/* 画像プレビュー */}
        {imagePreviews.length > 0 && (
          <div className={`mt-3 grid gap-2 rounded-xl overflow-hidden max-w-md ${
            imagePreviews.length === 1 ? 'grid-cols-1' :
            imagePreviews.length === 2 ? 'grid-cols-2' :
            'grid-cols-2'
          }`}>
            {imagePreviews.map((preview, index) => (
              <div 
                key={index} 
                className={`relative group ${
                  imagePreviews.length === 3 && index === 0 ? 'row-span-2' : ''
                }`}
              >
                <img
                  src={preview}
                  alt={`プレビュー ${index + 1}`}
                  className={`w-full object-cover rounded-lg ${
                    imagePreviews.length === 1 ? 'h-32' :
                    imagePreviews.length === 2 ? 'h-24' :
                    index === 0 ? 'h-48' : 'h-24'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white rounded-full w-7 h-7 flex items-center justify-center transition-all shadow-lg"
                  disabled={loading}
                  title="画像を削除"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 区切り線 */}
      <div className="border-t border-gray-200"></div>

      {/* ツールバー */}
      <div className="flex items-center justify-between">
        {/* 左側：アイコンボタン */}
        <div className="flex items-center gap-4">
          {/* 画像アップロードボタン */}
          {additionalImages.length < 3 && (
            <label
              htmlFor="images"
              className="cursor-pointer group"
              title="画像を追加"
            >
              <div className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-blue-50 transition-colors group-hover:bg-blue-100">
                <svg
                  className="w-5 h-5 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <input
                id="images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
                disabled={loading || !isConnected}
              />
            </label>
          )}
          
          {/* GIFボタン */}
          {additionalImages.length < 3 && (
            <div className="relative" ref={gifPickerRef}>
              <button
                type="button"
                onClick={() => {
                  setShowGifPicker(!showGifPicker);
                  setShowEmojiPicker(false);
                }}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-blue-50 transition-colors"
                title="GIFを検索"
                disabled={loading || !isConnected}
              >
                <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <text x="12" y="16" textAnchor="middle" fontSize="8" fontWeight="bold" fill="currentColor">GIF</text>
                </svg>
              </button>

              {/* GIFピッカー */}
              {showGifPicker && (
                <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-2xl border border-gray-200 w-96 max-h-96 overflow-hidden z-50 flex flex-col">
                  {/* 検索バー */}
                  <div className="p-3 border-b border-gray-200">
                    <input
                      type="text"
                      placeholder="GIFを検索..."
                      value={gifSearchQuery}
                      onChange={(e) => setGifSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      autoFocus
                    />
                  </div>

                  {/* GIFグリッド */}
                  <div className="flex-1 overflow-y-auto p-3">
                    {gifLoading ? (
                      <div className="flex flex-col items-center justify-center h-64">
                        <LoadingSpinner />
                        <p className="mt-2 text-sm text-gray-500">GIFを読み込み中...</p>
                      </div>
                    ) : gifs.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {gifs.map((gif) => (
                          <button
                            key={gif.id}
                            type="button"
                            onClick={() => selectGif(gif.url)}
                            className="relative aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all group"
                          >
                            <img
                              src={gif.preview}
                              alt={gif.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 text-gray-500 text-sm">
                        <svg className="w-12 h-12 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="font-medium">GIFが見つかりませんでした</p>
                        <p className="text-xs mt-1 text-gray-400">別のキーワードで検索してみてください</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 絵文字ボタン */}
          <div className="relative" ref={emojiPickerRef}>
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-blue-50 transition-colors"
              title="絵文字を追加"
              disabled={loading || !isConnected}
            >
              <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="9" cy="9" r="1.5" />
                <circle cx="15" cy="9" r="1.5" />
                <path d="M12 14c-2.33 0-4.31 1.46-5.11 3.5h10.22c-.8-2.04-2.78-3.5-5.11-3.5z" />
              </svg>
            </button>

            {/* 絵文字ピッカー */}
            {showEmojiPicker && (
              <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-80 max-h-64 overflow-y-auto z-50">
                <div className="text-xs text-gray-500 mb-2 font-medium">絵文字を選択</div>
                <div className="grid grid-cols-8 gap-2">
                  {commonEmojis.map((emoji, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      className="w-8 h-8 flex items-center justify-center text-xl hover:bg-gray-100 rounded transition-colors"
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 右側：文字数カウントと投稿ボタン */}
        <div className="flex items-center gap-4">
          {/* 文字数カウント */}
          <div className="flex items-center gap-2">
            {text.length > 0 && (
              <div className={`text-sm font-medium ${
                text.length >= 280 ? 'text-red-500' : 
                text.length > 260 ? 'text-orange-500' : 
                'text-gray-400'
              }`}>
                {280 - text.length}
              </div>
            )}
            {!isConnected && (
              <span className="text-xs text-red-500 font-medium">
                X連携が必要
              </span>
            )}
          </div>

          {/* 投稿ボタン */}
          <button
            type="submit"
            disabled={loading || !isConnected || text.trim().length === 0}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-full transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner />
                <span>投稿中</span>
              </div>
            ) : (
              'ポスト'
            )}
          </button>
        </div>
      </div>

      {error && (
        <ErrorMessage message={error} onClose={() => setError(null)} />
      )}

      {success && (
        <div className="bg-green-50/80 backdrop-blur-sm border border-green-200 rounded-xl p-4 shadow-lg">
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
                      className="max-w-full h-auto rounded-xl shadow-md"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

