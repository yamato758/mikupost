# Giphy APIキーの設定方法

## ローカル開発環境

`.env.local`ファイルに以下の行を追加してください：

```env
GIPHY_API_KEY=uY6GcTKLzgTDWJzn1547uJW9r3aJrFli
```

### 設定手順

1. プロジェクトのルートディレクトリ（`mikupost`）に`.env.local`ファイルがあるか確認
2. ファイルが存在しない場合は作成
3. 以下の内容を追加：

```env
# GIF検索API (Giphy)
GIPHY_API_KEY=uY6GcTKLzgTDWJzn1547uJW9r3aJrFli
```

4. 開発サーバーを再起動：
   ```bash
   npm run dev
   ```

## Vercel本番環境

### 設定手順

1. [Vercel Dashboard](https://vercel.com/dashboard)にアクセス
2. プロジェクト `mikupost` を選択
3. **Settings** → **Environment Variables** を開く
4. 以下の環境変数を追加：
   - **Name**: `GIPHY_API_KEY`
   - **Value**: `uY6GcTKLzgTDWJzn1547uJW9r3aJrFli`
   - **Environment**: Production, Preview, Development すべてにチェック
5. **Save** をクリック
6. **Deployments** タブに移動
7. 最新のデプロイメントの **...** メニューから **Redeploy** をクリック

### 確認方法

環境変数が正しく設定されているか確認：

1. Vercel Dashboard → Settings → Environment Variables
2. `GIPHY_API_KEY`が表示されていることを確認
3. アプリでGIF検索を試して、正常に動作することを確認

## トラブルシューティング

### GIF検索が失敗する場合

1. **環境変数が設定されているか確認**
   - ローカル: `.env.local`ファイルを確認
   - Vercel: Dashboardで環境変数を確認

2. **開発サーバーを再起動**
   - 環境変数を追加・変更した後は、必ずサーバーを再起動してください

3. **Vercelで再デプロイ**
   - 環境変数を追加・変更した後は、必ず再デプロイが必要です

4. **APIキーが正しいか確認**
   - Giphy Developers PortalでAPIキーが有効か確認

## 注意事項

- `.env.local`ファイルは`.gitignore`に含まれているため、Gitにコミットされません
- APIキーは機密情報のため、公開リポジトリにコミットしないでください
- Vercelの環境変数は暗号化されて保存されます

