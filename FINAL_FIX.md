# 「Something went wrong」エラー完全解決ガイド

## 問題の原因

1. **Vercelの環境変数が古いURLを指している**
2. **X Developer Portalの「App permissions」が「Read only」になっている可能性**

## 解決手順

### ステップ1: Vercelの環境変数を確認・更新

1. [Vercel Dashboard](https://vercel.com/takedahiroakis-projects/mikupost/settings/environment-variables) にアクセス
2. `TWITTER_REDIRECT_URI` の値を確認
3. 最新のデプロイURLに更新：
   ```
   https://mikupost-h6r7ntt2u-takedahiroakis-projects.vercel.app/api/auth/twitter/callback
   ```
4. `NEXTAUTH_URL` も更新：
   ```
   https://mikupost-h6r7ntt2u-takedahiroakis-projects.vercel.app
   ```
5. 保存

### ステップ2: 再デプロイ

環境変数を変更した後、**必ず再デプロイ**が必要です：

1. Vercel Dashboard → 「Deployments」タブ
2. 最新のデプロイの「...」メニューをクリック
3. 「Redeploy」を選択

または、CLIで：
```bash
vercel --prod
```

### ステップ3: X Developer Portalの設定確認（最重要）

1. [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard) にアクセス
2. アプリを選択
3. 「Settings」→「User authentication settings」を開く
4. **「App permissions」セクションを確認**
   - **「Read and write」が選択されているか確認**
   - 「Read only」になっている場合は、**「Read and write」に変更して保存**
5. **「Scopes」セクションを確認**
   - 以下のスコープがすべて有効になっているか確認：
     - `tweet.read`
     - `tweet.write`
     - `users.read`
     - `offline.access`
     - `media.write`
6. **「Callback URI / Redirect URL」を確認**
   - 最新のURLが設定されているか確認：
     ```
     https://mikupost-h6r7ntt2u-takedahiroakis-projects.vercel.app/api/auth/twitter/callback
     ```

### ステップ4: ブラウザのCookieをクリア

設定を変更した後は、ブラウザのCookieをクリアしてください：

1. ブラウザの設定を開く
2. 「Cookieとサイトデータ」を開く
3. 「すべてのCookieとサイトデータを削除」を実行
4. または、シークレットモード/プライベートモードで試す

### ステップ5: 再度連携を試す

1. アプリにアクセス
2. 「連携する」をクリック
3. Xの認証画面で許可

## 確認チェックリスト

- [ ] Vercelの環境変数`TWITTER_REDIRECT_URI`が最新のURLになっている
- [ ] Vercelの環境変数`NEXTAUTH_URL`が最新のURLになっている
- [ ] 環境変数変更後、再デプロイを実行した
- [ ] X Developer Portalの「App permissions」が「Read and write」になっている
- [ ] 必要なスコープがすべて有効になっている
- [ ] X Developer PortalのコールバックURLが最新のURLになっている
- [ ] ブラウザのCookieをクリアした

## それでも解決しない場合

1. X Developer Portalでアプリを再作成
2. 新しいClient IDとClient Secretを取得
3. Vercelの環境変数を更新
4. 再デプロイ

