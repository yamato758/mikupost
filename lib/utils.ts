/**
 * ユーティリティ関数
 */

import { MAX_TWEET_LENGTH } from './constants';

/**
 * テキストのバリデーション
 */
export function validateTweetText(text: string): { valid: boolean; error?: string } {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return { valid: false, error: 'テキストを入力してください' };
  }

  if (text.length > MAX_TWEET_LENGTH) {
    return {
      valid: false,
      error: `テキストは${MAX_TWEET_LENGTH}文字以内で入力してください`,
    };
  }

  return { valid: true };
}

/**
 * 環境変数の検証
 */
export function validateEnvVars(requiredVars: string[]): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * エラーレスポンスの作成
 */
export function createErrorResponse(
  error: string,
  errorType: 'image_generation' | 'media_upload' | 'tweet_post' | 'network' | 'auth' | 'validation',
  status: number = 500
) {
  return {
    success: false as const,
    error,
    errorType,
    status,
  };
}

/**
 * 成功レスポンスの作成
 */
export function createSuccessResponse<T extends Record<string, unknown>>(data: T): T & { success: true } {
  return {
    success: true as const,
    ...data,
  } as T & { success: true };
}

/**
 * 安全にJSONをパースする
 */
export function safeJsonParse<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

/**
 * エラーメッセージを抽出する
 */
export function extractErrorMessage(error: unknown, defaultMessage: string): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return defaultMessage;
}

