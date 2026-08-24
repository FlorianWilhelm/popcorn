/* Meet Update Rotator - Popup-Logik
 * Tracking haengt am Meeting-Namen, nicht am Termin oder Wochentag.
 * Ein Meeting wird erst verfolgt, wenn es hier ausdruecklich aktiviert wurde.
 */

const STORE_KEY = "mur_v1"; // Schluessel bleibt, Migration laeuft im Code
const ROUND_TTL = 6 * 60 * 60 * 1000;
const DEFAULT_TOP_N = 5;
const DEFAULT_REFRESH_INTERVAL = 5;

const $ = (id) => document.getElementById(id);

let data = {
  version: 2,
  meetings: {},
  settings: {
    topN: DEFAULT_TOP_N,
    autoRefresh: true,
    refreshInterval: DEFAULT_REFRESH_INTERVAL
  }
};
let current = null; // { inMeet, code, title, people }
let currentId = null; // getracktes Meeting, das gerade laeuft
let selectedId = null; // manuell aus der Meetingliste geoeffnet
let presentKeys = new Set();
let view = "round";
let refreshTimer = null;

const norm = (s) => (s || "").normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase();
const keyOf = (name) => norm(name);
const uid = () => `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

const getTopN = () => (data.settings && Number(data.settings.topN)) || DEFAULT_TOP_N;
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
  "drag_indicator", "grid_view", "screen_search_desktop"
]);

const NOISE_PATTERN = /^(du|you|sie|ich|me|host|moderator|gastgeber|meeting-host|besprechungsleiter|praesentation|präsentation|presentation|stummgeschaltet|muted|angepinnt|pinned|beitreten|joining|eingeladen|invited|ebenfalls eingeladen|also invited|im meeting|in call|contributors|weitere optionen|more options|teilnehmer|participants|personen|people|suchen|search|reframe|framing|auto-framing|ausschnitt|ausschnitt anpassen|kamera|camera|mikrofon|microphone|video|audio)$/i;

const isNoiseOrIcon = (s) => {
  if (!s) return true;
  const lower = (s || "").toLowerCase().trim();
  if (NOISE_WORDS.has(lower)) return true;
  if (NOISE_PATTERN.test(lower)) return true;
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

  // Action prefixes and suffixes from Meet UI / accessibility labels
  s = s.replace(/^pin\s+(.+?)\s+to\s+(?:your\s+|the\s+)?(?:main\s+)?screen$/i, "$1");
  s = s.replace(/^unpin\s+(.+?)\s+from\s+(?:your\s+|the\s+)?(?:main\s+)?screen$/i, "$1");
  s = s.replace(/^pin\s+(.+?)\s+to\s+screen$/i, "$1");
  s = s.replace(/^unpin\s+(.+?)\s+from\s+screen$/i, "$1");
  s = s.replace(/^(.+?)\s+an\s+(?:den\s+)?(?:hauptbildschirm|bildschirm)\s+anpinnen$/i, "$1");
  s = s.replace(/^(.+?)\s+vom\s+(?:hauptbildschirm|bildschirm)\s+(?:lösen|entfernen|entpinnen)$/i, "$1");
  s = s.replace(/^(.+?)\s+(?:nicht\s+mehr\s+anpinnen|anpinnen|anheften)$/i, "$1");
  s = s.replace(/^(?:weitere\s+(?:optionen|aktionen)\s+für|more\s+(?:options|actions)\s+for|aktionen\s+für)\s+(.+)$/i, "$1");
  s = s.replace(/^(?:mute|unmute|stummschalten\s+für)\s+(.+)$/i, "$1");
  s = s.replace(/^(.+?)\s+stummschalten$/i, "$1");
  s = s.replace(/^(?:video\s+von\s+|video\s+of\s+)(.+)$/i, "$1");
  s = s.replace(/^(.+?)'s\s+video$/i, "$1");

  // Remove parenthetical qualifiers: (Du), (You), (Host), (Presentation), etc.
  s = s.replace(/\((du|you|sie|ich|me|dein bildschirm|your presentation|präsentation|presentation|gastgeber|host|meeting host|besprechungsleiter|moderator|extern|external|intern|internal)\)/gi, "");
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
        prev: p && p.prev != null ? p.prev : null
      };
    } else {
      newPeople[newKey].last = Math.max(newPeople[newKey].last || 0, (p && p.last) || 0);
      if (p && p.prev != null && newPeople[newKey].prev == null) {
        newPeople[newKey].prev = p.prev;
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
      if (mappedKey && m.people[mappedKey] && !seenRound.has(mappedKey)) {
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
      topN: DEFAULT_TOP_N,
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
    loadedData.settings = { topN: DEFAULT_TOP_N, autoRefresh: true, refreshInterval: DEFAULT_REFRESH_INTERVAL };
  } else {
    loadedData.settings.topN = Math.max(1, Math.min(20, Number(loadedData.settings.topN) || DEFAULT_TOP_N));
    loadedData.settings.autoRefresh = loadedData.settings.autoRefresh !== false;
    loadedData.settings.refreshInterval = Math.max(2, Math.min(60, Number(loadedData.settings.refreshInterval) || DEFAULT_REFRESH_INTERVAL));
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

async function readMeet(withPeople) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !/^https:\/\/meet\.google\.com\//.test(tab.url || "")) {
    return { ok: false, reason: "nomeet" };
  }
  const send = () => chrome.tabs.sendMessage(tab.id, { type: "MUR_SCRAPE", withPeople: !!withPeople });
  try {
    return await send();
  } catch {
    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
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
      m.people[k] = { name: clean, last: 0, prev: null };
      added++;
    } else {
      m.people[k].name = clean;
    }
  }
  return added;
}

function candidates(m) {
  const pool = Object.entries(m.people)
    .map(([k, v]) => ({ key: k, ...v }))
    .filter((p) => m.includeAbsent || presentKeys.size === 0 || presentKeys.has(p.key));
  pool.sort((a, b) => a.last - b.last || a.name.localeCompare(b.name, "de"));
  return pool;
}

function ensureRound(m, force) {
  const topCount = getTopN();
  const fresh = m.round && Date.now() - m.round.createdAt < ROUND_TTL;
  if (!force && fresh) {
    const valid = m.round.keys.filter((k) => m.people[k]);
    if (valid.length) {
      if (valid.length < topCount) {
        const pool = candidates(m).map((p) => p.key);
        for (const k of pool) {
          if (!valid.includes(k) && valid.length < topCount) {
            valid.push(k);
          }
        }
      }
      m.round.keys = valid.slice(0, topCount);
      return;
    }
  }
  m.round = { keys: candidates(m).slice(0, topCount).map((p) => p.key), createdAt: Date.now() };
}

/* ---------- Bausteine ---------- */

function waitedText(last) {
  if (!last) return "noch nie";
  const days = Math.floor((Date.now() - last) / 86400000);
  const date = new Date(last).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });
  if (days <= 0) return `heute · ${date}`;
  return `vor ${days} ${days === 1 ? "Tag" : "Tagen"} · ${date}`;
}

function waitRatio(last, oldest) {
  if (!last) return 1;
  const span = Date.now() - (oldest || last);
  if (span <= 0) return 0.08;
  return Math.max(0.08, Math.min(1, (Date.now() - last) / span));
}

function buildPersonItem(m, person, index, oldest, opts = {}) {
  const li = document.createElement("li");
  li.className = "item";
  const doneToday = person.last && Date.now() - person.last < 86400000;
  if (doneToday) li.classList.add("done");
  if (presentKeys.size && !presentKeys.has(person.key)) li.classList.add("absent");

  const pos = document.createElement("div");
  pos.className = "pos";
  pos.textContent = index === null ? "" : String(index + 1).padStart(2, "0");

  const main = document.createElement("div");
  const name = document.createElement("div");
  name.className = "name";
  name.textContent = person.name;

  const meta = document.createElement("div");
  meta.className = "meta";
  const bar = document.createElement("div");
  bar.className = "bar-wait";
  const fill = document.createElement("span");
  fill.style.width = `${Math.round(waitRatio(person.last, oldest) * 100)}%`;
  bar.appendChild(fill);
  const label = document.createElement("span");
  label.textContent = waitedText(person.last);
  meta.append(label, bar);
  main.append(name, meta);

  const right = document.createElement("div");
  right.className = "actions";

  const toggle = document.createElement("label");
  toggle.className = "toggle";
  toggle.title = "Hat vorgetragen";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = !!doneToday;
  const track = document.createElement("span");
  track.className = "track";
  toggle.append(input, track);

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

  right.appendChild(toggle);

  if (opts.deletable) {
    const del = document.createElement("button");
    del.className = "mini ghost icon-btn";
    del.title = "Person entfernen";
    del.setAttribute("aria-label", "Person entfernen");
    del.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
    del.addEventListener("click", async () => {
      delete m.people[person.key];
      if (m.round) m.round.keys = m.round.keys.filter((k) => k !== person.key);
      await save();
      render();
    });
    right.appendChild(del);
  }

  li.append(pos, main, right);
  return li;
}

function buildMeetingItem(m) {
  const li = document.createElement("li");
  li.className = "meeting" + (m.id === currentId ? " current" : "");

  const left = document.createElement("div");
  const input = document.createElement("input");
  input.type = "text";
  input.value = m.name;
  input.title = "Name bearbeiten";
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
    setStatus(`Umbenannt in ${v}. Der alte Name bleibt als Erkennung erhalten.`);
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") input.blur();
  });

  const meta = document.createElement("div");
  meta.className = "meta";
  const count = Object.keys(m.people).length;
  const parts = [`${count} ${count === 1 ? "Person" : "Personen"}`];
  if (m.id === currentId) parts.push("läuft gerade");
  meta.textContent = parts.join(" · ");
  left.append(input, meta);

  const actions = document.createElement("div");
  actions.className = "actions";

  const copyBtn = document.createElement("button");
  copyBtn.className = "mini ghost icon-btn";
  copyBtn.title = "Als Markdown in Zwischenablage kopieren";
  copyBtn.setAttribute("aria-label", "Als Markdown kopieren");
  copyBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
  copyBtn.addEventListener("click", async () => {
    await copyMeetingMarkdown(m);
    copyBtn.classList.add("copied");
    setStatus(`Markdown für "${m.name}" kopiert.`);
    setTimeout(() => copyBtn.classList.remove("copied"), 1500);
  });

  const dlBtn = document.createElement("button");
  dlBtn.className = "mini ghost icon-btn";
  dlBtn.title = "Als Markdown-Datei exportieren (.md)";
  dlBtn.setAttribute("aria-label", "Als Markdown-Datei exportieren");
  dlBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
  dlBtn.addEventListener("click", () => {
    downloadMeetingMarkdown(m);
  });

  const open = document.createElement("button");
  open.className = "mini ghost btn-with-icon";
  open.title = "Personenliste dieses Meetings öffnen";
  open.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg><span>Öffnen</span>`;
  open.addEventListener("click", () => {
    selectedId = m.id;
    view = "people";
    render();
  });

  const del = document.createElement("button");
  del.className = "mini ghost icon-btn";
  del.title = "Tracking beenden und Verlauf löschen";
  del.setAttribute("aria-label", "Meeting löschen");
  del.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
  del.addEventListener("click", async () => {
    if (!confirm(`Tracking für "${m.name}" beenden? Der gespeicherte Verlauf wird gelöscht.`)) return;
    delete data.meetings[m.id];
    if (currentId === m.id) currentId = null;
    if (selectedId === m.id) selectedId = null;
    await save();
    render();
  });

  actions.append(copyBtn, dlBtn, open, del);
  li.append(left, actions);
  return li;
}

