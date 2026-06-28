const STORAGE_KEY = "mahjong-ledger-state-v1";
const THEME_KEY = "mahjong-ledger-theme-v1";
const SHARE_CONFIG_KEY = "mahjong-ledger-share-config-v1";
const DEFAULT_REMOTE_SHARE_API_BASE_URL = "https://mahjong-ledger-share.daiperie-mahjong-ledger.workers.dev";
const STARTING_SCORE = 25000;
const RETURN_SCORE = 30000;
const STARTING_CHIPS = 20;
const ROUNDS = ["東1局", "東2局", "東3局", "東4局", "南1局", "南2局", "南3局", "南4局"];
const HONBA_RON_POINTS = 300;
const HONBA_TSUMO_POINTS = 100;
const RIICHI_STICK_POINTS = 1000;
const SCORE_FU_OPTIONS = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110];
const SCORE_HAN_OPTIONS = [
  { value: "", label: "翻を選択" },
  { value: "1", label: "1翻", han: 1 },
  { value: "2", label: "2翻", han: 2 },
  { value: "3", label: "3翻", han: 3 },
  { value: "4", label: "4翻", han: 4 },
  { value: "mangan", label: "満貫", limit: "mangan" },
  { value: "haneman", label: "跳満(6・7翻)", limit: "haneman" },
  { value: "baiman", label: "倍満(8〜10翻)", limit: "baiman" },
  { value: "sanbaiman", label: "三倍満(11翻以上)", limit: "sanbaiman" },
  { value: "yakuman", label: "役満", limit: "yakuman" },
];
const LIMIT_SCORES = {
  mangan: { label: "満貫", childRon: 8000, dealerRon: 12000, childTsumoChild: 2000, childTsumoDealer: 4000, dealerTsumo: 4000 },
  haneman: { label: "跳満", childRon: 12000, dealerRon: 18000, childTsumoChild: 3000, childTsumoDealer: 6000, dealerTsumo: 6000 },
  baiman: { label: "倍満", childRon: 16000, dealerRon: 24000, childTsumoChild: 4000, childTsumoDealer: 8000, dealerTsumo: 8000 },
  sanbaiman: { label: "三倍満", childRon: 24000, dealerRon: 36000, childTsumoChild: 6000, childTsumoDealer: 12000, dealerTsumo: 12000 },
  yakuman: { label: "役満", childRon: 32000, dealerRon: 48000, childTsumoChild: 8000, childTsumoDealer: 16000, dealerTsumo: 16000 },
};
const WIND_LABELS = ["東", "南", "西", "北"];
const DEFAULT_UMA = [30, 10, -10, -30];
const TOBASHI_BONUS = 10;
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
  { key: "tobashiBonusEnabled", label: "トバし賞+10", type: "checkbox" },
  { key: "ledgerShowTobi", label: "記録票: トビ", type: "checkbox" },
  { key: "ledgerShowTobashi", label: "記録票: トバし", type: "checkbox" },
  { key: "ledgerShowTobashiBonus", label: "記録票: トバし賞", type: "checkbox" },
  { key: "ledgerShowRawScore", label: "記録票: 点数", type: "checkbox" },
  { key: "ledgerShowRoundedScore", label: "記録票: 素点丸め", type: "checkbox" },
  { key: "ledgerShowUma", label: "記録票: ウマ", type: "checkbox" },
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
const SHARE_CONFIG_FIELDS = [
  { key: "apiBaseUrl", label: "共有API URL", type: "url", placeholder: "https://example.workers.dev" },
  { key: "writeToken", label: "保存キー", type: "password", placeholder: "記録端末のみ" },
];

const elements = {
  playersGrid: document.querySelector("#playersGrid"),
  actionGrid: document.querySelector("#actionGrid"),
  deltaGrid: document.querySelector("#deltaGrid"),
  chipGrid: document.querySelector("#chipGrid"),
  historyList: document.querySelector("#historyList"),
  roundLabel: document.querySelector("#roundLabel"),
  roundSubLabel: document.querySelector("#roundSubLabel"),
  honbaValue: document.querySelector("#honbaValue"),
  stickValue: document.querySelector("#stickValue"),
  handCount: document.querySelector("#handCount"),
  winnerSelect: document.querySelector("#winnerSelect"),
  loserSelect: document.querySelector("#loserSelect"),
  winnerWindDisplay: document.querySelector("#winnerWindDisplay"),
  loserWindDisplay: document.querySelector("#loserWindDisplay"),
  memoInput: document.querySelector("#memoInput"),
  advanceRound: document.querySelector("#advanceRound"),
  saveHandButton: document.querySelector("#saveHandButton"),
  undoButton: document.querySelector("#undoButton"),
  resetButton: document.querySelector("#resetButton"),
  finishMatchButton: document.querySelector("#finishMatchButton"),
  csvButton: document.querySelector("#csvButton"),
  shareLinkButton: document.querySelector("#shareLinkButton"),
  exportButton: document.querySelector("#exportButton"),
  importButton: document.querySelector("#importButton"),
  importFile: document.querySelector("#importFile"),
  themeToggle: document.querySelector("#themeToggle"),
  summaryStats: document.querySelector("#summaryStats"),
  trendChart: document.querySelector("#trendChart"),
  matchList: document.querySelector("#matchList"),
  settingsGrid: document.querySelector("#settingsGrid"),
  dangerZone: document.querySelector("#dangerZone"),
  archiveScopeButtons: document.querySelectorAll("[data-archive-scope]"),
};

let state = loadState();
let draft = createDraft(state);
let shareConfig = loadShareConfig();
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
      chips: STARTING_CHIPS,
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
    tobashiBonusEnabled: true,
    ledgerShowTobi: false,
    ledgerShowTobashi: false,
    ledgerShowTobashiBonus: false,
    ledgerShowRawScore: false,
    ledgerShowRoundedScore: false,
    ledgerShowUma: false,
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
    chipDeltas: createDeltaMap(sourceState.players),
    scoreHan: "",
    scoreFu: 30,
    winScore: 0,
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
      chips: STARTING_CHIPS,
      ...player,
    })),
    history: Array.isArray(parsed.history) ? parsed.history : [],
    matches: Array.isArray(parsed.matches) ? parsed.matches : [],
    settings: normalizeSettingsPayload(parsed.settings || {}),
  };
}

