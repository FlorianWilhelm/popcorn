const test = require("node:test");
const assert = require("node:assert/strict");

const {
  collapseWhitespace,
  normalizeKey,
  cleanPersonName,
  isPresentation,
  isNoiseOrIcon,
  looksLikeName
} = require("../src/lib/names.js");

test("collapseWhitespace trims and collapses runs of whitespace", () => {
  assert.equal(collapseWhitespace("  Anna \n\t Schmidt  "), "Anna Schmidt");
  assert.equal(collapseWhitespace(null), "");
});

test("normalizeKey is case-, width-, and whitespace-insensitive", () => {
  assert.equal(normalizeKey("  Anna   SCHMIDT "), "anna schmidt");
  assert.equal(normalizeKey("Ａｎｎａ"), "anna");
  assert.equal(normalizeKey(undefined), "");
});

test("cleanPersonName unwraps Meet accessibility labels", () => {
  const cases = {
    "Pin Anna Schmidt to your main screen": "Anna Schmidt",
    "Unpin Anna Schmidt from your main screen": "Anna Schmidt",
    "More options for Ben Müller": "Ben Müller",
    "Weitere Optionen für Ben Müller": "Ben Müller",
    "Send a message to Carla": "Carla",
    "Chat with Carla": "Carla",
    "You can't remotely mute Dana's microphone": "Dana",
    "Erik an den Hauptbildschirm anpinnen": "Erik",
    "Video von Frida": "Frida",
    "Frida's video": "Frida"
  };
  for (const [raw, expected] of Object.entries(cases)) {
    assert.equal(cleanPersonName(raw), expected, raw);
  }
});

test("cleanPersonName removes qualifiers, counters, and separators", () => {
  assert.equal(cleanPersonName("Anna Schmidt (You)"), "Anna Schmidt");
  assert.equal(cleanPersonName("Anna Schmidt (Du)"), "Anna Schmidt");
  assert.equal(cleanPersonName("Anna Schmidt (Host)"), "Anna Schmidt");
  assert.equal(cleanPersonName("Anna Schmidt (invited)"), "Anna Schmidt");
  assert.equal(cleanPersonName("Anna Schmidt (eingeladen)"), "Anna Schmidt");
  assert.equal(cleanPersonName("People (12)"), "People");
  assert.equal(cleanPersonName("Anna · Schmidt"), "Anna Schmidt");
  assert.equal(cleanPersonName(""), "");
});

test("isPresentation detects screen shares and presentations", () => {
  for (const s of [
    "Your presentation",
    "Dein Bildschirm",
    "Präsentation von Ben",
    "Anna's presentation",
    "Anna’s screen",
    "Bildschirmübertragung",
    "Anna (Presentation)"
  ]) {
    assert.equal(isPresentation(s), true, s);
  }
  assert.equal(isPresentation("Anna Schmidt"), false);
  assert.equal(isPresentation(""), false);
});

test("isNoiseOrIcon detects Meet UI labels in German and English", () => {
  for (const s of [
    "mic_off",
    "In call",
    "Im Anruf",
    "Also invited",
    "Ebenfalls eingeladen",
    "Open the people panel",
    "Hintergründe und Effekte",
    "Backgrounds & effects",
    "  you  ",
    ""
  ]) {
    assert.equal(isNoiseOrIcon(s), true, JSON.stringify(s));
  }
  assert.equal(isNoiseOrIcon("Anna Schmidt"), false);
});

test("looksLikeName rejects scraping artifacts", () => {
  assert.equal(looksLikeName("Anna Schmidt"), true);
  assert.equal(looksLikeName("Ø"), false, "too short");
  assert.equal(looksLikeName("x".repeat(71)), false, "too long");
  assert.equal(looksLikeName("keyboard_arrow_down"), false, "icon ligature");
  assert.equal(looksLikeName("some_icon_name"), false, "snake_case token");
  assert.equal(looksLikeName("12345"), false, "digits only");
  assert.equal(looksLikeName("Your presentation"), false, "presentation");
  assert.equal(looksLikeName("Participants"), false, "panel label");
});
