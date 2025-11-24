# X OAuth認証エラー解決ガイド

## 「権限がない」エラーが発生する場合

### 1. X Developer Portalでの設定確認

#### App permissions（アプリ権限）

1. [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard) にアクセス
2. アプリを選択
3. 「Settings」→「User authentication settings」を開く
4. **「App permissions」が「Read and write」になっているか確認**
   - 「Read only」の場合は「Read and write」に変更
   - 変更後、保存が必要

#### OAuth 2.0設定

1. 「User authentication settings」で以下を確認：
   - **「OAuth 2.0」が有効になっているか**
   - **「Type of App」が「Web App, Automated App or Bot」になっているか**

#### Callback URI / Redirect URL

1. 「Callback URI / Redirect URL」に以下が設定されているか確認：
   ```
   https://mikupost-1qv2rumyp-takedahiroakis-projects.vercel.app/api/auth/twitter/callback
   ```
   - **注意**: デプロイURLが変更された場合は、このURLも更新が必要
   - 複数のURLを設定する場合は、改行で区切る

#### スコープ（Scopes）

以下のスコープが有効になっているか確認：
- ✅ `tweet.read`
- ✅ `tweet.write`
- ✅ `users.read`
- ✅ `offline.access`
- ✅ `media.write`

### 2. 環境変数の確認

Vercelの環境変数が正しく設定されているか確認：

```bash
vercel env ls
```

以下の環境変数が設定されているか確認：
- `TWITTER_CLIENT_ID`
- `TWITTER_CLIENT_SECRET`
- `TWITTER_REDIRECT_URI`（デプロイURLと一致しているか）
- `NANO_BANANA_API_TOKEN`
- `NEXTAUTH_URL`（デプロイURLと一致しているか）

### 3. よくある問題と解決策

#### 問題1: 「App permissions」が「Read only」

**解決策**: 
- X Developer Portalで「App permissions」を「Read and write」に変更
- 変更後、Client IDとClient Secretを再生成する必要がある場合があります

#### 問題2: コールバックURLが一致しない

**解決策**:
- Vercelの環境変数`TWITTER_REDIRECT_URI`と、X Developer Portalの「Callback URI」が完全に一致しているか確認
- URLの末尾のスラッシュ（`/`）も含めて完全一致が必要

#### 問題3: OAuth 2.0が有効になっていない

**解決策**:
- X Developer Portalで「OAuth 2.0」を有効化
- 「Type of App」を「Web App, Automated App or Bot」に設定

#### 問題4: スコープが不足している

**解決策**:
- 特に`media.write`スコープが有効になっているか確認
- スコープを変更した場合、再認証が必要

### 4. 再認証の手順

設定を変更した後は、以下を実行：

1. Vercelで再デプロイ（環境変数を変更した場合）
2. ブラウザのCookieをクリア
3. アプリで「連携する」を再度クリック

### 5. デバッグ方法

#### ログの確認

Vercel Dashboardでデプロイログを確認：
1. Vercel Dashboard → プロジェクト → 「Deployments」
2. 最新のデプロイを選択
3. 「Functions」タブでログを確認

#### エラーメッセージの確認

ブラウザの開発者ツール（F12）で：
1. 「Network」タブを開く
2. 「連携する」をクリック
3. `/api/auth/twitter`へのリクエストを確認
4. エラーレスポンスの内容を確認

### 6. 確認チェックリスト

- [ ] X Developer Portalで「App permissions」が「Read and write」
- [ ] OAuth 2.0が有効
- [ ] 「Type of App」が「Web App, Automated App or Bot」
- [ ] コールバックURLが正しく設定されている
- [ ] 必要なスコープがすべて有効
- [ ] Vercelの環境変数が正しく設定されている
- [ ] `TWITTER_REDIRECT_URI`がデプロイURLと一致
- [ ] 最新のコードがデプロイされている

### 7. それでも解決しない場合

1. X Developer Portalでアプリを再作成
2. 新しいClient IDとClient Secretを取得
3. Vercelの環境変数を更新
4. 再デプロイ

