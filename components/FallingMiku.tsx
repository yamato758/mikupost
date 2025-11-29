'use client';

import { useEffect, useState } from 'react';

interface MikuParticle {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  emoji?: string;
  imageUrl?: string;
  rotation: number;
}

export default function FallingMiku() {
  const [particles, setParticles] = useState<MikuParticle[]>([]);
  const [viewportHeight, setViewportHeight] = useState<number>(0);

  useEffect(() => {
    // ビューポートの高さを取得（iOS Safari対応）
    const updateViewportHeight = () => {
      // iOS Safariでは、window.innerHeightが正確な値を返す
      const height = window.innerHeight || document.documentElement.clientHeight;
      setViewportHeight(height);
    };

    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, []);

  useEffect(() => {
    // 初音ミク関連の絵文字とUnicode文字
    const mikuEmojis = ['🎤', '🎵', '🎶', '💙', '✨', '🌟', '🎹', '🎧'];
    
    // GIF画像のパス（APIルート経由）
    const mikuGifUrl = '/api/miku-gif';
    
    // 30個のパーティクルを生成（絵文字とGIF画像を混在）
    const newParticles: MikuParticle[] = Array.from({ length: 30 }, (_, i) => {
      // 30%の確率でGIF画像を使用、残りは絵文字
      const useGif = Math.random() < 0.3;
      
      return {
        id: i,
        left: Math.random() * 100, // 0-100%のランダムな位置
        delay: Math.random() * 8, // 0-8秒のランダムな遅延
        duration: 10 + Math.random() * 6, // 10-16秒のランダムな落下速度
        size: useGif ? 60 + Math.random() * 40 : 24 + Math.random() * 20, // GIFは少し大きく
        emoji: useGif ? undefined : mikuEmojis[Math.floor(Math.random() * mikuEmojis.length)],
        imageUrl: useGif ? mikuGifUrl : undefined,
        rotation: Math.random() * 360, // 初期回転角度
      };
    });

    setParticles(newParticles);
  }, []);

  return (
    <div 
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        WebkitTransform: 'translateZ(0)', // iOS用のハードウェアアクセラレーション
        transform: 'translateZ(0)',
        '--vh': viewportHeight > 0 ? `${viewportHeight}px` : '100vh', // iOS用の動的高さ
      } as React.CSSProperties & { '--vh': string }}
    >
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute top-0 text-center select-none"
          style={{
            left: `${particle.left}%`,
            fontSize: particle.emoji ? `${particle.size}px` : undefined,
            width: particle.imageUrl ? `${particle.size}px` : undefined,
            height: particle.imageUrl ? `${particle.size}px` : undefined,
            animation: `fall ${particle.duration}s linear ${particle.delay}s infinite`,
            WebkitAnimation: `fall ${particle.duration}s linear ${particle.delay}s infinite`, // iOS用
            opacity: 0.5 + Math.random() * 0.3, // 0.5-0.8のランダムな透明度
            filter: 'drop-shadow(0 0 3px rgba(100, 200, 255, 0.5))',
            WebkitFilter: 'drop-shadow(0 0 3px rgba(100, 200, 255, 0.5))', // iOS用
            transform: `rotate(${particle.rotation}deg) translateZ(0)`, // translateZ(0)でハードウェアアクセラレーションを有効化
            WebkitTransform: `rotate(${particle.rotation}deg) translateZ(0)`, // iOS用
            backfaceVisibility: 'hidden', // iOS用の最適化
            WebkitBackfaceVisibility: 'hidden', // iOS用
            willChange: 'transform', // パフォーマンス最適化
          }}
        >
          {particle.imageUrl ? (
            <img
              src={particle.imageUrl}
              alt="初音ミク"
              className="w-full h-full object-contain"
              style={{
                imageRendering: 'auto',
              }}
            />
          ) : (
            particle.emoji
          )}
        </div>
      ))}
    </div>
  );
}

