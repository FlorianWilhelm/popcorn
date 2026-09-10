/* POPCORN - Participant Order Picker for Candid On-call Reporting & Notes
 * Popup logic, state management, candidate rotation, and UI rendering.
 */

const STORE_KEY = "mur_v1"; // Key remains unchanged, migration happens in code
const ROUND_TTL = 6 * 60 * 60 * 1000;
const DEFAULT_REFRESH_INTERVAL = 2;

const $ = (id) => document.getElementById(id);

let data = {
  version: 2,
  meetings: {},
  settings: {
    autoRefresh: true,
    refreshInterval: DEFAULT_REFRESH_INTERVAL
  }
};
let current = null; // { inMeet, code, title, people }
let currentId = null; // getracktes Meeting, das gerade laeuft
let selectedId = null; // manuell aus der Meetingliste geoeffnet
let presentKeys = new Set();
let view = "meetings";
let initialViewResolved = false;
let refreshTimer = null;
let deleteMode = false;
let showAddRow = false;
let sortAlphabetical = false;

const norm = (s) => (s || "").normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase();
const keyOf = (name) => norm(name);
const uid = () => `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

const getAutoRefresh = () => (data.settings ? data.settings.autoRefresh !== false : true);
const getRefreshInterval = () => (data.settings && Number(data.settings.refreshInterval)) || DEFAULT_REFRESH_INTERVAL;

const NOISE_WORDS = new Set([
  "mic", "mic_off", "videocam", "videocam_off", "more_vert", "more_horiz", "push_pin",
  "present_to_all", "devices", "person_add", "domain_disabled",
  "keep", "keep_off", "visual_effects", "raise_hand", "front_hand",
  "arrow_drop_down", "close", "search", "check", "star", "block",
  "reframe", "framing", "auto_framing", "auto_awesome", "crop_free", "fit_screen",
  "fullscreen", "fullscreen_exit", "settings", "tune", "volume_up", "volume_off",
  "closed_caption", "closed_caption_off", "chat", "chat_bubble", "info", "info_outline",
  "pan_tool", "call_end", "expand_more", "expand_less", "chevron_right", "chevron_left",
  "drag_indicator", "grid_view", "screen_search_desktop",
  "keyboard_arrow_down", "keyboard_arrow_up",
  "accepted", "zugesagt", "angenommen",
  "declined", "abgelehnt", "abgesagt",
  "maybe", "vielleicht", "mit vorbehalt", "tentative",
  "awaiting", "awaiting response", "no response", "ausstehend", "antwort ausstehend",
  "noch keine antwort", "keine antwort", "unbeantwortet", "needs action",
  "invited", "eingeladen", "also invited", "ebenfalls eingeladen",
  "in call", "in the call", "in this call", "not in call", "not in the call",
  "im anruf", "nicht im anruf", "in dieser besprechung", "in diesem anruf",
  "in meeting", "im meeting", "in the meeting", "in der besprechung", "not in meeting", "nicht im meeting",
  "waiting to join", "warten auf beitritt", "wartet auf teilnahme",
  "waiting to pair with you", "wartet auf kopplung",
  "visitor badge", "besucher-badge", "visitor", "besucher",
  "contributors", "beitragende", "everyone in this call", "alle in diesem anruf",
  "everyone", "alle", "all", "people", "personen", "teilnehmer", "participants",
  "backgrounds and effects", "backgrounds & effects", "backgrounds", "effects",
  "hintergründe und effekte", "hintergründe & effekte", "hintergrund und effekte", "hintergründe", "effekte",
  "apply visual effects", "visuelle effekte anwenden", "visuelle effekte", "visual effects",
  "virtual background", "virtueller hintergrund",
  "add people", "personen hinzufügen", "teilnehmer hinzufügen", "invite people",
  "jemanden einladen", "invite someone", "share joining info", "teilnahmeinformationen teilen",
  "besprechungslink kopieren", "copy joining info",
  "host controls", "steuerelemente für den host", "host-steuerelemente",
  "meeting safety", "besprechungssicherheit",
  "activities", "aktivitäten", "chat", "chatnachrichten", "messages", "in-call messages",
  "nachrichten im anruf", "details", "meeting details", "besprechungsdetails",
  "polls", "umfragen", "q&a", "fragen und antworten", "whiteboard", "breakout rooms",
  "gruppensitzungen", "recording", "aufzeichnung", "transcripts", "transkripte",
  "captions", "untertitel", "search for people", "nach personen suchen",
  "search people", "teilnehmer suchen", "personen suchen", "suchen", "search",
  "mute all", "alle stummschalten", "turn off all mics", "alle mikrofone deaktivieren",
  "pinned", "angepinnt", "stummgeschaltet", "muted", "hand raised", "hand gehoben",
  "joined", "beigetreten", "left", "verlassen", "calling", "ringing",
  "more actions", "weitere aktionen", "back", "zurück",
  "open the people panel", "close the people panel", "people panel", "chat panel",
  "show everyone", "alle anzeigen", "show in-call messages", "in-call messages"
]);

const NOISE_PATTERN = /^(du|you|sie|ich|me|host|moderator|gastgeber|meeting-host|besprechungsleiter|praesentation|präsentation|presentation|stummgeschaltet|muted|angepinnt|pinned|beitreten|joining|joined|verlassen|left|eingeladen|invited|ebenfalls eingeladen|also invited|im meeting|in meeting|in the meeting|in der besprechung|in call|im anruf|in this call|in this meeting|in dieser besprechung|not in call|nicht im anruf|not in meeting|nicht im meeting|waiting to join|warten auf beitritt|wartet auf teilnahme|waiting to pair with you|wartet auf kopplung|visitor badge|besucher-badge|visitor|besucher|more actions|weitere aktionen|back|zurück|keyboard_arrow_down|keyboard_arrow_up|accepted|zugesagt|angenommen|declined|abgelehnt|abgesagt|maybe|vielleicht|mit vorbehalt|tentative|awaiting|awaiting response|ausstehend|antwort ausstehend|noch keine antwort|keine antwort|unbeantwortet|needs action|contributors|beitragende|weitere optionen|more options|teilnehmer|participants|personen|people|everyone|alle|suchen|search|search for people|nach personen suchen|teilnehmer suchen|personen suchen|reframe|framing|auto-framing|auto framing|ausschnitt|ausschnitt anpassen|kamera|camera|mikrofon|microphone|video|audio|backgrounds?(\s+(and|&)\s+effects?)?|hintergründe?(\s+(und|&)\s+effekte?)?|effects?|effekte?|apply visual effects|visuelle effekte(\s+anwenden)?|virtual background|virtueller hintergrund|add people|personen hinzufügen|teilnehmer hinzufügen|invite(\s+people|\s+someone)?|jemanden einladen|share joining info|teilnahmeinformationen teilen|host controls|steuerelemente für den host|host-steuerelemente|meeting safety|besprechungssicherheit|activities|aktivitäten|details|meeting details|besprechungsdetails|mute all|alle stummschalten|open\s+(?:the\s+)?people\s+panel|close\s+(?:the\s+)?people\s+panel|people\s+panel|chat\s+panel|show\s+everyone|alle\s+anzeigen)$/i;

const UI_PHRASE_RE = /^(?:open|close|öffnen|schließen|show|hide|view)\s+(?:the\s+)?(?:people|chat|activities|details|host controls?|teilnehmer|personen|chatten|nachrichten|everyone|alle)\s*(?:panel|leiste|fenster|list|liste)?$/i;
const PANEL_RE = /^(?:people|chat|activities|details|host controls?|teilnehmer|personen)\s*(?:panel|leiste|fenster|list|liste)$/i;

const isNoiseOrIcon = (s) => {
  if (!s) return true;
  const lower = (s || "").toLowerCase().trim();
  if (NOISE_WORDS.has(lower)) return true;
  if (NOISE_PATTERN.test(lower)) return true;
  if (UI_PHRASE_RE.test(lower) || PANEL_RE.test(lower)) return true;
  return false;
};

const isPresentationName = (s) => {
  if (!s) return false;
  const str = (s || "").replace(/\s+/g, " ").trim();
  if (/^(?:dein\s+bildschirm|your\s+screen|deine\s+präsentation|your\s+presentation|bildschirmübertragung|screen\s*share)$/i.test(str)) return true;
  if (/^(?:presentation|präsentation|praesentation)(?:\s+(?:von|of|by)\s+.*)?$/i.test(str)) return true;
  if (/(?:\x27s|’s|s|\x27|’)\s*(?:presentation|präsentation|praesentation|screen|bildschirm|bildschirmfreigabe|bildschirmübertragung)$/i.test(str)) return true;
  if (/\((?:präsentation|presentation|bildschirm|screen|dein bildschirm|your presentation)\)/i.test(str)) return true;
  return false;
};

const cleanPersonName = (raw) => {
  let s = (raw || "").replace(/\s+/g, " ").trim();
  if (!s) return "";

  // Remove count suffixes e.g. (12) or · 12
  s = s.replace(/\s*\(\d+\)\s*$/g, "");
  s = s.replace(/\s*·\s*\d+\s*$/g, "");

  // Action prefixes and suffixes from Meet UI / accessibility labels
  s = s.replace(/^(?:you\s+can\x27?t\s+remotely\s+mute|sie\s+können\s+das\s+mikrofon\s+von)\s+(.+?)(?:(?:\x27s|s)?\s+microphone|\s+nicht\s+stummschalten)?$/i, "$1");
  s = s.replace(/^pin\s+(.+?)\s+to\s+(?:your\s+|the\s+)?(?:main\s+)?screen$/i, "$1");
  s = s.replace(/^unpin\s+(.+?)\s+from\s+(?:your\s+|the\s+)?(?:main\s+)?screen$/i, "$1");
  s = s.replace(/^pin\s+(.+?)\s+to\s+screen$/i, "$1");
  s = s.replace(/^unpin\s+(.+?)\s+from\s+screen$/i, "$1");
  s = s.replace(/^(.+?)\s+an\s+(?:den\s+)?(?:hauptbildschirm|bildschirm)\s+anpinnen$/i, "$1");
  s = s.replace(/^(.+?)\s+vom\s+(?:hauptbildschirm|bildschirm)\s+(?:lösen|entfernen|entpinnen)$/i, "$1");
  s = s.replace(/^(.+?)\s+(?:nicht\s+mehr\s+anpinnen|anpinnen|anheften)$/i, "$1");
  s = s.replace(/^(?:weitere\s+(?:optionen|aktionen)\s+für|more\s+(?:options|actions)\s+for|aktionen\s+für)\s+(.+)$/i, "$1");
  s = s.replace(/^(?:send\s+a\s+message\s+to|nachricht\s+an)\s+(.+?)(?:\s+senden)?$/i, "$1");
  s = s.replace(/^(?:chat\s+with|chatten\s+mit)\s+(.+)$/i, "$1");
  s = s.replace(/^(?:mute|unmute|stummschalten\s+für)\s+(.+)$/i, "$1");
  s = s.replace(/^(.+?)\s+stummschalten$/i, "$1");
  s = s.replace(/^(?:video\s+von\s+|video\s+of\s+)(.+)$/i, "$1");
  s = s.replace(/^(.+?)'s\s+video$/i, "$1");

  // Remove parenthetical qualifiers: (Du), (You), (Host), (Presentation), (Visitor), (abwesend), etc.
  s = s.replace(/\((du|you|sie|ich|me|dein bildschirm|your presentation|präsentation|presentation|gastgeber|host|meeting host|besprechungsleiter|moderator|extern|external|intern|internal|contributor|beitragende|beitragender|abwesend|absent|visitor|besucher)\)/gi, "");
  s = s.replace(/[·•]/g, " ");

  return s.replace(/\s+/g, " ").trim();
};

function sanitizeMeetingData(m) {
  if (!m || !m.people) return false;
  let changed = false;
  const newPeople = {};
  const keyMap = new Map();

  for (const [oldKey, p] of Object.entries(m.people)) {
    const rawName = (p && p.name) ? p.name : oldKey;
    if (isPresentationName(rawName) || isPresentationName(oldKey) || isNoiseOrIcon(rawName) || isNoiseOrIcon(oldKey)) {
      changed = true;
      continue;
    }
    const clean = cleanPersonName(rawName) || rawName;
    if (isPresentationName(clean) || isNoiseOrIcon(clean)) {
      changed = true;
      continue;
    }
    const newKey = keyOf(clean);

    if (newKey !== oldKey || (p && p.name !== clean)) {
      changed = true;
    }

    if (!newPeople[newKey]) {
      newPeople[newKey] = {
        name: clean,
        last: (p && p.last) || 0,
        prev: p && p.prev != null ? p.prev : null,
        ignored: !!(p && p.ignored)
      };
    } else {
      newPeople[newKey].last = Math.max(newPeople[newKey].last || 0, (p && p.last) || 0);
      if (p && p.prev != null && newPeople[newKey].prev == null) {
        newPeople[newKey].prev = p.prev;
      }
      if (p && p.ignored) {
        newPeople[newKey].ignored = true;
      }
    }
    keyMap.set(oldKey, newKey);
  }

  m.people = newPeople;

  if (m.round && Array.isArray(m.round.keys)) {
    const updatedRoundKeys = [];
    const seenRound = new Set();
    for (const k of m.round.keys) {
      const mappedKey = keyMap.get(k);
      if (mappedKey && m.people[mappedKey] && !m.people[mappedKey].ignored && !seenRound.has(mappedKey)) {
        seenRound.add(mappedKey);
        updatedRoundKeys.push(mappedKey);
      }
    }
    if (updatedRoundKeys.length !== m.round.keys.length || updatedRoundKeys.some((k, i) => k !== m.round.keys[i])) {
      changed = true;
    }
    m.round.keys = updatedRoundKeys;
  }

  return changed;
}

const activeId = () => selectedId || currentId;
const meeting = () => (activeId() ? data.meetings[activeId()] : null);

/* ---------- Speicher ---------- */

async function load() {
  const res = await chrome.storage.local.get(STORE_KEY);
  const raw = res[STORE_KEY];
  let loadedData = {
    version: 2,
    meetings: {},
    settings: {
      autoRefresh: true,
      refreshInterval: DEFAULT_REFRESH_INTERVAL
    }
  };

  if (raw && raw.meetings) {
    loadedData = raw;
  } else if (raw && raw.groups) {
    // Migration v1: Gruppen hingen am Meeting-Code
    for (const [gid, g] of Object.entries(raw.groups || {})) {
      const id = uid();
      loadedData.meetings[id] = {
        id,
        name: g.name || gid,
        aliases: [norm(g.name || gid)],
        codes: g.codes || (gid ? [gid] : []),
        people: g.people || {},
        round: g.round || null,
        includeAbsent: !!g.includeAbsent,
        createdAt: Date.now()
      };
    }
  }

  if (!loadedData.settings) {
    loadedData.settings = { autoRefresh: true, refreshInterval: DEFAULT_REFRESH_INTERVAL };
  } else {
    loadedData.settings.autoRefresh = loadedData.settings.autoRefresh !== false;
    loadedData.settings.refreshInterval = Math.max(1, Math.min(60, Number(loadedData.settings.refreshInterval) || DEFAULT_REFRESH_INTERVAL));
  }

  let needsSave = false;
  for (const m of Object.values(loadedData.meetings || {})) {
    if (sanitizeMeetingData(m)) {
      needsSave = true;
    }
  }
  if (needsSave) {
    await chrome.storage.local.set({ [STORE_KEY]: loadedData });
  }

  return loadedData;
}

async function save() {
  await chrome.storage.local.set({ [STORE_KEY]: data });
}

/* ---------- Meet auslesen ---------- */

let sessionPort = null;

let lastActiveTabId = null;

function ensureSessionPort(tabId, force = false) {
  lastActiveTabId = tabId;
  if (sessionPort && !force) return;
  if (sessionPort && force) {
    try {
      sessionPort.disconnect();
    } catch {}
    sessionPort = null;
  }
  try {
    sessionPort = chrome.tabs.connect(tabId, { name: "popcorn-session" });
    sessionPort.onDisconnect.addListener(() => {
      sessionPort = null;
    });
  } catch {}
}

function disconnectSession() {
  if (lastActiveTabId) {
    try {
      chrome.tabs.sendMessage(lastActiveTabId, { type: "MUR_POPUP_CLOSING" }).catch(() => {});
    } catch {}
  }
  if (sessionPort) {
    try {
      sessionPort.disconnect();
    } catch {}
    sessionPort = null;
  }
}

window.addEventListener("pagehide", disconnectSession);
window.addEventListener("beforeunload", disconnectSession);
window.addEventListener("blur", disconnectSession);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    disconnectSession();
  }
});

async function readMeet(withPeople, opts = {}) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !/^https:\/\/meet\.google\.com\//.test(tab.url || "")) {
    return { ok: false, reason: "nomeet" };
  }
  ensureSessionPort(tab.id);
  const send = () => chrome.tabs.sendMessage(tab.id, {
    type: "MUR_SCRAPE",
    withPeople: !!withPeople,
    openIfClosed: !!opts.openIfClosed
  });
  try {
    return await send();
  } catch {
    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
      ensureSessionPort(tab.id, true);
      return await send();
    } catch {
      return { ok: false, reason: "noinject" };
    }
  }
}

/* ---------- Zuordnung ueber den Meeting-Namen ---------- */

function matchMeeting(title, code) {
  const t = norm(title);
  if (t) {
    for (const m of Object.values(data.meetings)) {
      if ((m.aliases || []).includes(t) || norm(m.name) === t) return { m, via: "name" };
    }
  }
  if (code) {
    for (const m of Object.values(data.meetings)) {
      if ((m.codes || []).includes(code)) return { m, via: "code" };
    }
  }
  return null;
}

function addAlias(m, value) {
  const v = norm(value);
  if (!v) return;
  m.aliases = m.aliases || [];
  if (!m.aliases.includes(v)) m.aliases.push(v);
}

/* ---------- Personen und Runden ---------- */

function syncRoster(m, people) {
  let added = 0;
  for (const p of people) {
    if (isPresentationName(p.name) || isNoiseOrIcon(p.name)) continue;
    const clean = cleanPersonName(p.name);
    if (!clean || isPresentationName(clean) || isNoiseOrIcon(clean)) continue;
    const k = keyOf(clean);
    if (!m.people[k]) {
      m.people[k] = { name: clean, last: 0, prev: null, ignored: false };
      added++;
    } else {
      m.people[k].name = clean;
    }
  }
  return added;
}

function syncMeetingOrder(m, forceReorder = false) {
  if (!m) return [];
  const fresh = m.round && Array.isArray(m.round.keys) && Date.now() - m.round.createdAt < ROUND_TTL;

  // Active pool: present participants who are not ignored
  // (If outside Meet, all non-ignored participants are active candidates)
  const isEligible = (k) => {
    const p = m.people[k];
    if (!p || p.ignored) return false;
    if (presentKeys.size > 0 && !presentKeys.has(k)) return false;
    return true;
  };

  const pool = Object.entries(m.people)
    .filter(([k]) => isEligible(k))
    .map(([k, v]) => ({ key: k, ...v }));

  // Helper: check if a person was recently checked off (done today)
  const isDone = (k) => {
    const p = m.people[k];
    return !!(p && p.last && Date.now() - p.last < 86400000);
  };

  // Compare pending participants by priority:
  // 1. Longest since update first (ascending last; 0/never comes first)
  // 2. Alphabetical tie-break by name
  const comparePriority = (a, b) =>
    (a.last || 0) - (b.last || 0) || a.name.localeCompare(b.name, "en");

  if (!forceReorder && fresh && m.round && Array.isArray(m.round.keys)) {
    // 1. Retain fixed order for candidates who have already given their update in this round
    const existingDone = m.round.keys.filter((k) => isEligible(k) && isDone(k));
    const doneKeys = [...existingDone];
    for (const p of pool) {
      if (isDone(p.key) && !doneKeys.includes(p.key)) {
        doneKeys.push(p.key);
      }
    }

    // 2. Pending participants (not yet checked off):
    // Dynamically order by priority so late joiners (with never or older updates)
    // are slotted in ahead of people who updated more recently.
    const pending = pool.filter((p) => !isDone(p.key));
    pending.sort(comparePriority);

    const orderedKeys = [...doneKeys, ...pending.map((p) => p.key)];
    m.round.keys = orderedKeys;
    return orderedKeys;
  }

  // Fresh session order:
  // Any participants already marked done stay at the top in their existing order,
  // followed by all pending participants sorted by priority.
  const donePool = [];
  if (m.round && Array.isArray(m.round.keys)) {
    for (const k of m.round.keys) {
      if (isEligible(k) && isDone(k)) donePool.push(k);
    }
  }
  for (const p of pool) {
    if (isDone(p.key) && !donePool.includes(p.key)) donePool.push(p.key);
  }

  const pendingPool = pool.filter((p) => !isDone(p.key));
  pendingPool.sort(comparePriority);

  const newKeys = [...donePool, ...pendingPool.map((p) => p.key)];
  m.round = { keys: newKeys, createdAt: Date.now() };
  return newKeys;
}

/* ---------- Bausteine ---------- */

function waitedText(last) {
  if (!last) return "never";
  const days = Math.floor((Date.now() - last) / 86400000);
  const date = new Date(last).toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "2-digit" });
  if (days <= 0) return `today · ${date}`;
  return `${days}d ago · ${date}`;
}

function buildPersonItem(m, person, index, opts = {}) {
  const li = document.createElement("li");
  li.className = "item";
  const doneToday = person.last && Date.now() - person.last < 86400000;
  if (doneToday) li.classList.add("done");
  if (presentKeys.size && !presentKeys.has(person.key)) li.classList.add("absent");
  if (person.ignored) li.classList.add("ignored");

  // Position indicator for Active rotation list
  if (index !== null && index !== undefined) {
    const pos = document.createElement("div");
    pos.className = "pos";
    pos.textContent = String(index + 1).padStart(2, "0");
    li.appendChild(pos);
  }

  // Checkbox or Delete button on the left
  if (deleteMode) {
    const del = document.createElement("button");
    del.className = "mini ghost icon-btn danger";
    del.title = `Delete "${person.name}"`;
    del.setAttribute("aria-label", "Delete person");
    del.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
    del.addEventListener("click", async () => {
      delete m.people[person.key];
      if (m.round && Array.isArray(m.round.keys)) {
        m.round.keys = m.round.keys.filter((k) => k !== person.key);
      }
      await save();
      render();
    });
    li.appendChild(del);
  } else {
    const checkLabel = document.createElement("label");
    checkLabel.className = "check-item";
    checkLabel.title = "Gave update";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = !!doneToday;

    input.addEventListener("change", async () => {
      const p = m.people[person.key];
      if (!p) return;
      if (input.checked) {
        p.prev = p.last;
        p.last = Date.now();
      } else {
        p.last = p.prev != null ? p.prev : 0;
        p.prev = null;
      }
      await save();
      render();
    });

    checkLabel.appendChild(input);
    li.appendChild(checkLabel);
  }

  // Name wrap with inline ignore eye icon
  const nameWrap = document.createElement("div");
  nameWrap.className = "name-wrap";

  const name = document.createElement("span");
  name.className = "name";
  name.textContent = person.name;
  nameWrap.appendChild(name);

  const ignoreBtn = document.createElement("button");
  ignoreBtn.className = "mini ghost icon-btn ignore-btn" + (person.ignored ? " ignored" : "");
  ignoreBtn.title = person.ignored ? "Ignored (click to include in updates)" : "Include in updates (click to ignore)";
  ignoreBtn.setAttribute("aria-label", person.ignored ? "Unignore person" : "Ignore person");

  if (person.ignored) {
    ignoreBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
  } else {
    ignoreBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="7" r="3"></circle></svg>`;
  }

  ignoreBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    const p = m.people[person.key];
    if (!p) return;
    p.ignored = !p.ignored;
    if (p.ignored && m.round && Array.isArray(m.round.keys)) {
      m.round.keys = m.round.keys.filter((k) => k !== person.key);
    }
    await save();
    render();
  });

  nameWrap.appendChild(ignoreBtn);
  li.appendChild(nameWrap);

  // Date on the far right
  const dateSpan = document.createElement("span");
  dateSpan.className = "date";
  dateSpan.textContent = person.ignored ? "ignored" : waitedText(person.last);
  if (person.last) {
    dateSpan.title = new Date(person.last).toLocaleString();
  }
  li.appendChild(dateSpan);

  return li;
}

