/* POPCORN - Participant Order Picker for Candid On-call Reporting & Notes
 * Popup: state, communication with the Meet content script, rendering, and event handling.
 * Pure logic lives in lib/names.js, lib/meetings.js, and lib/markdown.js.
 */

const { normalizeKey, cleanPersonName, isPresentation, isNoiseOrIcon } = PopcornNames;
const {
  DAY_MS,
  DEFAULT_REFRESH_INTERVAL,
  createDefaultData,
  createMeeting,
  clampRefreshInterval,
  sanitizeMeeting,
  migrateStoredData,
  matchMeeting,
  addAlias,
  rememberMeetIdentity,
  normalizeScrapedPeople,
  syncRoster,
  isDoneRecently,
  syncMeetingOrder
} = PopcornMeetings;
const { meetingToMarkdown, parseMeetingMarkdown, markdownFileName } = PopcornMarkdown;

const STORE_KEY = "mur_v1"; // Legacy key from "Meet Update Rotator"; keep it, renaming would wipe user data

const $ = (id) => document.getElementById(id);

let data = createDefaultData();
let current = null; // { inMeet, code, title, people }
let currentId = null; // tracked meeting that is currently running in Meet
let selectedId = null; // meeting opened manually from the meeting list
let presentKeys = new Set();
let view = "meetings";
let initialViewResolved = false;
let refreshTimer = null;
let deleteMode = false;
let showAddRow = false;
let sortAlphabetical = false;

const getAutoRefresh = () => (data.settings ? data.settings.autoRefresh !== false : true);
const getRefreshInterval = () => (data.settings && Number(data.settings.refreshInterval)) || DEFAULT_REFRESH_INTERVAL;

/** Orders a meeting's rotation based on who is currently present in Meet. */
const orderRound = (m) => syncMeetingOrder(m, { presentKeys });

const activeId = () => selectedId || currentId;
const meeting = () => (activeId() ? data.meetings[activeId()] : null);

/* ---------- Storage ---------- */

async function load() {
  const res = await chrome.storage.local.get(STORE_KEY);
  const { data: loaded, changed } = migrateStoredData(res[STORE_KEY]);
  if (changed) {
    await chrome.storage.local.set({ [STORE_KEY]: loaded });
  }
  return loaded;
}

async function save() {
  await chrome.storage.local.set({ [STORE_KEY]: data });
}

/* ---------- Reading Meet ---------- */

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
  const send = () =>
    chrome.tabs.sendMessage(tab.id, {
      type: "MUR_SCRAPE",
      withPeople: !!withPeople,
      openIfClosed: !!opts.openIfClosed
    });
  try {
    return await send();
  } catch {
    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["lib/names.js", "content.js"] });
      ensureSessionPort(tab.id, true);
      return await send();
    } catch {
      return { ok: false, reason: "noinject" };
    }
  }
}

/* ---------- UI building blocks ---------- */

function waitedText(last) {
  if (!last) return "never";
  const days = Math.floor((Date.now() - last) / DAY_MS);
  const date = new Date(last).toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "2-digit" });
  if (days <= 0) return `today · ${date}`;
  return `${days}d ago · ${date}`;
}