/* ---------- Rendern ---------- */

function setStatus(text) {
  const el = $("status");
  el.textContent = text || "";
  el.classList.toggle("hidden", !text);
}

function show(id) {
  for (const s of ["viewOff", "viewRound", "viewPeople", "viewMeetings", "viewSettings"]) {
    $(s).classList.toggle("hidden", s !== id);
  }
}

function render() {
  const m = meeting();
  const inMeet = !!(current && current.inMeet);

  // Kopfzeile
  if (inMeet) {
    $("headEyebrow").textContent = "Aktuelles Meeting";
    $("headName").textContent = current.title || current.code || "Meeting ohne Namen";
    $("badge").textContent = currentId ? "aktiv" : "aus";
    $("badge").className = `badge ${currentId ? "on" : "off"}`;
    $("badge").classList.remove("hidden");
  } else {
    $("headEyebrow").textContent = m ? "Ausgewählte Liste" : "Kein Meet-Tab";
    $("headName").textContent = m ? m.name : "Kein Meeting";
    $("badge").classList.add("hidden");
  }

  // Tabs
  for (const t of document.querySelectorAll(".tab")) {
    t.classList.toggle("active", t.dataset.view === view);
    if (t.dataset.view !== "meetings" && t.dataset.view !== "settings") t.disabled = !m;
  }

  // Ansicht waehlen
  if (view === "settings") {
    show("viewSettings");
  } else if (view === "meetings" || (!m && !inMeet)) {
    show("viewMeetings");
  } else if (!m) {
    show("viewOff");
  } else if (view === "people") {
    show("viewPeople");
  } else {
    show("viewRound");
  }

  // Aktivierungsansicht
  if (!m && inMeet) {
    if (!$("activateName").value) {
      $("activateName").value = current.title || (current.code ? `Meeting ${current.code}` : "");
    }
    const sel = $("linkTarget");
    sel.innerHTML = "";
    const all = Object.values(data.meetings);
    if (all.length === 0) {
      const opt = document.createElement("option");
      opt.textContent = "Keine Liste vorhanden";
      sel.appendChild(opt);
      sel.disabled = true;
      $("btnLink").disabled = true;
    } else {
      sel.disabled = false;
      $("btnLink").disabled = false;
      for (const g of all) {
        const opt = document.createElement("option");
        opt.value = g.id;
        opt.textContent = g.name;
        sel.appendChild(opt);
      }
    }
  }

  // Runde / Update
  const list = $("list");
  list.innerHTML = "";
  if (m) {
    const shown = (m.round ? m.round.keys : [])
      .map((k) => (m.people[k] ? { key: k, ...m.people[k] } : null))
      .filter(Boolean);
    const oldest = Math.min(...shown.map((p) => p.last || 0), Date.now());
    shown.forEach((p, i) => list.appendChild(buildPersonItem(m, p, i, oldest)));
    $("emptyHint").classList.toggle("hidden", shown.length > 0);
    $("includeAbsent").checked = !!m.includeAbsent;
  }

  // Personen
  const all = $("allList");
  all.innerHTML = "";
  if (m) {
    const everyone = Object.entries(m.people)
      .map(([k, v]) => ({ key: k, ...v }))
      .sort((a, b) => a.last - b.last || a.name.localeCompare(b.name, "de"));
    const oldestAll = Math.min(...everyone.map((p) => p.last || 0), Date.now());
    everyone.forEach((p) => all.appendChild(buildPersonItem(m, p, null, oldestAll, { deletable: true })));
    $("peopleEmpty").classList.toggle("hidden", everyone.length > 0);
  }

  // Meetings
  const ml = $("meetingList");
  ml.innerHTML = "";
  const meetings = Object.values(data.meetings).sort((a, b) => a.name.localeCompare(b.name, "de"));
  meetings.forEach((g) => ml.appendChild(buildMeetingItem(g)));
  $("meetingsEmpty").classList.toggle("hidden", meetings.length > 0);

  // Einstellungen
  if ($("settingTopN") && document.activeElement !== $("settingTopN")) {
    $("settingTopN").value = getTopN();
  }
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

/* ---------- Ablauf ---------- */

async function refresh(newRound = false, options = {}) {
  data = await load();

  // Phase 1: nur Name und Code lesen, Personenliste unberuehrt lassen
  const probe = await readMeet(false);
  current = probe && probe.ok
    ? { inMeet: true, code: probe.code, title: probe.title, people: [] }
    : { inMeet: false, code: null, title: null, people: [] };

  currentId = null;
  presentKeys = new Set();

  if (!current.inMeet) {
    if (!options.background) {
      setStatus(
        probe && probe.reason === "noinject"
          ? "Meet-Tab gefunden, aber noch nicht lesbar. Lade die Meet-Seite neu."
          : ""
      );
    }
    render();
    return;
  }

  const hit = matchMeeting(current.title, current.code);
  if (!hit) {
    if (!options.background) setStatus("");
    render();
    return;
  }

  const m = hit.m;
  currentId = m.id;
  selectedId = null;

  if (hit.via === "code" && current.title && norm(current.title) !== norm(m.name)) {
    addAlias(m, current.title);
    setStatus(`Der Kalendertitel lautet jetzt "${current.title}". Die Liste wurde zugeordnet.`);
  }
  if (current.code && !(m.codes || []).includes(current.code)) {
    m.codes = m.codes || [];
    m.codes.push(current.code);
  }

  // Phase 2: erst jetzt die Personenliste lesen
  const full = await readMeet(true);
  if (full && full.ok) {
    current.people = (full.people || [])
      .filter((p) => !isPresentationName(p.name) && !isNoiseOrIcon(p.name))
      .map((p) => ({ ...p, name: cleanPersonName(p.name) }))
      .filter((p) => !!p.name && !isPresentationName(p.name) && !isNoiseOrIcon(p.name));
    presentKeys = new Set(current.people.filter((p) => p.present).map((p) => keyOf(p.name)));
    const added = syncRoster(m, current.people);
    ensureRound(m, newRound);
    await save();
    render();

    const total = Object.keys(m.people).length;
    const parts = [`${presentKeys.size} anwesend von ${total}`];
    if (added) parts.push(`${added} neu aufgenommen`);
    if (current.people.length === 0) parts.push("Öffne in Meet die Personenliste");
    setStatus(parts.join(" · "));
  } else {
    ensureRound(m, newRound);
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
      const activeEl = document.activeElement;
      const isEditingText = activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA") && (activeEl.type === "text" || activeEl.type === "number");
      if (isEditingText && view !== "round") return;
      await refresh(false, { background: true });
    }, sec * 1000);
  }
}