function buildMeetingItem(m) {
  const li = document.createElement("li");
  li.className = "meeting" + (m.id === currentId ? " current" : "");

  const box = document.createElement("div");
  box.className = "meeting-box";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "meeting-name-input";
  input.value = m.name;
  input.title = "Edit name";
  input.addEventListener("change", async () => {
    const v = input.value.trim();
    if (!v) {
      input.value = m.name;
      return;
    }
    m.name = v;
    addAlias(m, v);
    await save();
    render();
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") input.blur();
  });

  const count = Object.keys(m.people).length;
  const countBadge = document.createElement("div");
  countBadge.className = "meeting-count";
  const countText = `${count} ${count === 1 ? "person" : "people"}`;
  countBadge.title = m.id === currentId ? `${countText} (in progress)` : countText;
  countBadge.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg><span>${count}</span>`;

  const openBtn = document.createElement("button");
  openBtn.className = "meeting-open-btn";
  openBtn.title = "Open people list for this meeting";
  openBtn.setAttribute("aria-label", "Open meeting");
  openBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;
  openBtn.addEventListener("click", () => {
    selectedId = m.id;
    view = "people";
    deleteMode = false;
    showAddRow = false;
    render();
  });

  box.append(input, countBadge, openBtn);

  const actions = document.createElement("div");
  actions.className = "actions";

  const editBtn = document.createElement("button");
  editBtn.className = "mini ghost icon-btn";
  editBtn.title = "View, edit, or copy Markdown";
  editBtn.setAttribute("aria-label", "Edit Markdown");
  editBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>`;
  editBtn.addEventListener("click", () => {
    openMarkdownModal(m.id);
  });

  const dlBtn = document.createElement("button");
  dlBtn.className = "mini ghost icon-btn";
  dlBtn.title = "Export as Markdown file (.md)";
  dlBtn.setAttribute("aria-label", "Export as Markdown file");
  dlBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
  dlBtn.addEventListener("click", () => {
    downloadMeetingMarkdown(m);
  });

  const del = document.createElement("button");
  del.className = "mini ghost icon-btn danger";
  del.title = "Stop tracking and delete history";
  del.setAttribute("aria-label", "Delete meeting");
  del.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
  del.addEventListener("click", async () => {
    if (!confirm(`Stop tracking "${m.name}"? The saved history will be deleted.`)) return;
    delete data.meetings[m.id];
    if (currentId === m.id) currentId = null;
    if (selectedId === m.id) selectedId = null;
    await save();
    render();
  });

  actions.append(editBtn, dlBtn, del);
  li.append(box, actions);
  return li;
}

