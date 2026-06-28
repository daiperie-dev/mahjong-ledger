# Mahjong Ledger

iPadで麻雀対局中の点数、順位、副露率、リーチ率、和了率、放銃率などを記録するWebアプリです。

## 起動

```powershell
node .\server.mjs
```

ブラウザで `http://localhost:5173/?v=25` を開きます。

iPadから同じWi-Fi内で開く場合は、起動時に表示される `iPad / LAN:` のURLを使います。

## 外部ネットワーク

外部ネットワークから使う場合は、GitHub Pagesなどに静的サイトとして公開します。手順は [DEPLOY.md](./DEPLOY.md) を参照してください。

## 共有

`share.html?v=25` は読み取り専用の共有ページです。

Googleスプレッドシートで共有する場合は、本体または共有ページのCSV出力を使います。公式iPad 1台で記録し、CSVをスプレッドシートへ取り込んで読み取り専用共有する運用を推奨します。

## データ

対局データはブラウザのローカルストレージに保存されます。公開URLへ移行すると保存場所が変わるため、旧URLでJSONを書き出し、新URLでJSONを読み込んで移行してください。

## 主な機能

- 半荘ごとの点数・順位記録
- 副露率、リーチ率、和了率、放銃率
- 連対率、4着回避率、トビ率、トバし率
- チップカウント
- ロン/ツモ/流局の安全確認
- 本場、供託、リーチ放銃時の自動補正
- ウマ、トバし賞、五捨六入による半荘スコア集計
- 半荘保存、総合成績、当日成績
- スコア推移グラフ
- JSONバックアップ
- Googleスプレッドシート向けCSV出力

## Short Share Links

The app can use an external Share API to store snapshots and send short `share.html?v=25&id=...` links.

- The recording iPad stores the Share API URL and write token in local storage.
- The deployed Share API URL is `https://mahjong-ledger-share.daiperie-mahjong-ledger.workers.dev`.
- The write token is not included in exported match JSON or shared links.
- If the Share API is not configured or saving fails, the app falls back to the compressed URL format.
- The Cloudflare Worker template is in `worker/`.
