/**
 * アプリケーション全体で使用する定数
 */

// X (Twitter) API設定
export const TWITTER_API_BASE = 'https://api.twitter.com/2';
export const TWITTER_AUTH_BASE = 'https://twitter.com/i/oauth2';
export const TWITTER_OAUTH_SCOPES = [
  'tweet.read',
  'tweet.write',
  'users.read',
  'offline.access',
  'media.write',
] as const;

// Gemini API設定
export const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
export const GEMINI_MODEL = 'gemini-2.5-flash-image:generateContent';
export const GEMINI_API_URL = `${GEMINI_API_BASE}/models/${GEMINI_MODEL}`;

// アプリケーション設定
export const MAX_TWEET_LENGTH = 280;
export const MEDIA_PROCESSING_WAIT_TIME = 2000; // ミリ秒

// ファイルパス
export const TOKENS_FILE_DIR = 'data';
export const TOKENS_FILE_NAME = 'tokens.json';

// OAuth 2.0設定
export const OAUTH_STATE = 'mikupost-auth-state'; // 本番環境ではランダム値推奨

// エラーメッセージ
export const ERROR_MESSAGES = {
  NO_API_KEY: 'APIキーが設定されていません',
  NO_ACCESS_TOKEN: 'アクセストークンがありません',
  TOKEN_LOAD_FAILED: 'トークンの読み込みに失敗しました',
  TOKEN_SAVE_FAILED: 'トークンの保存に失敗しました',
  TOKEN_DELETE_FAILED: 'トークンの削除に失敗しました',
  INVALID_TOKEN: 'トークンが無効です',
  NOT_CONNECTED: 'Xアカウントが連携されていません。先に連携を行ってください。',
  VALIDATION_REQUIRED: 'テキストを入力してください',
  VALIDATION_TOO_LONG: `テキストは${MAX_TWEET_LENGTH}文字以内で入力してください`,
  IMAGE_GENERATION_FAILED: '画像生成に失敗しました',
  MEDIA_UPLOAD_FAILED: '画像のアップロードに失敗しました',
  TWEET_POST_FAILED: 'Xへのポストに失敗しました',
  NETWORK_ERROR: 'ネットワークエラーが発生しました。接続を確認してください。',
  AUTH_FAILED: '認証に失敗しました',
  AUTH_CODE_MISSING: '認証コードが取得できませんでした',
  AUTH_CONFIG_INCOMPLETE: 'Twitter API設定が不完全です',
  TOKEN_EXCHANGE_FAILED: 'アクセストークンの取得に失敗しました',
  DISCONNECT_FAILED: '連携解除中にエラーが発生しました',
} as const;