function buildPersonItem(m, person, index) {
  const li = document.createElement("li");
  li.className = "item";
  const doneToday = isDoneRecently(person);
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
    downloadMarkdown(m.name, meetingToMarkdown(m));
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

/* ---------- Rendering ---------- */

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
    const activeKeys = orderRound(m);
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
        secondaryPeople.sort((a, b) => (a.name || "").localeCompare(b.name || "", "en", { sensitivity: "base" }));
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
    $("btnToggleAbsent").title = isAbsentShown ? "Hide absent or ignored" : "Show absent or ignored";
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

async function refresh(options = {}) {
  data = await load();

  // Phase 1: read title and code only, leave roster untouched
  const probe = await readMeet(false);
  current =
    probe && probe.ok
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

  const hit = matchMeeting(data.meetings, current.title, current.code);
  if (!hit) {
    if (!initialViewResolved && !options.background) {
      initialViewResolved = true;
      view = "meetings";
    }
    render();
    return;
  }

  const m = hit.meeting;
  currentId = m.id;
  selectedId = null;

  if (!initialViewResolved && !options.background) {
    initialViewResolved = true;
    view = "people";
  }

  rememberMeetIdentity(m, current);

  // Phase 2: now read people list
  const full = await readMeet(true, { openIfClosed: !options.background });
  if (full && full.ok) {
    current.people = normalizeScrapedPeople(full.people);
    presentKeys = new Set(current.people.filter((p) => p.present).map((p) => normalizeKey(p.name)));
    const added = syncRoster(m, current.people);
    orderRound(m);
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
    orderRound(m);
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
      await refresh({ background: true });
    }, sec * 1000);
  }
}

/* ---------- Markdown import and export ---------- */

function downloadMarkdown(meetingName, md) {
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = markdownFileName(meetingName);
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/** Stores a parsed roster as a new meeting, or overwrites the meeting with the same name after confirmation. */
async function importParsedMeeting({ meetingName, people }) {
  const name = meetingName || "Imported Meeting";
  const key = normalizeKey(name);
  const existing = Object.values(data.meetings).find(
    (m) => normalizeKey(m.name) === key || (m.aliases || []).includes(key)
  );

  if (existing) {
    const overwrite = confirm(
      `The meeting "${existing.name}" already exists.\n\nDo you want to overwrite it with data from the editor?`
    );
    if (!overwrite) return false;
    existing.people = people;
    existing.round = null;
    sanitizeMeeting(existing);
  } else {
    const m = createMeeting({ name, people });
    sanitizeMeeting(m);
    data.meetings[m.id] = m;
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
    saveBtn.disabled = val === initialMarkdownText.trim();
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

  downloadMarkdown(rawName, md);
}

async function saveMarkdownModal() {
  const textarea = $("markdownTextarea");
  if (!textarea) return;
  const text = textarea.value.trim();
  if (!text) {
    showModalError("Please enter or paste a Markdown table.");
    return;
  }

  const validation = parseMeetingMarkdown(textarea.value);
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
    sanitizeMeeting(m);
    await save();
    await refresh();
    closeMarkdownModal();
    return;
  }

  // New meeting / import
  const success = await importParsedMeeting(validation);
  if (success) {
    closeMarkdownModal();
  }
}

/** The file input is only reachable from the editor's Upload button, so files always load into the editor. */
async function loadFileIntoEditor(file) {
  $("markdownTextarea").value = await file.text();
  clearModalError();
  updateModalSaveButton();
}

/* ---------- Events ---------- */

for (const t of document.querySelectorAll(".tab")) {
  t.addEventListener("click", () => {
    view = t.dataset.view;
    deleteMode = false;
    showAddRow = false;
    render();
    if (view === "people" && current && current.inMeet) {
      refresh();
    }
  });
}

$("btnActivate").addEventListener("click", async () => {
  const name = $("activateName").value.trim();
  if (!name) {
    return;
  }
  const m = createMeeting({ name });
  if (current) rememberMeetIdentity(m, current);
  data.meetings[m.id] = m;
  currentId = m.id;
  selectedId = null;
  await save();
  view = "people";
  await refresh();
});

if ($("btnRefresh")) {
  $("btnRefresh").addEventListener("click", async () => {
    const btn = $("btnRefresh");
    btn.classList.add("spinning");
    try {
      await refresh();
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
  if (isPresentation(raw) || isNoiseOrIcon(raw)) {
    return;
  }
  const name = cleanPersonName(raw);
  if (!name || !m || isPresentation(name) || isNoiseOrIcon(name)) return;
  const k = normalizeKey(name);
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
  const val = clampRefreshInterval(parseInt(e.target.value, 10));
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
    if (f) loadFileIntoEditor(f);
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

refresh().then(() => {
  setupAutoRefresh();
});
