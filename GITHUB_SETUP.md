# GitHubリポジトリ作成手順

## 1. GitHubでリポジトリを作成

1. [GitHub](https://github.com)にログイン
2. 右上の「+」ボタンをクリック → 「New repository」を選択
3. リポジトリ設定：
   - **Repository name**: `mikupost`
   - **Description**: `初音ミク画像生成＆X投稿アプリ`
   - **Visibility**: Public または Private（お好みで）
   - **Initialize this repository with**: チェックを外す（既にローカルにファイルがあるため）
4. 「Create repository」をクリック

## 2. リモートリポジトリを追加してプッシュ

リポジトリ作成後、以下のコマンドを実行してください：

```bash
git remote add origin https://github.com/yamato758/mikupost.git
git push -u origin main
```

または、GitHubで表示される手順に従ってください。

## 3. 認証が必要な場合

プッシュ時に認証が求められる場合：

- **Personal Access Token (PAT)** を使用する方法（推奨）
  1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
  2. 「Generate new token (classic)」をクリック
  3. スコープで `repo` にチェック
  4. トークンを生成してコピー
  5. プッシュ時にパスワードの代わりにトークンを入力

- **Git Credential Manager** を使用する方法
  - Windowsの場合、認証情報が自動的に保存されます

## 4. 確認

プッシュが成功したら、以下のURLでリポジトリを確認できます：

https://github.com/yamato758/mikupost

