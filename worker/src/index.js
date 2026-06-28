const DEFAULT_ALLOWED_ORIGINS = [
  "https://daiperie-dev.github.io",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];
const ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
const ID_LENGTH = 18;
const MAX_SNAPSHOT_BYTES = 1_000_000;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request, env),
      });
    }

    if (url.pathname === "/health") {
      return json({ ok: true }, request, env);
    }

    if (url.pathname === "/snapshots" && request.method === "POST") {
      return createSnapshot(request, env);
    }

    const snapshotMatch = url.pathname.match(/^\/snapshots\/([A-Za-z0-9_-]{8,80})$/);
    if (snapshotMatch && request.method === "GET") {
      return getSnapshot(snapshotMatch[1], request, env);
    }

    if (snapshotMatch && request.method === "PUT") {
      return updateSnapshot(snapshotMatch[1], request, env);
    }

    return json({ error: "Not found" }, request, env, 404);
  },
};

async function createSnapshot(request, env) {
  const loaded = await readAuthorizedSnapshot(request, env);
  if (loaded.response) {
    return loaded.response;
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const id = makeShareId();
    const key = snapshotKey(id);
    const existing = await env.SHARE_SNAPSHOTS.get(key);
    if (existing) {
      continue;
    }

    await env.SHARE_SNAPSHOTS.put(key, JSON.stringify(loaded.snapshot), {
      metadata: {
        createdAt: new Date().toISOString(),
        matchCount: Array.isArray(loaded.snapshot.m) ? loaded.snapshot.m.length : 0,
      },
    });

    return json({ id }, request, env, 201);
  }

  return json({ error: "Could not allocate id" }, request, env, 500);
}

async function updateSnapshot(id, request, env) {
  const loaded = await readAuthorizedSnapshot(request, env);
  if (loaded.response) {
    return loaded.response;
  }

  const key = snapshotKey(id);
  const existing = await env.SHARE_SNAPSHOTS.get(key);
  if (!existing) {
    return json({ error: "Not found" }, request, env, 404);
  }

  await env.SHARE_SNAPSHOTS.put(key, JSON.stringify(loaded.snapshot), {
    metadata: {
      updatedAt: new Date().toISOString(),
      matchCount: Array.isArray(loaded.snapshot.m) ? loaded.snapshot.m.length : 0,
    },
  });

  return json({ id }, request, env);
}

async function readAuthorizedSnapshot(request, env) {
  if (!env.SHARE_SNAPSHOTS) {
    return { response: json({ error: "Storage is not configured" }, request, env, 500) };
  }

  if (!env.WRITE_TOKEN) {
    return { response: json({ error: "Write token is not configured" }, request, env, 500) };
  }

  if (request.headers.get("X-Share-Token") !== env.WRITE_TOKEN) {
    return { response: json({ error: "Unauthorized" }, request, env, 401) };
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_SNAPSHOT_BYTES) {
    return { response: json({ error: "Snapshot is too large" }, request, env, 413) };
  }

  let snapshot;
  try {
    snapshot = JSON.parse(text);
  } catch {
    return { response: json({ error: "Invalid JSON" }, request, env, 400) };
  }

  if (!isValidSnapshot(snapshot)) {
    return { response: json({ error: "Invalid snapshot" }, request, env, 400) };
  }

  return { snapshot };
}

async function getSnapshot(id, request, env) {
  if (!env.SHARE_SNAPSHOTS) {
    return json({ error: "Storage is not configured" }, request, env, 500);
  }

  const snapshot = await env.SHARE_SNAPSHOTS.get(snapshotKey(id));
  if (!snapshot) {
    return json({ error: "Not found" }, request, env, 404);
  }

  return new Response(snapshot, {
    status: 200,
    headers: {
      ...corsHeaders(request, env),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=60",
    },
  });
}

function isValidSnapshot(snapshot) {
  return Boolean(
    snapshot &&
      snapshot.v === 1 &&
      Array.isArray(snapshot.p) &&
      Array.isArray(snapshot.m) &&
      snapshot.p.length >= 4
  );
}

function makeShareId() {
  const bytes = new Uint8Array(ID_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => ID_ALPHABET[byte % ID_ALPHABET.length]).join("");
}

function snapshotKey(id) {
  return `snapshot:${id}`;
}

function json(body, request, env, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(request, env),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowedOrigins = String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const origins = allowedOrigins.length ? allowedOrigins : DEFAULT_ALLOWED_ORIGINS;
  const allowOrigin = origins.includes(origin) ? origin : origins[0];

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,X-Share-Token",
    "Vary": "Origin",
  };
}
