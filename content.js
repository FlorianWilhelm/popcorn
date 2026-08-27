/* Meet Update Rotator - content script
 * Liest Meeting-Name und Teilnehmerliste aus dem DOM der laufenden Meet-Session.
 * Google vergibt obfuskierte Klassennamen, deshalb arbeiten wir nur mit
 * stabilen Attributen: role, aria-label, data-participant-id, document.title.
 */
(() => {
  if (window.__murLoaded) return;
  window.__murLoaded = true;

  const CODE_RE = /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/i;

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
    "more actions", "weitere aktionen", "back", "zurück"
  ]);

  const NOISE = /^(du|you|sie|ich|me|host|moderator|gastgeber|meeting-host|besprechungsleiter|praesentation|präsentation|presentation|stummgeschaltet|muted|angepinnt|pinned|beitreten|joining|joined|verlassen|left|eingeladen|invited|ebenfalls eingeladen|also invited|im meeting|in meeting|in the meeting|in der besprechung|in call|im anruf|in this call|in this meeting|in dieser besprechung|not in call|nicht im anruf|not in meeting|nicht im meeting|waiting to join|warten auf beitritt|wartet auf teilnahme|waiting to pair with you|wartet auf kopplung|visitor badge|besucher-badge|visitor|besucher|more actions|weitere aktionen|back|zurück|keyboard_arrow_down|keyboard_arrow_up|accepted|zugesagt|angenommen|declined|abgelehnt|abgesagt|maybe|vielleicht|mit vorbehalt|tentative|awaiting|awaiting response|ausstehend|antwort ausstehend|noch keine antwort|keine antwort|unbeantwortet|needs action|contributors|beitragende|weitere optionen|more options|teilnehmer|participants|personen|people|everyone|alle|suchen|search|search for people|nach personen suchen|teilnehmer suchen|personen suchen|reframe|framing|auto-framing|auto framing|ausschnitt|ausschnitt anpassen|kamera|camera|mikrofon|microphone|video|audio|backgrounds?(\s+(and|&)\s+effects?)?|hintergründe?(\s+(und|&)\s+effekte?)?|effects?|effekte?|apply visual effects|visuelle effekte(\s+anwenden)?|virtual background|virtueller hintergrund|add people|personen hinzufügen|teilnehmer hinzufügen|invite(\s+people|\s+someone)?|jemanden einladen|share joining info|teilnahmeinformationen teilen|host controls|steuerelemente für den host|host-steuerelemente|meeting safety|besprechungssicherheit|activities|aktivitäten|details|meeting details|besprechungsdetails|mute all|alle stummschalten)$/i;

  const clean = (s) => (s || "").replace(/\s+/g, " ").trim();

  function cleanPersonName(raw) {
    let s = clean(raw);
    if (!s) return "";

    // Remove count suffixes e.g. (12) or · 12
    s = s.replace(/\s*\(\d+\)\s*$/g, "");
    s = s.replace(/\s*·\s*\d+\s*$/g, "");

    // Action prefixes and suffixes from Meet UI / accessibility labels
    s = s.replace(/^(?:you\s+can\x27?t\s+remotely\s+mute|sie\s+können\s+das\s+mikrofon\s+von)\s+(.+?)(?:(?:\x27s|s)?\s+microphone|\s+nicht\s+stummschalten)?$/i, "$1");
    s = s.replace(/^pin\s+(.+?)\s+to\s+(?:your\s+|the\s+)?(?:main\s+)?screen$/i, "$1");
    s = s.replace(/^unpin\s+(.+?)\s+from\s+(?:your\s+|the\s+)?(?:main\s+)?screen$/i, "$1");
    s = s.replace(/^pin\s+(.+?)\s+to\s+screen$/i, "$1");
    s = s.replace(/^unpin\s+(.+?)\s+from\s+screen$/i, "$1");
    s = s.replace(/^(.+?)\s+an\s+(?:den\s+)?(?:hauptbildschirm|bildschirm)\s+anpinnen$/i, "$1");
    s = s.replace(/^(.+?)\s+vom\s+(?:hauptbildschirm|bildschirm)\s+(?:lösen|entfernen|entpinnen)$/i, "$1");
    s = s.replace(/^(.+?)\s+(?:nicht\s+mehr\s+anpinnen|anpinnen|anheften)$/i, "$1");
    s = s.replace(/^(?:weitere\s+(?:optionen|aktionen)\s+für|more\s+(?:options|actions)\s+for|aktionen\s+für)\s+(.+)$/i, "$1");
    s = s.replace(/^(?:send\s+a\s+message\s+to|nachricht\s+an)\s+(.+?)(?:\s+senden)?$/i, "$1");
    s = s.replace(/^(?:chat\s+with|chatten\s+mit)\s+(.+)$/i, "$1");
    s = s.replace(/^(?:mute|unmute|stummschalten\s+für)\s+(.+)$/i, "$1");
    s = s.replace(/^(.+?)\s+stummschalten$/i, "$1");
    s = s.replace(/^(?:video\s+von\s+|video\s+of\s+)(.+)$/i, "$1");
    s = s.replace(/^(.+?)'s\s+video$/i, "$1");

    // Remove parenthetical qualifiers: (Du), (You), (Host), (Presentation), (Visitor), (abwesend), etc.
    s = s.replace(/\((du|you|sie|ich|me|dein bildschirm|your presentation|präsentation|presentation|gastgeber|host|meeting host|besprechungsleiter|moderator|extern|external|intern|internal|contributor|beitragende|beitragender|abwesend|absent|visitor|besucher)\)/gi, "");
    s = s.replace(/[·•]/g, " ");

    return clean(s);
  }

  function isPresentation(raw) {
    if (!raw) return false;
    const str = clean(raw);
    if (/^(?:dein\s+bildschirm|your\s+screen|deine\s+präsentation|your\s+presentation|bildschirmübertragung|screen\s*share)$/i.test(str)) return true;
    if (/^(?:presentation|präsentation|praesentation)(?:\s+(?:von|of|by)\s+.*)?$/i.test(str)) return true;
    if (/(?:\x27s|’s|s|\x27|’)\s*(?:presentation|präsentation|praesentation|screen|bildschirm|bildschirmfreigabe|bildschirmübertragung)$/i.test(str)) return true;
    if (/\((?:präsentation|presentation|bildschirm|screen|dein bildschirm|your presentation)\)/i.test(str)) return true;
    return false;
  }

  function stripQualifier(name) {
    return cleanPersonName(name);
  }

  function looksLikeName(s) {
    if (!s) return false;
    if (s.length < 2 || s.length > 70) return false;
    if (NOISE.test(s)) return false;
    if (ICON_WORDS.has(s.toLowerCase())) return false;
    if (isPresentation(s)) return false;
    if (/^[a-z0-9]+(_[a-z0-9]+)+$/i.test(s)) return false;
    if (!/[a-zA-ZÀ-ÿ]/.test(s)) return false;
    if (/^\d+$/.test(s)) return false;
    if (/^(pin|unpin)\s+.*to\s+.*screen$/i.test(s)) return false;
    return true;
  }

  function extractName(item) {
    // 0. Skip accordion toggles, section headings, and tabs
    if (item.getAttribute("aria-expanded") !== null) return null;
    if (item.matches && item.matches('[role="heading"], [role="tab"], h1, h2, h3, h4, h5, h6')) return null;

    // 1. Google Meet standard name span in people panel
    const nameSpan = item.querySelector(".zWGUib");
    if (nameSpan && nameSpan.textContent) {
      const zName = cleanPersonName(nameSpan.textContent);
      if (looksLikeName(zName)) return zName;
    }

    // 2. Direct aria-label on listitem
    const selfAria = cleanPersonName(item.getAttribute("aria-label") || "");
    if (selfAria && looksLikeName(selfAria)) {
      const firstPart = selfAria.split(",")[0].trim();
      if (looksLikeName(firstPart)) return firstPart;
    }

    // 3. Action buttons with explicit participant names in aria-label
    const actionElements = [item, ...Array.from(item.querySelectorAll("[aria-label]"))];
    for (const el of actionElements) {
      const aria = el.getAttribute("aria-label");
      if (!aria) continue;
      const match = aria.match(/(?:weitere\s+(?:optionen|aktionen)\s+für|more\s+(?:options|actions)\s+for|aktionen\s+für|nachricht\s+an|send\s+a\s+message\s+to|chat\s+with|chatten\s+mit|you\s+can\x27?t\s+remotely\s+mute|sie\s+können\s+das\s+mikrofon\s+von)\s+(.+)$/i);
      if (match && match[1]) {
        const cleaned = cleanPersonName(match[1]);
        if (looksLikeName(cleaned)) return cleaned;
      }
    }

    // 4. data-self-name on item or descendant
    const selfEl = item.hasAttribute("data-self-name") ? item : item.querySelector("[data-self-name]");
    if (selfEl) {
      const selfName = selfEl.getAttribute("data-self-name");
      if (selfName && !isPresentation(selfName)) {
        const c = cleanPersonName(selfName);
        if (looksLikeName(c)) return c;
      }
    }

    // 5. Leaf nodes not inside buttons, menus, tooltips, or badges
    const allLeaves = Array.from(item.querySelectorAll("*")).filter(
      (el) => el.children.length === 0 && clean(el.textContent).length > 0
    );

    const nonButtonLeaves = allLeaves.filter(
      (el) => !el.closest('button, [role="button"], [role="menu"], [role="menuitem"], [role="tooltip"], [role="img"], [aria-haspopup="true"], .d93U2d')
    );
    for (const leaf of nonButtonLeaves) {
      if (isPresentation(leaf.textContent)) return null;
      const t = cleanPersonName(leaf.textContent);
      if (looksLikeName(t)) return t;
    }

    // 6. Fallback across all leaves
    for (const leaf of allLeaves) {
      if (isPresentation(leaf.textContent)) return null;
      const t = cleanPersonName(leaf.textContent);
      if (looksLikeName(t)) return t;
    }

    const direct = cleanPersonName(item.textContent);
    if (isPresentation(direct)) return null;
    return looksLikeName(direct) ? direct : null;
  }

  function meetCode() {
    const m = location.pathname.match(/^\/([a-z]{3}-[a-z]{4}-[a-z]{3})/i);
    return m ? m[1] : location.pathname.replace(/^\//, "").split("/")[0] || null;
  }

  /* Meeting-Name: Meet setzt bei Kalenderterminen den Titel in document.title.
   * Ohne Kalendertermin steht dort nur der Code. Dann liefern wir null und der
   * Nutzer traegt den Namen beim Aktivieren selbst ein. */
  function meetingTitle() {
    const candidates = [];

    const fromTitle = clean(document.title)
      .replace(/^Google\s+Meet\s*[-–—|:]\s*/i, "")
      .replace(/^Meet\s*[-–—|:]\s*/i, "")
      .replace(/\s*[-–—|]\s*Google\s+Meet$/i, "")
      .replace(/\s*[-–—|]\s*Meet$/i, "");
    candidates.push(fromTitle);

    const attr = document.querySelector("[data-meeting-title]");
    if (attr) candidates.push(clean(attr.getAttribute("data-meeting-title")));

    for (const h of document.querySelectorAll('[role="heading"]')) {
      candidates.push(clean(h.textContent));
    }

    for (const c of candidates) {
      if (!c) continue;
      if (CODE_RE.test(c)) continue;
      if (/^(meet|google meet|besprechung|meeting|startseite|home)$/i.test(c)) continue;
      if (c.length < 2 || c.length > 120) continue;
      return c;
    }
    return null;
  }

  function collect() {
    const seen = new Map();
    const items = Array.from(document.querySelectorAll('[role="listitem"]'));

    for (const item of items) {
      const hasId = item.hasAttribute("data-participant-id") || item.querySelector("[data-participant-id]") !== null;
      const inPeopleList = hasId || !!item.closest('[role="list"]');
      if (!inPeopleList) continue;

      if (item.getAttribute("data-is-screen-share") === "true" || item.getAttribute("data-is-presenting") === "true") continue;
      if (isPresentation(item.textContent) || isPresentation(item.getAttribute("aria-label"))) continue;

      const name = extractName(item);
      if (!name || isPresentation(name) || !looksLikeName(name)) continue;

      const key = name.toLowerCase();
      const prev = seen.get(key);
      seen.set(key, { name, present: (prev && prev.present) || hasId });
    }

    if (seen.size === 0) {
      for (const tile of document.querySelectorAll("[data-participant-id]")) {
        if (tile.getAttribute("data-is-screen-share") === "true" || tile.getAttribute("data-is-presenting") === "true") continue;
        if (isPresentation(tile.textContent) || isPresentation(tile.getAttribute("aria-label"))) continue;
        const name = extractName(tile);
        if (!name || isPresentation(name) || !looksLikeName(name)) continue;
        seen.set(name.toLowerCase(), { name, present: true });
      }
    }

    return Array.from(seen.values());
  }

  function findViewEveryoneButton() {
    const clickable = Array.from(document.querySelectorAll('button, [role="button"], div[role="button"], a'));
    return clickable.find((b) => {
      const txt = (b.textContent || "").toLowerCase();
      const aria = (b.getAttribute("aria-label") || "").toLowerCase();
      return /view everyone|alle in diesem anruf|alle teilnehmer anzeigen|everyone in this call/.test(txt + " " + aria);
    });
  }

  function findPanelButton() {
    const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
    return buttons.find((b) => {
      const label = (b.getAttribute("aria-label") || "").toLowerCase();
      return /personen|teilnehmer|people|everyone|participants/.test(label);
    });
  }

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* withPeople false heisst: nur Meeting-Name lesen, Personenliste nicht
   * antasten. So oeffnet die Erweiterung in nicht getrackten Meetings kein
   * Panel und bleibt vollstaendig passiv. */
  async function scrape(withPeople) {
    let people = [];
    let openedPanel = false;

    if (withPeople) {
      const viewEveryone = findViewEveryoneButton();
      if (viewEveryone) {
        viewEveryone.click();
        await wait(500);
      }

      people = collect();
      if (people.length < 2) {
        const btn = findPanelButton();
        if (btn) {
          btn.click();
          openedPanel = true;
          await wait(900);

          const innerViewEveryone = findViewEveryoneButton();
          if (innerViewEveryone) {
            innerViewEveryone.click();
            await wait(500);
          }

          people = collect();
        }
      }
    }

    return {
      ok: true,
      code: meetCode(),
      title: meetingTitle(),
      openedPanel,
      people,
      inCall: !!document.querySelector("[data-participant-id]")
    };
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg && msg.type === "MUR_SCRAPE") {
      scrape(msg.withPeople === true)
        .then(sendResponse)
        .catch((e) => sendResponse({ ok: false, error: String(e && e.message ? e.message : e) }));
      return true;
    }
  });
})();
