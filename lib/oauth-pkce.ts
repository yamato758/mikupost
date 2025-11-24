/**
 * OAuth 2.0 PKCE (Proof Key for Code Exchange) 実装
 * X APIのOAuth 2.0認証で使用
 */

import crypto from 'crypto';

/**
 * code_verifierを生成（ランダムな文字列）
 */
export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * code_challengeを生成（code_verifierのSHA256ハッシュ）
 */
export function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

/**
 * PKCEパラメータを生成
 */
export function generatePKCEParams(): { verifier: string; challenge: string } {
  const verifier = generateCodeVerifier();
  const challenge = generateCodeChallenge(verifier);
  return { verifier, challenge };
}

