# ミクポスト (MikuPost)

テキストを入力するだけで、初音ミクの画像を自動生成してX（旧Twitter）にポストできるWebアプリケーションです。

## 機能

- **Xアカウント連携**: OAuth 2.0を使用した安全なXアカウント連携
- **画像自動生成**: 入力テキストをもとに初音ミクの画像を自動生成（Replicate API使用）
- **自動投稿**: 生成した画像付きでXに自動投稿
- **エラーハンドリング**: 分かりやすいエラーメッセージ表示

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router) + TypeScript + React
- **スタイリング**: Tailwind CSS（半透明背景、バックドロップブラー、アニメーション）
- **バックエンド**: Next.js API Routes
- **画像生成**: Replicate API (Stable Diffusion)
- **X API**: Twitter API v2 (OAuth 2.0)

## セットアップ

### 1. 依存パッケージのインストール

```bash
cd mikupost
npm install
```

### 2. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```env
# X (Twitter) API
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret
TWITTER_REDIRECT_URI=http://localhost:3000/api/auth/twitter/callback

# 画像生成API (Replicate)
REPLICATE_API_TOKEN=your_replicate_token

# Next.js
NEXTAUTH_URL=http://localhost:3000
```

### 3. X APIの設定

1. [Twitter Developer Portal](https://developer.twitter.com/)にアクセス
2. 新しいアプリを作成
3. OAuth 2.0設定を有効化
4. コールバックURLを設定: `http://localhost:3000/api/auth/twitter/callback`
5. 必要なスコープを設定:
   - `tweet.read`
   - `tweet.write`
   - `users.read`
   - `offline.access`
6. Client IDとClient Secretを取得して`.env.local`に設定

### 4. Replicate APIの設定

1. [Replicate](https://replicate.com/)にアカウントを作成
2. APIトークンを取得
3. `.env.local`に`REPLICATE_API_TOKEN`を設定

### 5. 開発サーバーの起動

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
   - 「ポストする」ボタンをクリック
   - 画像生成→X投稿が自動で実行されます

3. **完了**
   - 投稿完了後、ツイートへのリンクが表示されます
   - 生成された画像も確認できます

## ディレクトリ構成

```
mikupost/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── auth/         # OAuth認証
│   │   ├── post/         # 投稿エンドポイント
│   │   └── status/       # 連携状態確認
│   ├── layout.tsx        # ルートレイアウト
│   ├── page.tsx          # トップページ
│   └── globals.css       # グローバルスタイル
├── components/           # Reactコンポーネント
│   ├── PostForm.tsx     # 投稿フォーム
│   ├── TwitterStatus.tsx # X連携状態表示
│   ├── LoadingSpinner.tsx # ローディング表示
│   └── ErrorMessage.tsx  # エラーメッセージ
├── lib/                  # ユーティリティ
│   ├── types.ts         # TypeScript型定義
│   ├── token-manager.ts # トークン管理
│   ├── image-generator.ts # 画像生成
│   └── twitter-client.ts # X APIクライアント
└── data/                 # データ保存（.gitignore対象）
    └── tokens.json       # アクセストークン
```

## エラーハンドリング

アプリケーションは以下のエラーを適切に処理します：

- **画像生成失敗**: 「画像生成に失敗しました。時間をおいて再度お試しください。」
- **Xメディアアップロード失敗**: 「画像のアップロードに失敗しました。」
- **Xポスト失敗**: 「Xへのポストに失敗しました。」
- **ネットワークエラー**: 「ネットワークエラーが発生しました。接続を確認してください。」

## セキュリティ

- アクセストークンは`data/tokens.json`に保存されます（`.gitignore`対象）
- 環境変数は`.env.local`で管理（`.gitignore`対象）
- CSRF対策: Next.js標準機能を使用
- XSS対策: React標準機能を使用

## 注意事項

- 初音ミクのキャラクター利用ガイドラインに準拠した利用を前提としています
- 画像生成API（Replicate）の利用には料金が発生する場合があります
- X APIの利用には利用規約を遵守してください
- 本番環境では、アクセストークンの保存にデータベースを使用することを推奨します

## トラブルシューティング

### X連携が失敗する場合

- `.env.local`の`TWITTER_CLIENT_ID`と`TWITTER_CLIENT_SECRET`が正しく設定されているか確認
- コールバックURLがX Developer Portalで正しく設定されているか確認
- 必要なスコープが設定されているか確認

### 画像生成が失敗する場合

- `.env.local`の`REPLICATE_API_TOKEN`が正しく設定されているか確認
- Replicate APIの利用制限に達していないか確認
- ネットワーク接続を確認

### 投稿が失敗する場合

- Xアカウントが正しく連携されているか確認（`/api/status`で確認可能）
- X APIの利用制限に達していないか確認
- 画像サイズが大きすぎないか確認（推奨: 5MB以下）

## デプロイ

詳細なデプロイ手順は [DEPLOY.md](./DEPLOY.md) を参照してください。

### クイックスタート（Vercel）

1. GitHubにリポジトリをプッシュ
2. [Vercel](https://vercel.com/)でプロジェクトをインポート
3. 環境変数を設定
4. デプロイ完了

⚠️ **注意**: Vercelはサーバーレス環境のため、ファイルシステムへの永続的な書き込みは使用できません。トークン保存にはデータベースまたはKVストレージが必要です。

## ライセンス

このプロジェクトは個人利用・学習目的で作成されています。

