const test = require("node:test");
const assert = require("node:assert/strict");

const {
  DAY_MS,
  createDefaultData,
  createMeeting,
  clampRefreshInterval,
  sanitizeMeeting,
  migrateStoredData,
  matchMeeting,
  rememberMeetIdentity,
  normalizeScrapedPeople,
  syncRoster,
  addPerson,
  replaceRoster,
  setUpdateGiven,
  isDoneRecently,
  syncMeetingOrder
} = require("../src/lib/meetings.js");

const HOUR = 60 * 60 * 1000;
const NOW = new Date(2026, 8, 10, 10, 0).getTime();

const person = (name, last = 0, extra = {}) => ({ name, last, prev: null, ignored: false, ...extra });

function meetingWith(people, round = null) {
  const m = createMeeting({ name: "Daily", now: NOW });
  for (const p of people) m.people[p.name.toLowerCase()] = p;
  m.round = round;
  return m;
}

test("createMeeting builds a meeting with a normalized alias", () => {
  const m = createMeeting({ name: "Team  Weekly", codes: ["abc-defg-hij"], now: NOW });
  assert.match(m.id, /^m_[a-z0-9]+_[a-z0-9]+$/);
  assert.deepEqual(m.aliases, ["team weekly"]);
  assert.deepEqual(m.codes, ["abc-defg-hij"]);
  assert.deepEqual(m.people, {});
  assert.equal(m.round, null);
  assert.equal(m.includeAbsent, false);
  assert.equal(m.createdAt, NOW);
});

test("clampRefreshInterval keeps the interval between 1 and 60 seconds", () => {
  assert.equal(clampRefreshInterval(5), 5);
  assert.equal(clampRefreshInterval("7"), 7);
  assert.equal(clampRefreshInterval(500), 60);
  assert.equal(clampRefreshInterval(-3), 1);
  assert.equal(clampRefreshInterval(0), 2, "falls back to the default");
  assert.equal(clampRefreshInterval("abc"), 2, "falls back to the default");
});

test("migrateStoredData returns defaults for empty storage", () => {
  const { data, changed } = migrateStoredData(undefined, NOW);
  assert.deepEqual(data, createDefaultData());
  assert.equal(changed, false);
});

test("migrateStoredData migrates v1 groups keyed by Meet code", () => {
  const raw = {
    groups: {
      "abc-defg-hij": { name: "Standup", people: { anna: person("Anna") }, includeAbsent: true }
    }
  };
  const { data, changed } = migrateStoredData(raw, NOW);
  const meetings = Object.values(data.meetings);
  assert.equal(changed, true);
  assert.equal(meetings.length, 1);
  assert.equal(meetings[0].name, "Standup");
  assert.deepEqual(meetings[0].codes, ["abc-defg-hij"]);
  assert.deepEqual(meetings[0].aliases, ["standup"]);
  assert.equal(meetings[0].includeAbsent, true);
  assert.deepEqual(Object.keys(meetings[0].people), ["anna"]);
});

test("migrateStoredData normalizes settings", () => {
  const { data } = migrateStoredData({ meetings: {}, settings: { refreshInterval: 999 } }, NOW);
  assert.deepEqual(data.settings, { autoRefresh: true, refreshInterval: 60 });

  const { data: disabled } = migrateStoredData({ meetings: {}, settings: { autoRefresh: false } }, NOW);
  assert.equal(disabled.settings.autoRefresh, false);
});

test("sanitizeMeeting cleans names, merges duplicates, and drops noise", () => {
  const m = {
    people: {
      "anna schmidt (you)": person("Anna Schmidt (You)", 100, { prev: 50 }),
      "anna schmidt": person("Anna Schmidt", 200),
      mic_off: person("mic_off"),
      "your presentation": person("Your presentation"),
      ben: person("Ben", 0, { ignored: true })
    },
    round: { keys: ["anna schmidt (you)", "anna schmidt", "mic_off", "ben"], createdAt: NOW }
  };
  assert.equal(sanitizeMeeting(m), true);
  assert.deepEqual(m.people, {
    "anna schmidt": { name: "Anna Schmidt", last: 200, prev: 50, ignored: false },
    ben: { name: "Ben", last: 0, prev: null, ignored: true }
  });
  assert.deepEqual(m.round.keys, ["anna schmidt"], "maps old keys, removes duplicates, noise, and ignored people");
});

