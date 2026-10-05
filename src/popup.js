/* POPCORN - Participant Order Picker for Candid On-call Reporting & Notes
 * Popup: state, communication with the Meet content script, rendering, and event handling.
 * Pure logic lives in lib/names.js, lib/meetings.js, and lib/markdown.js.
 */

const { normalizeKey } = PopcornNames;
const {
  DAY_MS,
  createDefaultData,
  createMeeting,
  clampRefreshInterval,
  sanitizeMeeting,
  migrateStoredData,
  isInSplitView,
  pickMeetTab,
  matchMeeting,
  addAlias,
  rememberMeetIdentity,
  normalizeScrapedPeople,
  syncRoster,
  addPerson,
  replaceRoster,
  setUpdateGiven,
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

const getAutoRefresh = () => data.settings.autoRefresh !== false;
const getRefreshInterval = () => clampRefreshInterval(data.settings.refreshInterval);

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

let meetTabId = null; // the Meet tab being read; in Split View it can be the unfocused pane

function ensureSessionPort(tabId, force = false) {
  meetTabId = tabId;
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
  if (meetTabId) {
    try {
      chrome.tabs.sendMessage(meetTabId, { type: "POPCORN_POPUP_CLOSING" }).catch(() => {});
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

async function findMeetTab() {
  const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
  // In Split View only the focused pane is active; the Meet call may be in the other pane
  const splitTabs = isInSplitView(active)
    ? await chrome.tabs.query({ windowId: active.windowId, splitViewId: active.splitViewId })
    : [];
  return pickMeetTab(active, splitTabs);
}

async function readMeet(withPeople, opts = {}) {
  const tab = await findMeetTab();
  if (!tab) {
    return { ok: false, reason: "nomeet" };
  }
  ensureSessionPort(tab.id);
  const send = () =>
    chrome.tabs.sendMessage(tab.id, {
      type: "POPCORN_SCRAPE",
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

/* ---------- Icons ---------- */

// Feather icons (https://feathericons.com) on a 24x24 grid.
const ICON_PATHS = {
  trash:
    '<path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>',
  eyeOff:
    '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>',
  open: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line>',
  edit: '<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>',
  download:
    '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>',
  check: '<polyline points="20 6 9 17 4 12"></polyline>'
};

function icon(name, { size = 13, strokeWidth = 2 } = {}) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name]}</svg>`;
}

function createIconButton({ className = "mini ghost icon-btn", title, label, iconName, size, onClick }) {
  const btn = document.createElement("button");
  btn.className = className;
  btn.title = title;
  btn.setAttribute("aria-label", label);
  btn.innerHTML = icon(iconName, { size });
  btn.addEventListener("click", onClick);
  return btn;
}

/* ---------- UI building blocks ---------- */

/** Re-renders, which also recomputes the rotation, and then persists the in-memory data. */
async function commit() {
  render();
  await save();
}

async function applyChange(mutate) {
  mutate();
  await commit();
}

const compareByName = (a, b) => (a.name || "").localeCompare(b.name || "", "en", { sensitivity: "base" });

// Absent or ignored people: present-but-ignored last, otherwise longest wait first
const compareInactive = (a, b) => {
  if (!!a.ignored !== !!b.ignored) return a.ignored ? 1 : -1;
  return (a.last || 0) - (b.last || 0) || a.name.localeCompare(b.name, "en");
};

function waitedText(last) {
  if (!last) return "never";
  const days = Math.floor((Date.now() - last) / DAY_MS);
  const date = new Date(last).toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "2-digit" });
  if (days <= 0) return `today · ${date}`;
  return `${days}d ago · ${date}`;
}

/** One row in the People tab. `index` is the rotation position, or null for absent/ignored people. */
function buildPersonItem(m, person, index) {
  const li = document.createElement("li");
  li.className = "item";
  const doneToday = isDoneRecently(person);
  li.classList.toggle("done", doneToday);
  li.classList.toggle("absent", presentKeys.size > 0 && !presentKeys.has(person.key));
  li.classList.toggle("ignored", !!person.ignored);

  if (index !== null) {
    const pos = document.createElement("div");
    pos.className = "pos";
    pos.textContent = String(index + 1).padStart(2, "0");
    li.appendChild(pos);
  }

  // Checkbox, or delete button in delete mode
  if (deleteMode) {
    li.appendChild(
      createIconButton({
        className: "mini ghost icon-btn danger",
        title: `Delete "${person.name}"`,
        label: "Delete person",
        iconName: "trash",
        onClick: () => applyChange(() => delete m.people[person.key])
      })
    );
  } else {
    const checkLabel = document.createElement("label");
    checkLabel.className = "check-item";
    checkLabel.title = "Gave update";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = doneToday;
    input.addEventListener("change", () => applyChange(() => setUpdateGiven(m.people[person.key], input.checked)));
    checkLabel.appendChild(input);
    li.appendChild(checkLabel);
  }

  const nameWrap = document.createElement("div");
  nameWrap.className = "name-wrap";

  const name = document.createElement("span");
  name.className = "name";
  name.textContent = person.name;

  const ignoreBtn = createIconButton({
    className: "mini ghost icon-btn ignore-btn" + (person.ignored ? " ignored" : ""),
    title: person.ignored ? "Ignored (click to include in updates)" : "Include in updates (click to ignore)",
    label: person.ignored ? "Unignore person" : "Ignore person",
    iconName: person.ignored ? "eyeOff" : "eye",
    onClick: (e) => {
      e.stopPropagation();
      applyChange(() => {
        const p = m.people[person.key];
        if (p) p.ignored = !p.ignored;
      });
    }
  });

  nameWrap.append(name, ignoreBtn);
  li.appendChild(nameWrap);

  const dateSpan = document.createElement("span");
  dateSpan.className = "date";
  dateSpan.textContent = person.ignored ? "ignored" : waitedText(person.last);
  if (person.last) dateSpan.title = new Date(person.last).toLocaleString();
  li.appendChild(dateSpan);

  return li;
}

/** One row in the Meetings tab. */
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
  input.addEventListener("change", () => {
    const v = input.value.trim();
    if (!v) {
      input.value = m.name;
      return;
    }
    applyChange(() => {
      m.name = v;
      addAlias(m, v);
    });
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") input.blur();
  });

  const count = Object.keys(m.people).length;
  const countBadge = document.createElement("div");
  countBadge.className = "meeting-count";
  const countText = `${count} ${count === 1 ? "person" : "people"}`;
  countBadge.title = m.id === currentId ? `${countText} (in progress)` : countText;
  countBadge.innerHTML = `${icon("user", { size: 11 })}<span>${count}</span>`;

  const openBtn = createIconButton({
    className: "meeting-open-btn",
    title: "Open people list for this meeting",
    label: "Open meeting",
    iconName: "open",
    size: 12,
    onClick: () => {
      selectedId = m.id;
      view = "people";
      deleteMode = false;
      showAddRow = false;
      render();
    }
  });

  box.append(input, countBadge, openBtn);

  const actions = document.createElement("div");
  actions.className = "actions";
  actions.append(
    createIconButton({
      title: "View, edit, or copy Markdown",
      label: "Edit Markdown",
      iconName: "edit",
      onClick: () => openMarkdownModal(m.id)
    }),
    createIconButton({
      title: "Export as Markdown file (.md)",
      label: "Export as Markdown file",
      iconName: "download",
      onClick: () => downloadMarkdown(m.name, meetingToMarkdown(m))
    }),
    createIconButton({
      className: "mini ghost icon-btn danger",
      title: "Stop tracking and delete history",
      label: "Delete meeting",
      iconName: "trash",
      onClick: () => {
        if (!confirm(`Stop tracking "${m.name}"? The saved history will be deleted.`)) return;
        applyChange(() => {
          delete data.meetings[m.id];
          if (currentId === m.id) currentId = null;
          if (selectedId === m.id) selectedId = null;
        });
      }
    })
  );

  li.append(box, actions);
  return li;
}

/* ---------- Rendering ---------- */

function render() {
  const m = meeting();
  const inMeet = !!(current && current.inMeet);

  // The People tab needs a meeting; fall back to the meeting list otherwise
  if (!m && !inMeet && view === "people") view = "meetings";

  renderHeader(m, inMeet);
  renderTabs(m);
  renderMeetingsView(m, inMeet);
  if (m) renderPeopleView(m, inMeet);
  renderPeopleToolbar(m);
  renderSettings();
}

function setHeader(eyebrow, name, tracking, badgeTitle) {
  $("headEyebrow").textContent = eyebrow;
  $("headName").textContent = name;
  $("headName").title = name;
  const badge = $("badge");
  badge.textContent = tracking ? "on" : "off";
  badge.className = `badge ${tracking ? "on" : "off"}`;
  badge.title = badgeTitle;
}

function renderHeader(m, inMeet) {
  if (inMeet) {
    const title = current.title || current.code || "Untitled Meeting";
    if (currentId) setHeader("Current Meeting", title, true, "Tracking active in Google Meet");
    else setHeader("Current Meeting", title, false, "Meeting not tracked yet");
  } else if (m) {
    setHeader("Selected List", m.name, false, "No active Google Meet call (viewing saved list)");
  } else {
    setHeader("Google Meet", "No meeting open", false, "No active Google Meet call");
  }
}

function renderTabs(m) {
  for (const tab of document.querySelectorAll(".tab[data-view]")) {
    tab.classList.toggle("active", tab.dataset.view === view);
    if (tab.dataset.view === "people") tab.disabled = !m;
  }
  $("viewMeetings").classList.toggle("hidden", view !== "meetings");
  $("viewPeople").classList.toggle("hidden", view !== "people");
  $("viewSettings").classList.toggle("hidden", view !== "settings");
}

function renderMeetingsView(m, inMeet) {
  const showUntracked = !m && inMeet;
  $("untrackedCard").classList.toggle("hidden", !showUntracked);
  if (showUntracked && !$("activateName").value) {
    $("activateName").value = current.title || (current.code ? `Meeting ${current.code}` : "");
  }

  const meetings = Object.values(data.meetings).sort((a, b) => a.name.localeCompare(b.name, "en"));
  $("meetingList").replaceChildren(...meetings.map(buildMeetingItem));
  $("meetingsEmpty").classList.toggle("hidden", meetings.length > 0);
}

function renderPeopleView(m, inMeet) {
  const total = Object.keys(m.people).length;
  $("peoplePresence").textContent = inMeet
    ? `${presentKeys.size} present of ${total}`
    : `${total} ${total === 1 ? "participant" : "participants"}`;

  $("addPersonRow").classList.toggle("hidden", !showAddRow);
  $("btnToggleAdd").classList.toggle("active", showAddRow);

  // Active rotation. The numbers always show the rotation position, also when sorted by name.
  const activeKeys = orderRound(m);
  const active = activeKeys.map((key, index) => ({ person: { key, ...m.people[key] }, index }));
  if (sortAlphabetical) active.sort((a, b) => compareByName(a.person, b.person));
  $("activeList").replaceChildren(...active.map(({ person, index }) => buildPersonItem(m, person, index)));

  const emptyHint = $("peopleEmpty");
  emptyHint.textContent = inMeet
    ? "No present participants found. Open the people list in Meet, or add names using +."
    : "No participants added yet. Add names using +.";
  emptyHint.classList.toggle("hidden", activeKeys.length > 0);

  // Absent or ignored people, unranked
  const activeSet = new Set(activeKeys);
  const inactive = m.includeAbsent
    ? Object.entries(m.people)
        .filter(([key]) => !activeSet.has(key))
        .map(([key, p]) => ({ key, ...p }))
    : [];
  inactive.sort(sortAlphabetical ? compareByName : compareInactive);
  const secondaryList = $("secondaryList");
  secondaryList.replaceChildren(...inactive.map((p) => buildPersonItem(m, p, null)));
  secondaryList.classList.toggle("hidden", inactive.length === 0);
}

function renderPeopleToolbar(m) {
  const absentShown = !!(m && m.includeAbsent);
  const absentBtn = $("btnToggleAbsent");
  absentBtn.classList.toggle("active", absentShown);
  absentBtn.title = absentShown ? "Hide absent or ignored" : "Show absent or ignored";
  absentBtn.setAttribute("aria-label", absentBtn.title);
  absentBtn.disabled = !m;

  const sortBtn = $("btnToggleSort");
  sortBtn.classList.toggle("active", sortAlphabetical);
  sortBtn.title = sortAlphabetical
    ? "Alphabetical order active (click to sort by priority)"
    : "Sort alphabetically by name (preserves priority numbers)";
  sortBtn.disabled = !m;

  const deleteBtn = $("btnToggleDeleteMode");
  deleteBtn.classList.toggle("active", deleteMode);
  deleteBtn.title = deleteMode ? "Exit delete mode" : "Toggle delete mode";

  $("btnRefresh").disabled = !m;
}

function renderSettings() {
  const auto = getAutoRefresh();
  $("settingAutoRefresh").checked = auto;
  if (document.activeElement !== $("settingRefreshInterval")) {
    $("settingRefreshInterval").value = getRefreshInterval();
  }
  $("fieldRefreshInterval").classList.toggle("hidden", !auto);
  $("hintRefreshInterval").classList.toggle("hidden", !auto);
}

/* ---------- Workflow ---------- */

/** Picks the start view once, on the first foreground refresh after the popup opens. */
function resolveInitialView(nextView, options) {
  if (initialViewResolved || options.background) return;
  initialViewResolved = true;
  view = nextView;
}

let refreshesInFlight = 0;

async function refresh(options = {}) {
  refreshesInFlight++;
  try {
    await runRefresh(options);
  } finally {
    refreshesInFlight--;
  }
}

/* `data` is loaded once at startup and then only changed in memory. The popup is the only writer,
 * and Chrome closes it on blur, so there is never a second instance whose changes we could miss.
 * Reloading here would replace the objects that event handlers are about to mutate and lose clicks. */
async function runRefresh(options) {
  // Phase 1: read title and code only, leave the roster untouched
  const probe = await readMeet(false);
  if (!probe || !probe.ok) {
    current = { inMeet: false, code: null, title: null, people: [] };
    currentId = null;
    presentKeys = new Set();
    resolveInitialView("meetings", options);
    render();
    return;
  }

  current = { inMeet: true, code: probe.code, title: probe.title, people: [] };
  const hit = matchMeeting(data.meetings, current.title, current.code);
  if (!hit) {
    currentId = null;
    presentKeys = new Set();
    resolveInitialView("meetings", options);
    render();
    return;
  }

  const m = hit.meeting;
  currentId = m.id;
  selectedId = null;
  resolveInitialView("people", options);
  rememberMeetIdentity(m, current);

  // Phase 2: read the people list. Presence is replaced only after the scrape has finished,
  // so renders triggered by clicks in the meantime keep using the last known presence.
  const full = await readMeet(true, { openIfClosed: !options.background });
  const scraped = !!(full && full.ok);
  current.people = scraped ? normalizeScrapedPeople(full.people) : [];
  presentKeys = new Set(current.people.filter((p) => p.present).map((p) => normalizeKey(p.name)));
  const added = syncRoster(m, current.people);
  orderRound(m);
  await save();
  render();

  if (scraped) {
    const parts = [`${presentKeys.size} present of ${Object.keys(m.people).length}`];
    if (added) parts.push(`${added} newly added`);
    if (current.people.length === 0) parts.push("Open the people list in Meet");
    $("peoplePresence").textContent = parts.join(" · ");
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
      if (isModalOpen()) return;
      const activeEl = document.activeElement;
      const isEditingText = activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA");
      if (isEditingText && view !== "people") return;
      // Skip this tick if the previous scrape is still running (slow Meet DOM or short interval)
      if (refreshesInFlight > 0) return;
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
    replaceRoster(existing, people);
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
  const value = $("markdownTextarea").value.trim();
  // Editing an existing meeting needs an actual change; a new import only needs content
  $("btnModalSave").disabled = !value || (!!editingMeetingId && value === initialMarkdownText.trim());
}

function clearModalError() {
  $("modalError").classList.add("hidden");
  $("markdownTextarea").classList.remove("has-error");
}

/** Shows a validation error and selects the offending line (0-based lineIndex) in the editor. */
function showModalError(message, lineIndex) {
  const ta = $("markdownTextarea");
  $("modalErrorText").textContent = message;
  $("modalError").classList.remove("hidden");
  ta.classList.add("has-error");
  ta.focus();

  if (typeof lineIndex !== "number" || lineIndex < 0) return;
  const lines = ta.value.split("\n");
  const start = lines.slice(0, lineIndex).reduce((pos, line) => pos + line.length + 1, 0);
  const end = start + (lines[lineIndex] || "").replace(/\r$/, "").length;
  ta.setSelectionRange(start, end);

  const approxLineHeight = 18;
  ta.scrollTop = Math.max(0, (lineIndex - 2) * approxLineHeight);
}

function openMarkdownModal(meetingId = null) {
  const m = meetingId ? data.meetings[meetingId] : null;
  editingMeetingId = m ? m.id : null;
  initialMarkdownText = m ? meetingToMarkdown(m) : "";

  $("modalTitle").textContent = m ? `Edit "${m.name}"` : "New Meeting / Import";
  $("modalHint").textContent = m
    ? "View, edit, or copy the Markdown table of this meeting:"
    : "Paste a Markdown table or load a file from disk:";
  $("markdownTextarea").value = initialMarkdownText;
  $("btnModalSave").textContent = m ? "Save" : "Import";
  $("btnModalSave").disabled = true;

  clearModalError();
  document.body.classList.add("modal-open");
  $("markdownModal").classList.remove("hidden");
  setTimeout(() => $("markdownTextarea").focus(), 50);
}

function closeMarkdownModal() {
  clearModalError();
  $("markdownModal").classList.add("hidden");
  document.body.classList.remove("modal-open");
  editingMeetingId = null;
  initialMarkdownText = "";
}

const isModalOpen = () => !$("markdownModal").classList.contains("hidden");

async function copyModalText() {
  const textarea = $("markdownTextarea");
  if (!textarea.value.trim()) return;
  try {
    await navigator.clipboard.writeText(textarea.value);
  } catch {
    textarea.select();
    document.execCommand("copy");
  }

  // Briefly swap the icon to a check mark as feedback
  const copyBtn = $("btnModalCopy");
  const origHtml = copyBtn.innerHTML;
  const origTitle = copyBtn.title;
  copyBtn.classList.add("copied");
  copyBtn.title = "Copied!";
  copyBtn.setAttribute("aria-label", "Copied!");
  copyBtn.innerHTML = icon("check", { strokeWidth: 2.5 });
  setTimeout(() => {
    copyBtn.classList.remove("copied");
    copyBtn.title = origTitle;
    copyBtn.setAttribute("aria-label", origTitle);
    copyBtn.innerHTML = origHtml;
  }, 1500);
}

function downloadModalMarkdown() {
  const md = $("markdownTextarea").value;
  if (!md.trim()) return;
  const editing = editingMeetingId && data.meetings[editingMeetingId];
  const titleMatch = md.match(/^#\s+(.+)$/m);
  downloadMarkdown((editing && editing.name) || (titleMatch ? titleMatch[1].trim() : ""), md);
}

async function saveMarkdownModal() {
  const text = $("markdownTextarea").value;
  if (!text.trim()) {
    showModalError("Please enter or paste a Markdown table.");
    return;
  }

  const parsed = parseMeetingMarkdown(text);
  if (!parsed.ok) {
    showModalError(parsed.error, parsed.lineIndex);
    return;
  }
  clearModalError();

  const m = editingMeetingId && data.meetings[editingMeetingId];
  if (m) {
    if (parsed.meetingName && parsed.meetingName !== m.name) {
      m.name = parsed.meetingName;
      addAlias(m, parsed.meetingName);
    }
    replaceRoster(m, parsed.people);
    await save();
    await refresh();
    closeMarkdownModal();
  } else if (await importParsedMeeting(parsed)) {
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

for (const tab of document.querySelectorAll(".tab")) {
  tab.addEventListener("click", () => {
    view = tab.dataset.view;
    deleteMode = false;
    showAddRow = false;
    render();
    if (view === "people" && current && current.inMeet) refresh();
  });
}

$("btnActivate").addEventListener("click", async () => {
  const name = $("activateName").value.trim();
  if (!name) return;
  const m = createMeeting({ name });
  if (current) rememberMeetIdentity(m, current);
  data.meetings[m.id] = m;
  currentId = m.id;
  selectedId = null;
  await save();
  view = "people";
  await refresh();
});

$("btnRefresh").addEventListener("click", async () => {
  const btn = $("btnRefresh");
  btn.classList.add("spinning");
  try {
    await refresh();
  } finally {
    setTimeout(() => btn.classList.remove("spinning"), 400);
  }
});

$("btnToggleSort").addEventListener("click", () => {
  sortAlphabetical = !sortAlphabetical;
  render();
});

$("btnToggleAdd").addEventListener("click", () => {
  showAddRow = !showAddRow;
  render();
  if (showAddRow) $("newName").focus();
});

$("btnToggleAbsent").addEventListener("click", () => {
  const m = meeting();
  if (!m) return;
  applyChange(() => {
    m.includeAbsent = !m.includeAbsent;
  });
});

$("btnToggleDeleteMode").addEventListener("click", () => {
  deleteMode = !deleteMode;
  render();
});

$("btnAdd").addEventListener("click", async () => {
  const m = meeting();
  if (!m || !addPerson(m, $("newName").value.trim())) return;
  $("newName").value = "";
  await commit();
});

$("newName").addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("btnAdd").click();
  if (e.key === "Escape") {
    showAddRow = false;
    render();
  }
});

$("settingAutoRefresh").addEventListener("change", async (e) => {
  data.settings.autoRefresh = e.target.checked;
  renderSettings();
  await save();
  setupAutoRefresh();
});

$("settingRefreshInterval").addEventListener("change", async (e) => {
  data.settings.refreshInterval = clampRefreshInterval(parseInt(e.target.value, 10));
  e.target.value = data.settings.refreshInterval;
  await save();
  setupAutoRefresh();
});

$("btnNewMeeting").addEventListener("click", () => openMarkdownModal(null));

$("fileInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) loadFileIntoEditor(file);
  e.target.value = "";
});

$("btnModalCancel").addEventListener("click", closeMarkdownModal);
$("btnModalSave").addEventListener("click", saveMarkdownModal);
$("btnModalUpload").addEventListener("click", () => $("fileInput").click());
$("btnModalDownload").addEventListener("click", downloadModalMarkdown);
$("btnModalCopy").addEventListener("click", copyModalText);

const modalTextarea = $("markdownTextarea");
modalTextarea.addEventListener("input", () => {
  clearModalError();
  updateModalSaveButton();
});
modalTextarea.addEventListener("click", clearModalError);
modalTextarea.addEventListener("keyup", clearModalError);

// Close the modal by clicking the backdrop or pressing Escape
$("markdownModal").addEventListener("click", (e) => {
  if (e.target === $("markdownModal")) closeMarkdownModal();
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && isModalOpen()) closeMarkdownModal();
});

const version = chrome.runtime.getManifest().version;
$("appVersion").textContent = version;
$("headerLogo").title = `POPCORN v${version}`;

async function init() {
  data = await load();
  await refresh();
  setupAutoRefresh();
}

init();
