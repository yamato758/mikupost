# Vercel KV設定手順

## 概要

Vercel KVを使用することで、X連携のトークンを永続化できます。これにより、**一度連携すれば、次回以降は連携不要**になります。

## 設定手順

### 1. Vercel KVをプロジェクトに追加

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. プロジェクト `mikupost` を選択
3. 「Storage」タブをクリック
4. 「Create Database」→「KV」を選択
5. データベース名を入力（例: `mikupost-kv`）
6. 「Create」をクリック

### 2. 環境変数の自動設定

Vercel KVを作成すると、以下の環境変数が自動的に設定されます：

- `KV_REST_API_URL` - KV REST APIのURL
- `KV_REST_API_TOKEN` - KV REST APIのトークン

これらの環境変数は、Vercel Dashboardの「Settings」→「Environment Variables」で確認できます。

### 3. 再デプロイ

環境変数が設定されたら、再デプロイが必要です：

```bash
vercel --prod
```

または、Vercel Dashboardから「Redeploy」をクリックしてください。

## 動作確認

1. アプリにアクセス
2. X連携を実行
3. 連携が完了したら、ページをリロード
4. **「X連携済み」と表示されれば成功**（再連携不要）

## 仕組み

- **開発環境**: ファイルシステム（`data/tokens.json`）を使用
- **本番環境（Vercel KV設定済み）**: Vercel KVを使用
- **本番環境（Vercel KV未設定）**: ファイルシステム（動作しない可能性あり）

`lib/token-manager-kv.ts`が自動的に環境を検出し、適切なストレージを使用します。

## トラブルシューティング

### トークンが保存されない場合

1. Vercel KVが正しく作成されているか確認
2. 環境変数 `KV_REST_API_URL` と `KV_REST_API_TOKEN` が設定されているか確認
3. 再デプロイを実行

### 毎回連携が必要な場合

- Vercel KVが設定されていない可能性があります
- 上記の手順に従って、Vercel KVを設定してください

## 料金

Vercel KVの無料プラン：
- 読み取り: 30,000回/日
- 書き込み: 30,000回/日
- ストレージ: 256MB

通常の使用では十分です。

