const STORAGE_KEY = "mahjong-ledger-state-v1";
const DEFAULT_REMOTE_SHARE_API_BASE_URL = "https://mahjong-ledger-share.daiperie-mahjong-ledger.workers.dev";
const STARTING_SCORE = 25000;
const RETURN_SCORE = 30000;
const STARTING_CHIPS = 20;
const DEFAULT_UMA = [30, 10, -10, -30];
const TOBASHI_BONUS = 10;

const elements = {
  importButton: document.querySelector("#importButton"),
  importFile: document.querySelector("#importFile"),
  csvButton: document.querySelector("#csvButton"),
  exportButton: document.querySelector("#exportButton"),
  sourceLabel: document.querySelector("#sourceLabel"),
  sourceDetail: document.querySelector("#sourceDetail"),
  leaderGrid: document.querySelector("#leaderGrid"),
  summaryGrid: document.querySelector("#summaryGrid"),
  standingsHeading: document.querySelector("#standingsHeading"),
  matchesHeading: document.querySelector("#matchesHeading"),
  standingsTable: document.querySelector("#standingsTable"),
  trendChart: document.querySelector("#trendChart"),
  matchList: document.querySelector("#matchList"),
  scopeButtons: document.querySelectorAll("[data-scope]"),
};

let usingSharedUrl = false;
let currentState = loadLocalState();
let currentSource = getLocalSource(currentState);
let currentScope = "overall";

render(currentState, currentSource);
loadInitialSharedState();

elements.importButton.addEventListener("click", () => {
  elements.importFile.click();
});

elements.importFile.addEventListener("change", handleImportFile);
elements.csvButton.addEventListener("click", exportSheetCsv);
elements.exportButton.addEventListener("click", exportStateJson);
elements.scopeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentScope = button.dataset.scope || "overall";
    render(currentState, currentSource);
  });
});

window.addEventListener("storage", (event) => {
  if (usingSharedUrl) {
    return;
  }

  if (event.key !== STORAGE_KEY) {
    return;
  }

  currentState = loadLocalState();
  currentSource = {
    label: "ローカル保存",
    detail: "保存データが更新されました",
  };
  render(currentState, currentSource);
});

window.addEventListener("hashchange", async () => {
  const nextSharedState = await loadSharedStateFromUrl();
  if (!nextSharedState) {
    return;
  }

  usingSharedUrl = true;
  currentState = nextSharedState;
  currentSource = getSharedUrlSource();
  render(currentState, currentSource);
});

function getLocalSource(state) {
  return {
    label: "ローカル保存",
    detail: state.matches.length
      ? "この端末の保存済み半荘を表示しています"
      : "この端末に保存済み半荘はありません。本体の共有リンクから開くと外部端末でも表示できます。",
  };
}

async function loadInitialSharedState() {
  const initialSharedState = await loadSharedStateFromUrl();
  if (!initialSharedState) {
    return;
  }

  usingSharedUrl = true;
  currentState = initialSharedState;
  currentSource = getSharedUrlSource();
  render(currentState, currentSource);
}

function getSharedUrlSource() {
  return {
    label: "共有リンク",
    detail: "リンク内の成績データを表示しています",
  };
}

function loadLocalState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return normalizeState(raw ? JSON.parse(raw) : {});
  } catch {
    return normalizeState({});
  }
}

async function loadSharedStateFromUrl() {
  const hash = window.location.hash || "";
  const hashParams = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const searchParams = new URLSearchParams(window.location.search || "");
  const remoteId = searchParams.get("id") || hashParams.get("id");
  const compressed = hashParams.get("z");
  const encoded = hashParams.get("data");

  if (remoteId) {
    const apiBaseUrl = normalizeShareApiBaseUrl(
      searchParams.get("api") || hashParams.get("api") || DEFAULT_REMOTE_SHARE_API_BASE_URL
    );
    return loadRemoteSharedState(remoteId, apiBaseUrl);
  }

  if (!compressed && !encoded) {
    return null;
  }

  try {
    const payload = compressed ? await decodeCompressedSharePayload(compressed) : decodeSharePayload(encoded);
    return normalizeSharedPayload(payload);
  } catch {
    return null;
  }
}

async function loadRemoteSharedState(id, apiBaseUrl) {
  const normalizedId = String(id || "").trim();
  if (!apiBaseUrl || !/^[A-Za-z0-9_-]{8,80}$/.test(normalizedId)) {
    return null;
  }

  try {
    const response = await fetch(`${apiBaseUrl}/snapshots/${encodeURIComponent(normalizedId)}`);
    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    return normalizeSharedPayload(payload);
  } catch {
    return null;
  }
}

async function decodeCompressedSharePayload(encoded) {
  if (typeof window.DecompressionStream !== "function") {
    throw new Error("DecompressionStream is not supported");
  }

  const bytes = decodeBase64UrlToBytes(encoded);
  const stream = new Blob([bytes]).stream().pipeThrough(new window.DecompressionStream("gzip"));
  const text = await new Response(stream).text();
  return JSON.parse(text);
}

function decodeSharePayload(encoded) {
  const bytes = decodeBase64UrlToBytes(encoded);
  return JSON.parse(decodeUtf8Bytes(bytes));
}

function decodeBase64UrlToBytes(encoded) {
  const base64 = encoded
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(encoded.length / 4) * 4, "=");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function normalizeShareApiBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function decodeUtf8Bytes(bytes) {
  if (typeof window.TextDecoder === "function") {
    return new window.TextDecoder().decode(bytes);
  }

  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return decodeURIComponent(escape(binary));
}

function normalizeSharedPayload(payload) {
  if (payload && Array.isArray(payload.matches)) {
    return normalizeState(payload);
  }

  return normalizeState({
    createdAt: payload && payload.c ? payload.c : "",
    settings: payload && payload.s ? payload.s : {},
    players: payload && Array.isArray(payload.p) ? payload.p.map(expandSharedRootPlayer) : [],
    matches: payload && Array.isArray(payload.m) ? payload.m.map(expandSharedMatch) : [],
  });
}

function expandSharedRootPlayer(row) {
  return {
    id: row[0],
    seat: Number(row[1] || 0),
    name: row[2] || "",
  };
}

