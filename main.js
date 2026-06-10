if (!window.Matter) {
  window.Matter = createMatterFallback();
}

const {
  Engine,
  Render,
  Runner,
  Bodies,
  Body,
  Composite,
  Events,
  Vector,
} = Matter;

const canvas = document.querySelector("#game");
const wrap = document.querySelector(".game-wrap");
const dropZoneEl = document.querySelector("#dropZone");
const scoreEl = document.querySelector("#score");
const bestEl = document.querySelector("#best");
const nextCatEl = document.querySelector("#nextCat");
const nextPreviewCanvas = document.querySelector("#nextPreview");
const aimEl = document.querySelector("#aim");
const messageEl = document.querySelector("#message");
const finalScoreEl = document.querySelector("#finalScore");
const titleScreenEl = document.querySelector("#titleScreen");
const titleMascotEl = document.querySelector("#titleMascot");
const titleMascotOpenEl = document.querySelector("#titleMascotOpen");
const titleMascotSmileEl = document.querySelector("#titleMascotSmile");
const titleBestEl = document.querySelector("#titleBest");
const startGameButton = document.querySelector("#startGame");
const restartButton = document.querySelector("#restart");
const openRankingButton = document.querySelector("#openRanking");
const openTitleCollectionButton = document.querySelector("#openTitleCollection");
const rankingPanelEl = document.querySelector("#rankingPanel");
const rankingListEl = document.querySelector("#rankingList");
const rankingStatusEl = document.querySelector("#rankingStatus");
const closeRankingButton = document.querySelector("#closeRanking");
const titleCollectionPanelEl = document.querySelector("#titleCollectionPanel");
const titleCollectionListEl = document.querySelector("#titleCollectionList");
const closeTitleCollectionButton = document.querySelector("#closeTitleCollection");
const finalMaxCatEl = document.querySelector("#finalMaxCat");
const finalTitleEl = document.querySelector("#finalTitle");
const copyShareTextButton = document.querySelector("#copyShareText");
const onlineRankingForm = document.querySelector("#onlineRankingForm");
const playerNameInput = document.querySelector("#playerName");
const submitOnlineRankingButton = document.querySelector("#submitOnlineRanking");
const onlineRankingStatusEl = document.querySelector("#onlineRankingStatus");
const toggleBgmButton = document.querySelector("#toggleBgm");
const toggleSeButton = document.querySelector("#toggleSe");
const titleToggleBgmButton = document.querySelector("#titleToggleBgm");
const titleToggleSeButton = document.querySelector("#titleToggleSe");
const bgmVolumeInput = document.querySelector("#bgmVolume");
const seVolumeInput = document.querySelector("#seVolume");
const pauseButton = document.querySelector("#pauseButton");
const pauseScreenEl = document.querySelector("#pauseScreen");
const resumeGameButton = document.querySelector("#resumeGame");
const retryGameButton = document.querySelector("#retryGame");
const backToTitleButton = document.querySelector("#backToTitle");

const STORAGE_KEY = "nekomaru.bestScore";
const AUDIO_STORAGE_KEY = "nekomaru.audioSettings";
const RANKING_STORAGE_KEY = "nekomaru.localRanking";
const TITLE_COLLECTION_STORAGE_KEY = "nekomaru.earnedTitles";
const BOARD_WIDTH = 420;
const BOARD_HEIGHT = 620;
const DROP_Y = 34;
const SUPABASE_CONFIG = window.NEKOMARU_SUPABASE || {};
const ONLINE_RANKING_LIMIT = 100;
const SCORE_TITLES = [
  { min: 45000, title: "ねこだま伝説" },
  { min: 40000, title: "ねこだま神" },
  { min: 35000, title: "ねこだま王" },
  { min: 30000, title: "ねこだま勇者" },
  { min: 25000, title: "ねこだま将軍" },
  { min: 20000, title: "ねこだま達人" },
  { min: 15000, title: "ねこだま使い" },
  { min: 10000, title: "ねこだま見習い" },
  { min: 0, title: "ねこだま初心者" },
];
const CAT_TYPES = [
  { name: "白猫", radius: 25, color: "#fff9ef", text: "#4b3a2e", score: 1, image: "01-white-cat.png" },
  { name: "黒猫", radius: 30, color: "#2b2828", text: "#ffffff", score: 3, image: "02-black-cat.png" },
  { name: "ハチワレ", radius: 35, color: "#8fc9ff", text: "#17334a", score: 6, image: "03-hachiware.png" },
  { name: "茶トラ", radius: 40, color: "#d9822b", text: "#ffffff", score: 10, image: "04-orange-tabby.png" },
  { name: "キジトラ", radius: 46, color: "#8b7656", text: "#ffffff", score: 15, image: "05-brown-tabby.png" },
  { name: "サバトラ", radius: 54, color: "#9eabb7", text: "#1f2a33", score: 21, image: "06-silver-tabby.png" },
  { name: "三毛猫", radius: 62, color: "#f1b25f", text: "#49301c", score: 28, image: "07-calico.png" },
  { name: "長毛猫", radius: 74, color: "#e8d5bd", text: "#4a3728", score: 36, image: "08-longhair.png" },
  { name: "超もふもふ猫", radius: 86, color: "#d7b4ec", text: "#42255b", score: 45, image: "09-ultra-fluffy.png" },
  { name: "ねこだま王", radius: 102, color: "#f2d45c", text: "#4d3900", score: 60, image: "10-nekodama-king.png" },
];

const CAT_ASSET_DIR = "assets/cats/";
const catImages = CAT_TYPES.map((cat) => loadCatImage(cat.image));
const catImageMetrics = CAT_TYPES.map(() => ({ ready: false, offsetX: 0, offsetY: 0, scale: 1 }));
const AUDIO_SOURCES = {
  drop: "assets/audio/drop.mp3",
  merge: "assets/audio/merge.mp3",
  bigMerge: "assets/audio/bigMerge.mp3",
  kingMerge: "assets/audio/kingMerge.mp3",
  gameOver: "assets/audio/gameOver.mp3",
  button: "assets/audio/button.mp3",
  bgm: "assets/audio/bgm.mp3",
};

let engine;
let render;
let runner;
let physicsRunning = false;
let width = BOARD_WIDTH;
let height = BOARD_HEIGHT;
let walls = [];
let score = 0;
let best = Math.max(0, Math.floor(Number(localStorage.getItem(STORAGE_KEY) || 0) || 0));
let earnedTitleMins = loadEarnedTitleMins();
let nextType = 0;
let maxReachedType = 0;
let pointerX = 0;
let canDrop = true;
let isGameOver = false;
let mergingPairs = new Set();
let rafId = 0;
let effectParticles = [];
let shakeUntil = 0;
let shakePower = 0;
let gameStarted = false;
let isPaused = false;
let isAiming = false;
let isStarting = false;
let titleTimers = [];
let audioSettings = loadAudioSettings();
let audioContext = null;
let audioUnlocked = false;
let bgmAudio = null;
let bgmTimer = 0;
let sePools = {};
let lastShareText = "";
let onlineRankingSubmitted = false;

bestEl.textContent = best;
titleBestEl.textContent = best;
syncTitleCollectionFromBest();

setupAudio();
setupTitleCatAnimation();

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getGameOverY() {
  const cssValue = getComputedStyle(document.documentElement).getPropertyValue("--game-over-y");
  const parsed = Number.parseFloat(cssValue);
  return Number.isFinite(parsed) ? parsed : 160;
}

