import { TwitterTokens } from './types';
import fs from 'fs';
import path from 'path';
import { TOKENS_FILE_DIR, TOKENS_FILE_NAME, ERROR_MESSAGES } from './constants';

const TOKENS_FILE_PATH = path.join(process.cwd(), TOKENS_FILE_DIR, TOKENS_FILE_NAME);

/**
 * トークンファイルのディレクトリが存在しない場合は作成
 */
function ensureDataDirectory(): void {
  const dataDir = path.dirname(TOKENS_FILE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

/**
 * アクセストークンを読み込む
 */
export function loadTokens(): TwitterTokens | null {
  try {
    ensureDataDirectory();
    if (!fs.existsSync(TOKENS_FILE_PATH)) {
      return null;
    }
    const fileContent = fs.readFileSync(TOKENS_FILE_PATH, 'utf-8');
    const tokens = JSON.parse(fileContent) as TwitterTokens;
    return tokens;
  } catch (error) {
    console.error(ERROR_MESSAGES.TOKEN_LOAD_FAILED, error);
    return null;
  }
}

/**
 * アクセストークンを保存する
 */
export function saveTokens(tokens: TwitterTokens): void {
  try {
    ensureDataDirectory();
    fs.writeFileSync(TOKENS_FILE_PATH, JSON.stringify(tokens, null, 2), 'utf-8');
  } catch (error) {
    console.error(ERROR_MESSAGES.TOKEN_SAVE_FAILED, error);
    throw new Error(ERROR_MESSAGES.TOKEN_SAVE_FAILED);
  }
}

/**
 * トークンを削除する
 */
export function deleteTokens(): void {
  try {
    if (fs.existsSync(TOKENS_FILE_PATH)) {
      fs.unlinkSync(TOKENS_FILE_PATH);
    }
  } catch (error) {
    console.error(ERROR_MESSAGES.TOKEN_DELETE_FAILED, error);
  }
}

/**
 * トークンが有効かどうかをチェック（簡易版）
 * 実際の実装では、X APIでトークンの有効性を確認する必要がある
 */
export function isTokenValid(tokens: TwitterTokens | null): boolean {
  if (!tokens || !tokens.access_token) {
    return false;
  }
  
  // 有効期限が設定されている場合はチェック
  if (tokens.expires_at) {
    const now = Math.floor(Date.now() / 1000);
    return tokens.expires_at > now;
  }
  
  // 有効期限が設定されていない場合は、トークンが存在すれば有効とみなす
  return true;
}

