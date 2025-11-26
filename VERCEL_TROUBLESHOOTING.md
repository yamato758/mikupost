# Vercel環境でのOAuth認証トラブルシューティング

## 問題

ローカル環境では動作するが、Vercel環境では「Something went wrong」エラーが表示される。

## 考えられる原因と解決方法

### 1. コールバックURLの不一致（最も可能性が高い）

Vercelの環境変数`TWITTER_REDIRECT_URI`が最新のデプロイURLと一致していない可能性があります。

#### 確認方法

1. 最新のデプロイURLを確認：
   ```bash
   vercel ls
   ```
   最新のデプロイメントのURLを確認してください。

2. Vercelの環境変数を確認：
   ```bash
   vercel env ls
   ```
   `TWITTER_REDIRECT_URI`の値を確認してください。

3. 環境変数を更新：
   ```bash
   vercel env rm TWITTER_REDIRECT_URI production
   vercel env add TWITTER_REDIRECT_URI production
   # 最新のデプロイURLを入力: https://mikupost-xxxxx-takedahiroakis-projects.vercel.app/api/auth/twitter/callback
   ```

4. `NEXTAUTH_URL`も更新：
   ```bash
   vercel env rm NEXTAUTH_URL production
   vercel env add NEXTAUTH_URL production
   # 最新のデプロイURLを入力: https://mikupost-xxxxx-takedahiroakis-projects.vercel.app
   ```

5. **再デプロイ**（重要）：
   環境変数を変更した後は、必ず再デプロイが必要です。
   - Vercel Dashboard → 「Deployments」→ 最新のデプロイの「...」→ 「Redeploy」

### 2. X Developer PortalのコールバックURL設定

X Developer Portalに最新のVercel URLが登録されているか確認してください。

1. [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard) にアクセス
2. アプリを選択
3. 「Settings」→「User authentication settings」を開く
4. 「Callback URI / Redirect URL」に以下が登録されているか確認：
   ```
   https://mikupost-xxxxx-takedahiroakis-projects.vercel.app/api/auth/twitter/callback
   ```
   （`xxxxx`は最新のデプロイIDに置き換えてください）

5. **「App permissions」が「Read and write」になっているか確認**
6. 必要なスコープがすべて有効になっているか確認
7. 「Save」をクリック

### 3. Cookieの設定問題

Vercelのサーバーレス環境では、Cookieの設定が重要です。現在のコードでは：

```typescript
cookieStore.set('oauth_code_verifier', verifier, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // Vercelでは常にtrueになる
  sameSite: 'lax',
  maxAge: 600,
  path: '/',
});
```

この設定は通常問題ありませんが、Vercel環境では`secure: true`が必須です（HTTPSのみ）。

### 4. プロダクションURLの使用

Vercelでは、プロダクションURL（`https://mikupost.vercel.app`など）を使用することを推奨します。これにより、デプロイごとにURLが変わる問題を回避できます。

1. Vercel Dashboard → 「Settings」→ 「Domains」
2. カスタムドメインを設定するか、デフォルトのプロダクションURLを確認
3. そのURLを環境変数とX Developer Portalに設定

## 推奨される解決手順

### ステップ1: 最新のデプロイURLを確認

```bash
vercel ls
```

最新のデプロイメントのURLをメモしてください。

### ステップ2: Vercelの環境変数を更新

```bash
# TWITTER_REDIRECT_URIを更新
vercel env rm TWITTER_REDIRECT_URI production
vercel env add TWITTER_REDIRECT_URI production
# プロンプトで最新のURLを入力

# NEXTAUTH_URLを更新
vercel env rm NEXTAUTH_URL production
vercel env add NEXTAUTH_URL production
# プロンプトで最新のURLを入力
```

### ステップ3: X Developer Portalの設定を更新

1. X Developer PortalでコールバックURLを最新のVercel URLに更新
2. 「App permissions」が「Read and write」になっているか確認
3. 保存

### ステップ4: 再デプロイ

Vercel Dashboardから再デプロイを実行してください。

### ステップ5: テスト

1. ブラウザのCookieをクリア
2. VercelのURLにアクセス
3. 「連携する」ボタンをクリック
4. 認証が成功するか確認

## デバッグ方法

### Vercelのログを確認

1. Vercel Dashboard → 「Deployments」→ 最新のデプロイを選択
2. 「Functions」タブを開く
3. `/api/auth/twitter`や`/api/auth/twitter/callback`のログを確認
4. エラーメッセージがないか確認

### ブラウザの開発者ツールで確認

1. F12キーを押して開発者ツールを開く
2. 「Network」タブを開く
3. 「連携する」ボタンをクリック
4. リクエストとレスポンスを確認
5. 「Console」タブでエラーメッセージを確認

## よくあるエラー

### "Something went wrong"

- X Developer Portalの「App permissions」が「Read only」になっている
- コールバックURLが一致していない
- 必要なスコープが有効になっていない

### "認証セッションが無効です"

- Cookieが正しく設定されていない
- ブラウザのCookieがブロックされている
- `code_verifier`がCookieから取得できない

### "アクセストークンの取得に失敗しました"

- `code_verifier`が正しくない
- トークン交換のリクエストが失敗している
- Vercelのログで詳細なエラーを確認

