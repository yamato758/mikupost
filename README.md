# ミクポスト (MikuPost)

テキストを入力するだけで、初音ミクのかわいいちび画像を自動生成してX（旧Twitter）にポストできるWebアプリケーションです。

## 機能

- **Xアカウント連携**: OAuth 2.0を使用した安全なXアカウント連携
- **画像自動生成**: 入力テキストをもとに初音ミクのちびキャラ画像を自動生成（Gemini 2.5 Flash Image API使用）
- **自動投稿**: 生成した画像付きでXに自動投稿（OAuth 1.0aでメディアアップロード）
- **複数画像アップロード**: 最大4枚まで画像を添付可能（生成画像1枚 + 追加画像3枚）
- **GIF検索**: Giphy APIを使用したGIF検索・選択機能
- **絵文字ピッカー**: よく使われる絵文字を簡単に追加
- **落下アニメーション**: 背景に初音ミクのキャラクターが落下するアニメーション
- **エラーハンドリング**: 分かりやすいエラーメッセージ表示

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router) + TypeScript + React
- **スタイリング**: Tailwind CSS
- **バックエンド**: Next.js API Routes
- **画像生成**: Gemini 2.5 Flash Image API (Nano Banana)
- **X API**: Twitter API v2 (OAuth 2.0) + v1.1 Media Upload (OAuth 1.0a)
- **データストレージ**: Vercel KV / Upstash KV

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```env
# X (Twitter) API - OAuth 2.0
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret
TWITTER_REDIRECT_URI=http://localhost:3000/api/auth/twitter/callback

# X (Twitter) API - OAuth 1.0a（メディアアップロード用）
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret

# 画像生成API (Gemini)
NANO_BANANA_API_TOKEN=your_gemini_api_key

# GIF検索API (Giphy)
GIPHY_API_KEY=your_giphy_api_key

# Vercel KV / Upstash KV（トークン保存用）
UPSTASH_KV_REST_API_URL=your_kv_url
UPSTASH_KV_REST_API_TOKEN=your_kv_token

# Next.js
NEXTAUTH_URL=http://localhost:3000
```

### 3. X APIの設定