test("sanitizeMeeting reports no change for clean data", () => {
  const m = { people: { anna: person("Anna") }, round: { keys: ["anna"], createdAt: NOW } };
  assert.equal(sanitizeMeeting(m), false);
});

test("matchMeeting prefers title and alias over Meet code", () => {
  const byName = createMeeting({ name: "Daily Standup", now: NOW });
  byName.aliases.push("team sync");
  const byCode = createMeeting({ name: "Other", codes: ["abc-defg-hij"], now: NOW });
  const meetings = { [byName.id]: byName, [byCode.id]: byCode };

  assert.deepEqual(matchMeeting(meetings, "daily  STANDUP", "abc-defg-hij"), { meeting: byName, via: "name" });
  assert.deepEqual(matchMeeting(meetings, "Team Sync", null), { meeting: byName, via: "name" });
  assert.deepEqual(matchMeeting(meetings, "Unknown", "abc-defg-hij"), { meeting: byCode, via: "code" });
  assert.equal(matchMeeting(meetings, "Unknown", "xyz-xxxx-xyz"), null);
  assert.equal(matchMeeting(meetings, null, null), null);
});

test("rememberMeetIdentity learns new titles and codes once", () => {
  const m = createMeeting({ name: "Daily", codes: ["abc-defg-hij"], now: NOW });
  rememberMeetIdentity(m, { title: "Daily Standup (renamed)", code: "new-code-xyz" });
  rememberMeetIdentity(m, { title: "daily standup (renamed)", code: "new-code-xyz" });
  rememberMeetIdentity(m, { title: null, code: null });
  assert.deepEqual(m.aliases, ["daily", "daily standup (renamed)"]);
  assert.deepEqual(m.codes, ["abc-defg-hij", "new-code-xyz"]);
});

test("normalizeScrapedPeople cleans names and drops UI noise", () => {
  const scraped = [
    { name: "Anna Schmidt (You)", present: true },
    { name: "mic_off", present: true },
    { name: "Your presentation", present: true },
    { name: "", present: true },
    { name: "Ben", present: false }
  ];
  assert.deepEqual(normalizeScrapedPeople(scraped), [
    { name: "Anna Schmidt", present: true },
    { name: "Ben", present: false }
  ]);
  assert.deepEqual(normalizeScrapedPeople(undefined), []);
});

test("syncRoster adds new people and refreshes display names", () => {
  const m = meetingWith([person("anna", 100)]);
  const added = syncRoster(m, [{ name: "Anna" }, { name: "Ben" }]);
  assert.equal(added, 1);
  assert.deepEqual(m.people.anna, person("Anna", 100));
  assert.deepEqual(m.people.ben, person("Ben"));
});

test("addPerson validates and cleans manually entered names", () => {
  const m = meetingWith([person("Anna", 100)]);
  assert.equal(addPerson(m, "  Ben Müller (You) "), "ben müller");
  assert.deepEqual(m.people["ben müller"], person("Ben Müller"));
  assert.equal(addPerson(m, "anna"), "anna", "existing people are kept as they are");
  assert.equal(m.people.anna.last, 100);
  assert.equal(addPerson(m, "mic_off"), null);
  assert.equal(addPerson(m, "Your presentation"), null);
  assert.equal(addPerson(m, "   "), null);
  assert.equal(Object.keys(m.people).length, 2);
});

