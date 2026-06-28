const STORAGE_KEY = "mahjong-ledger-state-v1";
const STARTING_SCORE = 25000;
const DEFAULT_UMA = [20, 10, -10, -20];

const elements = {
  importButton: document.querySelector("#importButton"),
  importFile: document.querySelector("#importFile"),
  csvButton: document.querySelector("#csvButton"),
  sourceLabel: document.querySelector("#sourceLabel"),
  sourceDetail: document.querySelector("#sourceDetail"),
  summaryGrid: document.querySelector("#summaryGrid"),
  standingsHeading: document.querySelector("#standingsHeading"),
  matchesHeading: document.querySelector("#matchesHeading"),
  standingsTable: document.querySelector("#standingsTable"),
  matchList: document.querySelector("#matchList"),
  scopeButtons: document.querySelectorAll("[data-scope]"),
};

let currentState = loadLocalState();
let currentSource = {
  label: "ローカル保存",
  detail: currentState.matches.length ? "この端末の保存済み半荘を表示しています" : "保存済み半荘はまだありません",
};
let currentScope = "overall";

render(currentState, currentSource);

elements.importButton.addEventListener("click", () => {
  elements.importFile.click();
});

elements.importFile.addEventListener("change", handleImportFile);
elements.csvButton.addEventListener("click", exportSheetCsv);
elements.scopeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentScope = button.dataset.scope || "overall";
    render(currentState, currentSource);
  });
});

