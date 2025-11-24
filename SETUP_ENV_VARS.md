# Vercel環境変数設定手順

## 必要な環境変数

以下の環境変数を設定してください：

1. `TWITTER_CLIENT_ID` - X Developer Portalで取得
2. `TWITTER_CLIENT_SECRET` - X Developer Portalで取得
3. `TWITTER_REDIRECT_URI` - デプロイ済みURLを使用
4. `NANO_BANANA_API_TOKEN` - Gemini APIキー
5. `NEXTAUTH_URL` - デプロイ済みURLを使用

## デプロイ済みURL

**本番URL**: `https://mikupost-1qv2rumyp-takedahiroakis-projects.vercel.app`

## 設定手順

以下のコマンドを順番に実行し、プロンプトが表示されたら値を入力してください：

### 1. TWITTER_CLIENT_ID

```bash
vercel env add TWITTER_CLIENT_ID production
```

プロンプトが表示されたら、X Developer Portalで取得した`TWITTER_CLIENT_ID`を入力してEnterを押してください。

### 2. TWITTER_CLIENT_SECRET

```bash
vercel env add TWITTER_CLIENT_SECRET production
```

プロンプトが表示されたら、X Developer Portalで取得した`TWITTER_CLIENT_SECRET`を入力してEnterを押してください。

### 3. TWITTER_REDIRECT_URI

```bash
vercel env add TWITTER_REDIRECT_URI production
```

プロンプトが表示されたら、以下を入力してください：
```
https://mikupost-1qv2rumyp-takedahiroakis-projects.vercel.app/api/auth/twitter/callback
```

### 4. NANO_BANANA_API_TOKEN

```bash
vercel env add NANO_BANANA_API_TOKEN production
```

プロンプトが表示されたら、Gemini APIキーを入力してEnterを押してください。

### 5. NEXTAUTH_URL

```bash
vercel env add NEXTAUTH_URL production
```

プロンプトが表示されたら、以下を入力してください：
```
https://mikupost-1qv2rumyp-takedahiroakis-projects.vercel.app
```

## 環境変数の確認

設定した環境変数を確認するには：

```bash
vercel env ls
```

## 再デプロイ

環境変数を設定した後、再デプロイが必要です：

```bash
vercel --prod
```

または、Vercel Dashboardから「Redeploy」をクリックしてください。

## X Developer Portalの設定

環境変数を設定した後、X Developer PortalでもコールバックURLを設定してください：

1. [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard) にアクセス
2. アプリの設定を開く
3. 「Callback URI / Redirect URL」に以下を追加：
   ```
   https://mikupost-1qv2rumyp-takedahiroakis-projects.vercel.app/api/auth/twitter/callback
   ```
4. 保存

## トラブルシューティング

### 環境変数が反映されない場合

- 環境変数を設定した後、必ず再デプロイしてください
- `vercel env ls`で環境変数が正しく設定されているか確認してください
- 環境変数の値にスペースや特殊文字が含まれていないか確認してください

### 認証が動作しない場合

- `TWITTER_REDIRECT_URI`が正しく設定されているか確認
- X Developer PortalのコールバックURLが正しく設定されているか確認
- 環境変数が本番環境（production）に設定されているか確認

