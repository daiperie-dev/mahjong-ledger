# 外部ネットワーク公開

このアプリは静的ファイルだけで動くため、GitHub Pages や Netlify などに置けば外部ネットワークから起動できます。

## 推奨運用

1. 公式iPad 1台だけで記録する
2. 公開URLを公式iPadで開く
3. 半荘終了後にCSVを書き出す
4. GoogleスプレッドシートへCSVを取り込む
5. スプレッドシートを読み取り専用で共有する

対戦相手が同じ公開URLを開いても、公式iPad内の保存データは見えません。成績共有はGoogleスプレッドシートか、書き出したJSON/CSVで行います。

## GitHub Pages

1. GitHubでリポジトリを作成する
2. このフォルダのファイルをリポジトリへ入れる
3. `main` ブランチへ反映する
4. GitHubの `Settings` → `Pages` → `Build and deployment` を `GitHub Actions` にする
5. `Actions` の `Deploy Mahjong Ledger to GitHub Pages` が成功するのを待つ
6. 表示された `https://...github.io/.../` をiPadで開く

開くURL例:

```text
https://ユーザー名.github.io/リポジトリ名/?v=33
```

共有ページ:

```text
https://ユーザー名.github.io/リポジトリ名/share.html?v=33
```

## 既存データの移行

ローカルURLで記録していたデータは、公開URLへ自動では移りません。

1. 旧URLで本体を開く
2. `⇩` でJSONを書き出す
3. 公開URLで本体を開く
4. `⇧` でJSONを読み込む
5. 表示と保存済み半荘を確認する

## ローカル確認

```powershell
node .\server.mjs
```

構文確認:

```powershell
node --check app.js
node --check share.js
node --check service-worker.js
```

## Short Share Links

For shorter LINE links, deploy the Cloudflare Worker in `worker/` and enter the Worker URL plus write token in the Mahjong Ledger settings on the recording iPad.

Shared links then use `share.html?v=33&id=...` and read the saved snapshot from the Worker.

Current Share API URL:

```text
https://mahjong-ledger-share.daiperie-mahjong-ledger.workers.dev
```
