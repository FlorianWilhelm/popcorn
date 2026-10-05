const test = require("node:test");
const assert = require("node:assert/strict");

const {
  formatTimestamp,
  parseTimestamp,
  parseIgnored,
  meetingToMarkdown,
  parseMeetingMarkdown,
  markdownFileName
} = require("../src/lib/markdown.js");

// Built from local time so the tests pass in every time zone.
const at = (y, mo, d, h = 0, mi = 0, s = 0) => new Date(y, mo - 1, d, h, mi, s).getTime();

test("formatTimestamp writes locale-independent local time", () => {
  assert.equal(formatTimestamp(at(2026, 9, 10, 10, 15, 42)), "2026-09-10 10:15");
  assert.equal(formatTimestamp(at(2026, 1, 2, 3, 4)), "2026-01-02 03:04");
});

test("parseTimestamp reads the current ISO export format", () => {
  assert.equal(parseTimestamp("2026-09-10 10:15"), at(2026, 9, 10, 10, 15));
  assert.equal(parseTimestamp("2026-09-10T10:15:30"), at(2026, 9, 10, 10, 15, 30));
  assert.equal(parseTimestamp("2026-09-10"), at(2026, 9, 10), "date only is local midnight");
});

test("parseTimestamp reads legacy locale exports", () => {
  assert.equal(parseTimestamp("10.9.2026, 10:15:00"), at(2026, 9, 10, 10, 15), "de-DE");
  assert.equal(parseTimestamp("10/09/2026, 10:15:00"), at(2026, 9, 10, 10, 15), "en-GB");
  assert.equal(parseTimestamp("9/10/2026, 10:15:00 AM"), at(2026, 9, 10, 10, 15), "en-US");
});

test("parseTimestamp returns 0 for never markers and NaN for garbage", () => {
  for (const s of ["", "  ", "never", "Noch nie", "-", "–", "0", undefined]) {
    assert.equal(parseTimestamp(s), 0, JSON.stringify(s));
  }
  assert.ok(Number.isNaN(parseTimestamp("yesterday-ish")));
  assert.ok(Number.isNaN(parseTimestamp("2026-13-01 10:00")), "month overflow");
  assert.ok(Number.isNaN(parseTimestamp("32.01.2026")), "day overflow");
  assert.ok(Number.isNaN(parseTimestamp("2026-01-01 24:30")), "hour overflow");
});

test("parseIgnored reads yes/no values and rejects anything else", () => {
  for (const v of ["yes", "YES", " Yes ", "true", "x", "X", "ignored"]) assert.equal(parseIgnored(v), true, v);
  for (const v of ["", "  ", "no", "No", "false", "-", undefined]) assert.equal(parseIgnored(v), false, String(v));
  for (const v of ["maybe", "2026-09-10", "nope"]) assert.equal(parseIgnored(v), null, v);
});

test("meetingToMarkdown lists people in the order of the People tab and keeps dates of ignored people", () => {
  const NOW = at(2026, 9, 10, 12, 0);
  const meeting = {
    name: "Daily Standup",
    people: {
      anna: { name: "Anna", last: at(2026, 9, 10, 10, 15) },
      ben: { name: "Ben", last: at(2026, 9, 10, 10, 12) },
      carla: { name: "Carla", last: at(2026, 9, 7, 10, 5) },
      dana: { name: "Dana", last: 0 },
      emil: { name: "Emil", last: at(2026, 9, 3, 9, 30) },
      finn: { name: "Finn", last: at(2026, 9, 1, 9, 0), ignored: true },
      gina: { name: "Gina", last: 0, ignored: true }
    },
    round: { keys: ["ben", "anna", "carla"] }
  };
  assert.equal(
    meetingToMarkdown(meeting, { now: NOW }),
    [
      "# Daily Standup",
      "",
      "| Person | Last Update | Ignored |",
      "| --- | --- | --- |",
      "| Ben | 2026-09-10 10:12 |  |",
      "| Anna | 2026-09-10 10:15 |  |",
      "| Dana |  |  |",
      "| Emil | 2026-09-03 09:30 |  |",
      "| Carla | 2026-09-07 10:05 |  |",
      "| Gina |  | yes |",
      "| Finn | 2026-09-01 09:00 | yes |",
      ""
    ].join("\n"),
    "people who are done first in check-off order, then never-updated and longest wait first, ignored last"
  );
  assert.deepEqual(meeting.round, { keys: ["ben", "anna", "carla"] }, "export does not change the round");

  const rows = meetingToMarkdown(meeting, { presentKeys: new Set(["anna", "carla", "dana", "finn"]), now: NOW })
    .split("\n")
    .slice(4, -1)
    .map((row) => row.split("|")[1].trim());
  assert.deepEqual(
    rows,
    ["Anna", "Dana", "Carla", "Emil", "Ben", "Gina", "Finn"],
    "in a call, absent people follow the rotation like in the People tab"
  );
});

