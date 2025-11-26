# コールバックURL修正ガイド

## 問題

X Developer Portalで「無効なURL」というエラーが発生しています。

## 原因

1. URLの先頭部分（`https://`）が欠けている
2. VercelのデプロイURLが毎回変わるため、固定URLが必要

## 解決策

### 方法1: 完全なURLを入力（推奨）

X Developer Portalの「Callback URI / Redirect URL」フィールドに、**完全なURL**を入力してください：

```
https://mikupost-h6r7ntt2u-takedahiroakis-projects.vercel.app/api/auth/twitter/callback
```

**重要**: 
- `https://` から始まる必要があります
- URL全体をコピー&ペーストしてください
- スペースや改行が含まれていないか確認してください

### 方法2: カスタムドメインを設定（推奨・長期的な解決策）

Vercelでカスタムドメインを設定すると、固定URLが使えます：

1. Vercel Dashboard → プロジェクト → 「Settings」→ 「Domains」
2. 「Add Domain」をクリック
3. カスタムドメインを入力（例: `mikupost.vercel.app`）
4. 設定完了後、そのドメインをコールバックURLに使用

### 方法3: 複数のURLを設定

開発環境と本番環境の両方を使う場合、複数のコールバックURLを設定できます：

```
http://localhost:3000/api/auth/twitter/callback
https://mikupost-h6r7ntt2u-takedahiroakis-projects.vercel.app/api/auth/twitter/callback
```

複数のURLは**改行で区切って**入力します。

## 入力時の注意点

1. **URLの先頭**: `https://` から始まる必要があります
2. **URLの末尾**: `/api/auth/twitter/callback` まで含める必要があります
3. **スペース**: URLの前後にスペースがないか確認
4. **改行**: 複数のURLを設定する場合のみ改行を使用

## 確認手順

1. X Developer Portalで「Callback URI / Redirect URL」を確認
2. 完全なURLが入力されているか確認
3. 「Save」をクリック
4. エラーメッセージが消えているか確認

## トラブルシューティング

### まだエラーが出る場合

1. **URLをコピー&ペースト**: 手入力ではなく、コピー&ペーストを使用
2. **ブラウザのキャッシュをクリア**: ページを再読み込み
3. **別のブラウザで試す**: ブラウザの問題の可能性

### URLが毎回変わる問題

VercelのデプロイURLは毎回変わります。以下のいずれかで対応：

1. **カスタムドメインを設定**（推奨）
2. **最新のデプロイURLを都度更新**
3. **VercelのプロジェクトURLを使用**（`mikupost.vercel.app`のような固定URLがある場合）