function expandSharedMatch(match) {
  return {
    number: match.n,
    label: match.l || `半荘${match.n || ""}`,
    startedAt: match.st || "",
    finishedAt: match.f || "",
    endReason: match.e || "保存済み",
    bustedIds: Array.isArray(match.b) ? match.b : [],
    tobashiIds: Array.isArray(match.ti) ? match.ti : [],
    tobashiShares: match.ts || {},
    settings: normalizeSettings(match.s || {}),
    players: Array.isArray(match.p) ? match.p.map(expandSharedPlayer) : [],
  };
}

function expandSharedPlayer(row) {
  return {
    id: row[0],
    seat: Number(row[1] || 0),
    name: row[2] || "名前なし",
    score: Number(row[3] || 0),
    rank: Number(row[4] || 4),
    scoreDiff: Number(row[5] || 0),
    roundedScore: Number(row[6] || 0),
    uma: Number(row[7] || 0),
    tobashiBonus: Number(row[8] || 0),
    leagueScore: Number(row[9] || 0),
    chipDiff: Number(row[10] || 0),
    chips: Number(row[11] ?? STARTING_CHIPS),
    hands: Number(row[12] || 0),
    calls: Number(row[13] || 0),
    riichi: Number(row[14] || 0),
    wins: Number(row[15] || 0),
    dealIns: Number(row[16] || 0),
  };
}

function handleImportFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      currentState = normalizeState(JSON.parse(String(reader.result || "{}")));
      usingSharedUrl = false;
      currentSource = {
        label: "読込JSON",
        detail: file.name,
      };
      render(currentState, currentSource);
    } catch {
      window.alert("JSONを読み込めませんでした。Mahjong Ledgerの書き出しファイルを選んでください。");
    } finally {
      elements.importFile.value = "";
    }
  });
  reader.readAsText(file);
}

function exportSheetCsv() {
  const matches = getSortedMatches(currentState.matches);
  if (matches.length === 0) {
    window.alert("CSVにする保存済み半荘がありません。");
    return;
  }

  const stamp = new Date().toISOString().slice(0, 10);
  downloadTextFile(buildSheetCsv(matches), `mahjong-ledger-sheet-${stamp}.csv`, "text/csv");
}

function exportStateJson() {
  const stamp = new Date().toISOString().slice(0, 10);
  const payload = JSON.stringify(currentState, null, 2);
  downloadTextFile(payload, `mahjong-ledger-${stamp}.json`, "application/json");
}

function normalizeState(data) {
  return {
    players: Array.isArray(data.players) ? data.players : [],
    matches: Array.isArray(data.matches) ? data.matches : [],
    createdAt: data.createdAt || "",
    settings: normalizeSettings(data.settings || {}),
  };
}

function normalizeSettings(settings) {
  const normalized = { ...settings };
  const keptPreviousDefaultUma =
    Number(settings.umaRank1) === 20 &&
    Number(settings.umaRank2) === 10 &&
    Number(settings.umaRank3) === -10 &&
    Number(settings.umaRank4) === -20;

  if (keptPreviousDefaultUma || !Number.isFinite(Number(settings.umaRank1))) {
    normalized.umaRank1 = DEFAULT_UMA[0];
    normalized.umaRank2 = DEFAULT_UMA[1];
    normalized.umaRank3 = DEFAULT_UMA[2];
    normalized.umaRank4 = DEFAULT_UMA[3];
  }

  if (typeof normalized.tobashiBonusEnabled !== "boolean") {
    normalized.tobashiBonusEnabled = true;
  }

  return normalized;
}

function render(state, source) {
  const matches = getSortedMatches(state.matches);
  const latestDayMatches = getLatestMatchDayMatches(matches);
  const scopedMatches = currentScope === "today" ? latestDayMatches : matches;
  const rows = getAggregateRows(scopedMatches);
  const medians = getRateMedians(rows);
  const participantCount = rows.length || countCurrentPlayers(state.players);
  const latestMatch = scopedMatches[0] || matches[0] || null;
  const dayLabel = currentScope === "today" && latestMatch ? formatDateOnly(latestMatch.finishedAt) : "";
  const dayGroups = currentScope === "daily" ? getMatchDayGroups(matches) : [];

  elements.sourceLabel.textContent = source.label;
  elements.sourceDetail.textContent = source.detail;
  elements.standingsHeading.textContent =
    currentScope === "daily"
      ? "日別戦績"
      : currentScope === "today"
        ? `当日順位${dayLabel ? ` ${dayLabel}` : ""}`
        : "総合順位";
  elements.matchesHeading.textContent = currentScope === "today" ? "当日半荘" : "半荘一覧";
  elements.scopeButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String((button.dataset.scope || "overall") === currentScope));
  });
  const summary = {
    matchCount: currentScope === "daily" ? dayGroups.length : scopedMatches.length,
    participantCount,
    latestAt: latestMatch ? latestMatch.finishedAt : state.createdAt,
    topName: rows[0] ? rows[0].name : "",
    scopeLabel: currentScope === "today" ? "当日半荘" : currentScope === "daily" ? "日数" : "半荘数",
    latestLabel: currentScope === "today" ? "対象日" : currentScope === "daily" ? "対象日数" : "最終更新",
    latestValue: currentScope === "today" ? dayLabel : currentScope === "daily" ? `${dayGroups.length}日` : formatDate(latestMatch ? latestMatch.finishedAt : state.createdAt),
  };
  elements.leaderGrid.innerHTML = renderLeaderCard(summary);
  elements.summaryGrid.innerHTML = renderSummaryCards(summary);
  elements.standingsTable.innerHTML =
    currentScope === "daily"
      ? renderDailySummaries(matches)
      : rows.length
        ? `${currentScope === "today" ? renderDayScoreStrip(rows) : ""}${renderStandings(rows, medians)}`
        : renderEmpty(currentScope === "today" ? "当日の半荘がありません" : "保存済み半荘がありません");
  elements.standingsTable.innerHTML =
    currentScope === "daily"
      ? renderDailySummaries(matches)
      : scopedMatches.length
        ? renderArchiveLedger(scopedMatches, currentScope === "today" ? `当日 ${dayLabel}` : "総合")
        : renderEmpty(currentScope === "today" ? "当日の半荘がありません" : "保存済み半荘がありません");
  elements.standingsTable.scrollLeft = 0;
  elements.trendChart.innerHTML = currentScope !== "daily" && scopedMatches.length ? renderScoreTrend(scopedMatches) : "";
  elements.trendChart.innerHTML = (currentScope === "daily" ? matches.length : scopedMatches.length)
    ? renderScoreTrend(currentScope === "daily" ? matches : scopedMatches)
    : "";
  elements.matchList.innerHTML = scopedMatches.length ? renderMatches(scopedMatches) : renderEmpty("半荘保存後にここへ反映されます");
  elements.matchList.innerHTML = "";
}

