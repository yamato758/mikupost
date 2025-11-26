# ローカル開発環境のセットアップ

## 問題

ローカル環境（`http://localhost:3000`）で「連携する」ボタンを押すと「Something went wrong」エラーが表示される場合、X Developer PortalのコールバックURL設定に`localhost`が登録されていない可能性があります。

## 解決方法

### ステップ1: X Developer PortalでコールバックURLを追加

1. [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard) にアクセス
2. アプリを選択
3. 「Settings」→「User authentication settings」を開く
4. **「Callback URI / Redirect URL」セクション**を確認
5. 以下の**両方のURL**を登録してください：

   ```
   http://localhost:3000/api/auth/twitter/callback
   https://mikupost-h6r7ntt2u-takedahiroakis-projects.vercel.app/api/auth/twitter/callback
   ```

   > **重要**: 複数のコールバックURLを登録する場合は、1行に1つずつ入力してください。

6. **「App permissions」が「Read and write」になっているか確認**
7. **「Scopes」に以下がすべて有効になっているか確認**：
   - `tweet.read`
   - `tweet.write`
   - `users.read`
   - `offline.access`
   - `media.write`
8. **「Save」をクリックして保存**

### ステップ2: ローカルの`.env`ファイルを確認

プロジェクトルートに`.env.local`ファイル（または`.env`ファイル）があることを確認し、以下の設定が正しいか確認してください：

```env
# X (Twitter) API
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret
TWITTER_REDIRECT_URI=http://localhost:3000/api/auth/twitter/callback

# 画像生成API (Nano Banana - Gemini 2.5 Flash Image)
NANO_BANANA_API_TOKEN=your_gemini_api_key

# Next.js
NEXTAUTH_URL=http://localhost:3000
```

### ステップ3: 開発サーバーを再起動

環境変数を変更した場合は、開発サーバーを再起動してください：

```bash
# サーバーを停止（Ctrl+C）
# その後、再起動
npm run dev
```

### ステップ4: ブラウザのCookieをクリア

設定を変更した後は、ブラウザのCookieをクリアしてください：

1. ブラウザの設定を開く
2. 「Cookieとサイトデータ」を開く
3. `localhost:3000`のCookieを削除
4. または、シークレットモード/プライベートモードで試す

### ステップ5: 再度連携を試す

1. `http://localhost:3000`にアクセス
2. 「連携する」ボタンをクリック
3. Xの認証画面で許可

## トラブルシューティング

### まだ「Something went wrong」が表示される場合

1. **X Developer Portalの設定を再確認**
   - 「App permissions」が「Read and write」になっているか
   - コールバックURLが正確に入力されているか（スペースやタイプミスがないか）
   - 必要なスコープがすべて有効になっているか

2. **ブラウザのコンソールを確認**
   - F12キーを押して開発者ツールを開く
   - 「Console」タブでエラーメッセージを確認
   - 「Network」タブでリクエストが失敗していないか確認

3. **サーバーのログを確認**
   - ターミナルでサーバーのログを確認
   - エラーメッセージがないか確認

4. **X Developer Portalでアプリを再作成**
   - それでも解決しない場合は、X Developer Portalでアプリを再作成してみてください
   - 新しいClient IDとClient Secretを取得
   - `.env.local`ファイルを更新
   - 開発サーバーを再起動

## 注意事項

- ローカル開発環境と本番環境（Vercel）で異なるコールバックURLを使用する場合は、**両方のURLをX Developer Portalに登録する必要があります**
- 環境変数`TWITTER_REDIRECT_URI`は、現在の環境（ローカル or 本番）に応じて正しいURLを設定してください
- 本番環境では、Vercelの環境変数で`TWITTER_REDIRECT_URI`を設定してください

