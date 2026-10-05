const test = require("node:test");
const assert = require("node:assert/strict");

const {
  collapseWhitespace,
  normalizeKey,
  cleanPersonName,
  isPresentingStatus,
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

test("isPresentingStatus detects presenting labels in many UI languages", () => {
  for (const s of [
    "You are presenting",
    "You're presenting",
    "YOU ARE PRESENTING",
    "Anna Schmidt is presenting",
    "You are presenting to everyone",
    "Du präsentierst",
    "Sie präsentieren gerade",
    "Anna praesentiert",
    "Vous présentez",
    "Vous presentez",
    "Estás presentando",
    "Você está apresentando",
    "Stai presentando",
    "Je presenteert",
    "Du presenterar",
    "Prezentujesz",
    "Prezentujete",
    "Sunuyorsunuz",
    "Вы демонстрируете экран",
    "Ви презентуєте",
    "Παρουσιάζετε",
    "אתה מציג",
    "您正在演示",
    "你正在簡報",
    "画面を共有しています",
    "発表中です",
    "발표 중입니다",
    "คุณกำลังนำเสนอ",
    "Bạn đang trình bày"
  ]) {
    assert.equal(isPresentingStatus(s), true, s);
    assert.equal(isPresentation(s), true, s);
    assert.equal(looksLikeName(s), false, s);
  }
});

test("isPresentingStatus keeps real names, including ones that look similar", () => {
  for (const s of [
    "Anna Schmidt",
    "Florian Wilhelm",
    "Foggy (M, 2.OG)",
    "Present Gonzalez",
    "Anna Presenti",
    "Joe Presentable",
    "Sunu Kumar",
    "Trinh Bao",
    "René Fa",
    "Marie-Kristin Wirsching",
    "Phuong Mai Mai",
    ""
  ]) {
    assert.equal(isPresentingStatus(s), false, s);
  }
  assert.equal(
    isPresentingStatus("Anna Schmidt Meeting host more_vert keep mic_off Presenting now"),
    false,
    "long texts such as whole list items are not checked word by word"
  );
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

test("looksLikeName accepts names in non-Latin scripts", () => {
  for (const s of [
    "김민준",
    "张伟",
    "山田 太郎",
    "Иван Петров",
    "Γιώργος",
    "محمد",
    "שרה כהן",
    "प्रिया शर्मा",
    "สมชาย ใจดี",
    "Anna 김"
  ]) {
    assert.equal(looksLikeName(s), true, s);
  }
  assert.equal(looksLikeName(cleanPersonName("김민준 (You)")), true);
});

test("looksLikeName still rejects noise without letters, in any script", () => {
  const cases = {
    "١٢٣": "Arabic-Indic digits",
    "１２３": "full-width digits",
    "👍": "emoji",
    "❤️": "emoji with variation selector",
    "✋ 2": "raised hand with queue position",
    "• · …": "separators",
    "→→": "arrows",
    "××": "multiplication signs",
    王: "too short",
    mic_off: "icon ligature",
    PRESENT_TO_ALL: "icon ligature",
    "In call": "status label",
    "Im Anruf": "status label",
    "Your presentation": "presentation"
  };
  for (const [s, reason] of Object.entries(cases)) {
    assert.equal(looksLikeName(s), false, `${s} (${reason})`);
  }
});
