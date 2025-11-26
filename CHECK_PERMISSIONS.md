# 「権限がありません」エラー解決ガイド

## 最も重要な確認事項

### 1. App permissions（アプリ権限）の確認

**これが最も重要です！**

1. X Developer Portalで、現在開いている「Auth Settings」ページの**上に戻る**
2. または、左側のメニューから「Settings」→「User authentication settings」を開く
3. **「App permissions」セクションを探す**
4. **「Read and write」が選択されているか確認**
   - 「Read only」になっている場合は、**「Read and write」に変更**
   - 変更後、**必ず「Save」をクリック**

### 2. スコープ（Scopes）の確認

「App permissions」の下に「Scopes」セクションがあります。以下のスコープがすべて有効になっているか確認：

- ✅ `tweet.read`
- ✅ `tweet.write`
- ✅ `users.read`
- ✅ `offline.access`
- ✅ `media.write`（特に重要！）

### 3. OAuth 2.0設定の確認

- 「OAuth 2.0」が有効になっているか
- 「Type of App」が「Web App, Automated App or Bot」になっているか

### 4. 環境変数の再確認

Vercelの環境変数が正しく設定されているか確認：

```bash
vercel env ls
```

以下が設定されているか確認：
- `TWITTER_CLIENT_ID`
- `TWITTER_CLIENT_SECRET`
- `TWITTER_REDIRECT_URI` = `https://mikupost-h6r7ntt2u-takedahiroakis-projects.vercel.app/api/auth/twitter/callback`
- `NANO_BANANA_API_TOKEN`
- `NEXTAUTH_URL` = `https://mikupost-h6r7ntt2u-takedahiroakis-projects.vercel.app`

## よくある問題

### 問題1: App permissionsが「Read only」

**症状**: 「権限がありません」エラー

**解決策**:
1. X Developer Portalで「App permissions」を「Read and write」に変更
2. 変更後、保存
3. **重要**: 変更後、Client IDとClient Secretが再生成される場合があります
4. 再生成された場合は、Vercelの環境変数も更新が必要

### 問題2: スコープが不足している

**症状**: 特定の機能（画像アップロードなど）が動作しない

**解決策**:
- 特に`media.write`スコープが有効になっているか確認
- スコープを変更した場合、再認証が必要

### 問題3: 設定変更後の再認証が必要

**解決策**:
1. ブラウザのCookieをクリア
2. アプリで「連携する」を再度クリック

## 確認手順（順番に実行）

1. ✅ コールバックURLが正しく設定されている（完了）
2. ⚠️ **App permissionsが「Read and write」になっているか確認**（最重要）
3. ⚠️ 必要なスコープがすべて有効になっているか確認
4. ⚠️ OAuth 2.0が有効になっているか確認
5. ⚠️ Vercelの環境変数が正しく設定されているか確認
6. ⚠️ 設定変更後、再認証を試す

## 次のステップ

1. X Developer Portalで「App permissions」を確認
2. 「Read and write」になっていない場合は変更
3. 保存
4. アプリで「連携する」を再度試す