/* ---------- Rendern ---------- */

function setStatus(_text) {
  // Global status banner has been completely removed.
  // Direct UI feedback (button states, list changes) is used instead.
}

function show(id) {
  for (const s of ["viewMeetings", "viewPeople", "viewSettings"]) {
    const el = $(s);
    if (el) el.classList.toggle("hidden", s !== id);
  }
}

function render() {
  const m = meeting();
  const inMeet = !!(current && current.inMeet);

  // Header
  if (inMeet) {
    $("headEyebrow").textContent = "Current Meeting";
    const titleText = current.title || current.code || "Untitled Meeting";
    $("headName").textContent = titleText;
    $("headName").title = titleText;
    if (currentId) {
      $("badge").textContent = "on";
      $("badge").className = "badge on";
      $("badge").title = "Tracking active in Google Meet";
    } else {
      $("badge").textContent = "off";
      $("badge").className = "badge off";
      $("badge").title = "Meeting not tracked yet";
    }
  } else if (m) {
    $("headEyebrow").textContent = "Selected List";
    $("headName").textContent = m.name;
    $("headName").title = m.name;
    $("badge").textContent = "off";
    $("badge").className = "badge off";
    $("badge").title = "No active Google Meet call (viewing saved list)";
  } else {
    $("headEyebrow").textContent = "Google Meet";
    $("headName").textContent = "No meeting open";
    $("headName").title = "No meeting open";
    $("badge").textContent = "off";
    $("badge").className = "badge off";
    $("badge").title = "No active Google Meet call";
  }

  // Adjust view if outside Meet with no meeting active
  if (!m && !inMeet && view !== "settings" && view !== "meetings") {
    view = "meetings";
  }

  // Tabs
  for (const t of document.querySelectorAll(".tab[data-view]")) {
    const v = t.dataset.view;
    t.classList.toggle("active", v === view);
    if (v === "people") {
      t.disabled = !m;
    }
  }

  // Choose view
  if (view === "settings") {
    show("viewSettings");
  } else if (view === "people") {
    show("viewPeople");
  } else {
    show("viewMeetings");
  }

  // Meetings view
  const untrackedCard = $("untrackedCard");
  if (!m && inMeet) {
    if (untrackedCard) {
      untrackedCard.classList.remove("hidden");
      if (!$("activateName").value) {
        $("activateName").value = current.title || (current.code ? `Meeting ${current.code}` : "");
      }
    }
  } else if (untrackedCard) {
    untrackedCard.classList.add("hidden");
  }

  const ml = $("meetingList");
  ml.innerHTML = "";
  const meetings = Object.values(data.meetings).sort((a, b) => a.name.localeCompare(b.name, "en"));
  meetings.forEach((g) => ml.appendChild(buildMeetingItem(g)));
  $("meetingsEmpty").classList.toggle("hidden", meetings.length > 0);

  // People view (merged standup updates & roster)
  if (m) {
    const total = Object.keys(m.people).length;
    const presEl = $("peoplePresence");
    if (presEl) {
      if (inMeet) {
        const presentCount = presentKeys ? presentKeys.size : 0;
        presEl.textContent = `${presentCount} present of ${total}`;
      } else {
        presEl.textContent = `${total} ${total === 1 ? "participant" : "participants"}`;
      }
    }

    // Add person row state
    $("addPersonRow").classList.toggle("hidden", !showAddRow);
    if ($("btnToggleAdd")) $("btnToggleAdd").classList.toggle("active", showAddRow);

    // Active rotation list
    const activeKeys = syncMeetingOrder(m, false);
    const activeList = $("activeList");
    activeList.innerHTML = "";

    let displayItems = activeKeys
      .map((k, i) => ({ key: k, person: m.people[k], priorityIndex: i }))
      .filter((item) => !!item.person);

    if (sortAlphabetical) {
      displayItems.sort((a, b) =>
        (a.person.name || "").localeCompare(b.person.name || "", "en", { sensitivity: "base" })
      );
    }

    displayItems.forEach((item) => {
      activeList.appendChild(buildPersonItem(m, { key: item.key, ...item.person }, item.priorityIndex));
    });

    const emptyHint = $("peopleEmpty");
    if (emptyHint) {
      emptyHint.textContent = inMeet
        ? "No present participants found. Open the people list in Meet, or add names using +."
        : "No participants added yet. Add names using +.";
      emptyHint.classList.toggle("hidden", activeKeys.length > 0);
    }

    // Secondary list for absent or ignored people
    const secondaryList = $("secondaryList");
    secondaryList.innerHTML = "";

    if (m.includeAbsent) {
      const activeSet = new Set(activeKeys);
      let secondaryPeople = Object.entries(m.people)
        .filter(([k]) => !activeSet.has(k))
        .map(([k, v]) => ({ key: k, ...v }));

      if (sortAlphabetical) {
        secondaryPeople.sort((a, b) =>
          (a.name || "").localeCompare(b.name || "", "en", { sensitivity: "base" })
        );
      } else {
        secondaryPeople.sort((a, b) => {
          if (!!a.ignored !== !!b.ignored) return a.ignored ? 1 : -1;
          return (a.last || 0) - (b.last || 0) || a.name.localeCompare(b.name, "en");
        });
      }

      secondaryPeople.forEach((p) => {
        secondaryList.appendChild(buildPersonItem(m, p, null));
      });
      secondaryList.classList.toggle("hidden", secondaryPeople.length === 0);
    } else {
      secondaryList.classList.add("hidden");
    }
  }

  if ($("btnToggleAbsent")) {
    const isAbsentShown = m ? !!m.includeAbsent : false;
    $("btnToggleAbsent").classList.toggle("active", isAbsentShown);
    $("btnToggleAbsent").title = isAbsentShown
      ? "Hide absent and ignored"
      : "Show absent and ignored";
    $("btnToggleAbsent").setAttribute("aria-label", $("btnToggleAbsent").title);
    $("btnToggleAbsent").disabled = !m;
  }

  if ($("btnToggleSort")) {
    $("btnToggleSort").classList.toggle("active", sortAlphabetical);
    $("btnToggleSort").title = sortAlphabetical
      ? "Alphabetical order active (click to sort by priority)"
      : "Sort alphabetically by name (preserves priority numbers)";
    $("btnToggleSort").disabled = !m;
  }

  if ($("btnToggleDeleteMode")) {
    $("btnToggleDeleteMode").classList.toggle("active", deleteMode);
    $("btnToggleDeleteMode").title = deleteMode ? "Exit delete mode" : "Toggle delete mode";
  }

  if ($("btnRefresh")) {
    $("btnRefresh").disabled = !m;
  }

  // Settings
  if ($("settingAutoRefresh")) {
    $("settingAutoRefresh").checked = getAutoRefresh();
  }
  if ($("settingRefreshInterval") && document.activeElement !== $("settingRefreshInterval")) {
    $("settingRefreshInterval").value = getRefreshInterval();
  }
  if ($("fieldRefreshInterval")) {
    $("fieldRefreshInterval").classList.toggle("hidden", !getAutoRefresh());
    $("hintRefreshInterval").classList.toggle("hidden", !getAutoRefresh());
  }
}