function updateLayoutScale() {
  const appEl = document.querySelector(".app");
  if (!appEl) return;
  const viewportWidth = window.visualViewport?.width || window.innerWidth;
  const viewportHeight = window.visualViewport?.height || window.innerHeight;
  const scale = Math.min(1, viewportWidth / appEl.offsetWidth, viewportHeight / appEl.offsetHeight);
  document.documentElement.style.setProperty("--app-scale", String(Math.max(0.1, scale)));
}

function randomStartType() {
  return Math.floor(Math.random() * 4);
}

function loadCatImage(fileName) {
  const image = new Image();
  image.decoding = "async";
  image.src = `${CAT_ASSET_DIR}${fileName}`;
  image.addEventListener("load", () => {
    measureCatImage(fileName, image);
    if (nextPreviewCanvas) drawNextPreview();
  });
  return image;
}

function measureCatImage(fileName, image) {
  const index = CAT_TYPES.findIndex((cat) => cat.image === fileName);
  if (index < 0) return;
  const size = 128;
  const scratch = document.createElement("canvas");
  scratch.width = size;
  scratch.height = size;
  const context = scratch.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0, size, size);
  const data = context.getImageData(0, 0, size, size).data;
  let minX = size;
  let minY = size;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (data[(y * size + x) * 4 + 3] < 24) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (minX >= maxX || minY >= maxY) return;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const contentSize = Math.max(maxX - minX + 1, maxY - minY + 1);
  catImageMetrics[index] = {
    ready: true,
    offsetX: (size / 2 - centerX) / size,
    offsetY: (size / 2 - centerY) / size,
    scale: size / contentSize,
  };
}

function loadAudioSettings() {
  try {
    return {
      bgmOn: true,
      seOn: true,
      bgmVolume: 0.45,
      seVolume: 0.7,
      ...JSON.parse(localStorage.getItem(AUDIO_STORAGE_KEY) || "{}"),
    };
  } catch {
    return { bgmOn: true, seOn: true, bgmVolume: 0.45, seVolume: 0.7 };
  }
}

function saveAudioSettings() {
  try {
    localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(audioSettings));
  } catch {
    // Storage can be unavailable in private modes; audio still works for the session.
  }
}

function loadRanking() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RANKING_STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry) => Number.isFinite(entry?.score) && Number.isInteger(entry?.maxCat) && entry.maxCat >= 0)
      .map((entry) => ({
        score: Math.max(0, Math.floor(entry.score)),
        maxCat: clamp(entry.maxCat, 0, CAT_TYPES.length - 1),
        title: typeof entry.title === "string" ? entry.title : getTitleByScore(entry.score),
        date: typeof entry.date === "string" ? entry.date : new Date().toISOString(),
      }))
      .sort(sortRanking)
      .slice(0, 10);
  } catch {
    return [];
  }
}

function sortRanking(a, b) {
  if (b.score !== a.score) return b.score - a.score;
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

function saveRankingRecord() {
  const entry = {
    score,
    maxCat: maxReachedType,
    title: getTitleByScore(score),
    date: new Date().toISOString(),
  };
  const ranking = [...loadRanking(), entry].sort(sortRanking).slice(0, 10);
  try {
    localStorage.setItem(RANKING_STORAGE_KEY, JSON.stringify(ranking));
  } catch {
    // Ranking is optional; the game over flow should never fail because storage is unavailable.
  }
  if (!rankingPanelEl.classList.contains("hidden")) renderRanking();
}

function isSupabaseConfigured() {
  return Boolean(SUPABASE_CONFIG.restUrl && SUPABASE_CONFIG.publishableKey && SUPABASE_CONFIG.tableName);
}

function getSupabaseTableUrl(query = "") {
  const base = String(SUPABASE_CONFIG.restUrl || "").replace(/\/+$/, "");
  const tableName = encodeURIComponent(SUPABASE_CONFIG.tableName || "");
  return `${base}/${tableName}${query}`;
}

function getSupabaseHeaders(extra = {}) {
  const key = SUPABASE_CONFIG.publishableKey;
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...extra,
  };
}

async function fetchOnlineRanking() {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");
  const queryWithTitle = `?select=name,score,max_cat,title,created_at&order=score.desc,created_at.desc&limit=${ONLINE_RANKING_LIMIT}`;
  const legacyQuery = `?select=name,score,max_cat,created_at&order=score.desc,created_at.desc&limit=${ONLINE_RANKING_LIMIT}`;
  let response = await fetch(getSupabaseTableUrl(queryWithTitle), {
    method: "GET",
    headers: getSupabaseHeaders(),
  });
  if (!response.ok) {
    response = await fetch(getSupabaseTableUrl(legacyQuery), {
      method: "GET",
      headers: getSupabaseHeaders(),
    });
  }
  if (!response.ok) throw new Error(`Ranking fetch failed: ${response.status}`);
  const rows = await response.json();
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((row) => Number.isInteger(row?.score) && row.score >= 0)
    .map((row) => ({
      name: String(row.name || "ななし").slice(0, 12),
      score: row.score,
      maxCat: String(row.max_cat || "白猫"),
      title: typeof row.title === "string" && row.title ? row.title : getTitleByScore(row.score),
      date: typeof row.created_at === "string" ? row.created_at : "",
    }));
}

function validateOnlineRankingName(name) {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, message: "名前を入力してください" };
  if ([...trimmed].length > 12) return { ok: false, message: "名前は12文字までです" };
  return { ok: true, value: trimmed };
}

function validateOnlineRankingScore(value) {
  if (!Number.isInteger(value) || value < 0) {
    return { ok: false, message: "スコアが正しくありません" };
  }
  return { ok: true, value };
}

function getTitleByScore(value) {
  const safeScore = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  return SCORE_TITLES.find((item) => safeScore >= item.min)?.title || "ねこだま初心者";
}

function getTitleMilestones() {
  return [...SCORE_TITLES].sort((a, b) => a.min - b.min);
}