1. [Twitter Developer Portal](https://developer.twitter.com/)にアクセス
2. 新しいアプリを作成
3. **User authentication settings**で以下を設定：
   - App permissions: **Read and write**
   - Type of App: **Web App, Automated App or Bot**
   - Callback URL: `http://localhost:3000/api/auth/twitter/callback`
4. **Keys and tokens**から以下を取得：
   - API Key (Consumer Key)
   - API Key Secret (Consumer Secret)
   - Client ID
   - Client Secret
   - Access Token（Read and write権限で生成）
   - Access Token Secret

### 4. Gemini APIの設定

1. [Google AI Studio](https://aistudio.google.com/)でAPIキーを取得
2. `.env.local`に`NANO_BANANA_API_TOKEN`として設定

### 5. Giphy APIの設定（オプション）

1. [Giphy Developers](https://developers.giphy.com/)でアカウント作成
2. APIキーを取得
3. `.env.local`に`GIPHY_API_KEY`として設定
   - 注意: APIキーを設定しない場合、デフォルトの公開キーが使用されますが、制限があります

### 6. Upstash KVの設定（Vercel以外の場合）

1. [Upstash](https://upstash.com/)でアカウントを作成
2. Redis データベースを作成
3. REST API URLとTokenを取得
4. `.env.local`に設定

### 7. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## 使い方

1. **Xアカウント連携**
   - トップページの「連携する」ボタンをクリック
   - Xの認証画面で認証を完了

2. **投稿**
   - テキストエリアに投稿したいテキストを入力（最大280文字）
   - オプション: 画像アイコンから写真を追加（最大3枚）
   - オプション: GIFボタンからGIFを検索・選択
   - オプション: 絵文字ボタンから絵文字を追加
   - 「ポスト」ボタンをクリック
   - 画像生成→X投稿が自動で実行されます

3. **完了**
   - 投稿完了後、ツイートへのリンクが表示されます
   - 生成された画像も確認できます

## ディレクトリ構成

```
mikupost/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── auth/twitter/     # OAuth認証
│   │   │   ├── route.ts      # 認証開始
│   │   │   ├── callback/     # コールバック処理
│   │   │   └── disconnect/   # 連携解除
│   │   ├── post/             # 投稿エンドポイント
│   │   ├── status/           # 連携状態確認
│   │   ├── giphy-search/     # GIF検索API
│   │   └── miku-gif/         # 落下アニメーション用GIF
│   ├── layout.tsx            # ルートレイアウト
│   ├── page.tsx              # トップページ
│   └── globals.css           # グローバルスタイル
├── components/               # Reactコンポーネント
│   ├── PostForm.tsx          # 投稿フォーム（画像/GIF/絵文字対応）
│   ├── TwitterStatus.tsx     # X連携状態表示
│   ├── FallingMiku.tsx       # 落下アニメーション
│   ├── LoadingSpinner.tsx    # ローディング表示
│   └── ErrorMessage.tsx      # エラーメッセージ
└── lib/                      # ユーティリティ
    ├── types.ts              # TypeScript型定義
    ├── constants.ts          # 定数定義
    ├── token-manager-kv.ts   # KVトークン管理
    ├── session-manager.ts    # セッション管理
    ├── oauth-pkce.ts         # OAuth PKCE
    ├── oauth1-upload.ts      # OAuth 1.0aメディアアップロード
    ├── image-generator.ts    # 画像生成
    └── twitter-client.ts      # X APIクライアント
```

## Vercelへのデプロイ

### 1. 必要な環境変数

Vercelのプロジェクト設定で以下の環境変数を設定：

| 変数名 | 説明 |
|--------|------|
| `TWITTER_CLIENT_ID` | OAuth 2.0 Client ID |
| `TWITTER_CLIENT_SECRET` | OAuth 2.0 Client Secret |
| `TWITTER_REDIRECT_URI` | `https://your-domain.vercel.app/api/auth/twitter/callback` |
| `TWITTER_API_KEY` | API Key (Consumer Key) |
| `TWITTER_API_SECRET` | API Key Secret |
| `TWITTER_ACCESS_TOKEN` | Access Token (Read and write権限) |
| `TWITTER_ACCESS_TOKEN_SECRET` | Access Token Secret |
| `NANO_BANANA_API_TOKEN` | Gemini API Key |
| `GIPHY_API_KEY` | Giphy API Key（オプション） |
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` |

### 2. Vercel KVの設定

1. Vercelプロジェクトで **Storage** → **Create Database** → **KV**
2. 自動的に環境変数が設定されます

### 3. X Developer Portalの更新

Callback URLを本番URLに更新：
```
https://your-domain.vercel.app/api/auth/twitter/callback
```

## エラーハンドリング

アプリケーションは以下のエラーを適切に処理します：

- **画像生成失敗**: 「画像生成に失敗しました。時間をおいて再度お試しください。」
- **APIの利用制限**: 「APIの利用制限に達しました。しばらく時間をおいてから再度お試しください。」
- **Xメディアアップロード失敗**: 「画像のアップロードに失敗しました。」
- **Xポスト失敗**: 「Xへのポストに失敗しました。」
- **ネットワークエラー**: 「ネットワークエラーが発生しました。接続を確認してください。」

## トラブルシューティング

### X連携が失敗する場合

- 環境変数が正しく設定されているか確認
- コールバックURLがX Developer Portalで正しく設定されているか確認
- Access Tokenが「Read and write」権限で生成されているか確認

### 画像生成が失敗する場合

- `NANO_BANANA_API_TOKEN`が正しく設定されているか確認
- Gemini APIの利用制限に達していないか確認

### 画像がポストされない場合

- OAuth 1.0a用の4つの環境変数がすべて設定されているか確認：
  - `TWITTER_API_KEY`
  - `TWITTER_API_SECRET`
  - `TWITTER_ACCESS_TOKEN`
  - `TWITTER_ACCESS_TOKEN_SECRET`
- Access Tokenが「Read and write」権限で生成されているか確認

## 注意事項

- 初音ミクのキャラクター利用ガイドラインに準拠した利用を前提としています
- Gemini APIの無料枠には利用制限があります
- X APIの利用には利用規約を遵守してください

## ライセンス

このプロジェクトは個人利用・学習目的で作成されています。
