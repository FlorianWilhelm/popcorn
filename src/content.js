/* POPCORN - Participant Order Picker for Candid On-call Reporting & Notes
 * Content script for scraping Google Meet participant lists and title.
 */
(() => {
  // The popup may inject this script again; tear down the previous instance first.
  if (window.__popcornCleanup) {
    try {
      window.__popcornCleanup();
    } catch {}
  }

  // Shared name filters from lib/names.js, which is injected before this script.
  const {
    collapseWhitespace: clean,
    normalizeKey,
    cleanPersonName,
    isPresentation,
    looksLikeName
  } = globalThis.PopcornNames;

  const MEET_CODE_PATTERN = "[a-z]{3}-[a-z]{4}-[a-z]{3}";
  const CODE_RE = new RegExp(`^${MEET_CODE_PATTERN}$`, "i");
  const CODE_PATH_RE = new RegExp(`^/(${MEET_CODE_PATTERN})`, "i");

  const LIVE_ROSTER_INTERVAL_MS = 1000;
  const ROSTER_MERGE_WINDOW_MS = 60 * 1000; // people unseen for longer are not merged into a scrape
  const ROSTER_EXPIRY_MS = 2 * 60 * 1000; // people unseen for longer are forgotten
  const BOTTOM_BAR_HEIGHT = 160;

  const BUTTON_SELECTOR = 'button, [role="button"]';
  const ICON_SELECTOR = '.google-material-icons, [class*="icon" i], span, i';
  const CHAT_CONTAINER_SELECTOR =
    'aside[aria-label*="chat" i], div[aria-label*="chat" i], div[aria-label*="nachricht" i]';
  const CHAT_INPUT_SELECTOR =
    'textarea[aria-label*="chat" i], textarea[aria-label*="nachricht" i], [contenteditable="true"][aria-label*="chat" i]';

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const allButtons = () => Array.from(document.querySelectorAll(BUTTON_SELECTOR));

  /** Meet often wraps the real button in a container; return the button itself. */
  const toButton = (el) => (el.matches(BUTTON_SELECTOR) ? el : el.querySelector(BUTTON_SELECTOR) || el);

  /** True for visible controls in Meet's bottom control bar. */
  function isInBottomBar(el) {
    const rect = el.getBoundingClientRect();
    return rect.top > window.innerHeight - BOTTOM_BAR_HEIGHT && rect.width > 0 && rect.height > 0;
  }

  /** All human-readable labels of a control, lowercased. */
  const controlLabel = (b) =>
    `${b.getAttribute("aria-label") || ""} ${b.getAttribute("data-tooltip") || ""} ${b.getAttribute("title") || ""} ${b.textContent || ""}`.toLowerCase();

  function isChatInputVisible() {
    const input = document.querySelector(CHAT_INPUT_SELECTOR);
    return !!input && input.offsetParent !== null;
  }

  function isScreenShare(el) {
    return (
      el.getAttribute("data-is-screen-share") === "true" ||
      el.getAttribute("data-is-presenting") === "true" ||
      isPresentation(el.textContent) ||
      isPresentation(el.getAttribute("aria-label"))
    );
  }

  function extractName(item) {
    // 0. Skip accordion toggles, section headings, and tabs
    if (item.getAttribute("aria-expanded") !== null) return null;
    if (item.matches('[role="heading"], [role="tab"], h1, h2, h3, h4, h5, h6')) return null;

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
      const match = aria.match(
        /(?:weitere\s+(?:optionen|aktionen)\s+für|more\s+(?:options|actions)\s+for|aktionen\s+für|nachricht\s+an|send\s+a\s+message\s+to|chat\s+with|chatten\s+mit|you\s+can\x27?t\s+remotely\s+mute|sie\s+können\s+das\s+mikrofon\s+von|bitten,?\s+(?:sie\s+)?|ask\s+)\s*(.+?)(?:\s+(?:beizutreten|to\s+join))?$/i
      );
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

    // 5. Leaf nodes not inside buttons, menus, tooltips, or badges, then 6. all leaf nodes
    const allLeaves = Array.from(item.querySelectorAll("*")).filter(
      (el) => el.children.length === 0 && clean(el.textContent).length > 0
    );
    const nonButtonLeaves = allLeaves.filter(
      (el) =>
        !el.closest(
          'button, [role="button"], [role="menu"], [role="menuitem"], [role="tooltip"], [role="img"], [aria-haspopup="true"], .d93U2d'
        )
    );
    for (const leaves of [nonButtonLeaves, allLeaves]) {
      for (const leaf of leaves) {
        if (isPresentation(leaf.textContent)) return null;
        const t = cleanPersonName(leaf.textContent);
        if (looksLikeName(t)) return t;
      }
    }

    const direct = cleanPersonName(item.textContent);
    if (isPresentation(direct)) return null;
    return looksLikeName(direct) ? direct : null;
  }

  function meetCode() {
    const m = location.pathname.match(CODE_PATH_RE);
    return m ? m[1] : location.pathname.replace(/^\//, "").split("/")[0] || null;
  }

  /* Meeting name: for calendar events, Meet puts the event title into
   * document.title. Without a calendar event only the meeting code is there.
   * In that case we return null and the user enters a name when enabling tracking. */
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

  const ABSENT_SECTION_RE =
    /also invited|ebenfalls eingeladen|not in (?:the )?call|nicht im anruf|andere eingeladene|weitere eingeladene|ausstehend|awaiting response|no response|également invités|egalement invites|pas dans l'appel|también invitados|tambien invitados|no están en la llamada|no estan en la llamada/i;
  const IN_CALL_SECTION_RE =
    /\b(?:in call|im anruf|in this call|in diesem anruf|in meeting|in the meeting|in der besprechung|contributors|beitragende|dans l'appel|en la llamada)\b/i;
  const NOT_IN_CALL_STATUS_RE =
    /\b(?:not in (?:the )?call|nicht im anruf|also invited|ebenfalls eingeladen|awaiting response|no response|antwort ausstehend|noch keine antwort|invited|eingeladen)\b/i;
  const ASK_TO_JOIN_RE =
    /bitten,?\s+(?:sie\s+)?(?:beizutreten|teilzunehmen)|ask(?:\s+.*)?\s+to\s+join|teilnahme\s+anfragen|demander(?:\s+.*)?\s+à\s+participer|pedir(?:\s+.*)?\s+que\s+se\s+una/i;

  function getAbsentContext() {
    const absentHeaders = [];
    const absentContainers = new Set();

    // Scan for section headers / buttons / accordions / headings
    const candidates = Array.from(
      document.querySelectorAll(
        'button, [role="button"], [role="heading"], h1, h2, h3, h4, h5, h6, [aria-level], [aria-controls], div, span, p'
      )
    );

    for (const el of candidates) {
      if (el.closest('[role="listitem"]') || el.hasAttribute("aria-haspopup")) continue;
      const label = ((el.getAttribute("aria-label") || "") + " " + (el.title || "")).toLowerCase();
      const txt = (el.textContent || "").trim();

      const matchesText = txt.length > 0 && txt.length <= 100 && ABSENT_SECTION_RE.test(txt);
      const matchesLabel = ABSENT_SECTION_RE.test(label);
      if (matchesText || matchesLabel) {
        absentHeaders.push(el);

        // 1. If element controls another element via aria-controls
        const controlsId = el.getAttribute("aria-controls");
        if (controlsId) {
          const target = document.getElementById(controlsId);
          if (target) absentContainers.add(target);
        }

        // 2. Next sibling list or container
        let next = el.nextElementSibling;
        while (next) {
          if (next.getAttribute("role") === "list" || next.querySelector('[role="listitem"]')) {
            absentContainers.add(next);
            break;
          }
          next = next.nextElementSibling;
        }

        // 3. Parent container that encloses this header + list, but does NOT contain "in call"
        let p = el.parentElement;
        for (let d = 0; d < 4 && p && p !== document.body; d++) {
          const pTxt = (p.textContent || "").toLowerCase();
          const hasInCall = IN_CALL_SECTION_RE.test(pTxt);
          const hasList = p.querySelector('[role="list"], [role="listitem"]');
          if (hasList && !hasInCall) {
            absentContainers.add(p);
            break;
          }
          p = p.parentElement;
        }
      }
    }

    return { absentHeaders, absentContainers };
  }

  function isItemPresent(item, ctx) {
    // 1. Direct button or action on the item indicating "ask to join" / "invite"
    const itemText = (item.textContent || "").toLowerCase();
    const itemAria = (item.getAttribute("aria-label") || "").toLowerCase();
    const combined = itemText + " " + itemAria;

    if (ASK_TO_JOIN_RE.test(combined)) {
      return false;
    }
    for (const b of item.querySelectorAll(BUTTON_SELECTOR)) {
      const bTxt = ((b.textContent || "") + " " + (b.getAttribute("aria-label") || "")).toLowerCase();
      if (ASK_TO_JOIN_RE.test(bTxt)) {
        return false;
      }
    }

    // 2. Check if item is inside any known absent container
    for (const c of ctx.absentContainers) {
      if (c.contains(item)) {
        return false;
      }
    }

    // 3. Check DOM position relative to absent section headers in the same side panel
    for (const h of ctx.absentHeaders) {
      const panel =
        h.closest(
          'aside, [role="tabpanel"], div[aria-label*="panel" i], div[aria-label*="Personen" i], div[aria-label*="People" i]'
        ) || h.parentElement;
      if (panel && panel.contains(item)) {
        const pos = h.compareDocumentPosition(item);
        if ((pos & (Node.DOCUMENT_POSITION_FOLLOWING | Node.DOCUMENT_POSITION_CONTAINED_BY)) !== 0) {
          return false;
        }
      }
    }

    // 4. Check preceding siblings of the item's enclosing list
    const list = item.closest('[role="list"]');
    if (list) {
      let prev = list.previousElementSibling;
      while (prev) {
        const prevTxt = ((prev.textContent || "") + " " + (prev.getAttribute("aria-label") || "")).toLowerCase();
        if (ABSENT_SECTION_RE.test(prevTxt)) {
          return false;
        }
        prev = prev.previousElementSibling;
      }
    }

    // 5. Check ancestors up to 10 levels for absent indicators
    let cur = item;
    let depth = 0;
    while (cur && cur !== document.body && depth < 10) {
      const aria = (cur.getAttribute("aria-label") || "").toLowerCase();
      if (ABSENT_SECTION_RE.test(aria)) {
        return false;
      }
      cur = cur.parentElement;
      depth++;
    }

    // 6. Check item itself for not-in-call status text / badges
    return !NOT_IN_CALL_STATUS_RE.test(combined);
  }

  function collect() {
    const ctx = getAbsentContext();
    const seen = new Map();
    const panel = findPeopleSidePanel();
    const items = Array.from(document.querySelectorAll('[role="listitem"]'));

    for (const item of items) {
      if (item.closest(CHAT_CONTAINER_SELECTOR)) continue;
      if (item.closest('[role="toolbar"], nav, header')) continue;

      const rect = item.getBoundingClientRect();
      if (rect.top > window.innerHeight - 110) continue;
      if (rect.width === 0 || rect.height === 0) continue;

      const hasId = item.hasAttribute("data-participant-id") || item.querySelector("[data-participant-id]") !== null;
      const inPeopleList = hasId || !!item.querySelector(".zWGUib") || (panel !== null && panel.contains(item));
      if (!inPeopleList) continue;

      if (isScreenShare(item)) continue;

      const name = extractName(item);
      if (!name || isPresentation(name) || !looksLikeName(name)) continue;

      const present = isItemPresent(item, ctx);
      const key = normalizeKey(name);
      const prev = seen.get(key);
      seen.set(key, { name, present: (prev && prev.present) || present });
    }

    // Also scan video tiles with data-participant-id directly (must NOT be inside side panel)
    for (const tile of document.querySelectorAll("[data-participant-id]")) {
      if (tile.closest('[role="listitem"], [role="list"], aside, [role="tabpanel"]')) continue;
      if (isScreenShare(tile)) continue;
      const name = extractName(tile);
      if (!name || isPresentation(name) || !looksLikeName(name)) continue;
      seen.set(normalizeKey(name), { name, present: true });
    }

    return Array.from(seen.values());
  }

  function clickElement(el) {
    if (!el) return;
    const target = el.matches('button, [role="button"], a, input')
      ? el
      : el.closest('button, [role="button"], a, input') || el;

    const rect = target.getBoundingClientRect();
    const cx = Math.round(rect.left + (rect.width > 0 ? rect.width / 2 : 0));
    const cy = Math.round(rect.top + (rect.height > 0 ? rect.height / 2 : 0));

    const eventProps = {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      clientX: cx,
      clientY: cy,
      screenX: cx,
      screenY: cy,
      pageX: cx,
      pageY: cy
    };

    try {
      target.focus();
    } catch {}

    try {
      target.dispatchEvent(
        new PointerEvent("pointerdown", {
          ...eventProps,
          button: 0,
          buttons: 1,
          pointerId: 1,
          pointerType: "mouse",
          isPrimary: true
        })
      );
      target.dispatchEvent(
        new MouseEvent("mousedown", {
          ...eventProps,
          button: 0,
          buttons: 1
        })
      );
      target.dispatchEvent(
        new PointerEvent("pointerup", {
          ...eventProps,
          button: 0,
          buttons: 0,
          pointerId: 1,
          pointerType: "mouse",
          isPrimary: true
        })
      );
      target.dispatchEvent(
        new MouseEvent("mouseup", {
          ...eventProps,
          button: 0,
          buttons: 0
        })
      );
    } catch {}

    try {
      target.click();
    } catch {}
  }

  const NON_PEOPLE_BUTTON_RE =
    /\b(?:chat|chatten|nachricht(?:en)?|in-call messages|mikrofon|microphone|kamera|camera|verlassen|leave call|anruf verlassen|beenden|auflegen|jetzt präsentieren|present now|bildschirm freigeben|share screen|melden|raise hand|reaktion(?:en)?|send a reaction|untertitel|captions?|besprechungsdetails|meeting details|details zur besprechung|host controls|steuerelemente für den host|sicherheit|safety|security|weitere optionen|more options|einstellungen)\b/i;

  const PEOPLE_LABEL_RE =
    /\b(?:people|person(?:en)?|teilnehm(?:er|erliste|ende)?|participants?|show everyone|alle anzeigen|afficher tout le monde|mostrar a todos|mostra tutti|mostrar todos)\b/i;

  const PEOPLE_ICON_RE = /\b(?:people|people_outline|group|groups|person|person_outline)\b/i;

  function isPeopleButton(b) {
    if (!b) return false;
    const aria = (b.getAttribute("aria-label") || "").trim();
    const tooltip = (b.getAttribute("data-tooltip") || "").trim();
    const title = (b.getAttribute("title") || "").trim();
    const combinedLabels = `${aria} ${tooltip} ${title}`.toLowerCase();

    // 1. Explicitly exclude other known bottom bar control buttons
    if (NON_PEOPLE_BUTTON_RE.test(combinedLabels)) {
      return false;
    }

    // 2. Match people labels across languages (both singular and plural)
    if (PEOPLE_LABEL_RE.test(combinedLabels)) {
      return true;
    }

    // 3. Match Google Material Icons/Symbols inside button
    const icons = Array.from(b.querySelectorAll(ICON_SELECTOR));
    for (const icon of icons) {
      const iconTxt = (icon.textContent || "").trim().toLowerCase();
      if (PEOPLE_ICON_RE.test(iconTxt)) {
        return true;
      }
    }

    // 4. Check direct text content of button
    const directTxt = (b.textContent || "").trim().toLowerCase();
    if (PEOPLE_ICON_RE.test(directTxt) || PEOPLE_LABEL_RE.test(directTxt)) {
      return true;
    }

    // 5. Check aria-controls attribute
    const ariaControls = (b.getAttribute("aria-controls") || "").toLowerCase();
    if (ariaControls && /people|participant|teilnehm|person/i.test(ariaControls)) {
      return true;
    }

    return false;
  }

  function findPanelButton() {
    // Prefer the bottom control bar, then any button on screen
    const buttons = allButtons();
    const found = buttons.filter(isInBottomBar).find(isPeopleButton) || buttons.find(isPeopleButton);
    if (found) return toButton(found);

    // Fallback: data-panel-id="2", but only if it really is the People button
    const byPanelId2 = document.querySelector('[data-panel-id="2"]');
    if (byPanelId2 && isPeopleButton(byPanelId2)) return toButton(byPanelId2);

    return null;
  }

  function findPeopleSidePanel() {
    // 1. Look for actual side panel containers positioned at the right edge of the viewport
    const containers = Array.from(
      document.querySelectorAll('aside, section, div[role="region"], div[role="tabpanel"], div[data-panel-id]')
    );
    for (const el of containers) {
      if (el.offsetParent === null) continue;
      const style = window.getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none") continue;

      const rect = el.getBoundingClientRect();
      // Must be physically anchored and visible on the right edge of the screen
      if (rect.left >= window.innerWidth - 50 || rect.left < window.innerWidth * 0.4) continue;
      if (rect.right < window.innerWidth - 35 || rect.right > window.innerWidth + 35) continue;
      // Must be typical side-panel width (not full screen, not a tiny button)
      if (rect.width < 240 || rect.width > 550 || rect.height < window.innerHeight * 0.4) continue;
      if (rect.top > window.innerHeight - 120) continue; // Not in control bar
      if (el.closest('[role="main"]')) continue; // Never inside main video stage
      if (el.querySelector("video")) continue; // Panels do not contain video elements

      const aria = (el.getAttribute("aria-label") || "").toLowerCase();
      // Exclude chat, activities, details, host controls panels
      if (/chat|nachrichten|messages|aktivitäten|activities|details zur|besprechungsdetails|steuerelemente/i.test(aria))
        continue;
      if (el.querySelector('textarea, [contenteditable="true"]')) continue; // Chat message input

      const text = (el.textContent || "").slice(0, 500).toLowerCase();
      const hasPeople = el.querySelector(
        'div[role="list"][aria-label*="Participant" i], div[role="list"][aria-label*="Teilnehmer" i], div[role="list"][aria-label*="People" i], div[role="list"][aria-label*="Person" i], [aria-label*="In call" i], [aria-label*="Im Anruf" i], [aria-label*="Ebenfalls eingeladen" i], [aria-label*="Also invited" i]'
      );

      if (
        hasPeople ||
        PEOPLE_LABEL_RE.test(aria) ||
        PEOPLE_LABEL_RE.test(text) ||
        /in call|im anruf|also invited|ebenfalls eingeladen/i.test(text)
      ) {
        return el;
      }
    }

    // 2. Fallback: check if participant list container itself is visible on right edge
    const directList = document.querySelector(
      'div[role="list"][aria-label*="Participant" i], div[role="list"][aria-label*="Teilnehmer" i], div[role="list"][aria-label*="People" i], div[role="list"][aria-label*="Person" i], [aria-label="In call" i], [aria-label="Im Anruf" i]'
    );
    if (directList && directList.offsetParent !== null) {
      const style = window.getComputedStyle(directList);
      if (style.visibility !== "hidden" && style.display !== "none") {
        const rect = directList.getBoundingClientRect();
        if (
          rect.left > window.innerWidth * 0.4 &&
          rect.left < window.innerWidth - 50 &&
          rect.right >= window.innerWidth - 35 &&
          rect.right <= window.innerWidth + 35
        ) {
          return (
            directList.closest('aside, section, div[role="region"], div[role="tabpanel"]') || directList.parentElement
          );
        }
      }
    }

    return null;
  }

  function findSidePanelCloseButton() {
    const panel = findPeopleSidePanel();
    if (panel) {
      // 1. Look for close button in panel header
      const headerClose = Array.from(panel.querySelectorAll(BUTTON_SELECTOR)).find((b) => {
        const rect = b.getBoundingClientRect();
        if (rect.top > 180 || rect.width === 0 || rect.height === 0) return false;
        const aria = (b.getAttribute("aria-label") || "").toLowerCase();
        const icon = b.querySelector(ICON_SELECTOR);
        const txt = ((icon && icon.textContent) || b.textContent || "").trim().toLowerCase();
        return aria.includes("schließen") || aria.includes("close") || txt === "close" || txt === "clear";
      });
      if (headerClose) return headerClose;

      // 2. Look anywhere inside panel
      const inPanelClose = panel.querySelector(
        'button[aria-label*="schließen" i], button[aria-label*="close" i], button[title*="schließen" i], button[title*="close" i], [role="button"][aria-label*="schließen" i], [role="button"][aria-label*="close" i]'
      );
      if (inPanelClose) return inPanelClose;
    }

    return allButtons().find((b) => {
      const rect = b.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      // Must be on the right side of the screen where side panel is located
      if (rect.right < window.innerWidth / 2) return false;
      // Must not be in the bottom control bar
      if (rect.top > window.innerHeight - 100) return false;

      // Must not be inside chat panel
      if (b.closest(CHAT_CONTAINER_SELECTOR)) return false;

      const aria = (b.getAttribute("aria-label") || "").toLowerCase();
      const title = (b.getAttribute("title") || "").toLowerCase();
      const txt = (b.textContent || "").trim().toLowerCase();
      const icon = b.querySelector(ICON_SELECTOR);
      const iconTxt = ((icon && icon.textContent) || "").trim().toLowerCase();

      // Must not be leave call button
      if (/anruf|call|verlassen|leave/.test(aria + " " + title)) return false;

      return (
        aria === "schließen" ||
        aria === "close" ||
        aria.includes("schließen") ||
        aria.includes("close") ||
        title === "schließen" ||
        title === "close" ||
        txt === "close" ||
        iconTxt === "close"
      );
    });
  }

  function isPeoplePanelOpen() {
    // 1. Direct visual presence of the side panel in viewport
    if (findPeopleSidePanel() !== null) {
      return true;
    }

    // 2. Active People button in the bottom control bar (and no chat open instead)
    const btn = findPanelButton();
    return !!btn && isButtonActive(btn) && !isChatInputVisible();
  }

  function closePeoplePanel() {
    // 1. Primary: toggle bottom bar People button (the exact button that opened it)
    const panelBtn = findPanelButton();
    if (panelBtn) {
      clickElement(panelBtn);
      return;
    }

    // 2. Fallback: Close button in side panel header
    const closeBtn = findSidePanelCloseButton();
    if (closeBtn) {
      clickElement(closeBtn);
    }
  }

  const CHAT_LABEL_RE = /\b(?:chat|chatten|nachricht(?:en)?|in-call messages?|mit allen chatten|chat with everyone)\b/i;
  const ACTIVITIES_LABEL_RE = /\b(?:aktivitäten|activities)\b/i;
  const DETAILS_LABEL_RE = /\b(?:besprechungsdetails|meeting details|details zur besprechung)\b/i;
  const HOST_LABEL_RE = /\b(?:host controls|steuerelemente für den host)\b/i;

  function isButtonActive(b) {
    if (!b) return false;
    const isPressed = (el) =>
      el.getAttribute("aria-pressed") === "true" ||
      el.getAttribute("aria-expanded") === "true" ||
      el.getAttribute("aria-selected") === "true";
    return isPressed(toButton(b)) || isPressed(b);
  }

  function findChatButton() {
    return allButtons().find(
      (b) => isInBottomBar(b) && (b.getAttribute("data-panel-id") === "1" || CHAT_LABEL_RE.test(controlLabel(b)))
    );
  }

  const NON_PANEL_CONTROL_RE =
    /mikrofon|microphone|kamera|camera|verlassen|leave|hand|melden|reaktion|reaction|untertitel|caption|bildschirm|present|screen/i;

  /** An active bottom bar button for another side panel (Chat, Activities, Details, Host controls). */
  function findOtherActivePanelButton() {
    return allButtons().find((b) => {
      if (!isInBottomBar(b) || isPeopleButton(b)) return false;
      const label = controlLabel(b);
      if (NON_PANEL_CONTROL_RE.test(label)) return false;
      const isPanelButton =
        CHAT_LABEL_RE.test(label) ||
        ACTIVITIES_LABEL_RE.test(label) ||
        DETAILS_LABEL_RE.test(label) ||
        HOST_LABEL_RE.test(label) ||
        b.hasAttribute("data-panel-id");
      return isPanelButton && isButtonActive(b);
    });
  }

  let initialSessionState = null;
  let openedPanelByPopcorn = false;
  const activeSessionPorts = new Set();

  function captureInitialState() {
    if (initialSessionState !== null) return;

    // 1. Is People sidebar already open?
    if (isPeoplePanelOpen()) {
      initialSessionState = { type: "PEOPLE" };
      return;
    }

    // 2. Is Chat input visible or Chat button active?
    const chatBtn = findChatButton();
    if (isChatInputVisible() || (chatBtn && isButtonActive(chatBtn))) {
      initialSessionState = { type: "OTHER", button: chatBtn };
      return;
    }

    // 3. Is another panel button active (Activities, Details, Host)?
    const otherActiveBtn = findOtherActivePanelButton();
    if (otherActiveBtn) {
      initialSessionState = { type: "OTHER", button: otherActiveBtn };
      return;
    }

    // 4. No panel was open
    initialSessionState = { type: "NONE" };
  }

  function restoreInitialState() {
    const state = initialSessionState;
    const wasOpened = openedPanelByPopcorn;
    initialSessionState = null;
    openedPanelByPopcorn = false;

    // If Popcorn never opened or altered the panel, leave Meet exactly as is
    if (!wasOpened || !state) return;

    if (state.type === "OTHER" && state.button) {
      // Another panel (e.g. Chat) was open: switch back to it if not already active
      if (!isButtonActive(state.button)) clickElement(state.button);
    } else if (state.type === "NONE") {
      // No sidebar was open: close the People panel again
      closePeoplePanel();
    }
    // state.type === "PEOPLE": the People sidebar was already open, keep it open
  }

  /* The popup holds a "popcorn-session" port while it is open. The live roster is only
   * tracked during that time, so untracked meetings and closed popups cost nothing. */
  function onSessionConnect(port) {
    if (port.name !== "popcorn-session") return;
    activeSessionPorts.add(port);
    captureInitialState();
    startLiveRoster();

    port.onDisconnect.addListener(() => {
      activeSessionPorts.delete(port);
      if (activeSessionPorts.size === 0) {
        stopLiveRoster();
        restoreInitialState();
      }
    });
  }

  function findViewEveryoneButton() {
    const panel = findPeopleSidePanel();
    if (!panel) return null;

    const clickable = Array.from(panel.querySelectorAll('button, [role="button"], div[role="button"], a'));
    return clickable.find((b) => {
      const txt = (b.textContent || "").toLowerCase();
      const aria = (b.getAttribute("aria-label") || "").toLowerCase();
      if (/chat|nachricht|message/.test(txt + " " + aria)) return false;
      return /view everyone|alle in diesem anruf|alle teilnehmer anzeigen|everyone in this call/i.test(
        txt + " " + aria
      );
    });
  }

  const SECTION_EXPAND_RE =
    /\b(?:in (?:this |the )?call|im anruf|in (?:this |the )?meeting|in der besprechung|contributors|beitragende|also invited|ebenfalls eingeladen|not in (?:the )?call|nicht im anruf|andere eingeladene|weitere eingeladene|eingeladen|invited|waiting to join|warten auf beitritt|everyone in this call|alle in diesem anruf|alle teilnehmer)\b/i;

  function expandCollapsedSections() {
    const panel = findPeopleSidePanel();
    const searchRoot = panel || document;

    const toggles = Array.from(
      searchRoot.querySelectorAll('div[role="button"][aria-expanded="false"], button[aria-expanded="false"]')
    );
    let clickedAny = false;
    for (const t of toggles) {
      const rect = t.getBoundingClientRect();
      // Must not be in control bar
      if (rect.top > window.innerHeight - 120) continue;
      // If no panel resolved yet, restrict to right half of screen
      if (!panel && rect.left < window.innerWidth * 0.45) continue;

      // Avoid participant action menus (3 dots)
      if (t.closest('[role="listitem"]') || t.hasAttribute("aria-haspopup")) continue;

      const text = ((t.textContent || "") + " " + (t.getAttribute("aria-label") || "")).toLowerCase();
      if (/chat|nachricht|message|close|schließen|search|suchen/i.test(text)) continue;

      if (SECTION_EXPAND_RE.test(text)) {
        clickElement(t);
        clickedAny = true;
      }
    }
    return clickedAny;
  }

  /* Recently seen participants by normalized name. Meet virtualizes long lists, so people can
   * briefly disappear from the DOM; merging recent sightings keeps them in the result. */
  const sessionRoster = new Map();

  function rememberSeen(people, now) {
    for (const p of people) {
      if (p.name && looksLikeName(p.name)) {
        sessionRoster.set(normalizeKey(p.name), { name: p.name, present: p.present, lastSeen: now });
      }
    }
  }

  function updateLiveRoster() {
    if (!meetCode()) return;
    const now = Date.now();
    rememberSeen(collect(), now);
    for (const [k, v] of sessionRoster.entries()) {
      if (now - v.lastSeen > ROSTER_EXPIRY_MS) sessionRoster.delete(k);
    }
  }

  /** Adds people seen within the merge window who are missing from the current scrape. */
  function mergeWithRecentlySeen(people, now) {
    const merged = new Map();
    for (const [k, v] of sessionRoster.entries()) {
      if (now - v.lastSeen < ROSTER_MERGE_WINDOW_MS) merged.set(k, { name: v.name, present: v.present });
    }
    for (const p of people) {
      if (looksLikeName(p.name)) merged.set(normalizeKey(p.name), { name: p.name, present: p.present });
    }
    return merged.size > people.length ? Array.from(merged.values()) : people;
  }

  let liveRosterInterval = null;

  function startLiveRoster() {
    if (!liveRosterInterval) liveRosterInterval = setInterval(updateLiveRoster, LIVE_ROSTER_INTERVAL_MS);
  }

  function stopLiveRoster() {
    clearInterval(liveRosterInterval);
    liveRosterInterval = null;
  }

  /* withPeople === false means: read only the meeting name and leave the
   * people list untouched. This way the extension never opens a panel in
   * untracked meetings and stays completely passive. */
  async function scrape(withPeople, openIfClosed = false) {
    let people = [];

    if (withPeople) {
      captureInitialState();

      // If requested and panel is closed, open it and track that Popcorn opened it
      if (!isPeoplePanelOpen() && openIfClosed) {
        const btn = findPanelButton();
        if (btn) {
          clickElement(btn);
          openedPanelByPopcorn = true;
          await wait(400);
        }
      }

      // Initial section expand pass
      const expandedInitial = expandCollapsedSections();
      if (expandedInitial) {
        await wait(250);
      }

      const viewEveryone = findViewEveryoneButton();
      if (viewEveryone) {
        clickElement(viewEveryone);
        await wait(200);
      }

      // Poll until participants are loaded and count stabilizes
      // Note: Do NOT abort prematurely when only 1 participant (video tile) is found!
      // Allow up to 10 iterations (~1200ms) for the sidebar to load and render attendees.
      let lastCount = 0;
      let stableRounds = 0;
      for (let i = 0; i < 10; i++) {
        const didExpand = expandCollapsedSections();
        if (didExpand) {
          await wait(200);
        }
        people = collect();

        // Stabilization condition:
        // - If we have 2+ people and count didn't change: break after 1 stable round
        // - If we only have 1 person (e.g. video tile): require at least 3 stable rounds and at least 4 iterations (~600ms)
        if (people.length > 0 && people.length === lastCount) {
          stableRounds++;
          if (people.length >= 2 || (stableRounds >= 3 && i >= 4)) {
            break;
          }
        } else {
          stableRounds = 0;
        }

        lastCount = people.length;
        await wait(120);
      }

      const innerViewEveryone = findViewEveryoneButton();
      if (innerViewEveryone) {
        clickElement(innerViewEveryone);
        await wait(200);
        people = collect();
      }

      const now = Date.now();
      rememberSeen(people, now);
      people = mergeWithRecentlySeen(people, now);
    }

    return {
      ok: true,
      code: meetCode(),
      title: meetingTitle(),
      people
    };
  }

  const messageListener = (msg, _sender, sendResponse) => {
    if (msg && msg.type === "POPCORN_SCRAPE") {
      scrape(msg.withPeople === true, msg.openIfClosed === true)
        .then(sendResponse)
        .catch((e) => sendResponse({ ok: false, error: String(e && e.message ? e.message : e) }));
      return true;
    }
    if (msg && msg.type === "POPCORN_POPUP_CLOSING") {
      restoreInitialState();
      sendResponse({ ok: true });
      return true;
    }
  };
  chrome.runtime.onMessage.addListener(messageListener);

  chrome.runtime.onConnect.addListener(onSessionConnect);

  const onWindowFocus = () => {
    if (activeSessionPorts.size === 0 && openedPanelByPopcorn) {
      restoreInitialState();
    }
  };
  window.addEventListener("focus", onWindowFocus);

  window.__popcornCleanup = () => {
    stopLiveRoster();
    window.removeEventListener("focus", onWindowFocus);
    try {
      chrome.runtime.onMessage.removeListener(messageListener);
    } catch {}
    try {
      chrome.runtime.onConnect.removeListener(onSessionConnect);
    } catch {}
  };
})();