function loadEarnedTitleMins() {
  try {
    const parsed = JSON.parse(localStorage.getItem(TITLE_COLLECTION_STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    const validMins = new Set(getTitleMilestones().map((item) => item.min));
    return [...new Set(parsed.filter((value) => Number.isInteger(value) && validMins.has(value)))].sort((a, b) => a - b);
  } catch {
    return [];
  }
}

function saveEarnedTitleMins() {
  try {
    localStorage.setItem(TITLE_COLLECTION_STORAGE_KEY, JSON.stringify(earnedTitleMins));
  } catch {
    // Title collection is cosmetic; gameplay should continue even if storage is unavailable.
  }
}

function syncTitleCollectionFromBest() {
  const earned = new Set(earnedTitleMins);
  for (const item of getTitleMilestones()) {
    if (best >= item.min) earned.add(item.min);
  }
  const next = [...earned].sort((a, b) => a - b);
  const changed = next.length !== earnedTitleMins.length || next.some((value, index) => value !== earnedTitleMins[index]);
  earnedTitleMins = next;
  if (changed) saveEarnedTitleMins();
}

async function postOnlineRanking(payload) {
  const response = await fetch(getSupabaseTableUrl(), {
    method: "POST",
    headers: getSupabaseHeaders({
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    }),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Ranking submit failed: ${response.status}`);
}

async function submitOnlineRanking(event) {
  event.preventDefault();
  playSe("button");
  if (onlineRankingSubmitted) {
    onlineRankingStatusEl.textContent = "送信済みです";
    return;
  }
  onlineRankingStatusEl.textContent = "";
  const nameResult = validateOnlineRankingName(playerNameInput.value);
  if (!nameResult.ok) {
    onlineRankingStatusEl.textContent = nameResult.message;
    return;
  }
  const scoreResult = validateOnlineRankingScore(score);
  if (!scoreResult.ok) {
    onlineRankingStatusEl.textContent = scoreResult.message;
    return;
  }
  if (!isSupabaseConfigured()) {
    onlineRankingStatusEl.textContent = "オンラインランキングは未設定です";
    return;
  }

  submitOnlineRankingButton.disabled = true;
  submitOnlineRankingButton.textContent = "送信中";
  try {
    const payload = {
      name: nameResult.value,
      score: scoreResult.value,
      max_cat: CAT_TYPES[maxReachedType].name,
      title: getTitleByScore(scoreResult.value),
      created_at: new Date().toISOString(),
    };
    try {
      await postOnlineRanking(payload);
    } catch {
      const { title, ...legacyPayload } = payload;
      await postOnlineRanking(legacyPayload);
    }
    onlineRankingSubmitted = true;
    onlineRankingStatusEl.textContent = "送信しました";
    submitOnlineRankingButton.textContent = "送信済み";
    playerNameInput.blur();
    renderRanking();
  } catch {
    onlineRankingStatusEl.textContent = "送信できませんでした";
  } finally {
    submitOnlineRankingButton.disabled = onlineRankingSubmitted;
    if (!onlineRankingSubmitted) submitOnlineRankingButton.textContent = "ランキングに送信";
  }
}

function formatRankingDate(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${y}/${m}/${d} ${h}:${min}`;
}

function appendRankingEntries(entries, options = {}) {
  if (!rankingListEl) return;
  rankingListEl.replaceChildren();
  if (!entries.length) {
    const empty = document.createElement("li");
    empty.className = "ranking-empty";
    empty.textContent = "まだ記録がありません";
    rankingListEl.append(empty);
    return;
  }
  entries.forEach((entry, index) => {
    const item = document.createElement("li");
    const rank = document.createElement("span");
    const body = document.createElement("span");
    const nameText = document.createElement("span");
    const scoreText = document.createElement("span");
    const meta = document.createElement("span");
    rank.className = "ranking-rank";
    if (index === 0) rank.classList.add("rank-gold");
    if (index === 1) rank.classList.add("rank-silver");
    if (index === 2) rank.classList.add("rank-bronze");
    body.className = "ranking-body";
    nameText.className = "ranking-name";
    scoreText.className = "ranking-score";
    meta.className = "ranking-meta";
    rank.textContent = index < 3 ? `${["👑", "♕", "♔"][index]} ${index + 1}` : `${index + 1}`;
    const displayName = options.online ? entry.name : "LOCAL";
    nameText.textContent = displayName;
    scoreText.textContent = `SCORE ${entry.score}`;
    meta.textContent = formatRankingDate(entry.date);
    body.append(nameText, scoreText, meta);
    item.append(rank, body);
    rankingListEl.append(item);
  });
}

async function renderRanking() {
  if (!rankingListEl) return;
  rankingStatusEl.textContent = "";
  if (!isSupabaseConfigured()) {
    rankingStatusEl.textContent = "オンラインランキングは未設定です";
    appendRankingEntries(loadRanking());
    return;
  }
  rankingStatusEl.textContent = "読み込み中...";
  try {
    const entries = await fetchOnlineRanking();
    rankingStatusEl.textContent = "上位100件";
    appendRankingEntries(entries, { online: true });
  } catch {
    rankingStatusEl.textContent = "通信失敗。ローカル記録を表示中";
    appendRankingEntries(loadRanking());
  }
}

function getShareText() {
  const catName = CAT_TYPES[maxReachedType].name;
  const crown = maxReachedType === CAT_TYPES.length - 1 ? " 👑" : "";
  return `ねこまる SCORE ${score} / 最大到達：${catName}${crown}`;
}

async function copyShareText() {
  playSe("button");
  const text = lastShareText || getShareText();
  try {
    if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
    await navigator.clipboard.writeText(text);
    copyShareTextButton.textContent = "コピーしました";
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    copyShareTextButton.textContent = copied ? "コピーしました" : "コピーできませんでした";
  }
  window.setTimeout(() => {
    copyShareTextButton.textContent = "投稿用テキストをコピー";
  }, 1400);
}

function openRanking() {
  playSe("button");
  renderRanking();
  titleCollectionPanelEl.classList.add("hidden");
  rankingPanelEl.classList.remove("hidden");
}

function closeRanking() {
  playSe("button");
  rankingPanelEl.classList.add("hidden");
}

function renderTitleCollection() {
  if (!titleCollectionListEl) return;
  syncTitleCollectionFromBest();
  const earned = new Set(earnedTitleMins);
  titleCollectionListEl.replaceChildren();
  for (const item of getTitleMilestones()) {
    const unlocked = earned.has(item.min);
    const row = document.createElement("li");
    const icon = document.createElement("span");
    const name = document.createElement("span");
    const required = document.createElement("span");

    row.classList.toggle("is-locked", !unlocked);
    icon.className = "title-collection-icon";
    name.className = "title-collection-name";
    required.className = "title-collection-score";

    icon.textContent = unlocked ? "✅" : "🔒";
    name.textContent = unlocked ? getTitleByScore(item.min) : "？？？？？";
    required.textContent = `${item.min}点`;

    row.append(icon, name, required);
    titleCollectionListEl.append(row);
  }
}

function openTitleCollection() {
  playSe("button");
  renderTitleCollection();
  rankingPanelEl.classList.add("hidden");
  titleCollectionPanelEl.classList.remove("hidden");
}

function closeTitleCollection() {
  playSe("button");
  titleCollectionPanelEl.classList.add("hidden");
}

function setupAudio() {
  bgmAudio = createAudio(AUDIO_SOURCES.bgm, true);
  for (const name of ["drop", "merge", "bigMerge", "kingMerge", "gameOver", "button"]) {
    sePools[name] = Array.from({ length: name === "merge" ? 6 : 4 }, () => createAudio(AUDIO_SOURCES[name], false));
  }
  applyAudioSettingsToUi();
  updateBgmPlayback();
}

function createAudio(src, loop) {
  const audio = new Audio(src);
  audio.preload = "auto";
  audio.loop = loop;
  audio.playsInline = true;
  audio.addEventListener("error", () => {
    audio.dataset.unavailable = "true";
  });
  return audio;
}

function applyAudioSettingsToUi() {
  for (const button of [toggleBgmButton, titleToggleBgmButton].filter(Boolean)) {
    button.textContent = audioSettings.bgmOn ? "BGM ON" : "BGM OFF";
    button.setAttribute("aria-pressed", String(audioSettings.bgmOn));
  }
  for (const button of [toggleSeButton, titleToggleSeButton].filter(Boolean)) {
    button.textContent = audioSettings.seOn ? "SE ON" : "SE OFF";
    button.setAttribute("aria-pressed", String(audioSettings.seOn));
  }
  if (bgmVolumeInput) bgmVolumeInput.value = String(audioSettings.bgmVolume);
  if (seVolumeInput) seVolumeInput.value = String(audioSettings.seVolume);
  if (bgmAudio) bgmAudio.volume = audioSettings.bgmOn ? audioSettings.bgmVolume : 0;
}

function unlockAudio() {
  if (audioUnlocked) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (AudioContextClass && !audioContext) {
    audioContext = new AudioContextClass();
  }
  audioContext?.resume?.();
  audioUnlocked = true;
  updateBgmPlayback();
}

function playSe(name) {
  if (!audioSettings.seOn) return;
  unlockAudio();
  if (!playAudioFromPool(name)) {
    playSyntheticSe(name);
  }
}

function playAudioFromPool(name) {
  const pool = sePools[name];
  if (!pool) return false;
  const audio = pool.find((item) => item.paused || item.ended) || pool[0];
  if (!audio || audio.dataset.unavailable === "true" || audio.readyState === 0) return false;
  audio.volume = audioSettings.seVolume;
  audio.currentTime = 0;
  audio.play().catch(() => playSyntheticSe(name));
  return true;
}

function playSyntheticSe(name) {
  if (!audioContext || audioContext.state === "suspended") return;
  const presets = {
    drop: [[420, 0.055, "triangle"], [620, 0.035, "sine"]],
    merge: [[180, 0.08, "sine"], [260, 0.05, "triangle"]],
    bigMerge: [[260, 0.09, "triangle"], [520, 0.09, "sine"], [780, 0.12, "sine"]],
    kingMerge: [[220, 0.08, "triangle"], [440, 0.1, "sine"], [660, 0.12, "sine"], [880, 0.16, "sine"]],
    gameOver: [[260, 0.12, "triangle"], [180, 0.18, "sine"]],
    button: [[560, 0.045, "triangle"]],
  };
  let offset = 0;
  for (const [freq, duration, type] of presets[name] || presets.button) {
    scheduleTone(freq, duration, type, offset, audioSettings.seVolume * 0.18);
    offset += duration * 0.72;
  }
}

function scheduleTone(freq, duration, type, offset, volume) {
  const now = audioContext.currentTime + offset;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}

function updateBgmPlayback() {
  if (!bgmAudio) return;
  bgmAudio.volume = audioSettings.bgmOn ? audioSettings.bgmVolume : 0;
  if (!audioSettings.bgmOn || !audioUnlocked || !gameStarted) {
    bgmAudio.pause();
    stopSyntheticBgm();
    return;
  }
  if (bgmAudio.dataset.unavailable !== "true") {
    bgmAudio.play().then(stopSyntheticBgm).catch(startSyntheticBgm);
  } else {
    startSyntheticBgm();
  }
}

function startSyntheticBgm() {
  if (bgmTimer || !audioContext || !audioSettings.bgmOn || !gameStarted) return;
  const playLoop = () => {
    if (!audioSettings.bgmOn || !gameStarted || !audioContext || audioContext.state === "suspended") return;
    const notes = [392, 494, 587, 494, 440, 523, 659, 523];
    notes.forEach((note, index) => {
      scheduleTone(note, 0.16, "sine", index * 0.22, audioSettings.bgmVolume * 0.045);
    });
  };
  playLoop();
  bgmTimer = window.setInterval(playLoop, 2200);
}

function stopSyntheticBgm() {
  if (!bgmTimer) return;
  window.clearInterval(bgmTimer);
  bgmTimer = 0;
}

function setup() {
  updateLayoutScale();
  width = BOARD_WIDTH;
  height = BOARD_HEIGHT;
  pointerX = pointerX || width / 2;
  canvas.width = width * devicePixelRatio;
  canvas.height = height * devicePixelRatio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  engine = Engine.create();
  engine.gravity.y = 1.05;

  render = Render.create({
    canvas,
    engine,
    options: {
      width,
      height,
      wireframes: false,
      background: "transparent",
      pixelRatio: devicePixelRatio,
    },
  });

  runner = Runner.create();
  createWalls();
  nextType = randomStartType();
  updateHud();
  setAim(pointerX);

  Events.on(engine, "collisionStart", handleCollisions);
  Events.on(render, "afterRender", drawCats);
  Events.on(engine, "afterUpdate", checkGameOver);
  Render.run(render);
  Runner.run(runner, engine);
  physicsRunning = true;
}

function createWalls() {
  const wallStyle = { fillStyle: "#4a3728" };
  walls = [
    Bodies.rectangle(-15, height / 2, 30, height * 2, { isStatic: true, render: wallStyle }),
    Bodies.rectangle(width + 15, height / 2, 30, height * 2, { isStatic: true, render: wallStyle }),
    Bodies.rectangle(width / 2, height + 18, width, 36, { isStatic: true, render: wallStyle }),
  ];
  Composite.add(engine.world, walls);
}

function createCat(type, x, y) {
  const cat = CAT_TYPES[type];
  const body = Bodies.circle(x, y, cat.radius, {
    restitution: 0.086,
    friction: 0.75,
    frictionAir: 0.015,
    density: 0.0014,
    render: {
      fillStyle: cat.color,
      strokeStyle: "#4a3728",
      lineWidth: 2,
    },
  });
  body.label = "cat";
  body.catType = type;
  body.spawnedAt = engine.timing.timestamp;
  return body;
}

function setAim(clientOrLocalX) {
  const r = CAT_TYPES[nextType].radius;
  pointerX = clamp(clientOrLocalX, r + 8, width - r - 8);
  aimEl.style.left = `${pointerX}px`;
  dropZoneEl?.style.setProperty("--drop-aim", `${(pointerX / width) * 100}%`);
}

function dropCat() {
  if (!gameStarted || isPaused || !canDrop || isGameOver) return;
  canDrop = false;
  maxReachedType = Math.max(maxReachedType, nextType);
  const cat = createCat(nextType, pointerX, DROP_Y);
  Composite.add(engine.world, cat);
  playSe("drop");
  nextType = randomStartType();
  updateHud();
  setAim(pointerX);
  setTimeout(() => {
    canDrop = !isGameOver;
  }, 520);
}

function setAimFromDropZone(event) {
  if (!dropZoneEl || !width) return;
  const rect = dropZoneEl.getBoundingClientRect();
  const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
  setAim(ratio * width);
}

function canUseDropZone() {
  return gameStarted && !isPaused && !isGameOver && canDrop && !isStarting;
}

function cancelDropZoneAim() {
  isAiming = false;
  dropZoneEl?.classList.remove("is-active");
}

function startDropZoneAim(event) {
  if (!canUseDropZone()) return;
  event.preventDefault();
  isAiming = true;
  dropZoneEl.classList.add("is-active");
  dropZoneEl.setPointerCapture?.(event.pointerId);
  setAimFromDropZone(event);
}

function moveDropZoneAim(event) {
  if (!isAiming) return;
  event.preventDefault();
  setAimFromDropZone(event);
}

function finishDropZoneAim(event) {
  if (!isAiming) return;
  event.preventDefault();
  setAimFromDropZone(event);
  cancelDropZoneAim();
  if (dropZoneEl.hasPointerCapture?.(event.pointerId)) {
    dropZoneEl.releasePointerCapture(event.pointerId);
  }
  dropCat();
}

function handleCollisions(event) {
  for (const pair of event.pairs) {
    const a = pair.bodyA;
    const b = pair.bodyB;
    if (a.label !== "cat" || b.label !== "cat") continue;
    if (a.catType !== b.catType || a.catType >= CAT_TYPES.length - 1) continue;
    if (a.isMerging || b.isMerging) continue;

    const key = [a.id, b.id].sort().join(":");
    if (mergingPairs.has(key)) continue;
    mergingPairs.add(key);
    mergeCats(a, b, key);
  }
}

function mergeCats(a, b, key) {
  a.isMerging = true;
  b.isMerging = true;
  setTimeout(() => {
    if (!Composite.get(engine.world, a.id, "body") || !Composite.get(engine.world, b.id, "body")) {
      mergingPairs.delete(key);
      return;
    }
    const next = a.catType + 1;
    maxReachedType = Math.max(maxReachedType, next);
    const midpoint = Vector.mult(Vector.add(a.position, b.position), 0.5);
    Composite.remove(engine.world, [a, b]);
    const merged = createCat(next, midpoint.x, midpoint.y);
    merged.popStartedAt = performance.now();
    Body.setVelocity(merged, {
      x: (a.velocity.x + b.velocity.x) * 0.25,
      y: Math.min((a.velocity.y + b.velocity.y) * 0.2, 2),
    });
    Composite.add(engine.world, merged);
    spawnMergeEffect(midpoint.x, midpoint.y, next);
    playSe(next === CAT_TYPES.length - 1 ? "kingMerge" : next >= 7 ? "bigMerge" : "merge");
    if (next === CAT_TYPES.length - 1) {
      startShake(260, 4);
    }
    score += CAT_TYPES[next].score * 10;
    if (score > best) {
      best = score;
      try {
        localStorage.setItem(STORAGE_KEY, String(best));
      } catch {
        // Best score display still updates even if storage is unavailable.
      }
      titleBestEl.textContent = best;
    }
    updateHud();
    mergingPairs.delete(key);
  }, 40);
}

function updateHud() {
  syncTitleCollectionFromBest();
  scoreEl.textContent = score;
  bestEl.textContent = best;
  titleBestEl.textContent = best;
  nextCatEl.textContent = CAT_TYPES[nextType].name;
  nextCatEl.style.color = CAT_TYPES[nextType].text;
  nextCatEl.style.background = CAT_TYPES[nextType].color;
  nextCatEl.style.borderRadius = "999px";
  nextCatEl.style.padding = "5px 7px";
  drawNextPreview();
}

function checkGameOver() {
  if (isPaused || isGameOver || engine.timing.timestamp < 1500) return;
  const cats = Composite.allBodies(engine.world).filter((body) => body.label === "cat");
  const danger = cats.some((cat) => {
    const age = engine.timing.timestamp - cat.spawnedAt;
    const slow = Math.abs(cat.velocity.y) < 0.2 && Math.abs(cat.velocity.x) < 0.2;
    return age > 1500 && slow && cat.position.y - CAT_TYPES[cat.catType].radius < getGameOverY();
  });
  if (danger) endGame();
}

function endGame() {
  if (isGameOver) return;
  isGameOver = true;
  canDrop = false;
  cancelDropZoneAim();
  pauseButton.hidden = true;
  playSe("gameOver");
  lastShareText = getShareText();
  onlineRankingSubmitted = false;
  saveRankingRecord();
  finalScoreEl.textContent = `SCORE ${score}`;
  finalMaxCatEl.textContent = `最大到達：${CAT_TYPES[maxReachedType].name}`;
  finalTitleEl.textContent = `称号：${getTitleByScore(score)}`;
  copyShareTextButton.textContent = "投稿用テキストをコピー";
  onlineRankingStatusEl.textContent = "";
  submitOnlineRankingButton.disabled = false;
  submitOnlineRankingButton.textContent = "ランキングに送信";
  messageEl.classList.remove("hidden");
}

function restart() {
  isStarting = false;
  gameStarted = true;
  setPaused(false);
  score = 0;
  maxReachedType = 0;
  lastShareText = "";
  onlineRankingSubmitted = false;
  isGameOver = false;
  canDrop = true;
  mergingPairs.clear();
  effectParticles = [];
  shakeUntil = 0;
  shakePower = 0;
  messageEl.classList.add("hidden");
  titleScreenEl.classList.add("hidden");
  pauseButton.hidden = false;
  Composite.clear(engine.world, false);
  createWalls();
  nextType = randomStartType();
  updateHud();
  setAim(width / 2);
  updateBgmPlayback();
}

function setPaused(paused) {
  isPaused = paused;
  if (paused) cancelDropZoneAim();
  if (paused) {
    pausePhysics();
  } else {
    resumePhysics();
  }
  pauseScreenEl.classList.toggle("hidden", !paused);
  pauseButton.hidden = paused || !gameStarted || isGameOver;
}

function pausePhysics() {
  if (!runner || !physicsRunning) return;
  Runner.stop?.(runner);
  physicsRunning = false;
}

function resumePhysics() {
  if (!runner || !engine || physicsRunning) return;
  Runner.run(runner, engine);
  physicsRunning = true;
}

function openPause() {
  if (!gameStarted || isGameOver || isPaused) return;
  playSe("button");
  setPaused(true);
}

function resumeGame() {
  playSe("button");
  setPaused(false);
}

function backToTitle() {
  playSe("button");
  setPaused(false);
  gameStarted = false;
  isGameOver = false;
  canDrop = false;
  score = 0;
  maxReachedType = 0;
  lastShareText = "";
  onlineRankingSubmitted = false;
  mergingPairs.clear();
  effectParticles = [];
  shakeUntil = 0;
  shakePower = 0;
  messageEl.classList.add("hidden");
  pauseScreenEl.classList.add("hidden");
  titleScreenEl.classList.remove("hidden");
  pauseButton.hidden = true;
  if (engine) {
    Composite.clear(engine.world, false);
    createWalls();
  }
  updateHud();
  updateBgmPlayback();
}

function startGame() {
  if (isStarting || gameStarted) return;
  isStarting = true;
  rankingPanelEl.classList.add("hidden");
  unlockAudio();
  playSe("button");
  showTitleMascotSmile(260);
  pulseTitleMascot();
  window.setTimeout(() => {
    restart();
  }, 260);
}

function setupTitleCatAnimation() {
  scheduleTitleBlink();
}

function scheduleTitleBlink() {
  const delay = 4000 + Math.random() * 4000;
  const timer = window.setTimeout(() => {
    if (!gameStarted && !isStarting) {
      showTitleMascotSmile(250);
    }
    scheduleTitleBlink();
  }, delay);
  titleTimers.push(timer);
}

function showTitleMascotSmile(duration) {
  titleMascotOpenEl.classList.remove("is-visible");
  titleMascotSmileEl.classList.add("is-visible");
  window.setTimeout(() => {
    if (isStarting) return;
    titleMascotSmileEl.classList.remove("is-visible");
    titleMascotOpenEl.classList.add("is-visible");
  }, duration);
}

function pulseTitleMascot() {
  if (!titleMascotEl) return;
  titleMascotEl.classList.remove("start-pulse");
  void titleMascotEl.offsetWidth;
  titleMascotEl.classList.add("start-pulse");
  window.setTimeout(() => titleMascotEl.classList.remove("start-pulse"), 260);
}

function toggleBgmSetting() {
  playSe("button");
  audioSettings.bgmOn = !audioSettings.bgmOn;
  saveAudioSettings();
  applyAudioSettingsToUi();
  updateBgmPlayback();
}

function toggleSeSetting() {
  audioSettings.seOn = !audioSettings.seOn;
  saveAudioSettings();
  applyAudioSettingsToUi();
  if (audioSettings.seOn) playSe("button");
}

function drawCats() {
  const context = render.context;
  const cats = Composite.allBodies(engine.world).filter((body) => body.label === "cat");
  const shake = getShakeOffset();
  context.save();
  context.translate(shake.x, shake.y);
  for (const body of cats) {
    const cat = CAT_TYPES[body.catType];
    const r = cat.radius;
    const popScale = getPopScale(body);
    context.save();
    context.translate(body.position.x, body.position.y);
    context.rotate(body.angle);
    context.scale(popScale, popScale);
    if (!drawCatImage(context, body.catType, r)) {
      drawCatFace(context, body.catType, r);
    }
    context.restore();
  }
  drawEffectParticles(context);
  context.restore();
}

function spawnMergeEffect(x, y, catType) {
  const now = performance.now();
  const pawCount = 6 + Math.floor(Math.random() * 5);
  const sparkleCount = catType >= 7 ? 5 + Math.floor(Math.random() * 4) : 0;
  const baseColor = CAT_TYPES[catType].color;

  for (let i = 0; i < pawCount; i += 1) {
    const angle = (Math.PI * 2 * i) / pawCount + Math.random() * 0.35;
    const speed = 58 + Math.random() * 42;
    effectParticles.push({
      kind: "paw",
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 18,
      size: 7 + Math.random() * 4,
      color: baseColor,
      life: 400,
      born: now,
      rotate: Math.random() * Math.PI,
    });
  }

  for (let i = 0; i < sparkleCount; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 36 + Math.random() * 48;
    effectParticles.push({
      kind: "sparkle",
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 10,
      size: 8 + Math.random() * 5,
      color: i % 2 ? "#fff6a6" : "#ffd3fb",
      life: 460,
      born: now,
      rotate: Math.random() * Math.PI,
    });
  }
}

function startShake(duration, power) {
  shakeUntil = performance.now() + duration;
  shakePower = power;
}

function getShakeOffset() {
  const remain = shakeUntil - performance.now();
  if (remain <= 0) return { x: 0, y: 0 };
  const amount = shakePower * (remain / 260);
  return {
    x: (Math.random() - 0.5) * amount,
    y: (Math.random() - 0.5) * amount,
  };
}

function getPopScale(body) {
  if (!body.popStartedAt) return 1;
  const elapsed = performance.now() - body.popStartedAt;
  if (elapsed >= 300) {
    body.popStartedAt = 0;
    return 1;
  }
  if (elapsed < 120) {
    return 0.8 + (elapsed / 120) * 0.35;
  }
  return 1.15 - ((elapsed - 120) / 180) * 0.15;
}

function drawEffectParticles(context) {
  if (!effectParticles.length) return;
  const now = performance.now();

  for (let i = effectParticles.length - 1; i >= 0; i -= 1) {
    const particle = effectParticles[i];
    const age = now - particle.born;
    const progress = age / particle.life;
    if (progress >= 1) {
      effectParticles.splice(i, 1);
      continue;
    }

    const t = age / 1000;
    const x = particle.x + particle.vx * t;
    const y = particle.y + particle.vy * t + 80 * t * t;
    const alpha = 1 - progress;
    const scale = 0.75 + progress * 0.35;

    context.save();
    context.globalAlpha = alpha;
    context.translate(x, y);
    context.rotate(particle.rotate + progress * 0.8);
    context.scale(scale, scale);
    if (particle.kind === "sparkle") {
      drawSparkleParticle(context, particle.size, particle.color);
    } else {
      drawPawParticle(context, particle.size, particle.color);
    }
    context.restore();
  }
}

function drawPawParticle(context, size, color) {
  context.fillStyle = color;
  context.strokeStyle = "rgba(74, 55, 40, 0.28)";
  context.lineWidth = Math.max(1, size * 0.12);
  context.beginPath();
  context.ellipse(0, size * 0.12, size * 0.34, size * 0.28, 0, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  for (const toe of [-0.34, 0, 0.34]) {
    context.beginPath();
    context.arc(size * toe, -size * 0.26, size * 0.15, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  }
}

function drawSparkleParticle(context, size, color) {
  context.fillStyle = color;
  context.strokeStyle = "rgba(255, 186, 45, 0.45)";
  context.lineWidth = Math.max(1, size * 0.08);
  context.beginPath();
  context.moveTo(0, -size * 0.55);
  context.lineTo(size * 0.14, -size * 0.14);
  context.lineTo(size * 0.55, 0);
  context.lineTo(size * 0.14, size * 0.14);
  context.lineTo(0, size * 0.55);
  context.lineTo(-size * 0.14, size * 0.14);
  context.lineTo(-size * 0.55, 0);
  context.lineTo(-size * 0.14, -size * 0.14);
  context.closePath();
  context.fill();
  context.stroke();
}

function drawNextPreview() {
  const pixelRatio = Math.max(1, window.devicePixelRatio || 1);
  const size = 56;
  nextPreviewCanvas.width = size * pixelRatio;
  nextPreviewCanvas.height = size * pixelRatio;
  const context = nextPreviewCanvas.getContext("2d");
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, size, size);
  context.save();
  context.translate(size / 2, size / 2);
  if (!drawCatImage(context, nextType, 24)) {
    drawBaseCatCircle(context, nextType, 24);
    drawCatFace(context, nextType, 24, { showName: false });
  }
  context.restore();
}

function drawCatImage(context, type, r) {
  const image = catImages[type];
  if (!image?.complete || !image.naturalWidth) return false;
  const metrics = catImageMetrics[type];
  const drawSize = r * 2 * (metrics.ready ? metrics.scale : 1);
  const offsetX = metrics.ready ? metrics.offsetX * drawSize : 0;
  const offsetY = metrics.ready ? metrics.offsetY * drawSize : 0;

  context.save();
  context.beginPath();
  context.arc(0, 0, r - 1, 0, Math.PI * 2);
  context.clip();
  context.drawImage(image, -drawSize / 2 + offsetX, -drawSize / 2 + offsetY, drawSize, drawSize);
  context.restore();
  return true;
}

function drawCatFace(context, type, r, options = {}) {
  const { showName = true } = options;
  const cat = CAT_TYPES[type];
  const edge = "#4a3728";
  const dark = type === 1 ? "#fff8ec" : "#33251d";
  const scale = r / 50;

  context.save();
  context.beginPath();
  context.arc(0, 0, r - 2, 0, Math.PI * 2);
  context.clip();

  drawInnerEars(context, r, type);
  drawCatPattern(context, type, r);
  drawFur(context, type, r);

  const eyeY = -r * 0.1;
  const eyeX = r * 0.32;
  drawEye(context, -eyeX, eyeY, r, dark, type);
  drawEye(context, eyeX, eyeY, r, dark, type);

  context.fillStyle = type === 1 ? "#f4c7cb" : "#d47b78";
  context.strokeStyle = edge;
  context.lineWidth = Math.max(1.2, 1.7 * scale);
  context.beginPath();
  context.moveTo(0, r * 0.1);
  context.lineTo(-r * 0.08, r * 0.2);
  context.lineTo(r * 0.08, r * 0.2);
  context.closePath();
  context.fill();
  context.stroke();

  context.strokeStyle = dark;
  context.lineWidth = Math.max(1.2, 1.8 * scale);
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(0, r * 0.2);
  context.quadraticCurveTo(-r * 0.08, r * 0.32, -r * 0.2, r * 0.25);
  context.moveTo(0, r * 0.2);
  context.quadraticCurveTo(r * 0.08, r * 0.32, r * 0.2, r * 0.25);
  context.stroke();

  drawWhiskers(context, r, dark);
  drawTypeAccent(context, type, r);
  if (showName) drawCatName(context, cat, r);
  context.restore();
}

function drawBaseCatCircle(context, type, r) {
  const cat = CAT_TYPES[type];
  context.fillStyle = cat.color;
  context.strokeStyle = "#4a3728";
  context.lineWidth = Math.max(1, r * 0.08);
  context.beginPath();
  context.arc(0, 0, r, 0, Math.PI * 2);
  context.fill();
  context.stroke();
}

function drawInnerEars(context, r, type) {
  const pink = type === 1 ? "#815464" : "#f0a4a4";
  context.fillStyle = pink;
  context.beginPath();
  context.moveTo(-r * 0.72, -r * 0.42);
  context.lineTo(-r * 0.38, -r * 0.76);
  context.lineTo(-r * 0.24, -r * 0.28);
  context.closePath();
  context.fill();
  context.beginPath();
  context.moveTo(r * 0.72, -r * 0.42);
  context.lineTo(r * 0.38, -r * 0.76);
  context.lineTo(r * 0.24, -r * 0.28);
  context.closePath();
  context.fill();
}

function drawCatPattern(context, type, r) {
  const patterns = [
    [],
    [{ color: "#111", x: 0, y: -0.4, rx: 0.95, ry: 0.75 }],
    [{ color: "#f7fbff", x: 0, y: -0.06, rx: 0.34, ry: 0.95 }],
    [{ color: "#fff0c8", stripe: true }],
    [{ color: "#4d4232", stripe: true }, { color: "#c2a77b", x: -0.36, y: -0.14, rx: 0.28, ry: 0.36 }],
    [{ color: "#5e7180", stripe: true }],
    [{ color: "#fff6e6", x: -0.34, y: -0.1, rx: 0.34, ry: 0.5 }, { color: "#382821", x: 0.34, y: -0.2, rx: 0.3, ry: 0.44 }],
    [{ color: "rgba(255,255,255,0.35)", x: 0, y: 0.08, rx: 0.75, ry: 0.72 }],
    [{ color: "rgba(255,255,255,0.28)", x: 0, y: 0, rx: 0.9, ry: 0.9 }],
    [{ color: "#fff3a2", x: 0, y: -0.12, rx: 0.62, ry: 0.62 }],
  ];

  for (const item of patterns[type]) {
    if (item.stripe) {
      drawStripes(context, r, item.color, type);
      continue;
    }
    context.fillStyle = item.color;
    context.beginPath();
    context.ellipse(r * item.x, r * item.y, r * item.rx, r * item.ry, 0, 0, Math.PI * 2);
    context.fill();
  }
}

function drawStripes(context, r, color, type) {
  context.strokeStyle = color;
  context.lineWidth = Math.max(2, r * 0.08);
  context.lineCap = "round";
  const count = type === 3 ? 4 : 5;
  for (let i = 0; i < count; i += 1) {
    const x = (i - (count - 1) / 2) * r * 0.22;
    const top = -r * 0.75 + Math.abs(i - 2) * r * 0.08;
    context.beginPath();
    context.moveTo(x, top);
    context.lineTo(x * 0.5, -r * 0.36);
    context.stroke();
  }
  context.beginPath();
  context.moveTo(-r * 0.82, -r * 0.05);
  context.lineTo(-r * 0.55, r * 0.03);
  context.moveTo(r * 0.82, -r * 0.05);
  context.lineTo(r * 0.55, r * 0.03);
  context.stroke();
}

function drawFur(context, type, r) {
  if (type < 7) return;
  context.strokeStyle = type === 9 ? "#b99518" : "rgba(74, 55, 40, 0.32)";
  context.lineWidth = Math.max(1, r * 0.025);
  for (let i = 0; i < 18; i += 1) {
    const angle = (Math.PI * 2 * i) / 18;
    const inner = r * 0.78;
    const outer = r * (type === 8 ? 0.98 : 0.9);
    context.beginPath();
    context.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    context.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
    context.stroke();
  }
}

function drawEye(context, x, y, r, color, type) {
  context.fillStyle = color;
  context.beginPath();
  if (type === 9) {
    context.moveTo(x - r * 0.09, y);
    context.lineTo(x, y - r * 0.09);
    context.lineTo(x + r * 0.09, y);
    context.lineTo(x, y + r * 0.09);
    context.closePath();
  } else {
    context.ellipse(x, y, r * 0.075, r * 0.11, 0, 0, Math.PI * 2);
  }
  context.fill();

  context.fillStyle = type === 1 ? "#111" : "#fff";
  context.beginPath();
  context.arc(x + r * 0.025, y - r * 0.035, Math.max(1.2, r * 0.025), 0, Math.PI * 2);
  context.fill();
}

function drawWhiskers(context, r, color) {
  context.strokeStyle = color;
  context.lineWidth = Math.max(1, r * 0.025);
  context.lineCap = "round";
  for (const side of [-1, 1]) {
    for (const offset of [-0.08, 0.04, 0.16]) {
      context.beginPath();
      context.moveTo(side * r * 0.18, r * offset);
      context.lineTo(side * r * 0.78, r * (offset - 0.06 * Math.sign(offset || 1)));
      context.stroke();
    }
  }
}

function drawTypeAccent(context, type, r) {
  if (type !== 9) return;
  context.fillStyle = "#f8e27b";
  context.strokeStyle = "#7a5a00";
  context.lineWidth = Math.max(1, r * 0.025);
  context.beginPath();
  context.moveTo(-r * 0.34, -r * 0.54);
  context.lineTo(-r * 0.18, -r * 0.8);
  context.lineTo(0, -r * 0.58);
  context.lineTo(r * 0.18, -r * 0.8);
  context.lineTo(r * 0.34, -r * 0.54);
  context.closePath();
  context.fill();
  context.stroke();
}

function drawCatName(context, cat, r) {
  context.fillStyle = cat.text;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `800 ${Math.max(8, Math.floor(r * 0.21))}px system-ui, sans-serif`;
  wrapText(context, cat.name, 0, r * 0.56, r * 1.45, Math.max(9, r * 0.22));
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
  const chars = [...text];
  const lines = [];
  let line = "";
  for (const char of chars) {
    const test = line + char;
    if (context.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = char;
    } else {
      line = test;
    }
  }
  lines.push(line);
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((item, index) => context.fillText(item, x, startY + index * lineHeight));
}

function resizeGame() {
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(() => {
    updateLayoutScale();
    setAim(pointerX);
  });
}

dropZoneEl?.addEventListener("pointerdown", startDropZoneAim, { passive: false });
dropZoneEl?.addEventListener("pointermove", moveDropZoneAim, { passive: false });
dropZoneEl?.addEventListener("pointerup", finishDropZoneAim, { passive: false });
dropZoneEl?.addEventListener("pointercancel", cancelDropZoneAim, { passive: true });
dropZoneEl?.addEventListener("lostpointercapture", cancelDropZoneAim, { passive: true });
restartButton.addEventListener("click", () => {
  playSe("button");
  restart();
});
startGameButton.addEventListener("click", startGame);
openRankingButton.addEventListener("click", openRanking);
closeRankingButton.addEventListener("click", closeRanking);
openTitleCollectionButton.addEventListener("click", openTitleCollection);
closeTitleCollectionButton.addEventListener("click", closeTitleCollection);
copyShareTextButton.addEventListener("click", copyShareText);
onlineRankingForm.addEventListener("submit", submitOnlineRanking);
pauseButton.addEventListener("click", openPause);
resumeGameButton.addEventListener("click", resumeGame);
retryGameButton.addEventListener("click", () => {
  playSe("button");
  restart();
});
backToTitleButton.addEventListener("click", backToTitle);
toggleBgmButton?.addEventListener("click", toggleBgmSetting);
titleToggleBgmButton.addEventListener("click", toggleBgmSetting);
toggleSeButton?.addEventListener("click", toggleSeSetting);
titleToggleSeButton.addEventListener("click", toggleSeSetting);
bgmVolumeInput.addEventListener("input", () => {
  audioSettings.bgmVolume = Number(bgmVolumeInput.value);
  saveAudioSettings();
  applyAudioSettingsToUi();
  updateBgmPlayback();
});
seVolumeInput.addEventListener("input", () => {
  audioSettings.seVolume = Number(seVolumeInput.value);
  saveAudioSettings();
  applyAudioSettingsToUi();
});
document.addEventListener("pointerdown", unlockAudio, { passive: true });
window.addEventListener("resize", resizeGame);
window.addEventListener("orientationchange", resizeGame);
window.visualViewport?.addEventListener("resize", resizeGame);

  setup();

function createMatterFallback() {
  let nextBodyId = 1;
  const listeners = new WeakMap();

  const EventsApi = {
    on(target, name, callback) {
      if (!listeners.has(target)) listeners.set(target, {});
      const map = listeners.get(target);
      if (!map[name]) map[name] = [];
      map[name].push(callback);
    },
    trigger(target, name, event) {
      const map = listeners.get(target);
      for (const callback of map?.[name] || []) callback(event);
    },
  };

  const CompositeApi = {
    add(world, items) {
      for (const item of Array.isArray(items) ? items : [items]) {
        if (!world.bodies.includes(item)) world.bodies.push(item);
      }
    },
    remove(world, items) {
      const removeItems = Array.isArray(items) ? items : [items];
      world.bodies = world.bodies.filter((body) => !removeItems.includes(body));
    },
    clear(world) {
      world.bodies = [];
    },
    allBodies(world) {
      return world.bodies.slice();
    },
    get(world, id) {
      return world.bodies.find((body) => body.id === id);
    },
  };

  function createBody(kind, x, y, w, h, options = {}) {
    const radius = kind === "circle" ? w : 0;
    return {
      id: nextBodyId++,
      label: "Body",
      kind,
      position: { x, y },
      velocity: { x: 0, y: 0 },
      angle: 0,
      radius,
      width: w,
      height: h,
      isStatic: Boolean(options.isStatic),
      restitution: options.restitution ?? 0,
      friction: options.friction ?? 0.1,
      frictionAir: options.frictionAir ?? 0.01,
      render: options.render || {},
    };
  }

  function step(engine, delta) {
    if (engine.isPaused) return;
    const bodies = engine.world.bodies;
    const cats = bodies.filter((body) => !body.isStatic && body.kind === "circle");
    const pairs = [];
    const dt = delta / 16.6667;
    engine.timing.timestamp += delta;

    for (const body of cats) {
      body.velocity.y += engine.gravity.y * 0.42 * dt;
      body.velocity.x *= 1 - body.frictionAir;
      body.velocity.y *= 1 - body.frictionAir * 0.4;
      body.position.x += body.velocity.x * dt;
      body.position.y += body.velocity.y * dt;
      body.angle += body.velocity.x * 0.004;
    }

    for (const body of cats) {
      const r = body.radius;
      if (body.position.x < r) {
        body.position.x = r;
        body.velocity.x = Math.abs(body.velocity.x) * 0.18;
      }
      if (body.position.x > engine.bounds.width - r) {
        body.position.x = engine.bounds.width - r;
        body.velocity.x = -Math.abs(body.velocity.x) * 0.18;
      }
      if (body.position.y > engine.bounds.height - r) {
        body.position.y = engine.bounds.height - r;
        body.velocity.y = -Math.abs(body.velocity.y) * 0.06;
        body.velocity.x *= 0.82;
      }
    }

    for (let i = 0; i < cats.length; i += 1) {
      for (let j = i + 1; j < cats.length; j += 1) {
        const a = cats[i];
        const b = cats[j];
        const dx = b.position.x - a.position.x;
        const dy = b.position.y - a.position.y;
        const distance = Math.max(0.01, Math.hypot(dx, dy));
        const minDistance = a.radius + b.radius;
        if (distance >= minDistance) continue;

        pairs.push({ bodyA: a, bodyB: b });
        const nx = dx / distance;
        const ny = dy / distance;
        const overlap = minDistance - distance;
        const total = a.radius + b.radius;
        const aShare = b.radius / total;
        const bShare = a.radius / total;
        a.position.x -= nx * overlap * aShare;
        a.position.y -= ny * overlap * aShare;
        b.position.x += nx * overlap * bShare;
        b.position.y += ny * overlap * bShare;

        const relVel = (b.velocity.x - a.velocity.x) * nx + (b.velocity.y - a.velocity.y) * ny;
        if (relVel < 0) {
          const impulse = -relVel * 0.42;
          a.velocity.x -= nx * impulse * aShare;
          a.velocity.y -= ny * impulse * aShare;
          b.velocity.x += nx * impulse * bShare;
          b.velocity.y += ny * impulse * bShare;
        }
      }
    }

    if (pairs.length) EventsApi.trigger(engine, "collisionStart", { pairs });
    EventsApi.trigger(engine, "afterUpdate", {});
  }

  function draw(render) {
    const { context, canvas, engine } = render;
    const pixelRatio = render.options.pixelRatio || 1;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, canvas.width / pixelRatio, canvas.height / pixelRatio);
    for (const body of engine.world.bodies) {
      if (body.kind !== "circle") continue;
      context.save();
      context.translate(body.position.x, body.position.y);
      context.rotate(body.angle);
      context.beginPath();
      context.arc(0, 0, body.radius, 0, Math.PI * 2);
      context.fillStyle = body.render.fillStyle || "#ccc";
      context.fill();
      context.lineWidth = body.render.lineWidth || 1;
      context.strokeStyle = body.render.strokeStyle || "#333";
      context.stroke();
      context.restore();
    }
    EventsApi.trigger(render, "afterRender", {});
  }

  return {
    Engine: {
      create() {
        return {
          world: { bodies: [] },
          gravity: { y: 1 },
          timing: { timestamp: 0 },
          bounds: { width: 0, height: 0 },
        };
      },
    },
    Render: {
      create({ canvas, engine, options }) {
        const context = canvas.getContext("2d");
        engine.bounds.width = options.width;
        engine.bounds.height = options.height;
        return { canvas, context, engine, options };
      },
      run(render) {
        const loop = () => {
          draw(render);
          render.frame = requestAnimationFrame(loop);
        };
        loop();
      },
    },
    Runner: {
      create() {
        return { frame: 0, running: false };
      },
      run(runner, engine) {
        if (runner.running) return;
        runner.running = true;
        let last = performance.now();
        const loop = (now) => {
          if (!runner.running) return;
          step(engine, Math.min(32, now - last));
          last = now;
          runner.frame = requestAnimationFrame(loop);
        };
        runner.frame = requestAnimationFrame(loop);
      },
      stop(runner) {
        runner.running = false;
        if (runner.frame) cancelAnimationFrame(runner.frame);
        runner.frame = 0;
      },
    },
    Bodies: {
      circle(x, y, radius, options) {
        return createBody("circle", x, y, radius, radius, options);
      },
      rectangle(x, y, w, h, options) {
        return createBody("rectangle", x, y, w, h, options);
      },
    },
    Body: {
      setVelocity(body, velocity) {
        body.velocity = { ...velocity };
      },
    },
    Composite: CompositeApi,
    Events: EventsApi,
    Vector: {
      add(a, b) {
        return { x: a.x + b.x, y: a.y + b.y };
      },
      mult(vector, scalar) {
        return { x: vector.x * scalar, y: vector.y * scalar };
      },
    },
  };
}
