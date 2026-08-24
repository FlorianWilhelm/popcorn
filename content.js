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
    "mic", "mic_off", "videocam", "videocam_off", "more_vert", "push_pin",
    "present_to_all", "devices", "person_add", "domain_disabled",
    "keep", "keep_off", "visual_effects", "raise_hand", "front_hand",
    "arrow_drop_down", "close", "search", "check", "star", "block"
  ]);

  const NOISE = /^(du|you|sie|ich|me|host|moderator|gastgeber|meeting-host|besprechungsleiter|praesentation|präsentation|presentation|stummgeschaltet|muted|angepinnt|pinned|beitreten|joining|eingeladen|invited|ebenfalls eingeladen|also invited|im meeting|in call|contributors|weitere optionen|more options|teilnehmer|participants|personen|people|suchen|search)$/i;

  const clean = (s) => (s || "").replace(/\s+/g, " ").trim();

  function stripQualifier(name) {
    return clean(
      name
        .replace(/\((du|you|sie|dein bildschirm|your presentation|präsentation|presentation|gastgeber|host|meeting host)\)/gi, "")
        .replace(/[·•]/g, " ")
    );
  }

  function looksLikeName(s) {
    if (!s) return false;
    if (s.length < 2 || s.length > 70) return false;
    if (NOISE.test(s)) return false;
    if (ICON_WORDS.has(s)) return false;
    if (/^[a-z0-9]+(_[a-z0-9]+)+$/.test(s)) return false;
    if (!/[a-zA-ZÀ-ÿ]/.test(s)) return false;
    if (/^\d+$/.test(s)) return false;
    return true;
  }

  function extractName(item) {
    const selfName = item.getAttribute("data-self-name");
    if (selfName && looksLikeName(clean(selfName))) return stripQualifier(selfName);

    const leaves = Array.from(item.querySelectorAll("*")).filter(
      (el) => el.children.length === 0 && clean(el.textContent).length > 0
    );
    for (const leaf of leaves) {
      const t = stripQualifier(clean(leaf.textContent));
      if (looksLikeName(t)) return t;
    }

    const aria = stripQualifier(clean(item.getAttribute("aria-label") || ""));
    if (looksLikeName(aria)) return aria.split(",")[0].trim();

    const direct = stripQualifier(clean(item.textContent));
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
      const hasId = item.hasAttribute("data-participant-id");
      const inPeopleList = hasId || !!item.closest('[role="list"]');
      if (!inPeopleList) continue;

      const name = extractName(item);
      if (!name) continue;

      const key = name.toLowerCase();
      const prev = seen.get(key);
      seen.set(key, { name, present: (prev && prev.present) || hasId });
    }

    if (seen.size === 0) {
      for (const tile of document.querySelectorAll("[data-participant-id]")) {
        const name = extractName(tile);
        if (!name) continue;
        seen.set(name.toLowerCase(), { name, present: true });
      }
    }

    return Array.from(seen.values());
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
      people = collect();
      if (people.length < 2) {
        const btn = findPanelButton();
        if (btn) {
          btn.click();
          openedPanel = true;
          await wait(900);
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