test("meetingToMarkdown handles a meeting without people", () => {
  assert.equal(
    meetingToMarkdown({ name: "Empty" }),
    "# Empty\n\n| Person | Last Update | Ignored |\n| --- | --- | --- |\n\n"
  );
});

test("parseMeetingMarkdown round-trips an export", () => {
  const meeting = {
    name: "Daily Standup",
    people: {
      anna: { name: "Anna", last: at(2026, 9, 10, 10, 15), prev: null, ignored: false },
      carla: { name: "Carla", last: 0, prev: null, ignored: false },
      guest: { name: "Guest", last: at(2026, 9, 1, 9, 0), prev: null, ignored: true },
      "room kepler": { name: "Room Kepler", last: 0, prev: null, ignored: true }
    }
  };
  assert.deepEqual(parseMeetingMarkdown(meetingToMarkdown(meeting)), {
    ok: true,
    meetingName: "Daily Standup",
    people: meeting.people
  });
});

test("parseMeetingMarkdown reads the Ignored column", () => {
  const result = parseMeetingMarkdown(
    [
      "| Person | Last Update | Ignored |",
      "| --- | --- | --- |",
      "| Anna | 2026-09-10 10:15 | yes |",
      "| Ben | 2026-09-09 10:12 | no |",
      "| Carla |  | x |",
      "| Dana | 2026-09-08 10:00 |",
      "| Emil | 2026-09-07 10:00 |  |",
      "| Finn | 2026-09-06 10:00 (ignored) |  |"
    ].join("\n")
  );
  assert.equal(result.ok, true);
  assert.deepEqual(result.people, {
    anna: { name: "Anna", last: at(2026, 9, 10, 10, 15), prev: null, ignored: true },
    ben: { name: "Ben", last: at(2026, 9, 9, 10, 12), prev: null, ignored: false },
    carla: { name: "Carla", last: 0, prev: null, ignored: true },
    dana: { name: "Dana", last: at(2026, 9, 8, 10, 0), prev: null, ignored: false },
    emil: { name: "Emil", last: at(2026, 9, 7, 10, 0), prev: null, ignored: false },
    finn: { name: "Finn", last: at(2026, 9, 6, 10, 0), prev: null, ignored: true }
  });
});

// Two-column format written by POPCORN up to v0.31: locale dates and ignored markers in "Last Update".
const LEGACY_EXPORT = [
  "# Weekly Sync",
  "",
  "| Person | Last Update |",
  "| --- | --- |",
  "| Anna Schmidt | 02/10/2026, 13:12:42 |",
  "| Ben Weber | 10/09/2026, 13:17:24 |",
  "| Carla Diaz |  |",
  "| Dana Roth | 27/08/2026, 13:05:21 (ignored) |",
  "| Emil Novak | ignored |",
  ""
].join("\n");

test("parseMeetingMarkdown imports legacy two-column exports with their ignored markers", () => {
  const result = parseMeetingMarkdown(LEGACY_EXPORT);
  assert.equal(result.ok, true);
  assert.equal(result.meetingName, "Weekly Sync");
  assert.deepEqual(result.people, {
    "anna schmidt": { name: "Anna Schmidt", last: at(2026, 10, 2, 13, 12, 42), prev: null, ignored: false },
    "ben weber": { name: "Ben Weber", last: at(2026, 9, 10, 13, 17, 24), prev: null, ignored: false },
    "carla diaz": { name: "Carla Diaz", last: 0, prev: null, ignored: false },
    "dana roth": { name: "Dana Roth", last: at(2026, 8, 27, 13, 5, 21), prev: null, ignored: true },
    "emil novak": { name: "Emil Novak", last: 0, prev: null, ignored: true }
  });
});