function normalizeSettingsPayload(settings) {
  const normalized = {
    ...createDefaultSettings(),
    ...settings,
  };

  const keptPreviousDefaultUma =
    Number(settings.umaRank1) === 20 &&
    Number(settings.umaRank2) === 10 &&
    Number(settings.umaRank3) === -10 &&
    Number(settings.umaRank4) === -20;

  if (keptPreviousDefaultUma) {
    normalized.umaRank1 = DEFAULT_UMA[0];
    normalized.umaRank2 = DEFAULT_UMA[1];
    normalized.umaRank3 = DEFAULT_UMA[2];
    normalized.umaRank4 = DEFAULT_UMA[3];
  }

  return normalized;
}

function loadShareConfig() {
  try {
    const stored = localStorage.getItem(SHARE_CONFIG_KEY);
    return normalizeShareConfig(stored ? JSON.parse(stored) : {});
  } catch {
    return normalizeShareConfig({});
  }
}

function normalizeShareConfig(config) {
  return {
    apiBaseUrl: normalizeShareApiBaseUrl(config.apiBaseUrl || DEFAULT_REMOTE_SHARE_API_BASE_URL),
    writeToken: String(config.writeToken || "").trim(),
  };
}

function saveShareConfig() {
  localStorage.setItem(SHARE_CONFIG_KEY, JSON.stringify(shareConfig));
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
  if (elements.shareLinkButton) {
    elements.shareLinkButton.addEventListener("click", shareSnapshotLink);
  }
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
    ensureRonLoser();
    applyWinScoreDeltas();
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

  if (action === "chip-step") {
    draft.chipDeltas[playerId] = normalizeChip((draft.chipDeltas[playerId] || 0) + value);
    render();
  }

  if (action === "chip-clear") {
    draft.chipDeltas[playerId] = 0;
    render();
  }

  if (action === "delete-current-hand") {
    deleteCurrentHand(target.dataset.handId);
  }

  if (action === "delete-match") {
    deleteSavedMatch(target.dataset.matchId);
  }

  if (action === "delete-day") {
    deleteSavedDay(target.dataset.dayKey);
  }

  if (action === "delete-all-data") {
    deleteAllData();
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
    ensureRonLoser();
    applyWinScoreDeltas();
    render();
  }

  if (target === elements.loserSelect) {
    draft.loserId = target.value;
    applyWinScoreDeltas();
    render();
  }

  if (target.matches("[data-score-han]")) {
    draft.scoreHan = target.value;
    render();
  }

  if (target.matches("[data-score-fu]")) {
    draft.scoreFu = normalizeFuValue(target.value);
    render();
  }

  if (target.matches("[data-chip-input]")) {
    draft.chipDeltas[target.dataset.chipInput] = normalizeChip(Number(target.value || 0));
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

  if (target.matches("[data-share-config]")) {
    const key = target.dataset.shareConfig;
    shareConfig = normalizeShareConfig({
      ...shareConfig,
      [key]: target.value,
    });
    saveShareConfig();
  }
}

function handleInput(event) {
  const target = event.target;

  if (target === elements.memoInput) {
    draft.memo = target.value;
  }

  if (target.matches("[data-share-config]")) {
    const key = target.dataset.shareConfig;
    shareConfig = {
      ...shareConfig,
      [key]: target.value,
    };
    saveShareConfig();
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
  renderActions();
  renderDeltas();
  renderChipDeltas();
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
      const chipDiff = Number(player.chips ?? STARTING_CHIPS) - STARTING_CHIPS;
      const chipClass = chipDiff > 0 ? "plus" : chipDiff < 0 ? "minus" : "";
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
            <div class="chip-line">
              <span>チップ</span>
              <strong>${formatNumber(player.chips ?? STARTING_CHIPS)}枚</strong>
              <em class="${chipClass}">${formatSigned(chipDiff)}</em>
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
  ensureRonLoser();
  const loserOptions = state.players
    .filter((player) => player.id !== draft.winnerId)
    .map((player) => `<option value="${player.id}">${escapeHtml(getPlayerOptionLabel(player))}</option>`)
    .join("");
  const emptyOption = `<option value="">なし</option>`;
  const isDraw = draft.result === "draw";
  const hasLoser = draft.result === "ron";

  elements.winnerSelect.innerHTML = isDraw ? `${emptyOption}${playerOptions}` : playerOptions;
  elements.loserSelect.innerHTML = hasLoser ? loserOptions : `${emptyOption}${playerOptions}`;
  elements.winnerSelect.value = isDraw ? "" : draft.winnerId;
  elements.loserSelect.value = hasLoser ? draft.loserId : "";

  elements.winnerSelect.disabled = isDraw;
  elements.loserSelect.disabled = !hasLoser;
  if (elements.winnerWindDisplay) {
    elements.winnerWindDisplay.innerHTML = isDraw ? "" : renderSelectorWindBadge(draft.winnerId);
  }
  if (elements.loserWindDisplay) {
    elements.loserWindDisplay.innerHTML = hasLoser ? renderSelectorWindBadge(draft.loserId) : "";
  }
}

function renderSelectorWindBadge(playerId) {
  const player = state.players.find((item) => item.id === playerId);
  if (!player) {
    return "";
  }

  const wind = getPlayerWindMeta(player);
  return `
    <span class="wind-chip selector ${wind.isDealer ? "dealer" : ""}">
      ${wind.label}${wind.isDealer ? "<small>親</small>" : ""}
    </span>
    <strong>${escapeHtml(player.name)}</strong>
  `;
}

function renderModeTabs() {
  document.querySelectorAll("[data-action='set-result']").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.result === draft.result));
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
  applyWinScoreDeltas();
  elements.deltaGrid.innerHTML = draft.result === "draw" ? renderDrawScorePanel() : renderWinningScorePanel();
}

