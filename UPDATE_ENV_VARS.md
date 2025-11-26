# Vercel環境変数更新手順

## 方法1: Vercel CLIで更新（削除→追加）

### ステップ1: 既存の環境変数を削除

```bash
vercel env rm TWITTER_REDIRECT_URI production
```

確認プロンプトで `y` を入力

### ステップ2: 新しい値を追加

```bash
vercel env add TWITTER_REDIRECT_URI production
```

プロンプトが表示されたら、以下を入力：
```
https://mikupost-h6r7ntt2u-takedahiroakis-projects.vercel.app/api/auth/twitter/callback
```

### ステップ3: 再デプロイ

```bash
vercel --prod
```

---

## 方法2: Web UIで更新（推奨・簡単）

### ステップ1: Vercel Dashboardにアクセス

1. [Vercel Dashboard](https://vercel.com/takedahiroakis-projects/mikupost) にアクセス
2. 「Settings」→「Environment Variables」を開く

### ステップ2: 環境変数を更新

1. `TWITTER_REDIRECT_URI` を見つける
2. 右側の「...」メニューをクリック
3. 「Edit」を選択
4. 値を以下に更新：
   ```
   https://mikupost-h6r7ntt2u-takedahiroakis-projects.vercel.app/api/auth/twitter/callback
   ```
5. 「Save」をクリック

### ステップ3: 再デプロイ

1. 「Deployments」タブに移動
2. 最新のデプロイの「...」メニューをクリック
3. 「Redeploy」を選択

---

## 確認

更新後、以下を確認：

1. ✅ X Developer PortalのコールバックURLが正しく設定されているか
2. ✅ Vercelの環境変数が正しく設定されているか
3. ✅ 再デプロイが完了しているか

## 注意事項

- デプロイURLが変更された場合は、`TWITTER_REDIRECT_URI`と`NEXTAUTH_URL`の両方を更新する必要があります
- 環境変数を変更した後は、必ず再デプロイが必要です