/* ---------- Workflow ---------- */

async function refresh(newRound = false, options = {}) {
  data = await load();

  // Phase 1: read title and code only, leave roster untouched
  const probe = await readMeet(false);
  current = probe && probe.ok
    ? { inMeet: true, code: probe.code, title: probe.title, people: [] }
    : { inMeet: false, code: null, title: null, people: [] };

  currentId = null;
  presentKeys = new Set();

  if (!current.inMeet) {
    if (!initialViewResolved && !options.background) {
      initialViewResolved = true;
      view = "meetings";
    }
    render();
    return;
  }

  const hit = matchMeeting(current.title, current.code);
  if (!hit) {
    if (!initialViewResolved && !options.background) {
      initialViewResolved = true;
      view = "meetings";
    }
    render();
    return;
  }

  const m = hit.m;
  currentId = m.id;
  selectedId = null;

  if (!initialViewResolved && !options.background) {
    initialViewResolved = true;
    view = "people";
  }

  if (hit.via === "code" && current.title && norm(current.title) !== norm(m.name)) {
    addAlias(m, current.title);
  }
  if (current.code && !(m.codes || []).includes(current.code)) {
    m.codes = m.codes || [];
    m.codes.push(current.code);
  }

  // Phase 2: now read people list
  const full = await readMeet(true, { openIfClosed: !options.background });
  if (full && full.ok) {
    current.people = (full.people || [])
      .filter((p) => !isPresentationName(p.name) && !isNoiseOrIcon(p.name))
      .map((p) => ({ ...p, name: cleanPersonName(p.name) }))
      .filter((p) => !!p.name && !isPresentationName(p.name) && !isNoiseOrIcon(p.name));
    presentKeys = new Set(current.people.filter((p) => p.present).map((p) => keyOf(p.name)));
    const added = syncRoster(m, current.people);
    syncMeetingOrder(m, newRound);
    await save();
    render();

    const total = Object.keys(m.people).length;
    const parts = [`${presentKeys.size} present of ${total}`];
    if (added) parts.push(`${added} newly added`);
    if (current.people.length === 0) parts.push("Open the people list in Meet");
    const presEl = $("peoplePresence");
    if (presEl) {
      presEl.textContent = parts.join(" · ");
    }
  } else {
    syncMeetingOrder(m, newRound);
    await save();
    render();
  }
}

function setupAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  const auto = getAutoRefresh();
  const sec = getRefreshInterval();
  if (auto && sec > 0) {
    refreshTimer = setInterval(async () => {
      if (document.hidden) return;
      const modal = $("markdownModal");
      if (modal && !modal.classList.contains("hidden")) return;
      const activeEl = document.activeElement;
      const isEditingText = activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA");
      if (isEditingText && view !== "people") return;
      await refresh(false, { background: true });
    }, sec * 1000);
  }
}

/* ---------- Import und Export (Markdown) ---------- */

function meetingToMarkdown(m) {
  const rows = Object.values(m.people || {})
    .sort((a, b) => {
      if (!!a.ignored !== !!b.ignored) return a.ignored ? 1 : -1;
      return (b.last || 0) - (a.last || 0) || a.name.localeCompare(b.name);
    })
    .map((p) => {
      const timeStr = p.last ? new Date(p.last).toLocaleString() : "";
      let val = timeStr;
      if (p.ignored) {
        val = timeStr ? `${timeStr} (ignored)` : "ignored";
      }
      return `| ${p.name} | ${val} |`;
    });
  return `# ${m.name}\n\n| Person | Last Update |\n| --- | --- |\n${rows.join("\n")}\n`;
}

function downloadMeetingMarkdown(m) {
  const md = meetingToMarkdown(m);
  const slug = (m.name || "meeting")
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]+/gi, "-")
    .replace(/^-+|-+$/g, "");
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${slug || "meeting"}.md`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

async function copyMeetingMarkdown(m) {
  const md = meetingToMarkdown(m);
  try {
    await navigator.clipboard.writeText(md);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = md;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return true;
  }
}

function parseDateTimeString(str) {
  if (!str) return 0;
  const s = str.trim().toLowerCase();
  if (!s || s === "noch nie" || s === "never" || s === "-" || s === "–" || s === "0") return 0;

  // Format DD.MM.YYYY or DD/MM/YYYY[ ,][HH:mm[:ss]]
  const deMatch = s.match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (deMatch) {
    const [, d, m, y, h, min, sec] = deMatch;
    const date = new Date(Number(y), Number(m) - 1, Number(d), Number(h || 0), Number(min || 0), Number(sec || 0));
    if (!isNaN(date.getTime())) return date.getTime();
  }

  const parsed = Date.parse(str);
  if (!isNaN(parsed)) return parsed;

  return 0;
}

function validateAndParseMarkdownMeeting(mdText) {
  if (!mdText || !mdText.trim()) {
    return { ok: false, error: "The editor is empty. Please enter a Markdown table." };
  }

  const lines = mdText.split(/\r?\n/);
  let meetingName = "";
  const people = {};

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    const lineNum = i + 1;

    // Ignore empty lines
    if (!line) continue;

    // Meeting title (# Meeting Name)
    if (line.startsWith("#")) {
      if (!meetingName) {
        meetingName = line.replace(/^#+\s*/, "").trim();
      }
      continue;
    }

    // Every other non-empty line MUST be a table row starting with '|'
    if (!line.startsWith("|")) {
      return {
        ok: false,
        lineIndex: i,
        lineNum,
        error: `Line ${lineNum}: Expected a table row starting with "|"`
      };
    }

    const cols = line.split("|").map((c) => c.trim());
    if (cols.length < 3) {
      return {
        ok: false,
        lineIndex: i,
        lineNum,
        error: `Line ${lineNum}: Table row must contain at least 2 columns (| Name | Last Update |)`
      };
    }

    const col1 = cols[1];
    const col2 = cols[2];

    // Check table header
    if (/^person$/i.test(col1) || /^last update$/i.test(col2) || /^letztes update$/i.test(col2)) {
      continue;
    }

    // Check separator row like | --- | --- | or |:---|:---|
    if (/^[-:\s]+$/.test(col1) && (!col2 || /^[-:\s]+$/.test(col2))) {
      continue;
    }

    // Regular data row: validate Person name
    const cleanName = cleanPersonName(col1);
    if (!cleanName || isPresentationName(cleanName) || isNoiseOrIcon(cleanName)) {
      return {
        ok: false,
        lineIndex: i,
        lineNum,
        error: `Line ${lineNum}: Person name cannot be empty or invalid`
      };
    }

    // Validate Column 2 (Last Update)
    const isIgnored = /\b(ignored|ignoriert)\b/i.test(col2);
    const datePart = col2.replace(/\s*[\(\[]?\b(ignored|ignoriert)\b[\)\]]?/gi, "").trim();
    let last = 0;
    if (datePart) {
      last = parseDateTimeString(datePart);
      if (last === 0) {
        const s = datePart.toLowerCase();
        const isPermittedZero = !s || s === "noch nie" || s === "never" || s === "-" || s === "–" || s === "0";
        if (!isPermittedZero) {
          return {
            ok: false,
            lineIndex: i,
            lineNum,
            error: `Line ${lineNum}: Invalid date format in "Last Update" (${datePart})`
          };
        }
      }
    }

    people[keyOf(cleanName)] = { name: cleanName, last, prev: null, ignored: isIgnored };
  }

  const peopleCount = Object.keys(people).length;
  if (peopleCount === 0) {
    return {
      ok: false,
      error: "No participants found in the Markdown table."
    };
  }

  return { ok: true, meetingName, people };
}

function parseMarkdownMeeting(mdText) {
  const lines = mdText.split(/\r?\n/);
  let meetingName = "";
  const people = {};

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!meetingName && line.startsWith("#")) {
      meetingName = line.replace(/^#+\s*/, "").trim();
      continue;
    }
    if (line.startsWith("|")) {
      const cols = line.split("|").map((c) => c.trim());
      if (cols.length >= 3) {
        const col1 = cols[1];
        const col2 = cols[2];
        if (!col1 || /^[-:\s]+$/.test(col1) || /^person$/i.test(col1) || /^last update$/i.test(col2) || /^letztes update$/i.test(col2)) continue;
        const cleanName = cleanPersonName(col1);
        if (!cleanName || isPresentationName(cleanName) || isNoiseOrIcon(cleanName)) continue;
        const isIgnored = /\b(ignored|ignoriert)\b/i.test(col2);
        const datePart = col2.replace(/\s*[\(\[]?\b(ignored|ignoriert)\b[\)\]]?/gi, "").trim();
        const last = parseDateTimeString(datePart);
        people[keyOf(cleanName)] = { name: cleanName, last, prev: null, ignored: isIgnored };
      }
    }
  }
  return { meetingName, people };
}



async function importMarkdownText(text, sourceLabel = "clipboard") {
  if (!text || typeof text !== "string") {
    return false;
  }
  const md = parseMarkdownMeeting(text);
  const peopleCount = Object.keys(md.people).length;
  if (peopleCount === 0) {
    return false;
  }

  const meetingName = md.meetingName || "Imported Meeting";
  const existing = Object.values(data.meetings).find(
    (x) => norm(x.name) === norm(meetingName) || (x.aliases || []).includes(norm(meetingName))
  );

  if (existing) {
    const overwrite = confirm(
      `The meeting "${existing.name}" already exists.\n\nDo you want to overwrite it with data from ${sourceLabel}?`
    );
    if (!overwrite) return false;
    existing.people = md.people;
    existing.round = null;
    sanitizeMeetingData(existing);
  } else {
    const id = uid();
    data.meetings[id] = {
      id,
      name: meetingName,
      aliases: [norm(meetingName)],
      codes: [],
      people: md.people,
      round: null,
      includeAbsent: false,
      createdAt: Date.now()
    };
    sanitizeMeetingData(data.meetings[id]);
  }

  await save();
  await refresh();
  return true;
}

let editingMeetingId = null;
let initialMarkdownText = "";

function updateModalSaveButton() {
  const textarea = $("markdownTextarea");
  const saveBtn = $("btnModalSave");
  if (!textarea || !saveBtn) return;
  const val = textarea.value.trim();
  if (!val) {
    saveBtn.disabled = true;
    return;
  }
  if (editingMeetingId) {
    // Enabled only when content differs from original markdown
    saveBtn.disabled = (val === initialMarkdownText.trim());
  } else {
    // New meeting / import: enabled when non-empty
    saveBtn.disabled = false;
  }
}

function clearModalError() {
  const errEl = $("modalError");
  if (errEl) errEl.classList.add("hidden");
  const ta = $("markdownTextarea");
  if (ta) ta.classList.remove("has-error");
}

function showModalError(message, lineIndex) {
  const errEl = $("modalError");
  const errText = $("modalErrorText");
  const ta = $("markdownTextarea");
  if (!ta) return;

  if (errText) errText.textContent = message;
  if (errEl) errEl.classList.remove("hidden");
  ta.classList.add("has-error");

  if (typeof lineIndex === "number" && lineIndex >= 0) {
    const text = ta.value;
    let currentLine = 0;
    let start = 0;
    for (let i = 0; i < text.length; i++) {
      if (currentLine === lineIndex) {
        break;
      }
      if (text[i] === "\n") {
        currentLine++;
        start = i + 1;
      }
    }
    let end = text.indexOf("\n", start);
    if (end === -1) end = text.length;
    if (end > start && text[end - 1] === "\r") {
      end--;
    }

    ta.focus();
    ta.setSelectionRange(start, end);

    const linesBefore = text.slice(0, start).split("\n").length - 1;
    const approxLineHeight = 18;
    ta.scrollTop = Math.max(0, (linesBefore - 2) * approxLineHeight);
  } else {
    ta.focus();
  }
}

function openMarkdownModal(meetingId = null) {
  document.body.classList.add("modal-open");
  clearModalError();
  editingMeetingId = meetingId;
  const modal = $("markdownModal");
  const textarea = $("markdownTextarea");
  const titleEl = $("modalTitle");
  const hintEl = $("modalHint");
  const saveBtn = $("btnModalSave");
  if (!modal || !textarea) return;

  if (meetingId && data.meetings[meetingId]) {
    const m = data.meetings[meetingId];
    if (titleEl) titleEl.textContent = `Edit "${m.name}"`;
    if (hintEl) hintEl.textContent = "View, edit, or copy the Markdown table of this meeting:";
    const md = meetingToMarkdown(m);
    textarea.value = md;
    initialMarkdownText = md;
    if (saveBtn) {
      saveBtn.textContent = "Save";
      saveBtn.disabled = true;
    }
  } else {
    editingMeetingId = null;
    if (titleEl) titleEl.textContent = "New Meeting / Import";
    if (hintEl) hintEl.textContent = "Paste a Markdown table or load a file from disk:";
    textarea.value = "";
    initialMarkdownText = "";
    if (saveBtn) {
      saveBtn.textContent = "Import";
      saveBtn.disabled = true;
    }
  }

  modal.classList.remove("hidden");
  setTimeout(() => textarea.focus(), 50);
}

function closeMarkdownModal() {
  clearModalError();
  const modal = $("markdownModal");
  if (modal) modal.classList.add("hidden");
  document.body.classList.remove("modal-open");
  editingMeetingId = null;
  initialMarkdownText = "";
}

async function copyModalText() {
  const textarea = $("markdownTextarea");
  if (!textarea || !textarea.value.trim()) return;
  const copyBtn = $("btnModalCopy");
  try {
    await navigator.clipboard.writeText(textarea.value);
  } catch {
    textarea.select();
    document.execCommand("copy");
  }
  if (copyBtn) {
    const origHtml = copyBtn.innerHTML;
    const origTitle = copyBtn.title || "Copy Markdown to clipboard";
    copyBtn.classList.add("copied");
    copyBtn.title = "Copied!";
    copyBtn.setAttribute("aria-label", "Copied!");
    copyBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    setTimeout(() => {
      copyBtn.classList.remove("copied");
      copyBtn.title = origTitle;
      copyBtn.setAttribute("aria-label", origTitle);
      copyBtn.innerHTML = origHtml;
    }, 1500);
  }
}

function downloadModalMarkdown() {
  const textarea = $("markdownTextarea");
  if (!textarea || !textarea.value.trim()) return;
  const md = textarea.value;

  let rawName = "";
  if (editingMeetingId && data.meetings[editingMeetingId]) {
    rawName = data.meetings[editingMeetingId].name || "";
  }
  if (!rawName) {
    const titleMatch = md.match(/^#\s+(.+)$/m);
    if (titleMatch && titleMatch[1]) {
      rawName = titleMatch[1].trim();
    }
  }

  const slug = (rawName || "meeting")
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]+/gi, "-")
    .replace(/^-+|-+$/g, "");

  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${slug || "meeting"}.md`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

