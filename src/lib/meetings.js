/* POPCORN - Participant Order Picker for Candid On-call Reporting & Notes
 * Meeting data model: storage migration, meeting matching, roster sync, and speaker rotation.
 *
 * Loaded as a classic script in the popup (exposes globalThis.PopcornMeetings) and via require() in tests.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./names.js"));
  } else {
    root.PopcornMeetings = factory(root.PopcornNames);
  }
})(globalThis, function (names) {
  "use strict";

  const { normalizeKey, cleanPersonName, isPresentation, isNoiseOrIcon } = names;

  const DAY_MS = 24 * 60 * 60 * 1000;
  const DEFAULT_REFRESH_INTERVAL = 2;
  const MIN_REFRESH_INTERVAL = 1;
  const MAX_REFRESH_INTERVAL = 60;

  const isValidName = (name) => !!name && !isPresentation(name) && !isNoiseOrIcon(name);

  function createDefaultData() {
    return {
      version: 2,
      meetings: {},
      settings: { autoRefresh: true, refreshInterval: DEFAULT_REFRESH_INTERVAL }
    };
  }

  function createMeetingId(now = Date.now()) {
    return `m_${now.toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }

  function createMeeting({ name, codes = [], people = {}, round = null, includeAbsent = false, now = Date.now() }) {
    return {
      id: createMeetingId(now),
      name,
      aliases: [normalizeKey(name)],
      codes,
      people,
      round,
      includeAbsent,
      createdAt: now
    };
  }

  function clampRefreshInterval(value) {
    const n = Number(value) || DEFAULT_REFRESH_INTERVAL;
    return Math.max(MIN_REFRESH_INTERVAL, Math.min(MAX_REFRESH_INTERVAL, n));
  }

  /**
   * Cleans a meeting's roster in place: drops noise entries, normalizes names and keys,
   * merges duplicates, and remaps round keys. Returns true if anything changed.
   */
  function sanitizeMeeting(m) {
    if (!m || !m.people) return false;
    let changed = false;
    const newPeople = {};
    const keyMap = new Map();

    for (const [oldKey, p] of Object.entries(m.people)) {
      const rawName = p && p.name ? p.name : oldKey;
      if (!isValidName(rawName) || !isValidName(oldKey)) {
        changed = true;
        continue;
      }
      const clean = cleanPersonName(rawName) || rawName;
      if (!isValidName(clean)) {
        changed = true;
        continue;
      }
      const newKey = normalizeKey(clean);

      if (newKey !== oldKey || (p && p.name !== clean)) {
        changed = true;
      }

      const existing = newPeople[newKey];
      if (!existing) {
        newPeople[newKey] = {
          name: clean,
          last: (p && p.last) || 0,
          prev: p && p.prev != null ? p.prev : null,
          ignored: !!(p && p.ignored)
        };
      } else {
        existing.last = Math.max(existing.last || 0, (p && p.last) || 0);
        if (p && p.prev != null && existing.prev == null) existing.prev = p.prev;
        if (p && p.ignored) existing.ignored = true;
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

  /**
   * Turns whatever is stored in chrome.storage.local into the current data shape:
   * migrates the v1 format (groups keyed by Meet code), normalizes settings, and sanitizes rosters.
   * Returns { data, changed }, where changed means the result should be written back.
   */
  function migrateStoredData(raw, now = Date.now()) {
    let data = createDefaultData();
    let changed = false;

    if (raw && raw.meetings) {
      data = raw;
    } else if (raw && raw.groups) {
      for (const [gid, g] of Object.entries(raw.groups)) {
        const m = createMeeting({
          name: g.name || gid,
          codes: g.codes || (gid ? [gid] : []),
          people: g.people || {},
          round: g.round || null,
          includeAbsent: !!g.includeAbsent,
          now
        });
        data.meetings[m.id] = m;
      }
      changed = true;
    }

    if (!data.settings) {
      data.settings = createDefaultData().settings;
    } else {
      data.settings.autoRefresh = data.settings.autoRefresh !== false;
      data.settings.refreshInterval = clampRefreshInterval(data.settings.refreshInterval);
    }

    for (const m of Object.values(data.meetings || {})) {
      if (sanitizeMeeting(m)) changed = true;
    }

    return { data, changed };
  }

  /** Finds the tracked meeting for a Meet tab, by title/alias first and Meet code second. */
  function matchMeeting(meetings, title, code) {
    const t = normalizeKey(title);
    if (t) {
      for (const m of Object.values(meetings)) {
        if ((m.aliases || []).includes(t) || normalizeKey(m.name) === t) return { meeting: m, via: "name" };
      }
    }
    if (code) {
      for (const m of Object.values(meetings)) {
        if ((m.codes || []).includes(code)) return { meeting: m, via: "code" };
      }
    }
    return null;
  }

  function addAlias(m, value) {
    const v = normalizeKey(value);
    if (!v) return;
    m.aliases = m.aliases || [];
    if (!m.aliases.includes(v)) m.aliases.push(v);
  }

  /** Remembers the current Meet title and code so the meeting is found again if either changes. */
  function rememberMeetIdentity(m, { title, code }) {
    if (title) addAlias(m, title);
    if (code) {
      m.codes = m.codes || [];
      if (!m.codes.includes(code)) m.codes.push(code);
    }
  }

  /** Cleans scraped participants and drops entries that are not real people. */
  function normalizeScrapedPeople(people) {
    return (people || [])
      .filter((p) => p && isValidName(p.name))
      .map((p) => ({ ...p, name: cleanPersonName(p.name) }))
      .filter((p) => isValidName(p.name));
  }

  /** Adds unknown people to the roster and refreshes display names. Returns the number of people added. */
  function syncRoster(m, people) {
    let added = 0;
    for (const p of people) {
      const k = normalizeKey(p.name);
      if (!m.people[k]) {
        m.people[k] = { name: p.name, last: 0, prev: null, ignored: false };
        added++;
      } else {
        m.people[k].name = p.name;
      }
    }
    return added;
  }

  /** A person counts as done if they were checked off within the last 24 hours. */
  function isDoneRecently(person, now = Date.now()) {
    return !!(person && person.last && now - person.last < DAY_MS);
  }

  // Pending people: longest since last update first (never-updated first), then alphabetically.
  const comparePriority = (a, b) => (a.last || 0) - (b.last || 0) || a.name.localeCompare(b.name, "en");

  /**
   * Computes the speaker order for a meeting and stores it in m.round.keys.
   * People who are done keep their previous position at the top, in the order they were checked off,
   * so late joiners never push them around. Everyone else follows, sorted by priority.
   * presentKeys holds the keys of people currently in the call; when it is empty (outside Meet),
   * every non-ignored person is eligible.
   */
  function syncMeetingOrder(m, { presentKeys = new Set(), now = Date.now() } = {}) {
    if (!m) return [];

    const isEligible = (k) => {
      const p = m.people[k];
      return !!p && !p.ignored && (presentKeys.size === 0 || presentKeys.has(k));
    };
    const isDone = (k) => isDoneRecently(m.people[k], now);

    const eligibleKeys = Object.keys(m.people).filter(isEligible);
    const previousKeys = m.round && Array.isArray(m.round.keys) ? m.round.keys : [];

    const doneKeys = [
      ...new Set([...previousKeys.filter((k) => isEligible(k) && isDone(k)), ...eligibleKeys.filter(isDone)])
    ];
    const pendingKeys = eligibleKeys
      .filter((k) => !isDone(k))
      .sort((a, b) => comparePriority(m.people[a], m.people[b]));

    const keys = [...doneKeys, ...pendingKeys];
    m.round = { keys };
    return keys;
  }

  return {
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
  };
});