function renderWinningScorePanel() {
  const winner = state.players.find((item) => item.id === draft.winnerId) || state.players[0];
  const winnerName = winner ? getPlayerOptionLabel(winner) : "";
  const scoreResult = getSelectedScoreResult();
  const selectedHan = getScoreHanOption();
  const usesFu = Boolean(selectedHan && !selectedHan.limit);

  return `
    <div class="win-score-panel">
      <div class="win-score-head">
        <div>
          <span>和了者</span>
          <strong>${escapeHtml(winnerName)}</strong>
        </div>
        <div>
          <span>和了区分</span>
          <strong>${draft.result === "tsumo" ? "ツモ" : "ロン"}</strong>
        </div>
      </div>
      <div class="score-table-picker">
        <label>
          <span>翻</span>
          <select data-score-han aria-label="翻">
            ${SCORE_HAN_OPTIONS.map((option) => `<option value="${option.value}" ${option.value === draft.scoreHan ? "selected" : ""}>${option.label}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>符</span>
          <select data-score-fu aria-label="符" ${usesFu ? "" : "disabled"}>
            ${SCORE_FU_OPTIONS.map((fu) => `<option value="${fu}" ${fu === normalizeFuValue(draft.scoreFu) ? "selected" : ""}>${fu}符</option>`).join("")}
          </select>
        </label>
      </div>
      <div class="score-result-card ${scoreResult.valid ? "" : "invalid"}">
        <span>自動点数</span>
        <strong>${escapeHtml(scoreResult.valid ? scoreResult.display : scoreResult.message)}</strong>
        <small>${escapeHtml(scoreResult.valid ? scoreResult.detail : "点数表にある組み合わせを選択してください")}</small>
      </div>
      ${renderScorePreview()}
    </div>
  `;
}

function renderDrawScorePanel() {
  return `
    <div class="win-score-panel draw">
      <div class="win-score-head">
        <div>
          <span>流局</span>
          <strong>聴牌選択から自動計算</strong>
        </div>
      </div>
      <p class="score-help">聴牌・立直を選んで局を確定すると、設定に応じて聴牌料と供託を自動補正します。</p>
      ${renderScorePreview()}
    </div>
  `;
}

function renderScorePreview() {
  return `
    <div class="score-preview" aria-label="点数差プレビュー">
      ${renderScorePreviewItems()}
    </div>
  `;
}

function renderScorePreviewItems() {
  return state.players
    .map((player) => {
      const delta = Number(draft.deltas[player.id] || 0);
      const wind = getPlayerWindMeta(player);
      return `
        <span class="${toneClass(delta)}">
          <b>${wind.shortLabel} ${escapeHtml(player.name)}</b>
          ${formatSigned(delta)}
        </span>
      `;
    })
    .join("");
}

function renderChipDeltas() {
  elements.chipGrid.innerHTML = state.players
    .map((player) => {
      const value = draft.chipDeltas[player.id] || 0;
      const currentChips = Number(player.chips ?? STARTING_CHIPS);
      const wind = getPlayerWindMeta(player);

      return `
        <div class="chip-row">
          <span class="chip-name">
            <span class="mini-wind ${wind.isDealer ? "dealer" : ""}">${wind.shortLabel}</span>
            ${escapeHtml(player.name)}
          </span>
          <span class="chip-current">所持 ${formatNumber(currentChips)}枚</span>
          <input
            class="chip-input"
            type="number"
            inputmode="numeric"
            step="1"
            data-chip-input="${player.id}"
            value="${value}"
            aria-label="${escapeHtml(player.name)}のチップ差"
          />
          <div class="chip-buttons">
            ${chipButtonTemplate(player.id, -5)}
            ${chipButtonTemplate(player.id, -1)}
            ${chipButtonTemplate(player.id, 1)}
            ${chipButtonTemplate(player.id, 5)}
            <button class="chip-button clear" type="button" data-action="chip-clear" data-player-id="${player.id}">0</button>
          </div>
        </div>
      `;
    })
    .join("");
}

function chipButtonTemplate(playerId, value) {
  const tone = value < 0 ? "negative" : "positive";
  const label = `${value < 0 ? "−" : "＋"}${Math.abs(value)}`;
  return `
    <button
      class="chip-button ${tone}"
      type="button"
      data-action="chip-step"
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
    .map((hand, index) => {
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
      const chipDeltas = hand.playersAfter
        .map((player) => {
          const before = hand.playersBefore.find((item) => item.id === player.id);
          const beforeChips = before ? Number(before.chips ?? STARTING_CHIPS) : Number(player.chips ?? STARTING_CHIPS);
          const diff = Number(player.chips ?? STARTING_CHIPS) - beforeChips;
          return diff ? `<span>${escapeHtml(player.name)} チップ${formatSigned(diff)}</span>` : "";
        })
        .filter(Boolean)
        .join("");

      return `
        <article class="history-item">
          <div class="history-headline">
            <strong>${escapeHtml(headline)}</strong>
            ${index === 0 ? `<button class="mini-delete-button" type="button" data-action="delete-current-hand" data-hand-id="${hand.id}">局削除</button>` : ""}
          </div>
          <small>${actionNames}${memo}${autoNotes}</small>
          <div class="history-deltas">${deltas}</div>
          ${chipDeltas ? `<div class="history-deltas chips">${chipDeltas}</div>` : ""}
        </article>
      `;
    })
    .join("");
}

function renderArchiveLedger(matches, summaryLabel = "", withDeleteButtons = false, dayKey = "") {
  const sortedMatches = getSortedMatches(matches);
  const rows = getAggregateRows(sortedMatches);
  const latestMatch = sortedMatches[0] || null;

  return `
    <div class="ledger-stack">
      <div class="summary-cards">
        <div class="summary-card"><span>${escapeHtml(summaryLabel || "半荘数")}</span><strong>${sortedMatches.length}</strong></div>
        <div class="summary-card"><span>最新</span><strong>${escapeHtml(latestMatch ? formatDateTime(latestMatch.finishedAt) : "-")}</strong></div>
      </div>
      ${withDeleteButtons && dayKey ? `<button class="mini-delete-button danger day-delete-button" type="button" data-action="delete-day" data-day-key="${dayKey}">日削除</button>` : ""}
      ${renderDayScoreStrip(rows)}
      ${renderMetricLedger(rows)}
      ${renderMatchLedger(sortedMatches)}
    </div>
  `;
}