test("a legacy export is re-exported in the new format without losing data", () => {
  const legacy = parseMeetingMarkdown(LEGACY_EXPORT);
  const md = meetingToMarkdown({ name: legacy.meetingName, people: legacy.people }, { now: at(2026, 10, 5, 9, 0) });
  assert.equal(
    md,
    [
      "# Weekly Sync",
      "",
      "| Person | Last Update | Ignored |",
      "| --- | --- | --- |",
      "| Carla Diaz |  |  |",
      "| Ben Weber | 2026-09-10 13:17 |  |",
      "| Anna Schmidt | 2026-10-02 13:12 |  |",
      "| Emil Novak |  | yes |",
      "| Dana Roth | 2026-08-27 13:05 | yes |",
      ""
    ].join("\n")
  );
  const reimported = parseMeetingMarkdown(md);
  assert.equal(reimported.ok, true);
  for (const [key, p] of Object.entries(legacy.people)) {
    // The new format stores minutes, so seconds from legacy exports are dropped.
    const minute = p.last - (p.last % 60000);
    assert.deepEqual(reimported.people[key], { ...p, last: minute }, key);
  }
});

test("parseMeetingMarkdown accepts legacy headers, alignment rows, and ignored markers", () => {
  const result = parseMeetingMarkdown(
    [
      "# Team",
      "| Person | Letztes Update |",
      "|:---|:---:|",
      "| Anna (You) | 10.09.2026, 10:15:00 |",
      "| Ben | ignoriert |",
      "| Carla | noch nie |"
    ].join("\r\n")
  );
  assert.equal(result.ok, true);
  assert.equal(result.meetingName, "Team");
  assert.deepEqual(result.people, {
    anna: { name: "Anna", last: at(2026, 9, 10, 10, 15), prev: null, ignored: false },
    ben: { name: "Ben", last: 0, prev: null, ignored: true },
    carla: { name: "Carla", last: 0, prev: null, ignored: false }
  });
});

test("parseMeetingMarkdown reports the first invalid line", () => {
  const cases = [
    ["# T\n| Anna | |\nnot a row", 2, /Expected a table row/],
    ["| Anna", 0, /at least 2 columns/],
    ["| Anna | |\n|  | 2026-09-10 |", 1, /name cannot be empty/],
    ["| mic_off | |", 0, /name cannot be empty or invalid/],
    ["| Anna | sometime |", 0, /Invalid date format in "Last Update" \(sometime\)/],
    [
      "| Anna | | yes |\n| Ben | 2026-09-10 | maybe |",
      1,
      /Invalid value in "Ignored" \(maybe\), use "yes" or leave it empty/
    ]
  ];
  for (const [text, lineIndex, error] of cases) {
    const result = parseMeetingMarkdown(text);
    assert.equal(result.ok, false, text);
    assert.equal(result.lineIndex, lineIndex, text);
    assert.match(result.error, new RegExp(`^Line ${lineIndex + 1}: `), text);
    assert.match(result.error, error, text);
  }
});

test("parseMeetingMarkdown requires at least one participant", () => {
  const result = parseMeetingMarkdown("# Empty\n\n| Person | Last Update |\n| --- | --- |\n");
  assert.deepEqual(result, { ok: false, error: "No participants found in the Markdown table." });
  assert.equal(parseMeetingMarkdown("").ok, false);
});

test("markdownFileName slugifies the meeting name", () => {
  assert.equal(markdownFileName("Team Weekly DS & NLP"), "team-weekly-ds-nlp.md");
  assert.equal(markdownFileName("Größe Übersicht"), "größe-übersicht.md");
  assert.equal(markdownFileName("!!!"), "meeting.md");
  assert.equal(markdownFileName(""), "meeting.md");
});
