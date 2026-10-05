/* POPCORN - Participant Order Picker for Candid On-call Reporting & Notes
 * Participant name cleaning and noise filtering, shared by the popup and the content script.
 *
 * Loaded as a classic script (exposes globalThis.PopcornNames) and via require() in tests.
 * Google Meet runs in many UI languages, so the filters contain German and English phrases.
 * "Presenting" status labels are matched in many more languages, see PRESENTING_WORDS.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.PopcornNames = factory();
  }
})(globalThis, function () {
  "use strict";

  // Grouped by topic; keep the compact layout.
  // prettier-ignore
  const ICON_WORDS = new Set([
    "mic", "mic_off", "videocam", "videocam_off", "more_vert", "more_horiz", "push_pin",
    "present_to_all", "devices", "person_add", "domain_disabled",
    "keep", "keep_off", "visual_effects", "raise_hand", "front_hand",
    "arrow_drop_down", "close", "search", "check", "star", "block",
    "reframe", "framing", "auto_framing", "auto_awesome", "crop_free", "fit_screen",
    "fullscreen", "fullscreen_exit", "settings", "tune", "volume_up", "volume_off",
    "closed_caption", "closed_caption_off", "chat", "chat_bubble", "info", "info_outline",
    "pan_tool", "call_end", "expand_more", "expand_less", "chevron_right", "chevron_left",
    "drag_indicator", "grid_view", "screen_search_desktop",
    "keyboard_arrow_down", "keyboard_arrow_up",
    "accepted", "zugesagt", "angenommen",
    "declined", "abgelehnt", "abgesagt",
    "maybe", "vielleicht", "mit vorbehalt", "tentative",
    "awaiting", "awaiting response", "no response", "ausstehend", "antwort ausstehend",
    "noch keine antwort", "keine antwort", "unbeantwortet", "needs action",
    "invited", "eingeladen", "also invited", "ebenfalls eingeladen",
    "in call", "in the call", "in this call", "not in call", "not in the call",
    "im anruf", "nicht im anruf", "in dieser besprechung", "in diesem anruf",
    "in meeting", "im meeting", "in the meeting", "in der besprechung", "not in meeting", "nicht im meeting",
    "waiting to join", "warten auf beitritt", "wartet auf teilnahme",
    "waiting to pair with you", "wartet auf kopplung",
    "visitor badge", "besucher-badge", "visitor", "besucher",
    "contributors", "beitragende", "everyone in this call", "alle in diesem anruf",
    "everyone", "alle", "all", "people", "personen", "teilnehmer", "participants",
    "backgrounds and effects", "backgrounds & effects", "backgrounds", "effects",
    "hintergründe und effekte", "hintergründe & effekte", "hintergrund und effekte", "hintergründe", "effekte",
    "apply visual effects", "visuelle effekte anwenden", "visuelle effekte", "visual effects",
    "virtual background", "virtueller hintergrund",
    "add people", "personen hinzufügen", "teilnehmer hinzufügen", "invite people",
    "jemanden einladen", "invite someone", "share joining info", "teilnahmeinformationen teilen",
    "besprechungslink kopieren", "copy joining info",
    "host controls", "steuerelemente für den host", "host-steuerelemente",
    "meeting safety", "besprechungssicherheit",
    "activities", "aktivitäten", "chat", "chatnachrichten", "messages", "in-call messages",
    "nachrichten im anruf", "details", "meeting details", "besprechungsdetails",
    "polls", "umfragen", "q&a", "fragen und antworten", "whiteboard", "breakout rooms",
    "gruppensitzungen", "recording", "aufzeichnung", "transcripts", "transkripte",
    "captions", "untertitel", "search for people", "nach personen suchen",
    "search people", "teilnehmer suchen", "personen suchen", "suchen", "search",
    "mute all", "alle stummschalten", "turn off all mics", "alle mikrofone deaktivieren",
    "pinned", "angepinnt", "stummgeschaltet", "muted", "hand raised", "hand gehoben",
    "joined", "beigetreten", "left", "verlassen", "calling", "ringing",
    "more actions", "weitere aktionen", "back", "zurück",
    "open the people panel", "close the people panel", "people panel", "chat panel",
    "show everyone", "alle anzeigen", "show in-call messages", "in-call messages"
  ]);

  const NOISE_RE =
    /^(du|you|sie|ich|me|host|moderator|gastgeber|meeting-host|besprechungsleiter|praesentation|präsentation|presentation|stummgeschaltet|muted|angepinnt|pinned|beitreten|joining|joined|verlassen|left|eingeladen|invited|ebenfalls eingeladen|also invited|im meeting|in meeting|in the meeting|in der besprechung|in call|im anruf|in this call|in this meeting|in dieser besprechung|not in call|nicht im anruf|not in meeting|nicht im meeting|waiting to join|warten auf beitritt|wartet auf teilnahme|waiting to pair with you|wartet auf kopplung|visitor badge|besucher-badge|visitor|besucher|more actions|weitere aktionen|back|zurück|keyboard_arrow_down|keyboard_arrow_up|accepted|zugesagt|angenommen|declined|abgelehnt|abgesagt|maybe|vielleicht|mit vorbehalt|tentative|awaiting|awaiting response|ausstehend|antwort ausstehend|noch keine antwort|keine antwort|unbeantwortet|needs action|contributors|beitragende|weitere optionen|more options|teilnehmer|participants|personen|people|everyone|alle|suchen|search|search for people|nach personen suchen|teilnehmer suchen|personen suchen|reframe|framing|auto-framing|auto framing|ausschnitt|ausschnitt anpassen|kamera|camera|mikrofon|microphone|video|audio|backgrounds?(\s+(and|&)\s+effects?)?|hintergründe?(\s+(und|&)\s+effekte?)?|effects?|effekte?|apply visual effects|visuelle effekte(\s+anwenden)?|virtual background|virtueller hintergrund|add people|personen hinzufügen|teilnehmer hinzufügen|invite(\s+people|\s+someone)?|jemanden einladen|share joining info|teilnahmeinformationen teilen|host controls|steuerelemente für den host|host-steuerelemente|meeting safety|besprechungssicherheit|activities|aktivitäten|details|meeting details|besprechungsdetails|mute all|alle stummschalten|open\s+(?:the\s+)?people\s+panel|close\s+(?:the\s+)?people\s+panel|people\s+panel|chat\s+panel|show\s+everyone|alle\s+anzeigen)$/i;

  const UI_PHRASE_RE =
    /^(?:open|close|öffnen|schließen|show|hide|view)\s+(?:the\s+)?(?:people|chat|activities|details|host controls?|teilnehmer|personen|chatten|nachrichten|everyone|alle)\s*(?:panel|leiste|fenster|list|liste)?$/i;
  const PANEL_RE =
    /^(?:people|chat|activities|details|host controls?|teilnehmer|personen)\s*(?:panel|leiste|fenster|list|liste)$/i;

  // Meet accessibility labels that wrap a participant name, e.g. "Pin Anna to your main screen".
  // Applied in order; each pattern captures the name in group 1.
  const NAME_IN_LABEL_PATTERNS = [
    /^(?:you\s+can\x27?t\s+remotely\s+mute|sie\s+können\s+das\s+mikrofon\s+von)\s+(.+?)(?:(?:\x27s|s)?\s+microphone|\s+nicht\s+stummschalten)?$/i,
    /^pin\s+(.+?)\s+to\s+(?:your\s+|the\s+)?(?:main\s+)?screen$/i,
    /^unpin\s+(.+?)\s+from\s+(?:your\s+|the\s+)?(?:main\s+)?screen$/i,
    /^pin\s+(.+?)\s+to\s+screen$/i,
    /^unpin\s+(.+?)\s+from\s+screen$/i,
    /^(.+?)\s+an\s+(?:den\s+)?(?:hauptbildschirm|bildschirm)\s+anpinnen$/i,
    /^(.+?)\s+vom\s+(?:hauptbildschirm|bildschirm)\s+(?:lösen|entfernen|entpinnen)$/i,
    /^(.+?)\s+(?:nicht\s+mehr\s+anpinnen|anpinnen|anheften)$/i,
    /^(?:weitere\s+(?:optionen|aktionen)\s+für|more\s+(?:options|actions)\s+for|aktionen\s+für)\s+(.+)$/i,
    /^(?:send\s+a\s+message\s+to|nachricht\s+an)\s+(.+?)(?:\s+senden)?$/i,
    /^(?:chat\s+with|chatten\s+mit)\s+(.+)$/i,
    /^(?:mute|unmute|stummschalten\s+für)\s+(.+)$/i,
    /^(.+?)\s+stummschalten$/i,
    /^(?:video\s+von\s+|video\s+of\s+)(.+)$/i,
    /^(.+?)'s\s+video$/i
  ];

  const PRESENTATION_PATTERNS = [
    /^(?:dein\s+bildschirm|your\s+screen|deine\s+präsentation|your\s+presentation|bildschirmübertragung|screen\s*share)$/i,
    /^(?:presentation|präsentation|praesentation)(?:\s+(?:von|of|by)\s+.*)?$/i,
    /(?:\x27s|’s|s|\x27|’)\s*(?:presentation|präsentation|praesentation|screen|bildschirm|bildschirmfreigabe|bildschirmübertragung)$/i,
    /\((?:präsentation|presentation|bildschirm|screen|dein bildschirm|your presentation)\)/i
  ];

  const collapseWhitespace = (s) => (s || "").replace(/\s+/g, " ").trim();

  /** Lowercase without accents and other combining marks, e.g. "Präsentiert" -> "prasentiert". */
  const foldText = (s) =>
    collapseWhitespace(s)
      .normalize("NFKD")
      .replace(/\p{M}+/gu, "")
      .toLowerCase();

  // Words in Meet's labels for a running presentation, e.g. "You are presenting", "Anna is presenting",
  // "Du präsentierst", "Vous présentez". Meet shows these in the user's UI language, so the list covers
  // the common ones. Only full words count, so names that merely start with "Present..." stay valid.
  // prettier-ignore
  const PRESENTING_WORDS = new Set([
    // English, German
    "presenting", "presentation", "presenter",
    "präsentierst", "präsentieren", "präsentiert", "präsentation", "praesentierst", "praesentieren", "praesentiert",
    // French, Spanish, Catalan, Portuguese, Italian
    "présentez", "présentes", "présente", "présenter", "présentation",
    "presentando", "presentas", "presentación", "presentant", "presentació", "presenteu",
    "apresentando", "apresenta", "apresentação", "presentazione",
    // Dutch, Swedish, Danish, Norwegian, Finnish, Estonian
    "presenteert", "presenteer", "presenteren", "presentatie",
    "presenterar", "præsenterer", "præsentation", "presenterer", "presentasjon",
    "esität", "esittää", "esitys", "esittelet", "esittelee", "esitlete", "esitled", "esitleb", "esitlus",
    // Polish, Czech, Slovak, Slovenian, Croatian, Serbian, Hungarian, Romanian
    "prezentujesz", "prezentuje", "prezentacja", "prezentujete", "prezentuješ", "prezentace", "prezentácia",
    "predstavljate", "predstavljaš", "predstavlja", "predstavitev", "prezentirate", "prezentiraš", "prezentira",
    "prezentacija", "представљате", "представља", "презентација",
    "bemutatsz", "bemutat", "bemutató", "prezentálsz", "prezentál", "prezentáció",
    "prezentați", "prezinți", "prezintă", "prezentare",
    // Lithuanian, Latvian, Greek, Turkish
    "pristatote", "pristatai", "pristato", "pristatymas", "prezentējat", "prezentē", "prezentācija",
    "παρουσιάζετε", "παρουσιάζεις", "παρουσιάζει", "παρουσίαση",
    "sunuyorsunuz", "sunuyorsun", "sunuyor", "sunum",
    // Russian, Ukrainian, Bulgarian
    "показываете", "показывает", "демонстрируете", "демонстрирует", "демонстрация", "презентуете", "презентация",
    "показуєте", "показує", "демонструєте", "демонструє", "демонстрація", "презентуєте", "презентація",
    "представяте", "представя", "презентирате", "презентация",
    // Hebrew, Arabic, Persian
    "מציג", "מציגה", "מציגים", "מצגת", "تقدم", "يقدم", "تعرض", "يعرض", "تقديمي", "ارائه",
    // Indonesian, Malay, Hindi, Bengali
    "presentasi", "mempresentasikan", "membentangkan", "pembentangan",
    "प्रज़ेंट", "प्रेजेंट", "प्रस्तुत", "प्रस्तुति", "উপস্থাপনা", "প্রেজেন্ট"
  ].map(foldText));

  // The same for languages that do not separate words by spaces, matched as parts of the label.
  // prettier-ignore
  const PRESENTING_FRAGMENTS = [
    "演示", "展示", "共享屏幕", "簡報", "分享畫面", // Chinese
    "プレゼン", "発表中", "画面を共有", "画面共有", // Japanese
    "발표", "프레젠테이션", "화면 공유", // Korean
    "นำเสนอ", // Thai
    "trình bày" // Vietnamese (two words)
  ].map(foldText);

  // Status labels are short. Longer texts (e.g. whole list items) are not checked word by word.
  const MAX_STATUS_WORDS = 8;

  /** True for Meet's "presenting" status labels in any of the languages above. */
  function isPresentingStatus(raw) {
    const s = foldText(raw);
    if (!s) return false;
    const words = s.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    if (words.length > MAX_STATUS_WORDS) return false;
    return words.some((w) => PRESENTING_WORDS.has(w)) || PRESENTING_FRAGMENTS.some((f) => s.includes(f));
  }

  /** Normalized lookup key for names and meeting titles (case-, width- and whitespace-insensitive). */
  const normalizeKey = (s) => collapseWhitespace((s || "").normalize("NFKC")).toLowerCase();

  /** Strips Meet accessibility phrases, counters, and qualifiers like "(You)" from a raw label. */
  function cleanPersonName(raw) {
    let s = collapseWhitespace(raw);
    if (!s) return "";

    // Remove count suffixes e.g. (12) or · 12
    s = s.replace(/\s*\(\d+\)\s*$/g, "");
    s = s.replace(/\s*·\s*\d+\s*$/g, "");

    // Unwrap names from Meet UI / accessibility labels
    for (const re of NAME_IN_LABEL_PATTERNS) s = s.replace(re, "$1");

    // Remove parenthetical qualifiers: (Du), (You), (Host), (Presentation), (Visitor), (abwesend), etc.
    s = s.replace(
      /\((du|you|sie|ich|me|dein bildschirm|your presentation|präsentation|presentation|gastgeber|host|meeting host|besprechungsleiter|moderator|extern|external|intern|internal|contributor|beitragende|beitragender|abwesend|absent|visitor|besucher|eingeladen|invited)\)/gi,
      ""
    );
    s = s.replace(/[·•]/g, " ");

    return collapseWhitespace(s);
  }

  /** True for screen share and presentation tiles and for "presenting" status labels. */
  function isPresentation(raw) {
    if (!raw) return false;
    const str = collapseWhitespace(raw);
    return PRESENTATION_PATTERNS.some((re) => re.test(str)) || isPresentingStatus(str);
  }

  /** True for Meet UI labels, icon ligature names, and status phrases that are not person names. */
  function isNoiseOrIcon(s) {
    const lower = collapseWhitespace(s).toLowerCase();
    if (!lower) return true;
    if (ICON_WORDS.has(lower)) return true;
    if (NOISE_RE.test(lower)) return true;
    if (UI_PHRASE_RE.test(lower) || PANEL_RE.test(lower)) return true;
    return false;
  }

  /** Stricter check used while scraping the Meet DOM, where every text node is a candidate. */
  function looksLikeName(s) {
    if (!s) return false;
    if (s.length < 2 || s.length > 70) return false;
    if (isNoiseOrIcon(s)) return false;
    if (isPresentation(s)) return false;
    if (/^[a-z0-9]+(_[a-z0-9]+)+$/i.test(s)) return false;
    if (!/[a-zA-ZÀ-ÿ]/.test(s)) return false;
    if (/^\d+$/.test(s)) return false;
    if (/^(pin|unpin)\s+.*to\s+.*screen$/i.test(s)) return false;
    return true;
  }

  return {
    collapseWhitespace,
    normalizeKey,
    cleanPersonName,
    isPresentingStatus,
    isPresentation,
    isNoiseOrIcon,
    looksLikeName
  };
});