function renderMetricLedger(rows) {
  if (!rows.length) {
    return `<div class="history-empty">表示できる集計がありません</div>`;
  }

  const medians = getRateMedians(rows);
  const metrics = [
    { label: "半荘数", value: (row) => row.games },
    { label: "合計スコア", value: (row) => formatSigned(row.totalLeagueScore), tone: (row) => toneClass(row.totalLeagueScore) },
    { label: "平均順位", value: (row) => row.averageRank.toFixed(2) },
    { label: "トップ率", value: (row) => formatRateValue(row.topRate), tone: (row) => rateToneClass(row.topRate, medians.topRate) },
    { label: "連対率", value: (row) => formatRateValue(row.rentaiRate), tone: (row) => rateToneClass(row.rentaiRate, medians.rentaiRate) },
    { label: "4着回避率", value: (row) => formatRateValue(row.avoidLastRate), tone: (row) => rateToneClass(row.avoidLastRate, medians.avoidLastRate) },
    { label: "トビ率", value: (row) => formatRateValue(row.tobiRate), tone: (row) => rateToneClass(row.tobiRate, medians.tobiRate, true) },
    { label: "トバし率", value: (row) => formatRateValue(row.tobashiRate), tone: (row) => rateToneClass(row.tobashiRate, medians.tobashiRate) },
    { label: "和了率", value: (row) => formatRateValue(row.winRate), tone: (row) => rateToneClass(row.winRate, medians.winRate) },
    { label: "放銃率", value: (row) => formatRateValue(row.dealInRate), tone: (row) => rateToneClass(row.dealInRate, medians.dealInRate, true) },
    { label: "リーチ率", value: (row) => formatRateValue(row.riichiRate), tone: (row) => rateToneClass(row.riichiRate, medians.riichiRate) },
    { label: "副露率", value: (row) => formatRateValue(row.callRate), tone: (row) => rateToneClass(row.callRate, medians.callRate) },
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
                ${rows
                  .map((row) => `<td class="${metric.tone ? metric.tone(row) : ""}">${metric.value(row)}</td>`)
                  .join("")}
              </tr>
            `)
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function getLedgerColumns(settings = state.settings || {}) {
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

  return columns;
}

function renderMatchLedger(matches) {
  const sheetPlayers = getLedgerPlayers(matches);
  const columns = getLedgerColumns();
  if (!matches.length || !sheetPlayers.length) {
    return `<div class="history-empty">表示できる半荘がありません</div>`;
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
                <td>${escapeHtml(formatDateTime(match.finishedAt))}</td>
                ${sheetPlayers.map((player) => renderMatchLedgerPlayerCells(match, player.key, columns)).join("")}
              </tr>
            `)
            .join("")}
        </tbody>
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

function getMatchLedgerCsvCells(match, playerKey, columns = getLedgerColumns()) {
  const player = findMatchLedgerPlayer(match, playerKey);
  if (!player) {
    return Array(columns.length).fill("");
  }

  return columns.map((column) => getMatchLedgerCell(column.key, player, match).csv);
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
      name: player.name || defaultPlayerName(player.seat) || key,
    });
  };

  state.players.forEach(addPlayer);
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

function renderSummary() {
  const matches = getSortedMatches(state.matches || []);
  const scopedMatches = archiveScope === "today" ? getLatestMatchDayMatches(matches) : matches;
  elements.archiveScopeButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String((button.dataset.archiveScope || "overall") === archiveScope));
  });

  if (matches.length === 0) {
    elements.summaryStats.innerHTML = `<div class="history-empty">保存済み半荘はまだありません</div>`;
    elements.trendChart.innerHTML = "";
    elements.matchList.innerHTML = "";
    return;
  }

  if (archiveScope === "daily") {
    elements.summaryStats.innerHTML = renderDailySummaries(matches, true);
    elements.trendChart.innerHTML = renderScoreTrend(matches);
    elements.matchList.innerHTML = "";
    return;
  }

  const rows = getAggregateRows(scopedMatches);
  const medians = getRateMedians(rows);
  const latestMatch = scopedMatches[0] || matches[0] || null;
  const dayLabel = archiveScope === "today" && latestMatch ? formatDateOnly(latestMatch.finishedAt) : "";
  elements.summaryStats.innerHTML = `
    <div class="summary-cards">
      <div class="summary-card"><span>${archiveScope === "today" ? "当日半荘" : "半荘数"}</span><strong>${scopedMatches.length}</strong></div>
      <div class="summary-card"><span>${archiveScope === "today" ? "対象日" : "最新"}</span><strong>${escapeHtml(archiveScope === "today" ? dayLabel : (latestMatch.endReason || "保存"))}</strong></div>
    </div>
    ${archiveScope === "today" ? renderDayScoreStrip(rows) : ""}
    <div class="summary-table">
      ${rows
        .map(
          (row) => {
            const scoreClass = toneClass(row.totalLeagueScore);
            const chipClass = toneClass(row.totalChipDiff);
            return `
            <div class="summary-row">
              <strong>${escapeHtml(row.name)}</strong>
              <span>${row.games}半荘</span>
              <span class="${scoreClass}">スコア${formatSigned(row.totalLeagueScore)}</span>
              <span class="${chipClass}">チップ${formatSigned(row.totalChipDiff)}</span>
              <span>平均${row.averageRank.toFixed(2)}位</span>
              ${rateBadge("トップ", row.topRate, medians.topRate)}
              ${rateBadge("連対", row.rentaiRate, medians.rentaiRate)}
              ${rateBadge("4着回避", row.avoidLastRate, medians.avoidLastRate)}
              ${rateBadge("トビ", row.tobiRate, medians.tobiRate, true)}
              ${rateBadge("トバし", row.tobashiRate, medians.tobashiRate)}
              <span>${formatNumber(Math.round(row.averageScore))}点</span>
            </div>
          `;
          }
        )
        .join("")}
    </div>
  `;
  elements.summaryStats.innerHTML = renderArchiveLedger(
    scopedMatches,
    archiveScope === "today" ? `当日 ${dayLabel}` : "総合"
  );
  elements.trendChart.innerHTML = renderScoreTrend(scopedMatches);

  elements.matchList.innerHTML = scopedMatches
    .slice(0, 6)
    .map((match) => {
      const players = getPlayersWithRanks(match);
      const top = players[0] || null;
      const finishedAt = formatDateTime(match.finishedAt);
      const tobashi = formatTobashiPlayers(match);
      const scores = players
        .map((player) => {
          const bonus = getPlayerTobashiBonus(player, match);
          const bonusText = bonus ? ` 賞${formatSigned(bonus)}` : "";
          return `${player.rank}位 ${player.name} ${formatSigned(getPlayerLeagueScore(player, match))} / チップ${formatSigned(getPlayerChipDiff(player))}${bonusText}`;
        })
        .join(" / ");
      return `
        <article class="match-item">
          <div class="match-headline">
            <strong>${escapeHtml(match.label || `半荘${match.number || ""}`)}</strong>
            <button class="mini-delete-button" type="button" data-action="delete-match" data-match-id="${match.id}">半荘削除</button>
          </div>
          <span>${escapeHtml(match.endReason || "保存")} / ${finishedAt}</span>
          ${tobashi ? `<span>トバし: ${escapeHtml(tobashi)}</span>` : ""}
          <small>トップ: ${escapeHtml(top ? top.name : "")} ${top ? formatNumber(top.score) : ""}</small>
          <small>スコア: ${escapeHtml(scores)}</small>
        </article>
      `;
    })
    .join("");
  elements.matchList.innerHTML = "";
}