function renderLeaderCard(summary) {
  return `
    <article class="summary-card gold leader-card">
      <span>暫定首位</span>
      <strong>${escapeHtml(summary.topName || "-")}</strong>
    </article>
  `;
}

function renderSummaryCards(summary) {
  return `
    <article class="summary-card accent">
      <span>${escapeHtml(summary.scopeLabel || "半荘数")}</span>
      <strong>${formatNumber(summary.matchCount)}</strong>
    </article>
    <article class="summary-card blue">
      <span>参加者</span>
      <strong>${formatNumber(summary.participantCount)}</strong>
    </article>
    <article class="summary-card">
      <span>${escapeHtml(summary.latestLabel || "最終更新")}</span>
      <strong>${escapeHtml(summary.latestValue || formatDate(summary.latestAt) || "-")}</strong>
    </article>
  `;
}

function renderStandings(rows, medians) {
  const header = `
    <div class="standing-row header" aria-hidden="true">
      <span>順位</span>
      <span>名前</span>
      <span>半荘</span>
      <span>合計スコア</span>
      <span>平均スコア</span>
      <span>チップ</span>
      <span>平均順位</span>
      <span>トップ</span>
      <span>連対</span>
      <span>4着回避</span>
      <span>トビ</span>
      <span>トバし</span>
      <span>トバし賞</span>
      <span>平均点</span>
      <span>合計差</span>
      <span>和了</span>
      <span>放銃</span>
      <span>リーチ</span>
      <span>副露</span>
    </div>
  `;

  const body = rows
    .map((row, index) => {
      const scoreClass = toneClass(row.totalLeagueScore);
      const diffClass = toneClass(row.totalScoreDiff);
      const chipClass = toneClass(row.totalChipDiff);
      const bonusClass = toneClass(row.totalTobashiBonus);
      return `
        <article class="standing-row">
          <span class="rank">${index + 1}</span>
          <strong class="player-name">${escapeHtml(row.name)}</strong>
          <span>${row.games}</span>
          <span class="${scoreClass}">${formatSigned(row.totalLeagueScore)}</span>
          <span>${row.averageLeagueScore.toFixed(2)}</span>
          <span class="${chipClass}">${formatSigned(row.totalChipDiff)}</span>
          <span>${row.averageRank.toFixed(2)}</span>
          ${rateCell(row.topRate, medians.topRate)}
          ${rateCell(row.rentaiRate, medians.rentaiRate)}
          ${rateCell(row.avoidLastRate, medians.avoidLastRate)}
          ${rateCell(row.tobiRate, medians.tobiRate, true)}
          ${rateCell(row.tobashiRate, medians.tobashiRate)}
          <span class="${bonusClass}">${formatSigned(row.totalTobashiBonus)}</span>
          <span>${formatNumber(Math.round(row.averageScore))}</span>
          <span class="${diffClass}">${formatSigned(row.totalScoreDiff)}</span>
          ${rateCell(row.winRate, medians.winRate)}
          ${rateCell(row.dealInRate, medians.dealInRate, true)}
          ${rateCell(row.riichiRate, medians.riichiRate)}
          ${rateCell(row.callRate, medians.callRate)}
        </article>
      `;
    })
    .join("");

  return header + body;
}

function renderArchiveLedger(matches, summaryLabel = "") {
  const sortedMatches = getSortedMatches(matches);
  const rows = getAggregateRows(sortedMatches);
  const latestMatch = sortedMatches[0] || null;

  return `
    <div class="ledger-stack">
      <div class="summary-cards">
        <div class="summary-card"><span>${escapeHtml(summaryLabel || "半荘数")}</span><strong>${sortedMatches.length}</strong></div>
        <div class="summary-card"><span>最新</span><strong>${escapeHtml(latestMatch ? formatDate(latestMatch.finishedAt) : "-")}</strong></div>
      </div>
      ${renderDayScoreStrip(rows)}
      ${renderMetricLedger(rows)}
      ${renderMatchLedger(sortedMatches)}
    </div>
  `;
}

