/* POPCORN - Participant Order Picker for Candid On-call Reporting & Notes
 * Markdown import and export of meeting rosters.
 *
 * Format:
 *   # Meeting Name
 *
 *   | Person | Last Update |
 *   | --- | --- |
 *   | Anna Schmidt | 2026-09-10 10:15 |
 *   | Guest User | ignored |
 *
 * Loaded as a classic script in the popup (exposes globalThis.PopcornMarkdown) and via require() in tests.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./names.js"));
  } else {
    root.PopcornMarkdown = factory(root.PopcornNames);
  }
})(globalThis, function (names) {
  "use strict";

  const { normalizeKey, cleanPersonName, isPresentation, isNoiseOrIcon } = names;

  // Cell values meaning "never gave an update". German variants are kept for older exports.
  const NEVER_MARKERS = new Set(["", "never", "noch nie", "-", "–", "0"]);
  const IGNORED_RE = /\b(ignored|ignoriert)\b/i;
  const IGNORED_STRIP_RE = /\s*[([]?\b(ignored|ignoriert)\b[)\]]?/gi;
  const ISO_RE = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ t](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;
  const DAY_FIRST_RE = /^(\d{1,2})[./](\d{1,2})[./](\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;

  const pad2 = (n) => String(n).padStart(2, "0");

  /** Formats a timestamp as local time "YYYY-MM-DD HH:mm", independent of the browser locale. */
  function formatTimestamp(ts) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }

  function localTime(year, month, day, hours = 0, minutes = 0, seconds = 0) {
    const d = new Date(year, month - 1, day, hours, minutes, seconds);
    // Reject overflowing values such as month 13 or day 32, which Date would silently roll over.
    if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return NaN;
    if (hours > 23 || minutes > 59 || seconds > 59) return NaN;
    return d.getTime();
  }

  /**
   * Parses a "Last Update" cell. Returns 0 for "never" markers and NaN for unparseable input.
   * Accepted formats:
   * - "2026-09-10 10:15" (current export format, local time; seconds and "T" separator optional)
   * - "10.09.2026, 10:15:00" or "10/09/2026" (day first, legacy exports from de/en-GB locales)
   * - anything Date.parse understands, e.g. legacy en-US exports like "9/10/2026, 10:15:00 AM"
   */
  function parseTimestamp(str) {
    const s = (str || "").trim().toLowerCase();
    if (NEVER_MARKERS.has(s)) return 0;

    for (const [re, order] of [
      [ISO_RE, [1, 2, 3]],
      [DAY_FIRST_RE, [3, 2, 1]]
    ]) {
      const m = s.match(re);
      if (m) {
        const [y, mo, d] = order.map((i) => Number(m[i]));
        return localTime(y, mo, d, Number(m[4] || 0), Number(m[5] || 0), Number(m[6] || 0));
      }
    }

    const parsed = Date.parse(str);
    return Number.isNaN(parsed) ? NaN : parsed;
  }

  function meetingToMarkdown(m) {
    const rows = Object.values(m.people || {})
      .sort((a, b) => {
        if (!!a.ignored !== !!b.ignored) return a.ignored ? 1 : -1;
        return (b.last || 0) - (a.last || 0) || a.name.localeCompare(b.name, "en");
      })
      .map((p) => {
        const timeStr = p.last ? formatTimestamp(p.last) : "";
        let val = timeStr;
        if (p.ignored) val = timeStr ? `${timeStr} (ignored)` : "ignored";
        return `| ${p.name} | ${val} |`;
      });
    return `# ${m.name}\n\n| Person | Last Update |\n| --- | --- |\n${rows.join("\n")}\n`;
  }

  const isHeaderRow = (nameCell, updateCell) =>
    /^person$/i.test(nameCell) || /^last update$/i.test(updateCell) || /^letztes update$/i.test(updateCell);

  const isSeparatorRow = (nameCell) => /^[-:\s]+$/.test(nameCell);

  /**
   * Parses and validates a Markdown roster. Stops at the first invalid line.
   * Returns { ok: true, meetingName, people } or { ok: false, error, lineIndex? }.
   */
  function parseMeetingMarkdown(text) {
    const lines = (text || "").split(/\r?\n/);
    let meetingName = "";
    const people = {};
    const fail = (lineIndex, message) => ({ ok: false, lineIndex, error: `Line ${lineIndex + 1}: ${message}` });

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.startsWith("#")) {
        if (!meetingName) meetingName = line.replace(/^#+\s*/, "").trim();
        continue;
      }

      if (!line.startsWith("|")) return fail(i, 'Expected a table row starting with "|"');

      const cols = line.split("|").map((c) => c.trim());
      if (cols.length < 3) return fail(i, "Table row must contain at least 2 columns (| Name | Last Update |)");

      const [, nameCell, updateCell] = cols;
      if (isHeaderRow(nameCell, updateCell) || isSeparatorRow(nameCell)) continue;

      const name = cleanPersonName(nameCell);
      if (!name || isPresentation(name) || isNoiseOrIcon(name))
        return fail(i, "Person name cannot be empty or invalid");

      const datePart = updateCell.replace(IGNORED_STRIP_RE, "").trim();
      const last = parseTimestamp(datePart);
      if (Number.isNaN(last)) return fail(i, `Invalid date format in "Last Update" (${datePart})`);

      people[normalizeKey(name)] = { name, last, prev: null, ignored: IGNORED_RE.test(updateCell) };
    }

    if (Object.keys(people).length === 0) {
      return { ok: false, error: "No participants found in the Markdown table." };
    }
    return { ok: true, meetingName, people };
  }

  /** File name for a downloaded roster, e.g. "Team Weekly DS & NLP" -> "team-weekly-ds-nlp.md". */
  function markdownFileName(meetingName) {
    const slug = (meetingName || "")
      .toLowerCase()
      .replace(/[^a-z0-9äöüß]+/gi, "-")
      .replace(/^-+|-+$/g, "");
    return `${slug || "meeting"}.md`;
  }

  return {
    formatTimestamp,
    parseTimestamp,
    meetingToMarkdown,
    parseMeetingMarkdown,
    markdownFileName
  };
});
