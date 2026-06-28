const STORAGE_KEY = "mahjong-ledger-state-v1";
const THEME_KEY = "mahjong-ledger-theme-v1";
const STARTING_SCORE = 25000;
const ROUNDS = ["東1局", "東2局", "東3局", "東4局", "南1局", "南2局", "南3局", "南4局"];
const HONBA_RON_POINTS = 300;
const HONBA_TSUMO_POINTS = 100;
const RIICHI_STICK_POINTS = 1000;
const SCORE_PRESETS = [2000, 2600, 3900, 5800, 8000, 12000];
const WIND_LABELS = ["東", "南", "西", "北"];
const DEFAULT_UMA = [20, 10, -10, -20];
const SETTINGS = [
  { key: "autoRoundRules", label: "局進行・本場", type: "checkbox" },
  { key: "autoHonbaPayments", label: "本場点補正", type: "checkbox" },
  { key: "autoDepositPayout", label: "供託払い出し", type: "checkbox" },
  { key: "autoRiichiDeposit", label: "流局リーチ供託", type: "checkbox" },
  { key: "autoDrawTenpaiPayments", label: "流局聴牌料", type: "checkbox" },
  { key: "autoRiichiDealIn", label: "立直放銃1000点", type: "checkbox" },
  { key: "autoEndSouth4", label: "南4局終了保存", type: "checkbox" },
  { key: "tobiEnabled", label: "トビ終了", type: "checkbox" },
  { key: "tobiThreshold", label: "トビ基準", type: "number" },
  {
    key: "drawTobashiMode",
    label: "流局トバし",
    type: "select",
    options: [
      { value: "kamicha", label: "上家取り" },
      { value: "split", label: "分け合い" },
    ],
  },
  { key: "umaRank1", label: "ウマ1位", type: "number", step: 1, normalize: "integer" },
  { key: "umaRank2", label: "ウマ2位", type: "number", step: 1, normalize: "integer" },
  { key: "umaRank3", label: "ウマ3位", type: "number", step: 1, normalize: "integer" },
  { key: "umaRank4", label: "ウマ4位", type: "number", step: 1, normalize: "integer" },
  { key: "safetyZeroWin", label: "和了0点防止", type: "checkbox" },
  { key: "safetyRonSinglePayer", label: "ロン支払い形確認", type: "checkbox" },
  { key: "safetyScoreBalance", label: "点数差確認", type: "checkbox" },
  { key: "safetyScoreDirection", label: "支払い向き確認", type: "checkbox" },
  { key: "safetyDrawNoTenpai", label: "流局聴牌確認", type: "checkbox" },
];

const elements = {
  playersGrid: document.querySelector("#playersGrid"),
  actionGrid: document.querySelector("#actionGrid"),
  deltaGrid: document.querySelector("#deltaGrid"),
  historyList: document.querySelector("#historyList"),
  roundLabel: document.querySelector("#roundLabel"),
  roundSubLabel: document.querySelector("#roundSubLabel"),
  honbaValue: document.querySelector("#honbaValue"),
  stickValue: document.querySelector("#stickValue"),
  handCount: document.querySelector("#handCount"),
  winnerSelect: document.querySelector("#winnerSelect"),
  loserSelect: document.querySelector("#loserSelect"),
  memoInput: document.querySelector("#memoInput"),
  advanceRound: document.querySelector("#advanceRound"),
  saveHandButton: document.querySelector("#saveHandButton"),
  undoButton: document.querySelector("#undoButton"),
  resetButton: document.querySelector("#resetButton"),
  finishMatchButton: document.querySelector("#finishMatchButton"),
  csvButton: document.querySelector("#csvButton"),
  exportButton: document.querySelector("#exportButton"),
  importButton: document.querySelector("#importButton"),
  importFile: document.querySelector("#importFile"),
  themeToggle: document.querySelector("#themeToggle"),
  summaryStats: document.querySelector("#summaryStats"),
  matchList: document.querySelector("#matchList"),
  settingsGrid: document.querySelector("#settingsGrid"),
  archiveScopeButtons: document.querySelectorAll("[data-archive-scope]"),
};

let state = loadState();
let draft = createDraft(state);
let scoreInputMode = "adjust";
let archiveScope = "overall";

applyTheme(localStorage.getItem(THEME_KEY) || "light");
render();
bindEvents();
registerServiceWorker();

function createInitialState() {
  return {
    roundIndex: 0,
    honba: 0,
    riichiSticks: 0,
    createdAt: new Date().toISOString(),
    players: ["東家", "南家", "西家", "北家"].map((name, index) => ({
      id: makeId(`player-${index}`),
      seat: index,
      name,
      score: STARTING_SCORE,
      hands: 0,
      calls: 0,
      riichi: 0,
      wins: 0,
      dealIns: 0,
    })),
    history: [],
    matches: [],
    settings: createDefaultSettings(),
  };
}

function createDefaultSettings() {
  return {
    autoRoundRules: true,
    autoHonbaPayments: true,
    autoDepositPayout: true,
    autoRiichiDeposit: true,
    autoDrawTenpaiPayments: true,
    autoRiichiDealIn: true,
    autoEndSouth4: true,
    tobiEnabled: true,
    tobiThreshold: 0,
    drawTobashiMode: "kamicha",
    umaRank1: DEFAULT_UMA[0],
    umaRank2: DEFAULT_UMA[1],
    umaRank3: DEFAULT_UMA[2],
    umaRank4: DEFAULT_UMA[3],
    safetyZeroWin: true,
    safetyRonSinglePayer: true,
    safetyScoreBalance: true,
    safetyScoreDirection: true,
    safetyDrawNoTenpai: true,
  };
}

function createDraft(sourceState) {
  const first = sourceState.players[0] ? sourceState.players[0].id : "";
  const second = sourceState.players[1] ? sourceState.players[1].id : first;

  return {
    result: "ron",
    winnerId: first,
    loserId: second,
    actions: createActionMap(sourceState.players),
    deltas: createDeltaMap(sourceState.players),
    memo: "",
    advanceRound: true,
  };
}

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return createInitialState();
    }

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed.players) || parsed.players.length !== 4) {
      return createInitialState();
    }

    return normalizeStatePayload(parsed);
  } catch {
    return createInitialState();
  }
}