/* ---------- Import und Export (Markdown & JSON) ---------- */

function meetingToMarkdown(m) {
  const rows = Object.values(m.people || {})
    .sort((a, b) => (b.last || 0) - (a.last || 0) || a.name.localeCompare(b.name))
    .map((p) => {
      const timeStr = p.last ? new Date(p.last).toLocaleString() : "noch nie";
      return `| ${p.name} | ${timeStr} |`;
    });
  return `# ${m.name}\n\n| Person | Letztes Update |\n| --- | --- |\n${rows.join("\n")}\n`;
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

  // Format DD.MM.YYYY[ ,][HH:mm[:ss]]
  const deMatch = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (deMatch) {
    const [, d, m, y, h, min, sec] = deMatch;
    const date = new Date(Number(y), Number(m) - 1, Number(d), Number(h || 0), Number(min || 0), Number(sec || 0));
    if (!isNaN(date.getTime())) return date.getTime();
  }

  const parsed = Date.parse(str);
  if (!isNaN(parsed)) return parsed;

  return 0;
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
        if (!col1 || /^[-:\s]+$/.test(col1) || /^person$/i.test(col1)) continue;
        const cleanName = cleanPersonName(col1);
        if (!cleanName || isPresentationName(cleanName) || isNoiseOrIcon(cleanName)) continue;
        const last = parseDateTimeString(col2);
        people[keyOf(cleanName)] = { name: cleanName, last, prev: null };
      }
    }
  }
  return { meetingName, people };
}

