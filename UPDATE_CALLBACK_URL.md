# コールバックURL更新手順

## 現在の問題

X Developer PortalのコールバックURLがローカル環境のURLになっています：
```
http://localhost:3000/api/auth/twitter/callback
```

これを本番環境（Vercel）のURLに変更する必要があります。

## 最新のデプロイURL

最新のデプロイURLを確認するには：

```bash
vercel ls
```

または、Vercel Dashboardで確認：
https://vercel.com/takedahiroakis-projects/mikupost

## 更新手順

### 1. X Developer PortalでコールバックURLを更新

1. [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard) にアクセス
2. アプリを選択
3. 「Settings」→「User authentication settings」を開く
4. 「Callback URI / Redirect URL」セクションを探す
5. 以下のURLに変更（または追加）：
   ```
   https://mikupost-h6r7ntt2u-takedahiroakis-projects.vercel.app/api/auth/twitter/callback
   ```
   **注意**: デプロイURLが変更された場合は、最新のURLを使用してください
6. 「Save」をクリック

### 2. Vercelの環境変数を確認・更新

Vercelの環境変数`TWITTER_REDIRECT_URI`が最新のデプロイURLと一致しているか確認：

```bash
vercel env ls
```

一致していない場合は更新：

```bash
vercel env rm TWITTER_REDIRECT_URI production
vercel env add TWITTER_REDIRECT_URI production
```

プロンプトが表示されたら、以下を入力：
```
https://mikupost-h6r7ntt2u-takedahiroakis-projects.vercel.app/api/auth/twitter/callback
```

### 3. 再デプロイ

環境変数を変更した場合は、再デプロイが必要：

```bash
vercel --prod
```

### 4. 確認

1. X Developer PortalのコールバックURLが正しく設定されているか確認
2. Vercelの環境変数が正しく設定されているか確認
3. アプリで「連携する」を再度試す

## 複数のURLを設定する場合

開発環境と本番環境の両方を使う場合は、X Developer Portalで複数のコールバックURLを設定できます：

```
http://localhost:3000/api/auth/twitter/callback
https://mikupost-h6r7ntt2u-takedahiroakis-projects.vercel.app/api/auth/twitter/callback
```

複数のURLは改行で区切って設定します。

