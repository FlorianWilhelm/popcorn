/* Meet Update Rotator - Popup-Logik
 * Tracking haengt am Meeting-Namen, nicht am Termin oder Wochentag.
 * Ein Meeting wird erst verfolgt, wenn es hier ausdruecklich aktiviert wurde.
 */

const STORE_KEY = "mur_v1"; // Schluessel bleibt, Migration laeuft im Code
const ROUND_TTL = 6 * 60 * 60 * 1000;
const TOP_N = 5;

const $ = (id) => document.getElementById(id);

let data = { version: 2, meetings: {} };
let current = null; // { inMeet, code, title, people }
let currentId = null; // getracktes Meeting, das gerade laeuft
let selectedId = null; // manuell aus der Meetingliste geoeffnet
let presentKeys = new Set();
let view = "round";

const norm = (s) => (s || "").normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase();
const keyOf = (name) => norm(name);
const uid = () => `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

const activeId = () => selectedId || currentId;
const meeting = () => (activeId() ? data.meetings[activeId()] : null);

/* ---------- Speicher ---------- */

async function load() {
  const res = await chrome.storage.local.get(STORE_KEY);
  const raw = res[STORE_KEY];
  if (!raw) return { version: 2, meetings: {} };
  if (raw.meetings) return raw;

  // Migration v1: Gruppen hingen am Meeting-Code
  const migrated = { version: 2, meetings: {} };
  for (const [gid, g] of Object.entries(raw.groups || {})) {
    const id = uid();
    migrated.meetings[id] = {
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
  return migrated;
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
    const k = keyOf(p.name);
    if (!m.people[k]) {
      m.people[k] = { name: p.name, last: 0, prev: null };
      added++;
    } else {
      m.people[k].name = p.name;
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
  const fresh = m.round && Date.now() - m.round.createdAt < ROUND_TTL;
  if (!force && fresh) {
    const valid = m.round.keys.filter((k) => m.people[k]);
    if (valid.length) {
      m.round.keys = valid;
      return;
    }
  }
  m.round = { keys: candidates(m).slice(0, TOP_N).map((p) => p.key), createdAt: Date.now() };
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
    del.className = "mini ghost";
    del.textContent = "×";
    del.title = "Person entfernen";
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

  const open = document.createElement("button");
  open.className = "mini ghost";
  open.textContent = "Öffnen";
  open.addEventListener("click", () => {
    selectedId = m.id;
    view = "people";
    render();
  });

  const del = document.createElement("button");
  del.className = "mini ghost";
  del.textContent = "×";
  del.title = "Tracking beenden und Verlauf löschen";
  del.addEventListener("click", async () => {
    if (!confirm(`Tracking für "${m.name}" beenden? Der gespeicherte Verlauf wird gelöscht.`)) return;
    delete data.meetings[m.id];
    if (currentId === m.id) currentId = null;
    if (selectedId === m.id) selectedId = null;
    await save();
    render();
  });

  actions.append(open, del);
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
  for (const s of ["viewOff", "viewRound", "viewPeople", "viewMeetings"]) {
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
    if (t.dataset.view !== "meetings") t.disabled = !m;
  }

  // Ansicht waehlen
  if (view === "meetings" || (!m && !inMeet)) {
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

  // Runde
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
}

/* ---------- Ablauf ---------- */

async function refresh(newRound = false) {
  data = await load();

  // Phase 1: nur Name und Code lesen, Personenliste unberuehrt lassen
  const probe = await readMeet(false);
  current = probe && probe.ok
    ? { inMeet: true, code: probe.code, title: probe.title, people: [] }
    : { inMeet: false, code: null, title: null, people: [] };

  currentId = null;
  presentKeys = new Set();

  if (!current.inMeet) {
    setStatus(
      probe && probe.reason === "noinject"
        ? "Meet-Tab gefunden, aber noch nicht lesbar. Lade die Meet-Seite neu."
        : ""
    );
    render();
    return;
  }

  const hit = matchMeeting(current.title, current.code);
  if (!hit) {
    setStatus("");
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
    current.people = full.people || [];
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

/* ---------- Import und Export ---------- */

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
  }
  return target;
}

async function importFile(file) {
  const text = await file.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    setStatus("Die Datei ist kein gültiges JSON.");
    return;
  }
  if (!parsed || typeof parsed !== "object" || !(parsed.meetings || parsed.groups)) {
    setStatus("In der Datei fehlt das Feld meetings.");
    return;
  }
  const replace = confirm(
    "OK ersetzt alle gespeicherten Listen durch die Datei.\nAbbrechen führt die Datei mit den bestehenden Listen zusammen."
  );
  if (replace) {
    data = parsed.meetings ? parsed : { version: 2, meetings: {} };
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
  const name = $("newName").value.trim();
  if (!name || !m) return;
  const k = keyOf(name);
  if (!m.people[k]) m.people[k] = { name, last: 0, prev: null };
  $("newName").value = "";
  await save();
  render();
});

$("newName").addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("btnAdd").click();
});

$("btnExport").addEventListener("click", exportData);
$("btnImport").addEventListener("click", () => $("fileInput").click());
$("fileInput").addEventListener("change", (e) => {
  const f = e.target.files[0];
  if (f) importFile(f);
  e.target.value = "";
});

refresh(false);
