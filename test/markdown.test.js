const test = require("node:test");
const assert = require("node:assert/strict");

const {
  formatTimestamp,
  parseTimestamp,
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

test("meetingToMarkdown lists people by most recent update, ignored people last", () => {
  const md = meetingToMarkdown({
    name: "Daily Standup",
    people: {
      ben: { name: "Ben", last: at(2026, 9, 9, 10, 12) },
      guest: { name: "Guest", last: 0, ignored: true },
      anna: { name: "Anna", last: at(2026, 9, 10, 10, 15) },
      carla: { name: "Carla", last: 0 },
      dana: { name: "Dana", last: at(2026, 9, 1, 9, 0), ignored: true }
    }
  });
  assert.equal(
    md,
    [
      "# Daily Standup",
      "",
      "| Person | Last Update |",
      "| --- | --- |",
      "| Anna | 2026-09-10 10:15 |",
      "| Ben | 2026-09-09 10:12 |",
      "| Carla |  |",
      "| Dana | 2026-09-01 09:00 (ignored) |",
      "| Guest | ignored |",
      ""
    ].join("\n")
  );
});

test("parseMeetingMarkdown round-trips an export", () => {
  const meeting = {
    name: "Daily Standup",
    people: {
      anna: { name: "Anna", last: at(2026, 9, 10, 10, 15), prev: null, ignored: false },
      carla: { name: "Carla", last: 0, prev: null, ignored: false },
      guest: { name: "Guest", last: at(2026, 9, 1, 9, 0), prev: null, ignored: true }
    }
  };
  assert.deepEqual(parseMeetingMarkdown(meetingToMarkdown(meeting)), {
    ok: true,
    meetingName: "Daily Standup",
    people: meeting.people
  });
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
    ["| Anna | sometime |", 0, /Invalid date format in "Last Update" \(sometime\)/]
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