async function saveMarkdownModal() {
  const textarea = $("markdownTextarea");
  if (!textarea) return;
  const text = textarea.value.trim();
  if (!text) {
    showModalError("Please enter or paste a Markdown table.");
    return;
  }

  const validation = validateAndParseMarkdownMeeting(textarea.value);
  if (!validation.ok) {
    showModalError(validation.error, validation.lineIndex);
    return;
  }

  clearModalError();
  const { meetingName, people } = validation;

  if (editingMeetingId && data.meetings[editingMeetingId]) {
    const m = data.meetings[editingMeetingId];
    if (meetingName && meetingName !== m.name) {
      m.name = meetingName;
      addAlias(m, meetingName);
    }
    m.people = people;
    m.round = null;
    sanitizeMeetingData(m);
    await save();
    await refresh();
    closeMarkdownModal();
    return;
  }

  // New meeting / import
  const success = await importMarkdownText(textarea.value, "editor");
  if (success) {
    closeMarkdownModal();
  }
}

async function importFile(file) {
  const text = await file.text();

  // If the Markdown modal is open, load content directly into the editor
  const modal = $("markdownModal");
  if (modal && !modal.classList.contains("hidden")) {
    const textarea = $("markdownTextarea");
    if (textarea) {
      textarea.value = text;
      clearModalError();
      updateModalSaveButton();
      return;
    }
  }

  // Import as Markdown meeting
  if (text.includes("|") && text.includes("#")) {
    await importMarkdownText(text, `"${file.name}"`);
  }
}