window.addEventListener("storage", (event) => {
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

function loadLocalState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return normalizeState(raw ? JSON.parse(raw) : {});
  } catch {
    return normalizeState({});
  }
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

function normalizeState(data) {
  return {
    players: Array.isArray(data.players) ? data.players : [],
    matches: Array.isArray(data.matches) ? data.matches : [],
    createdAt: data.createdAt || "",
    settings: data.settings || {},
  };
}

function render(state, source) {
  const matches = getSortedMatches(state.matches);
  const latestDayMatches = getLatestMatchDayMatches(matches);
  const scopedMatches = currentScope === "today" ? latestDayMatches : matches;
  const rows = getAggregateRows(scopedMatches);
  const participantCount = rows.length || countCurrentPlayers(state.players);
  const latestMatch = scopedMatches[0] || matches[0] || null;
  const dayLabel = currentScope === "today" && latestMatch ? formatDateOnly(latestMatch.finishedAt) : "";

  elements.sourceLabel.textContent = source.label;
  elements.sourceDetail.textContent = source.detail;
  elements.standingsHeading.textContent = currentScope === "today" ? `当日順位${dayLabel ? ` ${dayLabel}` : ""}` : "総合順位";
  elements.matchesHeading.textContent = currentScope === "today" ? "当日半荘" : "半荘一覧";
  elements.scopeButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String((button.dataset.scope || "overall") === currentScope));
  });
  elements.summaryGrid.innerHTML = renderSummaryCards({
    matchCount: scopedMatches.length,
    participantCount,
    latestAt: latestMatch ? latestMatch.finishedAt : state.createdAt,
    topName: rows[0] ? rows[0].name : "",
    scopeLabel: currentScope === "today" ? "当日半荘" : "半荘数",
    latestLabel: currentScope === "today" ? "対象日" : "最終更新",
    latestValue: currentScope === "today" ? dayLabel : formatDate(latestMatch ? latestMatch.finishedAt : state.createdAt),
  });
  elements.standingsTable.innerHTML = rows.length ? renderStandings(rows) : renderEmpty(currentScope === "today" ? "当日の半荘がありません" : "保存済み半荘がありません");
  elements.matchList.innerHTML = scopedMatches.length ? renderMatches(scopedMatches) : renderEmpty("半荘保存後にここへ反映されます");
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
    <article class="summary-card gold">
      <span>暫定首位</span>
      <strong>${escapeHtml(summary.topName || "-")}</strong>
    </article>
    <article class="summary-card">
      <span>${escapeHtml(summary.latestLabel || "最終更新")}</span>
      <strong>${escapeHtml(summary.latestValue || formatDate(summary.latestAt) || "-")}</strong>
    </article>
  `;
}

function renderStandings(rows) {
  const header = `
    <div class="standing-row header" aria-hidden="true">
      <span>順位</span>
      <span>名前</span>
      <span>半荘</span>
      <span>合計スコア</span>
      <span>平均スコア</span>
      <span>平均順位</span>
      <span>トップ</span>
      <span>トビ</span>
      <span>トバし</span>
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
      const scoreClass = row.totalLeagueScore > 0 ? "plus" : row.totalLeagueScore < 0 ? "minus" : "";
      return `
        <article class="standing-row">
          <span class="rank">${index + 1}</span>
          <strong class="player-name">${escapeHtml(row.name)}</strong>
          <span>${row.games}</span>
          <span class="${scoreClass}">${formatSigned(row.totalLeagueScore)}</span>
          <span>${row.averageLeagueScore.toFixed(2)}</span>
          <span>${row.averageRank.toFixed(2)}</span>
          <span>${formatRate(row.topRate)}</span>
          <span>${formatRate(row.tobiRate)}</span>
          <span>${formatRate(row.tobashiRate)}</span>
          <span>${formatNumber(Math.round(row.averageScore))}</span>
          <span class="${scoreClass}">${formatSigned(row.totalScoreDiff)}</span>
          <span>${formatRate(row.winRate)}</span>
          <span>${formatRate(row.dealInRate)}</span>
          <span>${formatRate(row.riichiRate)}</span>
          <span>${formatRate(row.callRate)}</span>
        </article>
      `;
    })
    .join("");

  return header + body;
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
            const scoreClass = leagueScore > 0 ? "plus" : leagueScore < 0 ? "minus" : "";
            return `
              <span>
                <b>${player.rank}位 ${escapeHtml(player.name)}</b>
                <strong class="${scoreClass}">${formatSigned(leagueScore)}</strong>
                <small>${formatNumber(player.score)}点 / ウマ ${formatSigned(getPlayerUma(player, match))}</small>
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

function renderEmpty(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function buildSheetCsv(matches) {
  const rows = [];
  const aggregateRows = getAggregateRows(matches);

  rows.push(["総合成績"]);
  rows.push(["順位", "名前", "半荘", "合計スコア", "平均スコア", "平均順位", "トップ率", "トビ率", "トバし率", "平均点", "合計点差", "和了率", "放銃率", "リーチ率", "副露率"]);
  aggregateRows.forEach((row, index) => {
    rows.push([
      index + 1,
      row.name,
      row.games,
      row.totalLeagueScore,
      row.averageLeagueScore.toFixed(2),
      row.averageRank.toFixed(2),
      formatRate(row.topRate),
      formatRate(row.tobiRate),
      formatRate(row.tobashiRate),
      Math.round(row.averageScore),
      Math.round(row.totalScoreDiff),
      formatRate(row.winRate),
      formatRate(row.dealInRate),
      formatRate(row.riichiRate),
      formatRate(row.callRate),
    ]);
  });

  rows.push([]);
  rows.push(["半荘明細"]);
  rows.push(["半荘", "終了日時", "終了理由", "順位", "名前", "点数", "点数差", "素点丸め", "ウマ", "半荘スコア", "トビ", "トバし"]);
  matches.forEach((match) => {
    getPlayersWithRanks(match).forEach((player) => {
      rows.push([
        match.label || `半荘${match.number || ""}`,
        formatDate(match.finishedAt),
        match.endReason || "保存済み",
        player.rank,
        player.name,
        Number(player.score || 0),
        getScoreDiff(player),
        getPlayerRoundedScore(player),
        getPlayerUma(player, match),
        getPlayerLeagueScore(player, match),
        Array.isArray(match.bustedIds) && match.bustedIds.includes(player.id) ? 1 : "",
        Number((match.tobashiShares && match.tobashiShares[player.id]) || 0) || "",
      ]);
    });
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
        tobiCount: 0,
        tobashiCredit: 0,
        leagueScoreTotal: 0,
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
      row.tobiCount += Array.isArray(match.bustedIds) && match.bustedIds.includes(player.id) ? 1 : 0;
      row.tobashiCredit += Number((match.tobashiShares && match.tobashiShares[player.id]) || 0);
      row.leagueScoreTotal += getPlayerLeagueScore({ ...player, rank }, match);
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
      tobiRate: row.games ? (row.tobiCount / row.games) * 100 : 0,
      tobashiRate: row.games ? (row.tobashiCredit / row.games) * 100 : 0,
      totalLeagueScore: row.leagueScoreTotal,
      averageLeagueScore: row.games ? row.leagueScoreTotal / row.games : 0,
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
  if (Number.isFinite(Number(player.scoreDiff))) {
    return Number(player.scoreDiff);
  }

  return Number(player.score || 0) - STARTING_SCORE;
}

function getPlayerRoundedScore(player) {
  const roundedScore = Number(player.roundedScore);
  if (Number.isFinite(roundedScore)) {
    return roundedScore;
  }

  return roundHundredsFiveDownSixUp(getScoreDiff(player));
}

function getPlayerUma(player, match) {
  const storedUma = Number(player.uma);
  if (Number.isFinite(storedUma)) {
    return storedUma;
  }

  const rank = Number(player.rank || getRanksForPlayers(match.players || []).get(player.id) || 4);
  return getUmaForRank(rank, match.settings || currentState.settings || {});
}

function getPlayerLeagueScore(player, match) {
  const leagueScore = Number(player.leagueScore);
  if (Number.isFinite(leagueScore)) {
    return leagueScore;
  }

  return getPlayerRoundedScore(player) + getPlayerUma(player, match);
}

function getUmaForRank(rank, settings) {
  const key = `umaRank${rank}`;
  const value = Number(settings && settings[key]);
  if (Number.isFinite(value)) {
    return value;
  }

  return DEFAULT_UMA[rank - 1] || 0;
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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