function renderMetricLedger(rows) {
  if (!rows.length) {
    return renderEmpty("表示できる集計がありません");
  }

  const medians = getRateMedians(rows);
  const metrics = [
    { label: "半荘数", value: (row) => row.games },
    { label: "合計スコア", value: (row) => formatSigned(row.totalLeagueScore), tone: (row) => toneClass(row.totalLeagueScore) },
    { label: "平均順位", value: (row) => row.averageRank.toFixed(2) },
    { label: "トップ率", value: (row) => formatRate(row.topRate), tone: (row) => rateToneClass(row.topRate, medians.topRate) },
    { label: "連対率", value: (row) => formatRate(row.rentaiRate), tone: (row) => rateToneClass(row.rentaiRate, medians.rentaiRate) },
    { label: "4着回避率", value: (row) => formatRate(row.avoidLastRate), tone: (row) => rateToneClass(row.avoidLastRate, medians.avoidLastRate) },
    { label: "トビ率", value: (row) => formatRate(row.tobiRate), tone: (row) => rateToneClass(row.tobiRate, medians.tobiRate, true) },
    { label: "トバし率", value: (row) => formatRate(row.tobashiRate), tone: (row) => rateToneClass(row.tobashiRate, medians.tobashiRate) },
    { label: "和了率", value: (row) => formatRate(row.winRate), tone: (row) => rateToneClass(row.winRate, medians.winRate) },
    { label: "放銃率", value: (row) => formatRate(row.dealInRate), tone: (row) => rateToneClass(row.dealInRate, medians.dealInRate, true) },
    { label: "リーチ率", value: (row) => formatRate(row.riichiRate), tone: (row) => rateToneClass(row.riichiRate, medians.riichiRate) },
    { label: "副露率", value: (row) => formatRate(row.callRate), tone: (row) => rateToneClass(row.callRate, medians.callRate) },
  ];

  return `
    <div class="ledger-scroll">
      <table class="ledger-table metric-ledger">
        <thead>
          <tr>
            <th>項目</th>
            ${rows.map((row) => `<th>${escapeHtml(row.name)}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${metrics
            .map((metric) => `
              <tr>
                <th>${metric.label}</th>
                ${rows.map((row) => `<td class="${metric.tone ? metric.tone(row) : ""}">${metric.value(row)}</td>`).join("")}
              </tr>
            `)
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function getLedgerColumns(settings = currentState.settings || {}) {
  const columns = [
    { key: "rank", label: "順位" },
    { key: "chip", label: "チップ" },
    { key: "leagueScore", label: "スコア" },
  ];

  if (settings.ledgerShowTobi) {
    columns.push({ key: "tobi", label: "トビ" });
  }
  if (settings.ledgerShowTobashi) {
    columns.push({ key: "tobashi", label: "トバし" });
  }
  if (settings.ledgerShowTobashiBonus) {
    columns.push({ key: "tobashiBonus", label: "トバし賞" });
  }
  if (settings.ledgerShowRawScore) {
    columns.push({ key: "rawScore", label: "点数" });
  }
  if (settings.ledgerShowRoundedScore) {
    columns.push({ key: "roundedScore", label: "素点丸め" });
  }
  if (settings.ledgerShowUma) {
    columns.push({ key: "uma", label: "ウマ" });
  }
  if (settings.ledgerShowOka) {
    columns.push({ key: "oka", label: "オカ補正" });
  }

  return columns;
}

function renderMatchLedger(matches) {
  const sheetPlayers = getLedgerPlayers(matches);
  const columns = getLedgerColumns();
  if (!matches.length || !sheetPlayers.length) {
    return renderEmpty("表示できる半荘がありません");
  }

  const chronological = getSortedMatches(matches).reverse();

  return `
    <div class="ledger-scroll">
      <table class="ledger-table match-ledger">
        <thead>
          <tr>
            <th rowspan="2">半荘</th>
            <th rowspan="2">保存日時</th>
            ${sheetPlayers.map((player) => `<th colspan="${columns.length}">${escapeHtml(player.name)}</th>`).join("")}
          </tr>
          <tr>
            ${sheetPlayers.map(() => columns.map((column) => `<th>${column.label}</th>`).join("")).join("")}
          </tr>
        </thead>
        <tbody>
          ${chronological
            .map((match) => `
              <tr>
                <th>${escapeHtml(match.label || `半荘${match.number || ""}`)}</th>
                <td>${escapeHtml(formatDate(match.finishedAt))}</td>
                ${sheetPlayers.map((player) => renderMatchLedgerPlayerCells(match, player.key, columns)).join("")}
              </tr>
            `)
            .join("")}
        </tbody>
        <tfoot>
          ${renderMatchLedgerTotalRow(chronological, sheetPlayers, columns)}
        </tfoot>
      </table>
    </div>
  `;
}

function renderMatchLedgerPlayerCells(match, playerKey, columns = getLedgerColumns()) {
  const player = findMatchLedgerPlayer(match, playerKey);
  if (!player) {
    return Array.from({ length: columns.length }, () => `<td></td>`).join("");
  }

  return columns
    .map((column) => {
      const cell = getMatchLedgerCell(column.key, player, match);
      return `<td class="${cell.className || ""}">${escapeHtml(cell.text)}</td>`;
    })
    .join("");
}

function renderMatchLedgerTotalRow(matches, sheetPlayers, columns = getLedgerColumns()) {
  const totals = getMatchLedgerPlayerTotals(matches, sheetPlayers);
  return `
    <tr>
      <th>トータル</th>
      <td>${matches.length}半荘</td>
      ${sheetPlayers
        .map((player) => {
          const total = totals.get(player.key);
          return columns.map((column) => renderMatchLedgerTotalCell(column.key, total)).join("");
        })
        .join("")}
    </tr>
  `;
}

function renderMatchLedgerTotalCell(columnKey, total) {
  if (!total) {
    return `<td></td>`;
  }

  switch (columnKey) {
    case "rank":
      return `<td>${total.rank || ""}</td>`;
    case "chip":
      return `<td class="${toneClass(total.chip)}">${formatSigned(total.chip)}</td>`;
    case "leagueScore":
      return `<td class="${toneClass(total.score)}">${formatSigned(total.score)}</td>`;
    default:
      return `<td></td>`;
  }
}

function getMatchLedgerCsvCells(match, playerKey, columns = getLedgerColumns()) {
  const player = findMatchLedgerPlayer(match, playerKey);
  if (!player) {
    return Array(columns.length).fill("");
  }

  return columns.map((column) => getMatchLedgerCell(column.key, player, match).csv);
}

function getMatchLedgerTotalCsvCells(total, columns = getLedgerColumns()) {
  if (!total) {
    return Array(columns.length).fill("");
  }

  return columns.map((column) => {
    switch (column.key) {
      case "rank":
        return total.rank || "";
      case "chip":
        return formatSigned(total.chip);
      case "leagueScore":
        return formatSigned(total.score);
      default:
        return "";
    }
  });
}

function getMatchLedgerPlayerTotals(matches, sheetPlayers) {
  const totals = new Map();
  sheetPlayers.forEach((player) => {
    totals.set(player.key, { key: player.key, name: player.name, score: 0, chip: 0, rank: "" });
  });

  matches.forEach((match) => {
    sheetPlayers.forEach((sheetPlayer) => {
      const player = findMatchLedgerPlayer(match, sheetPlayer.key);
      if (!player) {
        return;
      }

      const total = totals.get(sheetPlayer.key);
      total.score += getPlayerLeagueScore(player, match);
      total.chip += getPlayerChipDiff(player);
    });
  });

  const rankedTotals = Array.from(totals.values()).sort((a, b) => b.score - a.score || b.chip - a.chip || a.name.localeCompare(b.name, "ja"));
  rankedTotals.forEach((total, index) => {
    total.rank = index + 1;
  });

  return totals;
}

function getMatchLedgerCell(columnKey, player, match) {
  const rank = player.rank || getRanksForPlayers(match.players || []).get(player.id) || "";
  const chipDiff = getPlayerChipDiff(player);
  const leagueScore = getPlayerLeagueScore(player, match);
  const tobashiShare = Number((match.tobashiShares && match.tobashiShares[player.id]) || 0);
  const isBusted = Array.isArray(match.bustedIds) && match.bustedIds.includes(player.id);
  const tobashiBonus = getPlayerTobashiBonus(player, match);
  const roundedScore = getPlayerRoundedScore(player);
  const uma = getPlayerUma(player, match);
  const oka = getPlayerOkaAdjustment(player, match);

  switch (columnKey) {
    case "rank":
      return { text: String(rank || ""), csv: rank || "" };
    case "chip":
      return { text: formatSigned(chipDiff), csv: formatSigned(chipDiff), className: toneClass(chipDiff) };
    case "leagueScore":
      return { text: formatSigned(leagueScore), csv: formatSigned(leagueScore), className: toneClass(leagueScore) };
    case "tobi":
      return { text: isBusted ? "1" : "", csv: isBusted ? 1 : "" };
    case "tobashi":
      return { text: tobashiShare ? String(tobashiShare) : "", csv: tobashiShare || "" };
    case "tobashiBonus":
      return { text: formatSigned(tobashiBonus), csv: formatSigned(tobashiBonus), className: toneClass(tobashiBonus) };
    case "rawScore":
      return { text: formatNumber(player.score || 0), csv: Number(player.score || 0) };
    case "roundedScore":
      return { text: formatSigned(roundedScore), csv: formatSigned(roundedScore), className: toneClass(roundedScore) };
    case "uma":
      return { text: formatSigned(uma), csv: formatSigned(uma), className: toneClass(uma) };
    case "oka":
      return { text: formatSigned(oka), csv: formatSigned(oka), className: toneClass(oka) };
    default:
      return { text: "", csv: "" };
  }
}

function getLedgerPlayers(matches) {
  const players = new Map();
  const addPlayer = (player) => {
    const key = getLedgerPlayerKey(player);
    if (!key || players.has(key)) {
      return;
    }
    players.set(key, {
      id: key,
      key,
      name: player.name || key,
    });
  };

  (currentState.players || []).forEach(addPlayer);
  getSortedMatches(matches).reverse().forEach((match) => {
    (match.players || []).forEach(addPlayer);
  });

  return Array.from(players.values());
}

function findMatchLedgerPlayer(match, playerKey) {
  return (match.players || []).find((player) => getLedgerPlayerKey(player) === playerKey);
}

function getLedgerPlayerKey(player) {
  const name = String((player && player.name) || "").trim();
  return name || String((player && player.id) || "");
}

function renderMatches(matches) {
  return matches
    .slice(0, 30)
    .map((match) => {
      const players = getPlayersWithRanks(match);
      const top = players[0] || null;
      const tobashi = formatTobashiPlayers(match);
      const busted = formatPlayersByIds(match.players || [], match.bustedIds || []);
      const playerScores = players
        .map(
          (player) => {
            const leagueScore = getPlayerLeagueScore(player, match);
            const scoreClass = toneClass(leagueScore);
            const chipDiff = getPlayerChipDiff(player);
            const chipClass = toneClass(chipDiff);
            const bonus = getPlayerTobashiBonus(player, match);
            return `
              <span>
                <b>${player.rank}位 ${escapeHtml(player.name)}</b>
                <strong class="${scoreClass}">${formatSigned(leagueScore)}</strong>
                <small>${formatNumber(player.score)}点 / ウマ ${formatSigned(getPlayerUma(player, match))}${bonus ? ` / 賞 ${formatSigned(bonus)}` : ""}</small>
                <small class="${chipClass}">チップ ${formatSigned(chipDiff)}</small>
              </span>
            `;
          }
        )
        .join("");

      return `
        <article class="match-item">
          <div class="match-head">
            <strong>${escapeHtml(match.label || `半荘${match.number || ""}`)}</strong>
            <span>${formatDate(match.finishedAt)}</span>
          </div>
          <div class="match-meta">
            <span>${escapeHtml(match.endReason || "保存済み")}</span>
            ${top ? `<span>トップ ${escapeHtml(top.name)} ${formatSigned(getPlayerLeagueScore(top, match))}</span>` : ""}
            ${busted ? `<span>トビ ${escapeHtml(busted)}</span>` : ""}
            ${tobashi ? `<span>トバし ${escapeHtml(tobashi)}</span>` : ""}
          </div>
          <div class="score-strip">${playerScores}</div>
        </article>
      `;
    })
    .join("");
}

function renderDailySummaries(matches) {
  {
    const groups = getMatchDayGroups(matches);
    if (groups.length === 0) {
      return renderEmpty("日別に表示できる半荘がありません");
    }

    return groups
      .map((group) => `
        <section class="daily-summary">
          <div class="daily-summary-head">
            <div>
              <strong>${escapeHtml(group.label)}</strong>
              <span>${group.matches.length}半荘</span>
            </div>
          </div>
          ${renderArchiveLedger(group.matches, group.label)}
        </section>
      `)
      .join("");
  }

  const groups = getMatchDayGroups(matches);
  if (groups.length === 0) {
    return renderEmpty("日別に表示できる半荘がありません");
  }

  return groups
    .map((group) => {
      const rows = getAggregateRows(group.matches);
      const medians = getRateMedians(rows);
      return `
        <section class="daily-summary">
          <div class="daily-summary-head">
            <div>
              <strong>${escapeHtml(group.label)}</strong>
              <span>${group.matches.length}半荘</span>
            </div>
          </div>
          ${renderDayScoreStrip(rows)}
          <div class="daily-summary-rows">
            ${rows
              .map((row) => {
                const scoreClass = toneClass(row.totalLeagueScore);
                const chipClass = toneClass(row.totalChipDiff);
                return `
                  <div class="daily-summary-row">
                    <strong>${escapeHtml(row.name)}</strong>
                    <span>${row.games}半荘</span>
                    <span class="${scoreClass}">スコア${formatSigned(row.totalLeagueScore)}</span>
                    <span class="${chipClass}">チップ${formatSigned(row.totalChipDiff)}</span>
                    <span>平均${row.averageRank.toFixed(2)}位</span>
                    ${dailyRateBadge("トップ", row.topRate, medians.topRate)}
                    ${dailyRateBadge("連対", row.rentaiRate, medians.rentaiRate)}
                    ${dailyRateBadge("4着回避", row.avoidLastRate, medians.avoidLastRate)}
                  </div>
                `;
              })
              .join("")}
          </div>
        </section>
      `;
    })
    .join("");
}

function renderDayScoreStrip(rows) {
  if (!rows.length) {
    return "";
  }

  return `
    <div class="day-score-strip" aria-label="日内総合スコア">
      <span>日内総合スコア</span>
      ${rows
        .map((row) => `<strong class="${toneClass(row.totalLeagueScore)}">${escapeHtml(row.name)} ${formatSigned(row.totalLeagueScore)}</strong>`)
        .join("")}
    </div>
  `;
}

function renderScoreTrend(matches) {
  const chronological = getSortedMatches(matches).reverse();
  if (chronological.length === 0) {
    return "";
  }

  const names = [];
  const totals = new Map();
  const series = new Map();
  const ensurePlayer = (name) => {
    const key = String(name || "名前なし");
    if (series.has(key)) {
      return key;
    }

    names.push(key);
    totals.set(key, 0);
    series.set(key, [{ step: 0, value: 0 }]);
    return key;
  };

  chronological.forEach((match, index) => {
    (match.players || []).forEach((player) => {
      const key = ensurePlayer(player.name);
      totals.set(key, Number(totals.get(key) || 0) + getPlayerLeagueScore(player, match));
    });

    names.forEach((name) => {
      series.get(name).push({ step: index + 1, value: Number(totals.get(name) || 0) });
    });
  });

  const values = [...series.values()].flatMap((points) => points.map((point) => point.value));
  let minValue = Math.min(0, ...values);
  let maxValue = Math.max(0, ...values);
  if (minValue === maxValue) {
    minValue -= 10;
    maxValue += 10;
  }

  const width = 680;
  const height = 210;
  const padLeft = 44;
  const padRight = 104;
  const padTop = 10;
  const padBottom = 22;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;
  const stepMax = Math.max(1, chronological.length);
  const yFor = (value) => padTop + ((maxValue - value) / (maxValue - minValue)) * plotHeight;
  const xFor = (step) => padLeft + (step / stepMax) * plotWidth;
  const zeroY = yFor(0);
  const finalRows = names
    .map((name) => ({ name, value: Number(totals.get(name) || 0) }))
    .sort((a, b) => b.value - a.value);

  const lines = finalRows
    .map((row, index) => {
      const points = (series.get(row.name) || [])
        .map((point) => `${xFor(point.step).toFixed(1)},${yFor(point.value).toFixed(1)}`)
        .join(" ");
      return `<polyline points="${points}" fill="none" stroke="${chartColor(index)}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />`;
    })
    .join("");

  const labels = finalRows
    .map(
      (row, index) => `
        <div class="trend-legend-item">
          <span style="--trend-color: ${chartColor(index)}"></span>
          <strong>${escapeHtml(row.name)}</strong>
          <em class="${toneClass(row.value)}">${formatSigned(row.value)}</em>
        </div>
      `
    )
    .join("");

  return `
    <section class="trend-panel" aria-label="スコア推移">
      <div class="trend-head">
        <span>スコア推移</span>
        <strong>${chronological.length}半荘</strong>
      </div>
      <div class="trend-body">
        <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="半荘スコアの累積推移">
          <line x1="${padLeft}" y1="${zeroY.toFixed(1)}" x2="${width - padRight}" y2="${zeroY.toFixed(1)}" class="trend-zero" />
          <line x1="${padLeft}" y1="${padTop}" x2="${padLeft}" y2="${height - padBottom}" class="trend-axis" />
          <line x1="${padLeft}" y1="${height - padBottom}" x2="${width - padRight}" y2="${height - padBottom}" class="trend-axis" />
          <text x="8" y="${yFor(maxValue).toFixed(1)}" class="trend-label">${formatSigned(maxValue)}</text>
          <text x="8" y="${yFor(minValue).toFixed(1)}" class="trend-label">${formatSigned(minValue)}</text>
          ${lines}
        </svg>
        <div class="trend-legend">${labels}</div>
      </div>
    </section>
  `;
}

function renderEmpty(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function buildSheetCsv(matches) {
  const rows = [];
  const aggregateRows = getAggregateRows(matches);
  const sortedMatches = getSortedMatches(matches);
  const sheetPlayers = getLedgerPlayers(sortedMatches);
  const matchColumns = getLedgerColumns();

  rows.push(["半荘成績"]);
  rows.push([
    "半荘",
    "保存日時",
    "終了理由",
    ...sheetPlayers.flatMap((player) => matchColumns.map((column) => `${player.name} ${column.label}`)),
  ]);
  sortedMatches.reverse().forEach((match) => {
    rows.push([
      match.label || `半荘${match.number || ""}`,
      formatDate(match.finishedAt),
      match.endReason || "保存済み",
      ...sheetPlayers.flatMap((sheetPlayer) => getMatchLedgerCsvCells(match, sheetPlayer.key, matchColumns)),
    ]);
  });
  const ledgerTotals = getMatchLedgerPlayerTotals(sortedMatches, sheetPlayers);
  rows.push([
    "トータル",
    `${sortedMatches.length}半荘`,
    "",
    ...sheetPlayers.flatMap((sheetPlayer) => getMatchLedgerTotalCsvCells(ledgerTotals.get(sheetPlayer.key), matchColumns)),
  ]);

  rows.push([]);
  rows.push(["集計"]);
  rows.push(["項目", ...aggregateRows.map((row) => row.name)]);
  [
    ["半荘数", (row) => row.games],
    ["合計スコア", (row) => formatSigned(row.totalLeagueScore)],
    ["平均順位", (row) => row.averageRank.toFixed(2)],
    ["トップ率", (row) => formatRate(row.topRate)],
    ["連対率", (row) => formatRate(row.rentaiRate)],
    ["4着回避率", (row) => formatRate(row.avoidLastRate)],
    ["トビ率", (row) => formatRate(row.tobiRate)],
    ["トバし率", (row) => formatRate(row.tobashiRate)],
    ["和了率", (row) => formatRate(row.winRate)],
    ["放銃率", (row) => formatRate(row.dealInRate)],
    ["リーチ率", (row) => formatRate(row.riichiRate)],
    ["副露率", (row) => formatRate(row.callRate)],
  ].forEach(([label, getter]) => {
    rows.push([label, ...aggregateRows.map((row) => getter(row))]);
  });

  return `\uFEFF${rows.map(toCsvRow).join("\r\n")}`;
}

function getSortedMatches(matches) {
  return [...matches].sort((a, b) => {
    const timeA = Date.parse(a.finishedAt || "");
    const timeB = Date.parse(b.finishedAt || "");
    if (Number.isFinite(timeA) && Number.isFinite(timeB) && timeA !== timeB) {
      return timeB - timeA;
    }
    return Number(b.number || 0) - Number(a.number || 0);
  });
}

function getLatestMatchDayMatches(matches) {
  const latest = matches[0] || null;
  const latestKey = latest ? getLocalDateKey(latest.finishedAt) : "";
  if (!latestKey) {
    return [];
  }

  return matches.filter((match) => getLocalDateKey(match.finishedAt) === latestKey);
}

function getMatchDayGroups(matches) {
  const groups = new Map();

  getSortedMatches(matches).forEach((match) => {
    const key = getLocalDateKey(match.finishedAt);
    if (!key) {
      return;
    }

    const group = groups.get(key) || {
      key,
      label: formatDateOnly(match.finishedAt),
      matches: [],
    };
    group.matches.push(match);
    groups.set(key, group);
  });

  return [...groups.values()].sort((a, b) => b.key.localeCompare(a.key));
}

function getAggregateRows(matches) {
  const rows = new Map();

  matches.forEach((match) => {
    const ranks = getRanksForPlayers(match.players || []);
    (match.players || []).forEach((player) => {
      const rank = Number(player.rank || ranks.get(player.id) || 4);
      const key = normalizePlayerKey(player.name);
      const row = rows.get(key) || {
        name: player.name || "名前なし",
        games: 0,
        rankTotal: 0,
        topCount: 0,
        secondOrBetterCount: 0,
        avoidLastCount: 0,
        tobiCount: 0,
        tobashiCredit: 0,
        tobashiBonusTotal: 0,
        leagueScoreTotal: 0,
        chipDiffTotal: 0,
        scoreTotal: 0,
        totalScoreDiff: 0,
        hands: 0,
        calls: 0,
        riichi: 0,
        wins: 0,
        dealIns: 0,
      };

      row.games += 1;
      row.rankTotal += rank;
      row.topCount += rank === 1 ? 1 : 0;
      row.secondOrBetterCount += rank <= 2 ? 1 : 0;
      row.avoidLastCount += rank < Math.max(1, (match.players || []).length) ? 1 : 0;
      row.tobiCount += Array.isArray(match.bustedIds) && match.bustedIds.includes(player.id) ? 1 : 0;
      row.tobashiCredit += Number((match.tobashiShares && match.tobashiShares[player.id]) || 0);
      row.tobashiBonusTotal += getPlayerTobashiBonus({ ...player, rank }, match);
      row.leagueScoreTotal += getPlayerLeagueScore({ ...player, rank }, match);
      row.chipDiffTotal += getPlayerChipDiff(player);
      row.scoreTotal += Number(player.score || 0);
      row.totalScoreDiff += getScoreDiff(player);
      row.hands += Number(player.hands || 0);
      row.calls += Number(player.calls || 0);
      row.riichi += Number(player.riichi || 0);
      row.wins += Number(player.wins || 0);
      row.dealIns += Number(player.dealIns || 0);
      rows.set(key, row);
    });
  });

  return [...rows.values()]
    .map((row) => ({
      ...row,
      averageRank: row.games ? row.rankTotal / row.games : 0,
      topRate: row.games ? (row.topCount / row.games) * 100 : 0,
      rentaiRate: row.games ? (row.secondOrBetterCount / row.games) * 100 : 0,
      avoidLastRate: row.games ? (row.avoidLastCount / row.games) * 100 : 0,
      tobiRate: row.games ? (row.tobiCount / row.games) * 100 : 0,
      tobashiRate: row.games ? (row.tobashiCredit / row.games) * 100 : 0,
      totalTobashiBonus: row.tobashiBonusTotal,
      totalLeagueScore: row.leagueScoreTotal,
      averageLeagueScore: row.games ? row.leagueScoreTotal / row.games : 0,
      totalChipDiff: row.chipDiffTotal,
      averageScore: row.games ? row.scoreTotal / row.games : 0,
      callRate: row.hands ? (row.calls / row.hands) * 100 : 0,
      riichiRate: row.hands ? (row.riichi / row.hands) * 100 : 0,
      winRate: row.hands ? (row.wins / row.hands) * 100 : 0,
      dealInRate: row.hands ? (row.dealIns / row.hands) * 100 : 0,
    }))
    .sort((a, b) => b.totalLeagueScore - a.totalLeagueScore || a.averageRank - b.averageRank || b.totalScoreDiff - a.totalScoreDiff || b.averageScore - a.averageScore);
}

function getPlayersWithRanks(match) {
  const ranks = getRanksForPlayers(match.players || []);
  return (match.players || [])
    .map((player) => ({
      ...player,
      rank: Number(player.rank || ranks.get(player.id) || 4),
      score: Number(player.score || 0),
    }))
    .sort((a, b) => a.rank - b.rank || b.score - a.score);
}

function getRanksForPlayers(players) {
  const sorted = [...players].sort((a, b) => Number(b.score || 0) - Number(a.score || 0) || Number(a.seat || 0) - Number(b.seat || 0));
  return new Map(sorted.map((player, index) => [player.id, index + 1]));
}

function getScoreDiff(player) {
  return Number(player.score || 0) - RETURN_SCORE;
}

function getPlayerChipDiff(player) {
  if (Number.isFinite(Number(player.chipDiff))) {
    return Number(player.chipDiff);
  }

  if (Number.isFinite(Number(player.chips))) {
    return Number(player.chips) - STARTING_CHIPS;
  }

  return 0;
}

function getPlayerRoundedScore(player) {
  return roundHundredsFiveDownSixUp(getScoreDiff(player));
}

function getPlayerUma(player, match) {
  const rank = Number(player.rank || getRanksForPlayers(match.players || []).get(player.id) || 4);
  return getUmaForRank(rank, match.settings || currentState.settings || {});
}

function getPlayerTobashiBonus(player, match) {
  const settings = match.settings || currentState.settings || {};
  return (
    getTobashiBonusForPlayer(player.id, match.tobashiShares || {}, settings) -
    getTobashiPenaltyForPlayer(player.id, match.bustedIds || [], settings)
  );
}

function getPlayerBaseLeagueScore(player, match) {
  return getPlayerRoundedScore(player) + getPlayerUma(player, match) + getPlayerTobashiBonus(player, match);
}

function getPlayerOkaAdjustment(player, match) {
  const ranks = getRanksForPlayers(match.players || []);
  const rank = Number(player.rank || ranks.get(player.id) || 4);
  if (rank !== 1) {
    return 0;
  }

  return -getMatchBaseLeagueScoreTotal(match);
}

function getPlayerLeagueScore(player, match) {
  return getPlayerBaseLeagueScore(player, match) + getPlayerOkaAdjustment(player, match);
}

function getMatchBaseLeagueScoreTotal(match) {
  const ranks = getRanksForPlayers(match.players || []);
  return (match.players || []).reduce((sum, player) => {
    const rankedPlayer = { ...player, rank: Number(player.rank || ranks.get(player.id) || 4) };
    return sum + getPlayerBaseLeagueScore(rankedPlayer, match);
  }, 0);
}

function getMatchLeagueScoreTotal(match) {
  const ranks = getRanksForPlayers(match.players || []);
  return (match.players || []).reduce((sum, player) => {
    const rankedPlayer = { ...player, rank: Number(player.rank || ranks.get(player.id) || 4) };
    return sum + getPlayerLeagueScore(rankedPlayer, match);
  }, 0);
}

function getUmaForRank(rank, settings) {
  const key = `umaRank${rank}`;
  const value = Number(settings && settings[key]);
  if (Number.isFinite(value)) {
    return value;
  }

  return DEFAULT_UMA[rank - 1] || 0;
}

function getTobashiBonusForPlayer(playerId, shares, settings) {
  if (settings && settings.tobashiBonusEnabled === false) {
    return 0;
  }

  const share = Number((shares && shares[playerId]) || 0);
  return share > 0 ? Number((share * TOBASHI_BONUS).toFixed(2)) : 0;
}

function getTobashiPenaltyForPlayer(playerId, bustedIds, settings) {
  if (settings && settings.tobashiBonusEnabled === false) {
    return 0;
  }

  return Array.isArray(bustedIds) && bustedIds.includes(playerId) ? TOBASHI_BONUS : 0;
}

function roundHundredsFiveDownSixUp(value) {
  const number = Number(value || 0);
  const sign = number < 0 ? -1 : 1;
  const abs = Math.abs(number);
  const thousands = Math.trunc(abs / 1000);
  const hundreds = Math.trunc((abs % 1000) / 100);
  return sign * (thousands + (hundreds >= 6 ? 1 : 0));
}

function formatTobashiPlayers(match) {
  if (!match.tobashiShares) {
    return "";
  }

  return Object.keys(match.tobashiShares)
    .map((playerId) => {
      const player = (match.players || []).find((item) => item.id === playerId);
      const share = Number(match.tobashiShares[playerId] || 0);
      if (!player || share <= 0) {
        return "";
      }
      return share === 1 ? player.name : `${player.name} ${share.toFixed(2)}`;
    })
    .filter(Boolean)
    .join("、");
}

function formatPlayersByIds(players, ids) {
  return ids
    .map((id) => {
      const player = players.find((item) => item.id === id);
      return player ? player.name : "";
    })
    .filter(Boolean)
    .join("、");
}

function countCurrentPlayers(players) {
  return new Set(players.map((player) => normalizePlayerKey(player.name)).filter(Boolean)).size;
}

function normalizePlayerKey(name) {
  return String(name || "").trim() || "名前なし";
}

function downloadTextFile(payload, filename, type) {
  const blob = new Blob([payload], { type: `${type}; charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function toCsvRow(row) {
  return row.map(toCsvCell).join(",");
}

function toCsvCell(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatDateOnly(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

function getLocalDateKey(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("ja-JP");
}

function formatSigned(value) {
  const number = Number(value || 0);
  return number > 0 ? `+${formatNumber(number)}` : formatNumber(number);
}

function formatRate(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function toneClass(value) {
  const number = Number(value || 0);
  return number > 0 ? "plus" : number < 0 ? "minus" : "";
}

function rateCell(value, median, lowerIsBetter = false) {
  return `<span class="${rateToneClass(value, median, lowerIsBetter)}">${formatRate(value)}</span>`;
}

function dailyRateBadge(label, value, median, lowerIsBetter = false) {
  return `<span class="${rateToneClass(value, median, lowerIsBetter)}">${escapeHtml(label)}${formatRate(value)}</span>`;
}

function rateToneClass(value, median, lowerIsBetter = false) {
  const number = Number(value || 0);
  const center = Number(median || 0);
  if (number === center) {
    return "rate-mid";
  }

  const isGood = lowerIsBetter ? number < center : number > center;
  return isGood ? "rate-good" : "rate-bad";
}

function getRateMedians(rows) {
  const keys = ["topRate", "rentaiRate", "avoidLastRate", "tobiRate", "tobashiRate", "winRate", "dealInRate", "riichiRate", "callRate"];
  return keys.reduce((medians, key) => {
    medians[key] = median(rows.map((row) => Number(row[key] || 0)));
    return medians;
  }, {});
}

function median(values) {
  const sorted = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (sorted.length === 0) {
    return 0;
  }

  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function chartColor(index) {
  return ["#0f7a5a", "#2f6fb3", "#b97800", "#b84a62", "#6c5ce7", "#008b8b"][index % 6];
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