/* ---------- Events ---------- */

for (const t of document.querySelectorAll(".tab")) {
  t.addEventListener("click", () => {
    view = t.dataset.view;
    deleteMode = false;
    showAddRow = false;
    render();
    if (view === "people" && current && current.inMeet) {
      refresh(false);
    }
  });
}

$("btnActivate").addEventListener("click", async () => {
  const name = $("activateName").value.trim();
  if (!name) {
    return;
  }
  const id = uid();
  data.meetings[id] = {
    id,
    name,
    aliases: [norm(name)],
    codes: current && current.code ? [current.code] : [],
    people: {},
    round: null,
    includeAbsent: false,
    createdAt: Date.now()
  };
  if (current && current.title) addAlias(data.meetings[id], current.title);
  currentId = id;
  selectedId = null;
  await save();
  view = "people";
  await refresh(true);
});


if ($("btnRefresh")) {
  $("btnRefresh").addEventListener("click", async () => {
    const btn = $("btnRefresh");
    btn.classList.add("spinning");
    try {
      await refresh(false);
    } finally {
      setTimeout(() => btn.classList.remove("spinning"), 400);
    }
  });
}

if ($("btnToggleSort")) {
  $("btnToggleSort").addEventListener("click", () => {
    sortAlphabetical = !sortAlphabetical;
    render();
  });
}

