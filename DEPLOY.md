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
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/mikupost.git
git branch -M main
git push -u origin main
```

#### 2. Vercelにプロジェクトをインポート

1. [Vercel](https://vercel.com/)にアクセスしてログイン
2. 「Add New Project」をクリック
3. GitHubリポジトリを選択
4. プロジェクト設定はデフォルトでOK

#### 3. Vercel KVの設定

1. Vercelプロジェクトの **Storage** タブを開く
2. **Create Database** → **KV** を選択
3. データベースを作成
4. 環境変数が自動的に設定されます

#### 4. 環境変数の設定

Vercelのプロジェクト設定 → **Environment Variables** で以下を追加：

| 変数名 | 値 |
|--------|-----|
| `TWITTER_CLIENT_ID` | OAuth 2.0 Client ID |
| `TWITTER_CLIENT_SECRET` | OAuth 2.0 Client Secret |
| `TWITTER_REDIRECT_URI` | `https://your-app.vercel.app/api/auth/twitter/callback` |
| `TWITTER_API_KEY` | API Key (Consumer Key) |
| `TWITTER_API_SECRET` | API Key Secret |
| `TWITTER_ACCESS_TOKEN` | Access Token (Read and write権限) |
| `TWITTER_ACCESS_TOKEN_SECRET` | Access Token Secret |
| `NANO_BANANA_API_TOKEN` | Gemini API Key |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |

#### 5. X Developer Portalの設定

1. [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)にアクセス
2. アプリの **User authentication settings** を編集：
   - **App permissions**: Read and write
   - **Callback URL**: `https://your-app.vercel.app/api/auth/twitter/callback`
3. **Keys and tokens** で Access Token を再生成（Read and write権限）

#### 6. デプロイ

Vercelは自動的にデプロイを開始します。完了後、提供されたURLでアプリにアクセスできます。

---

## X API設定の詳細

### 必要な権限とスコープ

**OAuth 2.0（ユーザー認証用）:**
- `tweet.read`
- `tweet.write`
- `users.read`
- `offline.access`
- `media.write`

**OAuth 1.0a（メディアアップロード用）:**
- App permissions: **Read and write**

### Access Tokenの生成

1. X Developer Portalでアプリを選択
2. **Settings** → **User authentication settings** → **Edit**
3. **App permissions** を **Read and write** に設定 → **Save**
4. **Keys and tokens** タブに戻る
5. **Access Token and Secret** の **Regenerate** をクリック
6. 表示されたトークンをVercelの環境変数に設定

⚠️ **重要**: 権限を変更した後は、必ずAccess Tokenを再生成してください。

---

## Upstash KV（Vercel KV以外の場合）

Vercel KVの代わりにUpstash KVを使用することもできます。

1. [Upstash](https://upstash.com/)でアカウント作成
2. Redis データベースを作成
3. 以下の環境変数を設定：

```
UPSTASH_KV_REST_API_URL=https://xxx.upstash.io
UPSTASH_KV_REST_API_TOKEN=your_token
```

---

## トラブルシューティング

### デプロイが失敗する場合

- 環境変数が正しく設定されているか確認
- ビルドログを確認してエラーを特定
- `npm run build`がローカルで成功するか確認

### 認証が動作しない場合

- `TWITTER_REDIRECT_URI`がVercelのURLと一致しているか確認
- X Developer PortalのCallback URLが正しいか確認
- すべての環境変数が設定されているか確認

### 画像がポストされない場合

以下の4つの環境変数がすべて設定されているか確認：
- `TWITTER_API_KEY`
- `TWITTER_API_SECRET`
- `TWITTER_ACCESS_TOKEN`
- `TWITTER_ACCESS_TOKEN_SECRET`

Access Tokenが **Read and write** 権限で生成されているか確認。

### 「未連携」と表示される場合

- KV（Vercel KV または Upstash KV）が正しく設定されているか確認
- 環境変数が正しく設定されているか確認
- X APIのレート制限に達していないか確認（15分待つ）