function renderDailySummaries(matches, withDeleteButtons = false) {
  {
    const groups = getMatchDayGroups(matches);
    if (groups.length === 0) {
      return `<div class="history-empty">日別に表示できる半荘がありません</div>`;
    }

    return groups
      .map((group) => `
        <section class="daily-summary">
          <div class="daily-summary-head">
            <div>
              <strong>${escapeHtml(group.label)}</strong>
              <span>${group.matches.length}半荘</span>
            </div>
            ${withDeleteButtons ? `<button class="mini-delete-button danger" type="button" data-action="delete-day" data-day-key="${group.key}">日削除</button>` : ""}
          </div>
          ${renderArchiveLedger(group.matches, group.label)}
        </section>
      `)
      .join("");
  }

  const groups = getMatchDayGroups(matches);
  if (groups.length === 0) {
    return `<div class="history-empty">日別に表示できる半荘がありません</div>`;
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
            ${withDeleteButtons ? `<button class="mini-delete-button danger" type="button" data-action="delete-day" data-day-key="${group.key}">日削除</button>` : ""}
          </div>
          ${renderDayScoreStrip(rows)}
          <div class="summary-table">
            ${rows
              .map((row) => {
                const scoreClass = toneClass(row.totalLeagueScore);
                const chipClass = toneClass(row.totalChipDiff);
                return `
                  <div class="summary-row">
                    <strong>${escapeHtml(row.name)}</strong>
                    <span>${row.games}半荘</span>
                    <span class="${scoreClass}">スコア${formatSigned(row.totalLeagueScore)}</span>
                    <span class="${chipClass}">チップ${formatSigned(row.totalChipDiff)}</span>
                    <span>平均${row.averageRank.toFixed(2)}位</span>
                    ${rateBadge("トップ", row.topRate, medians.topRate)}
                    ${rateBadge("連対", row.rentaiRate, medians.rentaiRate)}
                    ${rateBadge("4着回避", row.avoidLastRate, medians.avoidLastRate)}
                    ${rateBadge("トビ", row.tobiRate, medians.tobiRate, true)}
                    ${rateBadge("トバし", row.tobashiRate, medians.tobashiRate)}
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
  const height = 240;
  const padLeft = 44;
  const padRight = 104;
  const padTop = 18;
  const padBottom = 34;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;
  const stepMax = Math.max(1, chronological.length);
  const yFor = (value) => padTop + ((maxValue - value) / (maxValue - minValue)) * plotHeight;
  const xFor = (step) => padLeft + (step / stepMax) * plotWidth;
  const zeroY = yFor(0);
  const finalRows = names
    .map((name) => ({
      name,
      value: Number(totals.get(name) || 0),
    }))
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
    .map((row, index) => {
      return `
        <div class="trend-legend-item">
          <span style="--trend-color: ${chartColor(index)}"></span>
          <strong>${escapeHtml(row.name)}</strong>
          <em class="${toneClass(row.value)}">${formatSigned(row.value)}</em>
        </div>
      `;
    })
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

function renderSettings() {
  const ruleSettingsHtml = SETTINGS.map((setting) => {
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

  const shareSettingsHtml = SHARE_CONFIG_FIELDS.map((field) => `
    <label class="setting-item share-setting">
      <span>${field.label}</span>
      <input
        type="${field.type}"
        data-share-config="${field.key}"
        value="${escapeHtml(shareConfig[field.key] || "")}"
        placeholder="${escapeHtml(field.placeholder || "")}"
        autocomplete="off"
      />
    </label>
  `).join("");

  elements.settingsGrid.innerHTML = `
    ${ruleSettingsHtml}
    <div class="settings-subhead">共有API</div>
    ${shareSettingsHtml}
  `;

  if (elements.dangerZone) {
    const savedMatchCount = Array.isArray(state.matches) ? state.matches.length : 0;
    const currentHandCount = Array.isArray(state.history) ? state.history.length : 0;
    elements.dangerZone.innerHTML = `
      <div class="danger-zone-head">
        <strong>データ削除</strong>
        <span>保存済み${savedMatchCount}半荘 / 現在${currentHandCount}局</span>
      </div>
      <button class="button danger" type="button" data-action="delete-all-data">オールデリート</button>
    `;
  }
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
      chips: Number(player.chips ?? STARTING_CHIPS) + Number(draft.chipDeltas[player.id] || 0),
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
    manualChipDeltas: deepClone(draft.chipDeltas),
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
  const hanSelect = document.querySelector("[data-score-han]");
  const fuSelect = document.querySelector("[data-score-fu]");
  if (hanSelect) {
    draft.scoreHan = hanSelect.value;
  }
  if (fuSelect) {
    draft.scoreFu = normalizeFuValue(fuSelect.value);
  }
  ensureRonLoser();
  applyWinScoreDeltas();
  document.querySelectorAll("[data-chip-input]").forEach((input) => {
    draft.chipDeltas[input.dataset.chipInput] = normalizeChip(Number(input.value || 0));
  });
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

  if (isWinningResult()) {
    const scoreResult = getSelectedScoreResult();
    if (!scoreResult.valid) {
      window.alert(scoreResult.message);
      return false;
    }
  }

  if (isWinningResult() && getSetting("safetyZeroWin") && sumAbsDeltas(draft.deltas) === 0) {
    window.alert("ロン/ツモが選ばれていますが、点数差がすべて0です。翻・符を選択してください。");
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

function deleteCurrentHand(handId) {
  const latest = state.history[0];
  if (!latest || latest.id !== handId) {
    window.alert("削除できる局は現在の最新局のみです。過去局を直す場合は、最新局から順に戻してください。");
    return;
  }

  if (!window.confirm("最新の1局を削除して、その局の前の状態へ戻しますか？")) {
    return;
  }

  undoLastHand();
}

function deleteSavedMatch(matchId) {
  const matches = Array.isArray(state.matches) ? state.matches : [];
  const match = matches.find((item) => item.id === matchId);
  if (!match) {
    return;
  }

  const label = match.label || `半荘${match.number || ""}`;
  if (!window.confirm(`${label} を保存済み成績から削除しますか？`)) {
    return;
  }

  state.matches = matches.filter((item) => item.id !== matchId);
  saveState();
  render();
}

function deleteSavedDay(dayKey) {
  const matches = Array.isArray(state.matches) ? state.matches : [];
  const dayMatches = matches.filter((match) => getLocalDateKey(match.finishedAt) === dayKey);
  if (dayMatches.length === 0) {
    return;
  }

  const label = formatDateOnly(dayMatches[0].finishedAt) || dayKey;
  if (!window.confirm(`${label} の保存済み半荘 ${dayMatches.length}件を削除しますか？`)) {
    return;
  }

  state.matches = matches.filter((match) => getLocalDateKey(match.finishedAt) !== dayKey);
  saveState();
  render();
}

function deleteAllData() {
  if (!window.confirm("すべての保存済み半荘、現在の局履歴、点数を削除しますか？")) {
    return;
  }

  if (!window.confirm("この操作は元に戻せません。オールデリートを実行しますか？")) {
    return;
  }

  state = createInitialState();
  draft = createDraft(state);
  archiveScope = "overall";
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
      const scoreDiff = player.score - RETURN_SCORE;
      const roundedScore = roundHundredsFiveDownSixUp(scoreDiff);
      const uma = getUmaForRank(rank, state.settings);
      const tobashiBonus =
        getTobashiBonusForPlayer(player.id, info.tobashiShares || {}, state.settings) -
        getTobashiPenaltyForPlayer(player.id, info.bustedIds || [], state.settings);
      return {
        ...player,
        rank,
        scoreDiff,
        roundedScore,
        uma,
        tobashiBonus,
        leagueScore: roundedScore + uma + tobashiBonus,
        chipDiff: Number(player.chips ?? STARTING_CHIPS) - STARTING_CHIPS,
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
  next.settings = normalizeSettingsPayload(previousState.settings || {});

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

async function shareSnapshotLink() {
  const matches = Array.isArray(state.matches) ? state.matches : [];
  if (matches.length === 0) {
    window.alert("共有する保存済み半荘がありません。半荘を保存してから共有リンクを作成してください。");
    return;
  }

  const shareResult = await buildShareUrl();
  const url = shareResult.url;
  if (shareResult.warning) {
    window.alert(shareResult.warning);
  }
  const title = "Mahjong Ledger 共有成績";

  try {
    if (navigator.share) {
      await navigator.share({ title, url });
      return;
    }

    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url);
      window.alert("共有リンクをコピーしました。スマホに送って開くと成績を見られます。");
      return;
    }
  } catch (error) {
    if (error && error.name === "AbortError") {
      return;
    }
  }

  window.prompt("共有リンクをコピーしてください。", url);
}

async function buildShareUrl() {
  const snapshot = createShareSnapshot();
  const remoteShare = await buildRemoteShareUrl(snapshot);
  if (remoteShare.url) {
    return remoteShare;
  }

  const url = new URL("./share.html?v=24", window.location.href);
  const compressed = await encodeCompressedSharePayload(snapshot);
  url.hash = compressed ? `z=${compressed}` : `data=${encodeSharePayload(snapshot)}`;
  return {
    url: url.toString(),
    warning: remoteShare.warning,
  };
}

async function buildRemoteShareUrl(snapshot) {
  const config = normalizeShareConfig(shareConfig);
  if (!config.apiBaseUrl || !config.writeToken) {
    return { url: "", warning: "" };
  }

  try {
    const response = await fetch(`${config.apiBaseUrl}/snapshots`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Share-Token": config.writeToken,
      },
      body: JSON.stringify(snapshot),
    });

    if (!response.ok) {
      throw new Error(`Share API responded ${response.status}`);
    }

    const result = await response.json();
    const id = String(result.id || "").trim();
    if (!/^[A-Za-z0-9_-]{8,80}$/.test(id)) {
      throw new Error("Share API returned an invalid id");
    }

    const url = new URL("./share.html?v=24", window.location.href);
    url.searchParams.set("id", id);

    const defaultApiBaseUrl = normalizeShareApiBaseUrl(DEFAULT_REMOTE_SHARE_API_BASE_URL);
    if (config.apiBaseUrl !== defaultApiBaseUrl) {
      url.searchParams.set("api", config.apiBaseUrl);
    }

    return { url: url.toString(), warning: "" };
  } catch {
    return {
      url: "",
      warning: "共有APIへの保存に失敗したため、URL内保存の共有リンクを作成します。",
    };
  }
}

function createShareSnapshot() {
  return {
    v: 1,
    c: state.createdAt || "",
    s: pickShareSettings(state.settings || {}),
    p: state.players.map((player) => [player.id, Number(player.seat || 0), player.name || ""]),
    m: getSortedMatches(state.matches || []).map(compactShareMatch),
  };
}

function compactShareMatch(match) {
  const ranks = getRanksForPlayers(match.players || []);

  return {
    n: match.number,
    l: match.label || "",
    st: match.startedAt || "",
    f: match.finishedAt || "",
    e: match.endReason || "",
    b: Array.isArray(match.bustedIds) ? match.bustedIds : [],
    ti: Array.isArray(match.tobashiIds) ? match.tobashiIds : [],
    ts: match.tobashiShares || {},
    s: pickShareSettings(match.settings || state.settings || {}),
    p: (match.players || []).map((player) => {
      const rankedPlayer = { ...player, rank: Number(player.rank || ranks.get(player.id) || 4) };
      return [
        rankedPlayer.id,
        Number(rankedPlayer.seat || 0),
        rankedPlayer.name || "",
        Number(rankedPlayer.score || 0),
        Number(rankedPlayer.rank || 4),
        getPlayerScoreDiff(rankedPlayer),
        getPlayerRoundedScore(rankedPlayer),
        getPlayerUma(rankedPlayer, match),
        getPlayerTobashiBonus(rankedPlayer, match),
        getPlayerLeagueScore(rankedPlayer, match),
        getPlayerChipDiff(rankedPlayer),
        Number(rankedPlayer.chips ?? STARTING_CHIPS),
        Number(rankedPlayer.hands || 0),
        Number(rankedPlayer.calls || 0),
        Number(rankedPlayer.riichi || 0),
        Number(rankedPlayer.wins || 0),
        Number(rankedPlayer.dealIns || 0),
      ];
    }),
  };
}

function pickShareSettings(settings) {
  return [
    "drawTobashiMode",
    "tobashiBonusEnabled",
    "ledgerShowTobi",
    "ledgerShowTobashi",
    "ledgerShowTobashiBonus",
    "ledgerShowRawScore",
    "ledgerShowRoundedScore",
    "ledgerShowUma",
    "umaRank1",
    "umaRank2",
    "umaRank3",
    "umaRank4",
  ].reduce((picked, key) => {
    if (settings[key] !== undefined) {
      picked[key] = settings[key];
    }
    return picked;
  }, {});
}

function normalizeShareApiBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function encodeSharePayload(payload) {
  const bytes = encodeUtf8Bytes(JSON.stringify(payload));
  return encodeBytesAsBase64Url(bytes);
}

async function encodeCompressedSharePayload(payload) {
  if (typeof window.CompressionStream !== "function") {
    return "";
  }

  try {
    const bytes = encodeUtf8Bytes(JSON.stringify(payload));
    const stream = new Blob([bytes]).stream().pipeThrough(new window.CompressionStream("gzip"));
    const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
    return encodeBytesAsBase64Url(compressed);
  } catch {
    return "";
  }
}

function encodeUtf8Bytes(text) {
  if (typeof window.TextEncoder === "function") {
    return new window.TextEncoder().encode(text);
  }

  const binary = unescape(encodeURIComponent(text));
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function encodeBytesAsBase64Url(bytes) {
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
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
      formatCsvDateTime(match.finishedAt),
      match.endReason || "保存済み",
      ...sheetPlayers.flatMap((sheetPlayer) => getMatchLedgerCsvCells(match, sheetPlayer.key, matchColumns)),
    ]);
  });

  rows.push([]);
  rows.push(["集計"]);
  rows.push(["項目", ...aggregateRows.map((row) => row.name)]);
  [
    ["半荘数", (row) => row.games],
    ["合計スコア", (row) => formatSigned(row.totalLeagueScore)],
    ["平均順位", (row) => row.averageRank.toFixed(2)],
    ["トップ率", (row) => formatRateValue(row.topRate)],
    ["連対率", (row) => formatRateValue(row.rentaiRate)],
    ["4着回避率", (row) => formatRateValue(row.avoidLastRate)],
    ["トビ率", (row) => formatRateValue(row.tobiRate)],
    ["トバし率", (row) => formatRateValue(row.tobashiRate)],
    ["和了率", (row) => formatRateValue(row.winRate)],
    ["放銃率", (row) => formatRateValue(row.dealInRate)],
    ["リーチ率", (row) => formatRateValue(row.riichiRate)],
    ["副露率", (row) => formatRateValue(row.callRate)],
  ].forEach(([label, getter]) => {
    rows.push([label, ...aggregateRows.map((row) => getter(row))]);
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
        secondOrBetterCount: 0,
        avoidLastCount: 0,
        tobiCount: 0,
        tobashiCredit: 0,
        tobashiBonusTotal: 0,
        leagueScoreTotal: 0,
        chipDiffTotal: 0,
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
      row.secondOrBetterCount += rank <= 2 ? 1 : 0;
      row.avoidLastCount += rank < Math.max(1, (match.players || []).length) ? 1 : 0;
      row.tobiCount += Array.isArray(match.bustedIds) && match.bustedIds.includes(player.id) ? 1 : 0;
      row.tobashiCredit += Number((match.tobashiShares && match.tobashiShares[player.id]) || 0);
      row.tobashiBonusTotal += getPlayerTobashiBonus({ ...player, rank }, match);
      row.leagueScoreTotal += getPlayerLeagueScore({ ...player, rank }, match);
      row.chipDiffTotal += getPlayerChipDiff(player);
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
      rentaiRate: row.games ? (row.secondOrBetterCount / row.games) * 100 : 0,
      avoidLastRate: row.games ? (row.avoidLastCount / row.games) * 100 : 0,
      tobiRate: row.games ? (row.tobiCount / row.games) * 100 : 0,
      tobashiRate: row.games ? (row.tobashiCredit / row.games) * 100 : 0,
      totalTobashiBonus: row.tobashiBonusTotal,
      totalLeagueScore: row.leagueScoreTotal,
      averageLeagueScore: row.games ? row.leagueScoreTotal / row.games : 0,
      totalChipDiff: row.chipDiffTotal,
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
  return Number(player.score || 0) - RETURN_SCORE;
}

function getPlayerChipDiff(player) {
  const chipDiff = Number(player.chipDiff);
  if (Number.isFinite(chipDiff)) {
    return chipDiff;
  }

  if (Number.isFinite(Number(player.chips))) {
    return Number(player.chips) - STARTING_CHIPS;
  }

  return 0;
}

function getPlayerRoundedScore(player) {
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

function getPlayerTobashiBonus(player, match) {
  const settings = match.settings || state.settings || {};
  return (
    getTobashiBonusForPlayer(player.id, match.tobashiShares || {}, settings) -
    getTobashiPenaltyForPlayer(player.id, match.bustedIds || [], settings)
  );
}

function getPlayerLeagueScore(player, match) {
  return getPlayerRoundedScore(player) + getPlayerUma(player, match) + getPlayerTobashiBonus(player, match);
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

function toneClass(value) {
  const number = Number(value || 0);
  return number > 0 ? "plus" : number < 0 ? "minus" : "";
}

function rateBadge(label, value, median, lowerIsBetter = false) {
  return `<span class="${rateToneClass(value, median, lowerIsBetter)}">${label}${Number(value || 0).toFixed(1)}%</span>`;
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

function normalizeChip(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value);
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

function ensureRonLoser() {
  if (draft.result !== "ron") {
    return;
  }

  if (!draft.winnerId && state.players[0]) {
    draft.winnerId = state.players[0].id;
  }

  if (!draft.loserId || draft.loserId === draft.winnerId) {
    const loser = state.players.find((player) => player.id !== draft.winnerId);
    draft.loserId = loser ? loser.id : "";
  }
}

function applyWinScoreDeltas() {
  draft.deltas = createDeltaMap(state.players);
  if (!isWinningResult()) {
    return;
  }

  const scoreResult = getSelectedScoreResult();
  const winnerId = draft.winnerId;
  draft.winScore = scoreResult.valid ? scoreResult.totalGain : 0;
  if (!winnerId || !scoreResult.valid) {
    return;
  }

  if (draft.result === "ron") {
    ensureRonLoser();
    if (!draft.loserId || draft.loserId === winnerId) {
      return;
    }

    draft.deltas[winnerId] = scoreResult.totalGain;
    draft.deltas[draft.loserId] = -scoreResult.totalGain;
    return;
  }

  scoreResult.payments.forEach((payment) => {
    draft.deltas[payment.playerId] = -payment.value;
    draft.deltas[winnerId] += payment.value;
  });
}

function getSelectedScoreResult() {
  if (!isWinningResult()) {
    return createInvalidScoreResult("");
  }

  const winnerId = draft.winnerId;
  if (!winnerId) {
    return createInvalidScoreResult("和了者を選択してください");
  }

  const hanOption = getScoreHanOption();
  if (!hanOption || !hanOption.value) {
    return createInvalidScoreResult("翻を選択してください");
  }

  const dealerId = getDealerId();
  const winnerIsDealer = winnerId === dealerId;
  const score = hanOption.limit
    ? calculateLimitScore(hanOption.limit, winnerIsDealer)
    : calculateStandardScore(hanOption.han, normalizeFuValue(draft.scoreFu), winnerIsDealer);
  if (!score.valid) {
    return score;
  }

  if (draft.result === "ron") {
    const value = winnerIsDealer ? score.dealerRon : score.childRon;
    return {
      valid: true,
      totalGain: value,
      payments: [],
      display: `${score.label} ${formatNumber(value)}`,
      detail: `${winnerIsDealer ? "親" : "子"} / ロン / ${score.detail}`,
    };
  }

  const payers = state.players.filter((player) => player.id !== winnerId);
  const payments = payers.map((player) => ({
    playerId: player.id,
    value: winnerIsDealer
      ? score.dealerTsumo
      : player.id === dealerId
        ? score.childTsumoDealer
        : score.childTsumoChild,
  }));
  const totalGain = payments.reduce((sum, payment) => sum + payment.value, 0);
  const display = winnerIsDealer
    ? `${score.label} ${formatNumber(score.dealerTsumo)}オール`
    : `${score.label} 子${formatNumber(score.childTsumoChild)} / 親${formatNumber(score.childTsumoDealer)}`;

  return {
    valid: true,
    totalGain,
    payments,
    display,
    detail: `${winnerIsDealer ? "親" : "子"} / ツモ / ${score.detail}`,
  };
}

function getScoreHanOption() {
  return SCORE_HAN_OPTIONS.find((option) => option.value === String(draft.scoreHan || "")) || SCORE_HAN_OPTIONS[0];
}

function normalizeFuValue(value) {
  const number = Number(value || 30);
  return SCORE_FU_OPTIONS.includes(number) ? number : 30;
}

function calculateStandardScore(han, fu, winnerIsDealer) {
  if (!isValidScoreCombination(han, fu, draft.result)) {
    return createInvalidScoreResult(`${han}翻${fu}符は${draft.result === "ron" ? "ロン" : "ツモ"}では点数表にない組み合わせです`);
  }

  const base = fu * (2 ** (han + 2));
  if (isKiriageMangan(han, fu)) {
    return calculateLimitScore("mangan", winnerIsDealer, `${han}翻${fu}符`, "切り上げ満貫");
  }

  if (base >= 2000) {
    return calculateLimitScore("mangan", winnerIsDealer, `${han}翻${fu}符`, "満貫");
  }

  return {
    valid: true,
    label: `${han}翻${fu}符`,
    detail: `${han}翻${fu}符`,
    childRon: roundUpToHundred(base * 4),
    dealerRon: roundUpToHundred(base * 6),
    childTsumoChild: roundUpToHundred(base),
    childTsumoDealer: roundUpToHundred(base * 2),
    dealerTsumo: roundUpToHundred(base * 2),
  };
}

function calculateLimitScore(limitKey, winnerIsDealer, detailLabel = "", reason = "") {
  const score = LIMIT_SCORES[limitKey];
  if (!score) {
    return createInvalidScoreResult("点数表にない翻数です");
  }

  const detail = [detailLabel || score.label, reason].filter(Boolean).join(" / ");
  return {
    valid: true,
    label: reason === "切り上げ満貫" ? `${score.label}(切り上げ)` : score.label,
    detail,
    childRon: score.childRon,
    dealerRon: score.dealerRon,
    childTsumoChild: score.childTsumoChild,
    childTsumoDealer: score.childTsumoDealer,
    dealerTsumo: score.dealerTsumo,
  };
}

function isValidScoreCombination(han, fu, result) {
  if (fu === 20) {
    return result === "tsumo" && han >= 2;
  }

  if (fu === 25) {
    return han >= 2 && (result === "ron" || han >= 3);
  }

  return fu >= 30;
}

function isKiriageMangan(han, fu) {
  return (han === 3 && fu === 60) || (han === 4 && fu === 30);
}

function roundUpToHundred(value) {
  const number = Number(value || 0);
  if (number <= 0) {
    return 0;
  }

  return Math.ceil(number / 100) * 100;
}

function createInvalidScoreResult(message) {
  return {
    valid: false,
    totalGain: 0,
    payments: [],
    display: "",
    detail: "",
    message: message || "翻・符を選択してください",
  };
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