test("replaceRoster swaps people, resets the round, and sanitizes", () => {
  const m = meetingWith([person("Anna")], { keys: ["anna"] });
  replaceRoster(m, { "ben (you)": person("Ben (You)", 5), mic_off: person("mic_off") });
  assert.deepEqual(m.people, { ben: person("Ben", 5) });
  assert.equal(m.round, null);
});

test("setUpdateGiven checks people off and restores the previous timestamp on undo", () => {
  const p = person("Anna", 100);
  setUpdateGiven(p, true, 500);
  assert.deepEqual(p, person("Anna", 500, { prev: 100 }));
  setUpdateGiven(p, false, 600);
  assert.deepEqual(p, person("Anna", 100));
  setUpdateGiven(p, false, 700);
  assert.deepEqual(p, person("Anna", 0), "undo without a previous timestamp falls back to never");
  setUpdateGiven(undefined, true);
});

test("isDoneRecently uses a rolling 24 hour window", () => {
  assert.equal(isDoneRecently(person("A", NOW - HOUR), NOW), true);
  assert.equal(isDoneRecently(person("A", NOW - DAY_MS + 1), NOW), true);
  assert.equal(isDoneRecently(person("A", NOW - DAY_MS), NOW), false);
  assert.equal(isDoneRecently(person("A", 0), NOW), false);
  assert.equal(isDoneRecently(undefined, NOW), false);
});

test("syncMeetingOrder sorts pending people by longest wait, never-updated first, then by name", () => {
  const m = meetingWith([
    person("Carla", NOW - 3 * DAY_MS),
    person("Ben"),
    person("Anna"),
    person("Dana", NOW - 5 * DAY_MS)
  ]);
  assert.deepEqual(syncMeetingOrder(m, { now: NOW }), ["anna", "ben", "dana", "carla"]);
  assert.deepEqual(m.round.keys, ["anna", "ben", "dana", "carla"]);
});

test("syncMeetingOrder keeps people who are done at the top in their round order", () => {
  const m = meetingWith(
    [person("Anna", NOW - 2 * HOUR), person("Ben", NOW - HOUR), person("Carla", NOW - 2 * DAY_MS)],
    { keys: ["ben", "anna", "carla"], createdAt: NOW - HOUR }
  );
  assert.deepEqual(syncMeetingOrder(m, { now: NOW }), ["ben", "anna", "carla"]);
});

test("syncMeetingOrder slots late joiners into the pending part by priority", () => {
  const m = meetingWith([person("Anna", NOW - HOUR), person("Ben", NOW - 2 * DAY_MS), person("Zoe")], {
    keys: ["anna", "ben"],
    createdAt: NOW - HOUR
  });
  // Zoe joined late and never gave an update: she goes after the done people but before Ben.
  assert.deepEqual(syncMeetingOrder(m, { now: NOW }), ["anna", "zoe", "ben"]);
});

test("syncMeetingOrder only includes present, non-ignored people", () => {
  const m = meetingWith([person("Anna"), person("Ben"), person("Carla", 0, { ignored: true })]);
  assert.deepEqual(syncMeetingOrder(m, { presentKeys: new Set(["ben", "carla"]), now: NOW }), ["ben"]);
  assert.deepEqual(syncMeetingOrder(m, { presentKeys: new Set(), now: NOW }), ["anna", "ben"], "no presence info");
});

test("syncMeetingOrder drops people from the round who left, were ignored, or were deleted", () => {
  const m = meetingWith(
    [person("Anna", NOW - HOUR), person("Ben", NOW - 2 * HOUR), person("Carla", 0, { ignored: true })],
    {
      keys: ["ben", "gone", "carla", "anna"],
      createdAt: NOW - 7 * HOUR
    }
  );
  assert.deepEqual(syncMeetingOrder(m, { presentKeys: new Set(["anna", "carla"]), now: NOW }), ["anna"]);
  assert.deepEqual(m.round, { keys: ["anna"] });
});

test("syncMeetingOrder handles a missing meeting", () => {
  assert.deepEqual(syncMeetingOrder(null), []);
});
