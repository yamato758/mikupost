# デプロイ手順

## Vercelへのデプロイ（推奨）

VercelはNext.jsを作った会社が提供するプラットフォームで、Next.jsアプリケーションに最適化されています。

### 前提条件

- GitHubアカウント
- Vercelアカウント（無料で作成可能）
- X Developer Portalでアプリ登録済み
- Gemini APIキー取得済み

### デプロイ手順

#### 1. GitHubにリポジトリをプッシュ

```bash
# Gitリポジトリを初期化（まだの場合）
git init

# ファイルをステージング
git add .

# コミット
git commit -m "Initial commit"

# GitHubにリポジトリを作成し、プッシュ
git remote add origin https://github.com/your-username/mikupost.git
git branch -M main
git push -u origin main
```

#### 2. Vercelにプロジェクトをインポート

1. [Vercel](https://vercel.com/)にアクセスしてログイン
2. 「Add New Project」をクリック
3. GitHubリポジトリを選択
4. プロジェクト設定：
   - **Framework Preset**: Next.js（自動検出される）
   - **Root Directory**: `./`（デフォルト）
   - **Build Command**: `npm run build`（自動）
   - **Output Directory**: `.next`（自動）

#### 3. 環境変数の設定

Vercelのプロジェクト設定で、以下の環境変数を追加：

```
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret
TWITTER_REDIRECT_URI=https://your-app.vercel.app/api/auth/twitter/callback
NANO_BANANA_API_TOKEN=your_gemini_api_key
NEXTAUTH_URL=https://your-app.vercel.app
```

**重要**: `TWITTER_REDIRECT_URI`は、デプロイ後に取得するVercelのURLに変更してください。

#### 4. X Developer Portalの設定更新

1. [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)にアクセス
2. アプリの設定を開く
3. 「Callback URI / Redirect URL」に以下を追加：
   ```
   https://your-app.vercel.app/api/auth/twitter/callback
   ```
4. 保存

#### 5. デプロイ

Vercelは自動的にデプロイを開始します。完了後、提供されたURLでアプリにアクセスできます。

### 注意事項

⚠️ **重要**: Vercelはサーバーレス環境のため、ファイルシステムへの永続的な書き込み（`data/tokens.json`）は使用できません。

現在の実装では、トークンは一時的なファイルシステムに保存されますが、これはサーバーレス環境では動作しません。

**解決策**:
- データベース（Vercel Postgres、Supabase、PlanetScaleなど）を使用
- または、セッションストレージ（Vercel KV、Redisなど）を使用

詳細は「トークン保存の改善」セクションを参照してください。

---

## その他のデプロイオプション

### Railway

1. [Railway](https://railway.app/)にアカウント作成
2. 「New Project」→「Deploy from GitHub repo」
3. リポジトリを選択
4. 環境変数を設定
5. デプロイ

**メリット**: ファイルシステムへの書き込みが可能

### Render

1. [Render](https://render.com/)にアカウント作成
2. 「New Web Service」→ GitHubリポジトリを選択
3. 設定：
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. 環境変数を設定
5. デプロイ

**メリット**: 無料プランあり、ファイルシステムへの書き込みが可能

### Fly.io

1. [Fly.io](https://fly.io/)にアカウント作成
2. `flyctl`をインストール
3. `flyctl launch`でデプロイ
4. 環境変数を設定

**メリット**: グローバルなデプロイ、ファイルシステムへの書き込みが可能

---

## トークン保存の改善（Vercel使用時）

Vercelでデプロイする場合、以下のいずれかの方法でトークン保存を改善する必要があります：

### オプション1: Vercel KV（推奨）

```bash
npm install @vercel/kv
```

`lib/token-manager.ts`を更新して、Vercel KVを使用するように変更します。

### オプション2: Supabase

```bash
npm install @supabase/supabase-js
```

Supabaseデータベースにトークンを保存します。

### オプション3: セッションストレージ

Next.jsのセッション機能を使用して、トークンをクライアント側で管理します。

---

## トラブルシューティング

### デプロイが失敗する場合

- 環境変数が正しく設定されているか確認
- ビルドログを確認してエラーを特定
- `npm run build`がローカルで成功するか確認

### 認証が動作しない場合

- `TWITTER_REDIRECT_URI`が正しく設定されているか確認
- X Developer PortalのコールバックURLが正しいか確認
- 環境変数がVercelに正しく設定されているか確認

### トークンが保存されない場合

- Vercel使用時は、ファイルシステムへの書き込みができないため、データベースまたはKVストレージを使用する必要があります

