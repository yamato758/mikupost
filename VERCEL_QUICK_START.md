# Vercelデプロイ クイックスタートガイド

## ✅ Vercelでデプロイ可能です！

このプロジェクトは既にVercel用に設定済みです。以下の手順で簡単にデプロイできます。

## 🚀 デプロイ方法（2つの方法）

### 方法1: GitHub経由でデプロイ（推奨・簡単）

1. **GitHubにプッシュ**
   ```bash
   git add .
   git commit -m "Add falling Miku animation"
   git push origin main
   ```

2. **Vercelにログイン**
   - [Vercel](https://vercel.com/)にアクセス
   - 「Continue with GitHub」でGitHubアカウントでログイン

3. **プロジェクトをインポート**
   - 「Add New Project」をクリック
   - GitHubリポジトリを選択
   - 「Import」をクリック

4. **環境変数を設定**
   Vercelのプロジェクト設定で以下の環境変数を追加：

   | 変数名 | 説明 |
   |--------|------|
   | `TWITTER_CLIENT_ID` | X Developer Portalで取得 |
   | `TWITTER_CLIENT_SECRET` | X Developer Portalで取得 |
   | `TWITTER_REDIRECT_URI` | デプロイ後に取得するURL（例: `https://your-app.vercel.app/api/auth/twitter/callback`） |
   | `TWITTER_API_KEY` | X API Key |
   | `TWITTER_API_SECRET` | X API Secret |
   | `TWITTER_ACCESS_TOKEN` | X Access Token |
   | `TWITTER_ACCESS_TOKEN_SECRET` | X Access Token Secret |
   | `NANO_BANANA_API_TOKEN` | Gemini API Key |
   | `NEXTAUTH_URL` | デプロイ後に取得するURL（例: `https://your-app.vercel.app`） |

5. **デプロイ**
   - 「Deploy」をクリック
   - デプロイ完了後、表示されるURLをコピー

6. **環境変数を更新**
   - デプロイ完了後、実際のURLに合わせて以下を更新：
     - `TWITTER_REDIRECT_URI`
     - `NEXTAUTH_URL`
   - 「Redeploy」をクリック

7. **X Developer Portalの設定更新**
   - Callback URLに `https://your-app.vercel.app/api/auth/twitter/callback` を追加

---

### 方法2: Vercel CLIでデプロイ

1. **Vercel CLIをインストール**
   ```bash
   npm i -g vercel
   ```

2. **ログイン**
   ```bash
   vercel login
   ```

3. **デプロイ**
   ```bash
   vercel
   ```
   初回は質問に答えます：
   - Set up and deploy? → `Y`
   - Link to existing project? → `N`（新規の場合）
   - Project name → `mikupost`

4. **環境変数を設定**
   ```bash
   vercel env add TWITTER_CLIENT_ID
   vercel env add TWITTER_CLIENT_SECRET
   vercel env add TWITTER_REDIRECT_URI
   vercel env add TWITTER_API_KEY
   vercel env add TWITTER_API_SECRET
   vercel env add TWITTER_ACCESS_TOKEN
   vercel env add TWITTER_ACCESS_TOKEN_SECRET
   vercel env add NANO_BANANA_API_TOKEN
   vercel env add NEXTAUTH_URL
   ```

5. **本番環境にデプロイ**
   ```bash
   vercel --prod
   ```

---

## 📦 Vercel KVの設定（推奨）

トークンを永続化するために、Vercel KVを設定することをお勧めします：

1. Vercel Dashboard → プロジェクト → **Storage**タブ
2. **Create Database** → **KV**を選択
3. データベース名を入力（例: `mikupost-kv`）
4. 作成すると、環境変数が自動設定されます：
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
5. 再デプロイを実行

---

## ✨ 新機能について

最近追加した「落下する初音ミク」のアニメーションも、Vercelで問題なく動作します！

- クライアントサイドのReactコンポーネントなので、追加の設定は不要です
- CSSアニメーションを使用しているため、パフォーマンスも良好です

---

## 🔍 トラブルシューティング

### ビルドエラーが発生する場合

```bash
# ローカルでビルドをテスト
npm run build
```

### 環境変数が反映されない場合

- 環境変数を追加・変更した後は、必ず再デプロイが必要です
- Vercel Dashboardから「Redeploy」をクリック

### アニメーションが表示されない場合

- ブラウザのコンソールでエラーを確認
- 最新のブラウザを使用しているか確認

---

## 📝 注意事項

- 初回デプロイ時は、`TWITTER_REDIRECT_URI`と`NEXTAUTH_URL`を一時的な値で設定しても構いません
- デプロイ完了後、実際のURLに更新して再デプロイしてください
- X Developer PortalのCallback URLも忘れずに更新してください

---

デプロイが完了したら、美しい落下アニメーション付きのミクポストをお楽しみください！🎤✨

