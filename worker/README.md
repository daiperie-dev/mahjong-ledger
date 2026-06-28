# Mahjong Ledger Share API

Cloudflare Worker + KV for short shared links.

## Endpoints

- `POST /snapshots`: stores a compact match snapshot. Requires `X-Share-Token`.
- `GET /snapshots/:id`: reads a snapshot by share id.
- `GET /health`: health check.

## Deploy Notes

1. Create a Cloudflare KV namespace.
2. Replace `REPLACE_WITH_KV_NAMESPACE_ID` in `wrangler.toml`.
3. Set the write token as a Worker secret:

```bash
wrangler secret put WRITE_TOKEN
```

4. Deploy:

```bash
wrangler deploy
```

After deploy, enter the Worker URL and the same write token in the Mahjong Ledger settings on the recording iPad.
