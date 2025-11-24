/**
 * APIレスポンス型定義
 */

export type ErrorType =
  | 'image_generation'
  | 'media_upload'
  | 'tweet_post'
  | 'network'
  | 'auth'
  | 'validation';

export interface TwitterTokens {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  token_type?: string;
}

export interface PostResponse {
  success: true;
  tweetId: string;
  tweetUrl: string;
  imageUrl?: string;
}

export interface TwitterStatusResponse {
  connected: boolean;
  username?: string;
}

export interface ImageGenerationResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  errorType: ErrorType;
}

// X APIレスポンス型
export interface TwitterApiError {
  errors?: Array<{
    message: string;
    code?: number;
    parameters?: Record<string, unknown>;
  }>;
  title?: string;
  detail?: string;
  type?: string;
}

export interface TwitterMediaUploadResponse {
  media_id_string?: string;
  data?: {
    media_id?: string;
    id?: string;
    processing_info?: {
      state: 'pending' | 'in_progress' | 'succeeded' | 'failed';
      check_after_secs?: number;
    };
  };
  id?: string;
  processing_info?: {
    state: 'pending' | 'in_progress' | 'succeeded' | 'failed';
    check_after_secs?: number;
  };
}

export interface TwitterTweetResponse {
  data: {
    id: string;
    text: string;
  };
}

export interface TwitterUserResponse {
  data: {
    id: string;
    username: string;
    name?: string;
  };
}

// Gemini APIレスポンス型
export interface GeminiApiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        inlineData?: {
          mimeType: string;
          data: string;
        };
      }>;
    };
  }>;
  error?: {
    message: string;
    code?: number;
  };
}

export interface TwitterTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