function exportData() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `update-rotator-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function mergeInto(target, incoming) {
  for (const [id, g] of Object.entries(incoming.meetings || {})) {
    sanitizeMeetingData(g);
    const existing =
      target.meetings[id] ||
      Object.values(target.meetings).find((x) => norm(x.name) === norm(g.name));
    if (!existing) {
      target.meetings[id] = g;
      continue;
    }
    for (const [k, p] of Object.entries(g.people || {})) {
      if (!existing.people[k]) existing.people[k] = p;
      else existing.people[k].last = Math.max(existing.people[k].last || 0, p.last || 0);
    }
    for (const a of g.aliases || []) addAlias(existing, a);
    for (const c of g.codes || []) if (!existing.codes.includes(c)) existing.codes.push(c);
    sanitizeMeetingData(existing);
  }
  return target;
}

async function importFile(file) {
  const text = await file.text();

  // 1. Zuerst als Markdown-Meeting prüfen
  if (text.includes("|") && text.includes("#")) {
    const md = parseMarkdownMeeting(text);
    if (md.meetingName && Object.keys(md.people).length > 0) {
      const existing = Object.values(data.meetings).find(
        (x) => norm(x.name) === norm(md.meetingName) || (x.aliases || []).includes(norm(md.meetingName))
      );
      if (existing) {
        const overwrite = confirm(
          `Das Meeting "${existing.name}" existiert bereits.\n\nSoll es mit den Daten aus "${file.name}" überschrieben werden?`
        );
        if (!overwrite) return;
        existing.people = md.people;
        existing.round = null;
        sanitizeMeetingData(existing);
      } else {
        const id = uid();
        data.meetings[id] = {
          id,
          name: md.meetingName,
          aliases: [norm(md.meetingName)],
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
      setStatus(`Meeting "${md.meetingName}" (${Object.keys(md.people).length} Personen) importiert.`);
      return;
    }
  }

  // 2. Als JSON-Backup importieren
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    setStatus("Die Datei konnte weder als Markdown noch als JSON gelesen werden.");
    return;
  }
  if (!parsed || typeof parsed !== "object" || !(parsed.meetings || parsed.groups)) {
    setStatus("In der JSON-Datei fehlt das Feld meetings.");
    return;
  }
  const replace = confirm(
    "OK ersetzt alle gespeicherten Listen durch die Datei.\nAbbrechen führt die Datei mit den bestehenden Listen zusammen."
  );
  if (replace) {
    data = parsed.meetings ? parsed : { version: 2, meetings: {} };
    for (const m of Object.values(data.meetings || {})) {
      sanitizeMeetingData(m);
    }
  } else {
    mergeInto(data, parsed);
  }
  await save();
  await refresh();
  setStatus(replace ? "Listen ersetzt." : "Listen zusammengeführt.");
}

/* ---------- Ereignisse ---------- */

for (const t of document.querySelectorAll(".tab")) {
  t.addEventListener("click", () => {
    view = t.dataset.view;
    if (view === "meetings") selectedId = selectedId;
    render();
  });
}

$("btnActivate").addEventListener("click", async () => {
  const name = $("activateName").value.trim();
  if (!name) {
    setStatus("Bitte einen Meeting-Namen eintragen.");
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
  await save();
  view = "round";
  await refresh(true);
  setStatus(`Tracking für "${name}" aktiviert.`);
});

$("btnLink").addEventListener("click", async () => {
  const id = $("linkTarget").value;
  const m = data.meetings[id];
  if (!m) return;
  if (current && current.title) addAlias(m, current.title);
  if (current && current.code && !m.codes.includes(current.code)) m.codes.push(current.code);
  await save();
  view = "round";
  await refresh(false);
  setStatus(`Dieses Meeting nutzt jetzt die Liste "${m.name}".`);
});

$("btnRefresh").addEventListener("click", () => refresh(false));
$("btnNewRound").addEventListener("click", () => refresh(true));

$("includeAbsent").addEventListener("change", async (e) => {
  const m = meeting();
  if (!m) return;
  m.includeAbsent = e.target.checked;
  await save();
  await refresh(true);
});

$("btnAdd").addEventListener("click", async () => {
  const m = meeting();
  const raw = $("newName").value.trim();
  if (isPresentationName(raw) || isNoiseOrIcon(raw)) {
    setStatus("Ungültiger Personenname.");
    return;
  }
  const name = cleanPersonName(raw);
  if (!name || !m || isPresentationName(name) || isNoiseOrIcon(name)) return;
  const k = keyOf(name);
  if (!m.people[k]) m.people[k] = { name, last: 0, prev: null };
  $("newName").value = "";
  await save();
  render();
});

$("newName").addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("btnAdd").click();
});

$("settingTopN").addEventListener("change", async (e) => {
  const val = Math.max(1, Math.min(20, parseInt(e.target.value, 10) || DEFAULT_TOP_N));
  data.settings = data.settings || {};
  data.settings.topN = val;
  $("settingTopN").value = val;
  const m = meeting();
  if (m) ensureRound(m, true);
  await save();
  render();
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
  const val = Math.max(2, Math.min(60, parseInt(e.target.value, 10) || DEFAULT_REFRESH_INTERVAL));
  data.settings = data.settings || {};
  data.settings.refreshInterval = val;
  $("settingRefreshInterval").value = val;
  await save();
  setupAutoRefresh();
});

if ($("btnImportPlus")) $("btnImportPlus").addEventListener("click", () => $("fileInput").click());
if ($("btnExportJson")) $("btnExportJson").addEventListener("click", exportData);
if ($("fileInput")) {
  $("fileInput").addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (f) importFile(f);
    e.target.value = "";
  });
}

try {
  const v = chrome.runtime.getManifest().version;
  if ($("appVersion")) $("appVersion").textContent = v;
} catch {}

refresh(false).then(() => {
  setupAutoRefresh();
});