if ($("btnToggleAdd")) {
  $("btnToggleAdd").addEventListener("click", () => {
    showAddRow = !showAddRow;
    render();
    if (showAddRow && $("newName")) {
      $("newName").focus();
    }
  });
}

if ($("btnToggleAbsent")) {
  $("btnToggleAbsent").addEventListener("click", async () => {
    const m = meeting();
    if (!m) return;
    m.includeAbsent = !m.includeAbsent;
    await save();
    render();
  });
}

$("btnAdd").addEventListener("click", async () => {
  const m = meeting();
  const raw = $("newName").value.trim();
  if (isPresentationName(raw) || isNoiseOrIcon(raw)) {
    return;
  }
  const name = cleanPersonName(raw);
  if (!name || !m || isPresentationName(name) || isNoiseOrIcon(name)) return;
  const k = keyOf(name);
  if (!m.people[k]) {
    m.people[k] = { name, last: 0, prev: null, ignored: false };
    if (m.round && Array.isArray(m.round.keys)) {
      m.round.keys.push(k);
    }
  }
  $("newName").value = "";
  await save();
  render();
});

$("newName").addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("btnAdd").click();
  if (e.key === "Escape") {
    showAddRow = false;
    render();
  }
});

$("settingAutoRefresh").addEventListener("change", async (e) => {
  data.settings = data.settings || {};
  data.settings.autoRefresh = e.target.checked;
  $("fieldRefreshInterval").classList.toggle("hidden", !e.target.checked);
  $("hintRefreshInterval").classList.toggle("hidden", !e.target.checked);
  await save();
  setupAutoRefresh();
});

$("settingRefreshInterval").addEventListener("change", async (e) => {
  const val = Math.max(1, Math.min(60, parseInt(e.target.value, 10) || DEFAULT_REFRESH_INTERVAL));
  data.settings = data.settings || {};
  data.settings.refreshInterval = val;
  $("settingRefreshInterval").value = val;
  await save();
  setupAutoRefresh();
});

if ($("btnToggleDeleteMode")) {
  $("btnToggleDeleteMode").addEventListener("click", () => {
    deleteMode = !deleteMode;
    render();
  });
}
if ($("btnNewMeeting")) $("btnNewMeeting").addEventListener("click", () => openMarkdownModal(null));
if ($("fileInput")) {
  $("fileInput").addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (f) importFile(f);
    e.target.value = "";
  });
}

if ($("btnModalClose")) $("btnModalClose").addEventListener("click", closeMarkdownModal);
if ($("btnModalCancel")) $("btnModalCancel").addEventListener("click", closeMarkdownModal);
if ($("btnModalSave")) $("btnModalSave").addEventListener("click", saveMarkdownModal);
if ($("btnModalUpload")) $("btnModalUpload").addEventListener("click", () => $("fileInput").click());
if ($("btnModalDownload")) $("btnModalDownload").addEventListener("click", downloadModalMarkdown);
if ($("btnModalCopy")) $("btnModalCopy").addEventListener("click", copyModalText);
const modalTextarea = $("markdownTextarea");
if (modalTextarea) {
  modalTextarea.addEventListener("input", () => {
    clearModalError();
    updateModalSaveButton();
  });
  modalTextarea.addEventListener("click", clearModalError);
  modalTextarea.addEventListener("keyup", () => {
    clearModalError();
    updateModalSaveButton();
  });
}
if ($("markdownModal")) {
  $("markdownModal").addEventListener("click", (e) => {
    if (e.target === $("markdownModal")) closeMarkdownModal();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const modal = $("markdownModal");
      if (modal && !modal.classList.contains("hidden")) {
        closeMarkdownModal();
      }
    }
  });
}

try {
  const v = chrome.runtime.getManifest().version;
  if ($("appVersion")) $("appVersion").textContent = v;
  if ($("headerLogo")) $("headerLogo").title = `POPCORN v${v}`;
} catch {}

refresh(false).then(() => {
  setupAutoRefresh();
});
