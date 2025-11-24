# Vercelデプロイ手順（詳細版）

## 方法1: Web UIでデプロイ（推奨・簡単）

### ステップ1: Vercelにログイン

1. [Vercel](https://vercel.com/)にアクセス
2. 「Sign Up」または「Log In」をクリック
3. 「Continue with GitHub」を選択してGitHubアカウントでログイン

### ステップ2: プロジェクトをインポート

1. ダッシュボードで「Add New Project」をクリック
2. 「Import Git Repository」セクションで `yamato758/mikupost` を検索・選択
3. 「Import」をクリック

### ステップ3: プロジェクト設定

以下の設定が自動検出されます（そのままでOK）：
- **Framework Preset**: Next.js
- **Root Directory**: `./`
- **Build Command**: `npm run build`（自動）
- **Output Directory**: `.next`（自動）
- **Install Command**: `npm install`（自動）

### ステップ4: 環境変数の設定（重要）

「Environment Variables」セクションで、以下の環境変数を追加：

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `TWITTER_CLIENT_ID` | `your_client_id` | X Developer Portalで取得 |
| `TWITTER_CLIENT_SECRET` | `your_client_secret` | X Developer Portalで取得 |
| `TWITTER_REDIRECT_URI` | `https://your-app.vercel.app/api/auth/twitter/callback` | **デプロイ後に更新** |
| `NANO_BANANA_API_TOKEN` | `your_gemini_api_key` | Gemini APIキー |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | **デプロイ後に更新** |

**重要**: 
- `TWITTER_REDIRECT_URI`と`NEXTAUTH_URL`は、デプロイ完了後に取得するURLに変更する必要があります
- 最初は一時的な値（例: `https://mikupost.vercel.app`）を設定しても構いません

### ステップ5: デプロイ

1. 「Deploy」をクリック
2. デプロイが完了するまで待機（通常1-2分）
3. デプロイ完了後、表示されるURL（例: `https://mikupost-xxx.vercel.app`）をコピー

### ステップ6: 環境変数の更新

1. プロジェクト設定 → 「Environment Variables」に戻る
2. `TWITTER_REDIRECT_URI`を更新：
   ```
   https://your-actual-url.vercel.app/api/auth/twitter/callback
   ```
3. `NEXTAUTH_URL`を更新：
   ```
   https://your-actual-url.vercel.app
   ```
4. 「Save」をクリック
5. 「Redeploy」をクリックして再デプロイ

### ステップ7: X Developer Portalの設定更新

1. [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)にアクセス
2. アプリの設定を開く
3. 「Callback URI / Redirect URL」に以下を追加：
   ```
   https://your-actual-url.vercel.app/api/auth/twitter/callback
   ```
4. 保存

---

## 方法2: Vercel CLIでデプロイ

### ステップ1: ログイン

```bash
vercel login
```

「Continue with GitHub」を選択してログイン

### ステップ2: デプロイ

```bash
vercel
```

初回デプロイ時は、いくつか質問されます：
- **Set up and deploy?** → `Y`
- **Which scope?** → あなたのアカウントを選択
- **Link to existing project?** → `N`（新規プロジェクト）
- **What's your project's name?** → `mikupost`（または任意）
- **In which directory is your code located?** → `./`（そのままEnter）

### ステップ3: 環境変数の設定

```bash
vercel env add TWITTER_CLIENT_ID
vercel env add TWITTER_CLIENT_SECRET
vercel env add TWITTER_REDIRECT_URI
vercel env add NANO_BANANA_API_TOKEN
vercel env add NEXTAUTH_URL
```

各コマンド実行時に値を入力します。

### ステップ4: 本番環境にデプロイ

```bash
vercel --prod
```

---

## トラブルシューティング

### デプロイが失敗する場合

1. **ビルドエラーの確認**
   - Vercelのデプロイログを確認
   - ローカルで `npm run build` が成功するか確認

2. **環境変数の確認**
   - すべての環境変数が正しく設定されているか確認
   - 値にスペースや特殊文字が含まれていないか確認

3. **依存関係の問題**
   - `package.json`が正しく設定されているか確認
   - `node_modules`が`.gitignore`に含まれているか確認

### 認証が動作しない場合

1. **コールバックURLの確認**
   - X Developer PortalのコールバックURLが正しいか確認
   - Vercelの環境変数`TWITTER_REDIRECT_URI`が正しいか確認

2. **環境変数の再デプロイ**
   - 環境変数を更新した後、必ず再デプロイが必要

### トークンが保存されない問題

⚠️ **重要**: Vercelはサーバーレス環境のため、ファイルシステムへの永続的な書き込み（`data/tokens.json`）は使用できません。

**解決策**:
- 現在の実装では、トークンは一時的に保存されますが、リクエスト間で永続化されません
- 本番環境では、Vercel KVまたはデータベースを使用する必要があります
- 詳細は `lib/token-manager-kv.ts.example` を参照

---

## 次のステップ

デプロイが完了したら：

1. ✅ アプリのURLを確認
2. ✅ X連携をテスト
3. ✅ 画像生成をテスト
4. ✅ 投稿機能をテスト

問題が発生した場合は、Vercelのデプロイログを確認してください。