function normalizeStatePayload(parsed) {
  if (!Array.isArray(parsed.players) || parsed.players.length !== 4) {
    return createInitialState();
  }

  return {
    ...createInitialState(),
    ...parsed,
    players: parsed.players.map((player, index) => ({
      seat: index,
      calls: 0,
      riichi: 0,
      wins: 0,
      dealIns: 0,
      hands: 0,
      ...player,
    })),
    history: Array.isArray(parsed.history) ? parsed.history : [],
    matches: Array.isArray(parsed.matches) ? parsed.matches : [],
    settings: {
      ...createDefaultSettings(),
      ...(parsed.settings || {}),
    },
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function bindEvents() {
  document.addEventListener("click", handleClick);
  document.addEventListener("change", handleChange);
  document.addEventListener("input", handleInput);
  elements.saveHandButton.addEventListener("click", saveHand);
  elements.undoButton.addEventListener("click", undoLastHand);
  elements.resetButton.addEventListener("click", resetMatch);
  elements.finishMatchButton.addEventListener("click", finishMatchManually);
  elements.csvButton.addEventListener("click", exportSheetCsv);
  elements.exportButton.addEventListener("click", exportMatch);
  elements.importButton.addEventListener("click", () => elements.importFile.click());
  elements.importFile.addEventListener("change", importStateFile);
  elements.themeToggle.addEventListener("click", toggleTheme);
  elements.archiveScopeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      archiveScope = button.dataset.archiveScope || "overall";
      render();
    });
  });
}

function handleClick(event) {
  const target = event.target.closest("[data-action]");
  if (!target) {
    return;
  }

  const action = target.dataset.action;
  const value = Number(target.dataset.value || 0);
  const playerId = target.dataset.playerId;

  if (action === "round-step") {
    state.roundIndex = clamp(state.roundIndex + value, 0, ROUNDS.length - 1);
    saveState();
    render();
  }

  if (action === "honba-step") {
    state.honba = Math.max(0, state.honba + value);
    saveState();
    render();
  }

  if (action === "stick-step") {
    state.riichiSticks = Math.max(0, state.riichiSticks + value);
    saveState();
    render();
  }

  if (action === "set-result") {
    draft.result = target.dataset.result;
    syncWinningPlayersFromDeltas();
    render();
  }

  if (action === "set-score-mode") {
    scoreInputMode = target.dataset.scoreMode || "adjust";
    render();
  }

  if (action === "toggle-call" || action === "toggle-riichi" || action === "toggle-tenpai") {
    const key = action === "toggle-call" ? "call" : action === "toggle-riichi" ? "riichi" : "tenpai";
    draft.actions[playerId][key] = !draft.actions[playerId][key];
    if (key === "riichi" && draft.actions[playerId].riichi) {
      draft.actions[playerId].tenpai = true;
    }
    render();
  }

  if (action === "delta-step") {
    draft.deltas[playerId] = normalizeScore((draft.deltas[playerId] || 0) + value);
    syncWinningPlayersFromDeltas();
    render();
  }
}

function handleChange(event) {
  const target = event.target;

  if (target.matches("[data-player-name]")) {
    const player = state.players.find((item) => item.id === target.dataset.playerName);
    if (player) {
      player.name = target.value.trim() || defaultPlayerName(player.seat);
      saveState();
      render();
    }
  }

  if (target === elements.winnerSelect) {
    draft.winnerId = target.value;
  }

  if (target === elements.loserSelect) {
    draft.loserId = target.value;
  }

  if (target.matches("[data-delta-input]")) {
    draft.deltas[target.dataset.deltaInput] = normalizeScore(Number(target.value || 0));
    syncWinningPlayersFromDeltas();
    render();
  }

  if (target === elements.advanceRound) {
    draft.advanceRound = target.checked;
  }

  if (target.matches("[data-setting]")) {
    const key = target.dataset.setting;
    const setting = SETTINGS.find((item) => item.key === key);
    if (target.type === "checkbox") {
      state.settings[key] = target.checked;
    } else if (target.tagName === "SELECT") {
      state.settings[key] = target.value;
    } else {
      state.settings[key] = normalizeSettingValue(setting, target.value);
    }
    saveState();
    render();
  }
}

function handleInput(event) {
  if (event.target === elements.memoInput) {
    draft.memo = event.target.value;
  }
}

function render() {
  elements.roundLabel.textContent = ROUNDS[state.roundIndex] || ROUNDS[0];
  elements.roundSubLabel.textContent = `${state.honba}本場 / 供託${state.riichiSticks}`;
  elements.honbaValue.textContent = state.honba;
  elements.stickValue.textContent = state.riichiSticks;
  elements.handCount.textContent = `${state.players[0] ? state.players[0].hands : 0}局`;
  elements.advanceRound.checked = draft.advanceRound;
  elements.memoInput.value = draft.memo;
  elements.undoButton.disabled = state.history.length === 0;

  renderPlayers();
  renderSelectors();
  renderModeTabs();
  renderScoreTabs();
  renderActions();
  renderDeltas();
  renderHistory();
  renderSummary();
  renderSettings();
}

function renderPlayers() {
  const ranks = getRanks();

  elements.playersGrid.innerHTML = state.players
    .map((player) => {
      const diff = player.score - STARTING_SCORE;
      const diffClass = diff > 0 ? "plus" : diff < 0 ? "minus" : "";
      const wind = getPlayerWindMeta(player);

      return `
        <article class="player-card">
          <div class="rank-badge">${ranks.get(player.id)}位</div>
          <div class="player-body">
            <div class="player-header">
              <span class="wind-chip ${wind.isDealer ? "dealer" : ""}">
                ${wind.label}${wind.isDealer ? "<small>親</small>" : ""}
              </span>
              <input
                class="player-name"
                data-player-name="${player.id}"
                value="${escapeHtml(player.name)}"
                aria-label="${escapeHtml(player.name)}の名前"
              />
            </div>
            <div class="score-line">
              <strong>${formatNumber(player.score)}</strong>
              <span class="${diffClass}">${formatSigned(diff)}</span>
            </div>
            <div class="stat-grid">
              ${statTemplate("副露率", player.calls, player.hands)}
              ${statTemplate("立直率", player.riichi, player.hands)}
              ${statTemplate("和了率", player.wins, player.hands)}
              ${statTemplate("放銃率", player.dealIns, player.hands)}
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderSelectors() {
  const playerOptions = state.players
    .map((player) => `<option value="${player.id}">${escapeHtml(getPlayerOptionLabel(player))}</option>`)
    .join("");
  const emptyOption = `<option value="">なし</option>`;
  const isDraw = draft.result === "draw";
  const hasLoser = draft.result === "ron";

  elements.winnerSelect.innerHTML = isDraw ? `${emptyOption}${playerOptions}` : playerOptions;
  elements.loserSelect.innerHTML = hasLoser ? playerOptions : `${emptyOption}${playerOptions}`;
  elements.winnerSelect.value = isDraw ? "" : draft.winnerId;
  elements.loserSelect.value = hasLoser ? draft.loserId : "";

  elements.winnerSelect.disabled = isDraw;
  elements.loserSelect.disabled = !hasLoser;
}

function renderModeTabs() {
  document.querySelectorAll("[data-action='set-result']").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.result === draft.result));
  });
}

function renderScoreTabs() {
  document.querySelectorAll("[data-action='set-score-mode']").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.scoreMode === scoreInputMode));
  });
}

function renderActions() {
  elements.actionGrid.innerHTML = state.players
    .map((player) => {
      const action = draft.actions[player.id] || { call: false, riichi: false };
      const wind = getPlayerWindMeta(player);

      return `
        <div class="action-row">
          <span class="action-name">
            <span class="mini-wind ${wind.isDealer ? "dealer" : ""}">${wind.shortLabel}</span>
            ${escapeHtml(player.name)}
          </span>
          <button
            class="toggle-button"
            type="button"
            data-action="toggle-call"
            data-player-id="${player.id}"
            aria-pressed="${action.call}"
          >副露</button>
          <button
            class="toggle-button"
            type="button"
            data-action="toggle-riichi"
            data-player-id="${player.id}"
            aria-pressed="${action.riichi}"
          >立直</button>
          <button
            class="toggle-button"
            type="button"
            data-action="toggle-tenpai"
            data-player-id="${player.id}"
            aria-pressed="${action.tenpai || action.riichi}"
          >聴牌</button>
        </div>
      `;
    })
    .join("");
}

function renderDeltas() {
  elements.deltaGrid.innerHTML = state.players
    .map((player) => {
      const value = draft.deltas[player.id] || 0;
      const wind = getPlayerWindMeta(player);

      return `
        <div class="delta-row">
          <span class="delta-name">
            <span class="mini-wind ${wind.isDealer ? "dealer" : ""}">${wind.shortLabel}</span>
            ${escapeHtml(player.name)}
          </span>
          <input
            class="delta-input"
            type="number"
            inputmode="numeric"
            step="100"
            data-delta-input="${player.id}"
            value="${value}"
            aria-label="${escapeHtml(player.name)}の点数差"
          />
          ${renderDeltaButtons(player.id)}
        </div>
      `;
    })
    .join("");
}

function renderDeltaButtons(playerId) {
  const values = scoreInputMode === "preset" ? SCORE_PRESETS : [1000, 500, 100];
  const negativeButtons = values.map((value) => deltaButtonTemplate(playerId, -value)).join("");
  const positiveButtons = values.map((value) => deltaButtonTemplate(playerId, value)).join("");

  return `<div class="delta-buttons ${scoreInputMode}">${negativeButtons}${positiveButtons}</div>`;
}

function deltaButtonTemplate(playerId, value) {
  const tone = value < 0 ? "negative" : "positive";
  const label = `${value < 0 ? "−" : "＋"}${formatNumber(Math.abs(value))}`;
  return `
    <button
      class="delta-button ${tone}"
      type="button"
      data-action="delta-step"
      data-player-id="${playerId}"
      data-value="${value}"
    >${label}</button>
  `;
}

function renderHistory() {
  if (state.history.length === 0) {
    elements.historyList.innerHTML = `<div class="history-empty">まだ履歴がありません</div>`;
    return;
  }

  elements.historyList.innerHTML = state.history
    .slice(0, 10)
    .map((hand) => {
      const resultText = hand.result === "draw" ? "流局" : hand.result === "tsumo" ? "ツモ" : "ロン";
      const winner = getPlayerNameFromSnapshot(hand.playersAfter, hand.winnerId);
      const loser = getPlayerNameFromSnapshot(hand.playersAfter, hand.loserId);
      const headline =
        hand.result === "draw"
          ? `${hand.roundLabel} ${resultText}`
          : hand.result === "tsumo"
            ? `${hand.roundLabel} ${winner} ${resultText}`
            : `${hand.roundLabel} ${winner} ${resultText} / ${loser} 放銃`;
      const actionNames = formatActions(hand);
      const memo = hand.memo ? ` / ${escapeHtml(hand.memo)}` : "";
      const autoNotes = Array.isArray(hand.autoNotes) && hand.autoNotes.length
        ? ` / 自動: ${escapeHtml(hand.autoNotes.join(" / "))}`
        : "";
      const deltas = hand.playersAfter
        .map((player) => {
          const before = hand.playersBefore.find((item) => item.id === player.id);
          const diff = player.score - (before ? before.score : player.score);
          return `<span>${escapeHtml(player.name)} ${formatSigned(diff)}</span>`;
        })
        .join("");

      return `
        <article class="history-item">
          <strong>${escapeHtml(headline)}</strong>
          <small>${actionNames}${memo}${autoNotes}</small>
          <div class="history-deltas">${deltas}</div>
        </article>
      `;
    })
    .join("");
}

function renderSummary() {
  const matches = getSortedMatches(state.matches || []);
  const scopedMatches = archiveScope === "today" ? getLatestMatchDayMatches(matches) : matches;
  elements.archiveScopeButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String((button.dataset.archiveScope || "overall") === archiveScope));
  });

  if (matches.length === 0) {
    elements.summaryStats.innerHTML = `<div class="history-empty">保存済み半荘はまだありません</div>`;
    elements.matchList.innerHTML = "";
    return;
  }

  const rows = getAggregateRows(scopedMatches);
  const latestMatch = scopedMatches[0] || matches[0] || null;
  const dayLabel = archiveScope === "today" && latestMatch ? formatDateOnly(latestMatch.finishedAt) : "";
  elements.summaryStats.innerHTML = `
    <div class="summary-cards">
      <div class="summary-card"><span>${archiveScope === "today" ? "当日半荘" : "半荘数"}</span><strong>${scopedMatches.length}</strong></div>
      <div class="summary-card"><span>${archiveScope === "today" ? "対象日" : "最新"}</span><strong>${escapeHtml(archiveScope === "today" ? dayLabel : (latestMatch.endReason || "保存"))}</strong></div>
    </div>
    <div class="summary-table">
      ${rows
        .map(
          (row) => `
            <div class="summary-row">
              <strong>${escapeHtml(row.name)}</strong>
              <span>${row.games}半荘</span>
              <span>平均${row.averageRank.toFixed(2)}位</span>
              <span>トップ${row.topRate.toFixed(1)}%</span>
              <span>トビ${row.tobiRate.toFixed(1)}%</span>
              <span>トバし${row.tobashiRate.toFixed(1)}%</span>
              <span>スコア${formatSigned(row.totalLeagueScore)}</span>
              <span>${formatNumber(Math.round(row.averageScore))}点</span>
            </div>
          `
        )
        .join("")}
    </div>
  `;

  elements.matchList.innerHTML = scopedMatches
    .slice(0, 6)
    .map((match) => {
      const players = getPlayersWithRanks(match);
      const top = players[0] || null;
      const finishedAt = formatDateTime(match.finishedAt);
      const tobashi = formatTobashiPlayers(match);
      const scores = players
        .map((player) => `${player.rank}位 ${player.name} ${formatSigned(getPlayerLeagueScore(player, match))}`)
        .join(" / ");
      return `
        <article class="match-item">
          <strong>${escapeHtml(match.label || `半荘${match.number || ""}`)}</strong>
          <span>${escapeHtml(match.endReason || "保存")} / ${finishedAt}</span>
          ${tobashi ? `<span>トバし: ${escapeHtml(tobashi)}</span>` : ""}
          <small>トップ: ${escapeHtml(top ? top.name : "")} ${top ? formatNumber(top.score) : ""}</small>
          <small>スコア: ${escapeHtml(scores)}</small>
        </article>
      `;
    })
    .join("");
}

function renderSettings() {
  elements.settingsGrid.innerHTML = SETTINGS.map((setting) => {
    const value = state.settings[setting.key];
    if (setting.type === "number") {
      const step = setting.step || 100;
      return `
        <label class="setting-item">
          <span>${setting.label}</span>
          <input type="number" step="${step}" data-setting="${setting.key}" value="${Number(value || 0)}" />
        </label>
      `;
    }

    if (setting.type === "select") {
      return `
        <label class="setting-item">
          <span>${setting.label}</span>
          <select data-setting="${setting.key}">
            ${setting.options
              .map((option) => `<option value="${option.value}" ${value === option.value ? "selected" : ""}>${option.label}</option>`)
              .join("")}
          </select>
        </label>
      `;
    }

    return `
      <label class="setting-item checkbox-setting">
        <input type="checkbox" data-setting="${setting.key}" ${value ? "checked" : ""} />
        <span>${setting.label}</span>
      </label>
    `;
  }).join("");
}

function saveHand() {
  syncDraftFromControls();

  if (!validateDraft()) {
    return;
  }

  const auto = calculateAutoAdjustments();
  const finalDeltas = mergeDeltas(draft.deltas, auto.scoreDeltas);
  const scoreTotal = sumDeltas(finalDeltas);
  const stickShift = (auto.riichiSticks - state.riichiSticks) * RIICHI_STICK_POINTS;
  const tableTotalShift = scoreTotal + stickShift;
  if (getSetting("safetyScoreBalance") && tableTotalShift !== 0 && !window.confirm(`点数差の合計が ${formatSigned(tableTotalShift)} です。このまま確定しますか？`)) {
    return;
  }

  const playersBefore = deepClone(state.players);
  const roundBefore = {
    roundIndex: state.roundIndex,
    honba: state.honba,
    riichiSticks: state.riichiSticks,
  };

  state.players = state.players.map((player) => {
    const action = draft.actions[player.id] || {};
    return {
      ...player,
      score: player.score + (finalDeltas[player.id] || 0),
      hands: player.hands + 1,
      calls: player.calls + (action.call ? 1 : 0),
      riichi: player.riichi + (action.riichi ? 1 : 0),
      wins: player.wins + (draft.result !== "draw" && draft.winnerId === player.id ? 1 : 0),
      dealIns: player.dealIns + (draft.result === "ron" && draft.loserId === player.id ? 1 : 0),
    };
  });

  const hand = {
    id: makeId("hand"),
    at: new Date().toISOString(),
    roundLabel: ROUNDS[state.roundIndex],
    honba: state.honba,
    riichiSticks: state.riichiSticks,
    result: draft.result,
    winnerId: draft.result === "draw" ? "" : draft.winnerId,
    loserId: draft.result === "ron" ? draft.loserId : "",
    actions: deepClone(draft.actions),
    memo: draft.memo.trim(),
    manualDeltas: deepClone(draft.deltas),
    finalDeltas: deepClone(finalDeltas),
    autoNotes: auto.notes,
    playersBefore,
    playersAfter: deepClone(state.players),
    roundBefore,
  };

  state.honba = auto.honba;
  state.riichiSticks = auto.riichiSticks;
  if (draft.advanceRound) {
    state.roundIndex = auto.roundIndex;
  }

  hand.roundAfter = {
    roundIndex: state.roundIndex,
    honba: state.honba,
    riichiSticks: state.riichiSticks,
  };

  state.history.unshift(hand);
  const endInfo = getMatchEndInfo(hand);
  if (endInfo.reason) {
    archiveCurrentMatch(endInfo);
    state = createNextMatchState(state);
  }

  draft = createDraft(state);
  saveState();
  render();
}

function syncDraftFromControls() {
  document.querySelectorAll("[data-delta-input]").forEach((input) => {
    draft.deltas[input.dataset.deltaInput] = normalizeScore(Number(input.value || 0));
  });
  syncWinningPlayersFromDeltas();
  draft.memo = elements.memoInput.value;
  draft.advanceRound = elements.advanceRound.checked;
}

function calculateAutoAdjustments() {
  const scoreDeltas = createDeltaMap(state.players);
  const notes = [];
  const dealerId = getDealerId();
  const winnerId = draft.result === "draw" ? "" : draft.winnerId;
  const loserId = draft.result === "ron" ? draft.loserId : "";
  const winnerIsDealer = winnerId && winnerId === dealerId;
  let nextRoundIndex = state.roundIndex;
  let nextHonba = state.honba;
  let nextRiichiSticks = state.riichiSticks;

  if (draft.result === "ron" || draft.result === "tsumo") {
    if (getSetting("autoHonbaPayments") && state.honba > 0) {
      if (draft.result === "ron") {
        const honbaPoints = state.honba * HONBA_RON_POINTS;
        scoreDeltas[winnerId] += honbaPoints;
        scoreDeltas[loserId] -= honbaPoints;
        notes.push(`${state.honba}本場: ロン +${formatNumber(honbaPoints)}`);
      } else {
        const payment = state.honba * HONBA_TSUMO_POINTS;
        state.players.forEach((player) => {
          if (player.id === winnerId) {
            scoreDeltas[player.id] += payment * (state.players.length - 1);
          } else {
            scoreDeltas[player.id] -= payment;
          }
        });
        notes.push(`${state.honba}本場: ツモ 各${formatNumber(payment)}`);
      }
    }

    if (getSetting("autoDepositPayout") && nextRiichiSticks > 0) {
      const stickPoints = nextRiichiSticks * RIICHI_STICK_POINTS;
      scoreDeltas[winnerId] += stickPoints;
      notes.push(`供託: +${formatNumber(stickPoints)}`);
      nextRiichiSticks = 0;
    }

    if (getSetting("autoRiichiDealIn") && draft.result === "ron" && loserId && isPlayerRiichi(loserId)) {
      scoreDeltas[loserId] -= RIICHI_STICK_POINTS;
      scoreDeltas[winnerId] += RIICHI_STICK_POINTS;
      notes.push(`立直放銃: ${formatNumber(RIICHI_STICK_POINTS)}`);
    }

    if (!getSetting("autoRoundRules")) {
      nextRoundIndex = advanceRoundIndex(state.roundIndex);
    } else if (winnerIsDealer) {
      nextHonba = state.honba + 1;
      nextRoundIndex = state.roundIndex;
      notes.push("親の連荘: +1本場");
    } else {
      nextHonba = 0;
      nextRoundIndex = advanceRoundIndex(state.roundIndex);
    }
  }

  if (draft.result === "draw") {
    const riichiTenpaiPlayers = state.players.filter((player) => isPlayerRiichi(player.id) && isPlayerTenpai(player.id));
    const tenpaiPlayers = state.players.filter((player) => isPlayerTenpai(player.id));
    const notenPlayers = state.players.filter((player) => !isPlayerTenpai(player.id));

    if (getSetting("autoRiichiDeposit") && riichiTenpaiPlayers.length > 0) {
      riichiTenpaiPlayers.forEach((player) => {
        scoreDeltas[player.id] -= RIICHI_STICK_POINTS;
      });
      nextRiichiSticks += riichiTenpaiPlayers.length;
      notes.push(`立直流局: 供託+${riichiTenpaiPlayers.length}`);
    }

    if (
      getSetting("autoDrawTenpaiPayments") &&
      sumAbsDeltas(draft.deltas) === 0 &&
      tenpaiPlayers.length > 0 &&
      notenPlayers.length > 0
    ) {
      const tenpaiGain = 3000 / tenpaiPlayers.length;
      const notenLoss = 3000 / notenPlayers.length;
      tenpaiPlayers.forEach((player) => {
        scoreDeltas[player.id] += tenpaiGain;
      });
      notenPlayers.forEach((player) => {
        scoreDeltas[player.id] -= notenLoss;
      });
      notes.push(`流局聴牌料: 聴牌 +${formatNumber(tenpaiGain)} / ノーテン -${formatNumber(notenLoss)}`);
    }

    if (!getSetting("autoRoundRules")) {
      nextRoundIndex = advanceRoundIndex(state.roundIndex);
    } else if (isPlayerTenpai(dealerId)) {
      nextHonba = state.honba + 1;
      nextRoundIndex = state.roundIndex;
      notes.push("親聴牌流局: +1本場");
    } else {
      nextHonba = state.honba + 1;
      nextRoundIndex = advanceRoundIndex(state.roundIndex);
      notes.push("流局: +1本場");
    }
  }

  return {
    scoreDeltas,
    roundIndex: nextRoundIndex,
    honba: nextHonba,
    riichiSticks: nextRiichiSticks,
    notes,
  };
}

function validateDraft() {
  if (draft.result === "ron" && draft.winnerId === draft.loserId) {
    window.alert("ロンの和了者と放銃者が同じです。");
    return false;
  }

  if (draft.result !== "draw" && !draft.winnerId) {
    window.alert("和了者を選んでください。");
    return false;
  }

  if (isWinningResult() && getSetting("safetyZeroWin") && sumAbsDeltas(draft.deltas) === 0) {
    window.alert("ロン/ツモが選ばれていますが、点数差がすべて0です。点数を入力してください。");
    return false;
  }

  if (draft.result === "ron" && getSetting("safetyRonSinglePayer") && !validateRonSinglePayer()) {
    return false;
  }

  if (isWinningResult() && getSetting("safetyScoreDirection") && !confirmScoreDirection()) {
    return false;
  }

  if (draft.result === "draw" && getSetting("safetyDrawNoTenpai") && !hasAnyTenpai()) {
    return window.confirm("流局ですが聴牌者が選ばれていません。このまま確定しますか？");
  }

  return true;
}

function syncWinningPlayersFromDeltas() {
  if (draft.result === "ron") {
    const shape = getRonDeltaShape();
    if (shape.isPair) {
      draft.winnerId = shape.winnerId;
      draft.loserId = shape.loserId;
    }
    return;
  }

  if (draft.result === "tsumo") {
    const shape = getTsumoDeltaShape();
    if (shape.isTsumo) {
      draft.winnerId = shape.winnerId;
    }
  }
}

function validateRonSinglePayer() {
  const shape = getRonDeltaShape();
  if (shape.isPair) {
    draft.winnerId = shape.winnerId;
    draft.loserId = shape.loserId;
    return true;
  }

  window.alert("ロンは和了者1人がプラス、放銃者1人だけがマイナス、他家0点の形にしてください。複数人が支払う場合はツモを選んでください。");
  return false;
}

function undoLastHand() {
  const last = state.history[0];
  if (!last) {
    return;
  }

  state.players = deepClone(last.playersBefore);
  state.roundIndex = last.roundBefore.roundIndex;
  state.honba = last.roundBefore.honba;
  state.riichiSticks = last.roundBefore.riichiSticks;
  state.history = state.history.slice(1);
  draft = createDraft(state);
  saveState();
  render();
}

function resetMatch() {
  if (!window.confirm("現在の未保存の局履歴を消して新規半荘を開始しますか？")) {
    return;
  }

  state = createNextMatchState(state);
  draft = createDraft(state);
  saveState();
  render();
}

function finishMatchManually() {
  if (state.history.length === 0) {
    window.alert("保存する局履歴がありません。");
    return;
  }

  if (!window.confirm("この半荘を保存して次の半荘を開始しますか？")) {
    return;
  }

  archiveCurrentMatch({ reason: "手動保存", bustedIds: [], tobashiIds: [], tobashiShares: {} });
  state = createNextMatchState(state);
  draft = createDraft(state);
  saveState();
  render();
}

function archiveCurrentMatch(endInfo) {
  const info = typeof endInfo === "string"
    ? { reason: endInfo, bustedIds: [], tobashiIds: [], tobashiShares: {} }
    : endInfo;
  const matches = Array.isArray(state.matches) ? state.matches : [];
  const number = matches.length + 1;
  const players = deepClone(state.players);
  const ranks = getRanksForPlayers(players);
  const match = {
    id: makeId("match"),
    number,
    label: `半荘${number}`,
    startedAt: state.createdAt,
    finishedAt: new Date().toISOString(),
    endReason: info.reason,
    bustedIds: info.bustedIds || [],
    tobashiIds: info.tobashiIds || [],
    tobashiShares: info.tobashiShares || {},
    players: players.map((player) => {
      const rank = ranks.get(player.id);
      const scoreDiff = player.score - STARTING_SCORE;
      const roundedScore = roundHundredsFiveDownSixUp(scoreDiff);
      const uma = getUmaForRank(rank, state.settings);
      return {
        ...player,
        rank,
        scoreDiff,
        roundedScore,
        uma,
        leagueScore: roundedScore + uma,
      };
    }),
    history: deepClone(state.history),
    settings: deepClone(state.settings),
  };

  state.matches = [match, ...matches];
}

function createNextMatchState(previousState) {
  const next = createInitialState();
  next.players = next.players.map((player, index) => ({
    ...player,
    name: previousState.players[index] ? previousState.players[index].name : player.name,
  }));
  next.matches = Array.isArray(previousState.matches) ? previousState.matches : [];
  next.settings = {
    ...createDefaultSettings(),
    ...(previousState.settings || {}),
  };

  return next;
}

function getMatchEndInfo(hand) {
  const empty = { reason: "", bustedIds: [], tobashiIds: [], tobashiShares: {} };

  if (getSetting("tobiEnabled")) {
    const threshold = Number(state.settings.tobiThreshold || 0);
    const bustedPlayers = state.players.filter((player) => player.score < threshold);
    if (bustedPlayers.length > 0) {
      const tobashiShares = determineTobashiShares(hand, bustedPlayers);
      const tobashiIds = Object.keys(tobashiShares);
      const bustedNames = bustedPlayers.map((player) => player.name).join("、");
      return {
        reason: `${bustedNames} トビ`,
        bustedIds: bustedPlayers.map((player) => player.id),
        tobashiIds,
        tobashiShares,
      };
    }
  }

  if (getSetting("autoEndSouth4") && hand.roundBefore.roundIndex === ROUNDS.length - 1) {
    const dealerId = getDealerIdFromRound(hand.roundBefore.roundIndex);
    const dealerContinues =
      (hand.result !== "draw" && hand.winnerId === dealerId) ||
      (hand.result === "draw" && isTenpaiInActions(hand.actions, dealerId));

    if (!dealerContinues) {
      return { ...empty, reason: "南4局終了" };
    }
  }

  return empty;
}

function determineTobashiShares(hand, bustedPlayers) {
  const shares = {};

  if (hand.result === "ron" || hand.result === "tsumo") {
    if (hand.winnerId) {
      shares[hand.winnerId] = 1;
    }
    return shares;
  }

  if (hand.result !== "draw") {
    return shares;
  }

  const positivePlayers = state.players.filter((player) => Number(hand.finalDeltas[player.id] || 0) > 0);
  if (positivePlayers.length === 0) {
    return shares;
  }

  if (positivePlayers.length === 1 || state.settings.drawTobashiMode === "split") {
    const share = 1 / positivePlayers.length;
    positivePlayers.forEach((player) => addShare(shares, player.id, share));
    return shares;
  }

  const bustedShare = 1 / bustedPlayers.length;
  bustedPlayers.forEach((busted) => {
    const taker = findKamichaTobashiPlayer(busted, positivePlayers);
    if (taker) {
      addShare(shares, taker.id, bustedShare);
    }
  });

  return shares;
}

function addShare(shares, playerId, value) {
  shares[playerId] = Number((Number(shares[playerId] || 0) + value).toFixed(4));
}

function findKamichaTobashiPlayer(bustedPlayer, positivePlayers) {
  const positiveBySeat = new Map(positivePlayers.map((player) => [player.seat, player]));
  for (let offset = 1; offset < state.players.length; offset += 1) {
    const seat = (bustedPlayer.seat - offset + state.players.length) % state.players.length;
    if (positiveBySeat.has(seat)) {
      return positiveBySeat.get(seat);
    }
  }

  return positivePlayers[0] || null;
}

function exportMatch() {
  const stamp = new Date().toISOString().slice(0, 10);
  const payload = JSON.stringify(state, null, 2);
  downloadTextFile(payload, `mahjong-ledger-${stamp}.json`, "application/json");
}

function exportSheetCsv() {
  const matches = Array.isArray(state.matches) ? state.matches : [];
  if (matches.length === 0) {
    window.alert("CSVにする保存済み半荘がありません。半荘保存後に書き出してください。");
    return;
  }

  const stamp = new Date().toISOString().slice(0, 10);
  downloadTextFile(buildSheetCsv(matches), `mahjong-ledger-sheet-${stamp}.csv`, "text/csv");
}

function importStateFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const importedState = normalizeStatePayload(JSON.parse(String(reader.result || "{}")));
      const matchCount = Array.isArray(importedState.matches) ? importedState.matches.length : 0;
      if (!window.confirm(`この端末の保存データを、読み込んだJSONで置き換えます。保存済み半荘 ${matchCount} 件を読み込みますか？`)) {
        return;
      }

      state = importedState;
      draft = createDraft(state);
      saveState();
      render();
      window.alert("JSONを読み込みました。");
    } catch {
      window.alert("JSONを読み込めませんでした。Mahjong Ledgerの書き出しファイルを選んでください。");
    } finally {
      elements.importFile.value = "";
    }
  });
  reader.readAsText(file);
}

function buildSheetCsv(matches) {
  const rows = [];
  const sortedMatches = getSortedMatches(matches);
  const aggregateRows = getAggregateRows(sortedMatches);

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
      formatRateValue(row.topRate),
      formatRateValue(row.tobiRate),
      formatRateValue(row.tobashiRate),
      Math.round(row.averageScore),
      Math.round(row.totalScoreDiff),
      formatRateValue(row.winRate),
      formatRateValue(row.dealInRate),
      formatRateValue(row.riichiRate),
      formatRateValue(row.callRate),
    ]);
  });

  rows.push([]);
  rows.push(["半荘明細"]);
  rows.push(["半荘", "終了日時", "終了理由", "順位", "名前", "点数", "点数差", "素点丸め", "ウマ", "半荘スコア", "トビ", "トバし"]);
  sortedMatches.forEach((match) => {
    getPlayersWithRanks(match)
      .forEach((player) => {
        rows.push([
          match.label || `半荘${match.number || ""}`,
          formatCsvDateTime(match.finishedAt),
          match.endReason || "保存",
          player.rank,
          player.name,
          Number(player.score || 0),
          getPlayerScoreDiff(player),
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

function downloadTextFile(payload, filename, type) {
  const blob = new Blob([payload], { type: `${type}; charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function toggleTheme() {
  const current = document.body.dataset.theme === "dark" ? "dark" : "light";
  applyTheme(current === "dark" ? "light" : "dark");
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
}

function getRanks() {
  const sorted = [...state.players].sort((a, b) => b.score - a.score || a.seat - b.seat);
  return new Map(sorted.map((player, index) => [player.id, index + 1]));
}

function getRanksForPlayers(players) {
  const sorted = [...players].sort((a, b) => b.score - a.score || a.seat - b.seat);
  return new Map(sorted.map((player, index) => [player.id, index + 1]));
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

function getPlayersWithRanks(match) {
  const players = match.players || [];
  const ranks = getRanksForPlayers(players);
  return players
    .map((player) => ({
      ...player,
      rank: Number(player.rank || ranks.get(player.id) || 4),
      score: Number(player.score || 0),
    }))
    .sort((a, b) => a.rank - b.rank || b.score - a.score);
}

function getAggregateRows(matches) {
  const rows = new Map();

  matches.forEach((match) => {
    const ranks = getRanksForPlayers(match.players || []);
    (match.players || []).forEach((player) => {
      const rank = Number(player.rank || ranks.get(player.id) || 4);
      const key = player.name;
      const row = rows.get(key) || {
        name: player.name,
        games: 0,
        rankTotal: 0,
        topCount: 0,
        tobiCount: 0,
        tobashiCredit: 0,
        leagueScoreTotal: 0,
        scoreTotal: 0,
        scoreDiffTotal: 0,
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
      row.scoreTotal += player.score;
      row.scoreDiffTotal += getPlayerScoreDiff(player);
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
      totalScoreDiff: row.scoreDiffTotal,
      callRate: row.hands ? (row.calls / row.hands) * 100 : 0,
      riichiRate: row.hands ? (row.riichi / row.hands) * 100 : 0,
      winRate: row.hands ? (row.wins / row.hands) * 100 : 0,
      dealInRate: row.hands ? (row.dealIns / row.hands) * 100 : 0,
    }))
    .sort((a, b) => b.totalLeagueScore - a.totalLeagueScore || a.averageRank - b.averageRank || b.averageScore - a.averageScore);
}

function formatTobashiPlayers(match) {
  if (!match.tobashiShares) {
    return "";
  }

  return Object.keys(match.tobashiShares)
    .map((playerId) => {
      const player = match.players.find((item) => item.id === playerId);
      const share = Number(match.tobashiShares[playerId] || 0);
      if (!player || share <= 0) {
        return "";
      }

      return share === 1 ? player.name : `${player.name} ${share.toFixed(2)}`;
    })
    .filter(Boolean)
    .join("、");
}

function getPlayerScoreDiff(player) {
  const scoreDiff = Number(player.scoreDiff);
  if (Number.isFinite(scoreDiff)) {
    return scoreDiff;
  }

  return Number(player.score || 0) - STARTING_SCORE;
}

function getPlayerRoundedScore(player) {
  const roundedScore = Number(player.roundedScore);
  if (Number.isFinite(roundedScore)) {
    return roundedScore;
  }

  return roundHundredsFiveDownSixUp(getPlayerScoreDiff(player));
}

function getPlayerUma(player, match) {
  const storedUma = Number(player.uma);
  if (Number.isFinite(storedUma)) {
    return storedUma;
  }

  const rank = Number(player.rank || getRanksForPlayers(match.players || []).get(player.id) || 4);
  return getUmaForRank(rank, match.settings || state.settings || {});
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

function toCsvRow(row) {
  return row.map(toCsvCell).join(",");
}

function toCsvCell(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function formatRateValue(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function statTemplate(label, count, hands) {
  return `
    <div class="stat-item">
      <span>${label}</span>
      <strong>${formatRate(count, hands)}</strong>
    </div>
  `;
}

function formatActions(hand) {
  const riichi = [];
  const calls = [];
  const tenpai = [];
  for (const player of hand.playersAfter) {
    const action = hand.actions[player.id];
    if (action && action.riichi) {
      riichi.push(player.name);
    }
    if (action && action.call) {
      calls.push(player.name);
    }
    if (action && (action.tenpai || action.riichi)) {
      tenpai.push(player.name);
    }
  }

  const parts = [];
  if (riichi.length) {
    parts.push(`立直: ${riichi.join("、")}`);
  }
  if (calls.length) {
    parts.push(`副露: ${calls.join("、")}`);
  }
  if (hand.result === "draw" && tenpai.length) {
    parts.push(`聴牌: ${tenpai.join("、")}`);
  }

  return parts.length ? escapeHtml(parts.join(" / ")) : "行動なし";
}

function getPlayerNameFromSnapshot(players, playerId) {
  const player = players.find((item) => item.id === playerId);
  return player ? player.name : "";
}

function defaultPlayerName(index) {
  return ["東家", "南家", "西家", "北家"][index] || `対局者${index + 1}`;
}

function getSetting(key) {
  return state.settings ? state.settings[key] !== false : createDefaultSettings()[key];
}

function normalizeSettingNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number / 100) * 100 : 0;
}

function normalizeSettingValue(setting, value) {
  if (setting && setting.normalize === "integer") {
    const number = Number(value);
    return Number.isFinite(number) ? Math.round(number) : 0;
  }

  return normalizeSettingNumber(value);
}

function isWinningResult() {
  return draft.result === "ron" || draft.result === "tsumo";
}

function hasAnyTenpai() {
  return state.players.some((player) => isPlayerTenpai(player.id));
}

function sumAbsDeltas(deltas) {
  return Object.keys(deltas).reduce((sum, key) => sum + Math.abs(Number(deltas[key] || 0)), 0);
}

function getRonDeltaShape() {
  const positives = [];
  const negatives = [];
  const zeros = [];

  state.players.forEach((player) => {
    const delta = Number(draft.deltas[player.id] || 0);
    if (delta > 0) {
      positives.push(player);
    } else if (delta < 0) {
      negatives.push(player);
    } else {
      zeros.push(player);
    }
  });

  return {
    isPair: positives.length === 1 && negatives.length === 1 && zeros.length === state.players.length - 2,
    winnerId: positives[0] ? positives[0].id : "",
    loserId: negatives[0] ? negatives[0].id : "",
    positives,
    negatives,
    zeros,
  };
}

function getTsumoDeltaShape() {
  const positives = [];
  const negatives = [];
  const zeros = [];

  state.players.forEach((player) => {
    const delta = Number(draft.deltas[player.id] || 0);
    if (delta > 0) {
      positives.push(player);
    } else if (delta < 0) {
      negatives.push(player);
    } else {
      zeros.push(player);
    }
  });

  return {
    isTsumo: positives.length === 1 && negatives.length === state.players.length - 1 && zeros.length === 0,
    winnerId: positives[0] ? positives[0].id : "",
    payerIds: negatives.map((player) => player.id),
    positives,
    negatives,
    zeros,
  };
}

function confirmScoreDirection() {
  const winnerDelta = Number(draft.deltas[draft.winnerId] || 0);

  if (draft.result === "ron") {
    const loserDelta = Number(draft.deltas[draft.loserId] || 0);
    if (winnerDelta <= 0 || loserDelta >= 0) {
      return window.confirm("ロンの点数入力で、和了者がプラスまたは放銃者がマイナスになっていません。このまま確定しますか？");
    }
  }

  if (draft.result === "tsumo") {
    const payerDeltas = state.players
      .filter((player) => player.id !== draft.winnerId)
      .map((player) => Number(draft.deltas[player.id] || 0));
    if (winnerDelta <= 0 || payerDeltas.filter((value) => value < 0).length < state.players.length - 1) {
      return window.confirm("ツモの点数入力で、和了者プラスまたは全員支払いになっていません。このまま確定しますか？");
    }
  }

  return true;
}

function formatRate(count, hands) {
  if (!hands) {
    return "0.0%";
  }

  return `${((count / hands) * 100).toFixed(1)}%`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("ja-JP");
}

function formatSigned(value) {
  const normalized = Number(value || 0);
  if (normalized > 0) {
    return `+${formatNumber(normalized)}`;
  }

  return formatNumber(normalized);
}

function normalizeScore(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value / 100) * 100;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createActionMap(players) {
  return players.reduce((map, player) => {
    map[player.id] = { call: false, riichi: false, tenpai: false };
    return map;
  }, {});
}

function createDeltaMap(players) {
  return players.reduce((map, player) => {
    map[player.id] = 0;
    return map;
  }, {});
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getDealerId() {
  const dealer = state.players[state.roundIndex % state.players.length];
  return dealer ? dealer.id : "";
}

function getDealerIdFromRound(roundIndex) {
  const dealer = state.players[roundIndex % state.players.length];
  return dealer ? dealer.id : "";
}

function getPlayerWindMeta(player) {
  const playerCount = state.players.length || 4;
  const dealerSeat = state.roundIndex % playerCount;
  const offset = (player.seat - dealerSeat + playerCount) % playerCount;
  const label = WIND_LABELS[offset] || "";
  const isDealer = offset === 0;

  return {
    label,
    shortLabel: isDealer ? `${label}親` : label,
    isDealer,
  };
}

function getPlayerOptionLabel(player) {
  const wind = getPlayerWindMeta(player);
  return `${wind.label}${wind.isDealer ? "(親)" : ""} ${player.name}`;
}

function advanceRoundIndex(roundIndex) {
  return clamp(roundIndex + 1, 0, ROUNDS.length - 1);
}

function isPlayerRiichi(playerId) {
  const action = draft.actions[playerId];
  return Boolean(action && action.riichi);
}

function isPlayerTenpai(playerId) {
  const action = draft.actions[playerId];
  return Boolean(action && (action.tenpai || action.riichi));
}

function isTenpaiInActions(actions, playerId) {
  const action = actions[playerId];
  return Boolean(action && (action.tenpai || action.riichi));
}

function mergeDeltas(manualDeltas, autoDeltas) {
  return state.players.reduce((deltas, player) => {
    deltas[player.id] = Number(manualDeltas[player.id] || 0) + Number(autoDeltas[player.id] || 0);
    return deltas;
  }, {});
}

function sumDeltas(deltas) {
  return Object.keys(deltas).reduce((sum, key) => sum + Number(deltas[key] || 0), 0);
}

function formatDateTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatCsvDateTime(value) {
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

function makeId(prefix) {
  const cryptoApi = window.crypto || window.msCrypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === "function") {
    return cryptoApi.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      })
      .catch(() => {});

    if (window.caches) {
      window.caches.keys()
        .then((keys) => {
          keys
            .filter((key) => key.indexOf("mahjong-ledger") === 0)
            .forEach((key) => window.caches.delete(key));
        })
        .catch(() => {});
    }
  });
}
