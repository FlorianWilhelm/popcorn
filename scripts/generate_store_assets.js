const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const assetsDir = path.join(rootDir, "store_assets");

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// 1. Read mascot base64
const icon128Buf = fs.readFileSync(path.join(rootDir, "icon128.png"));
const icon128Base64 = icon128Buf.toString("base64");
const icon48Buf = fs.readFileSync(path.join(rootDir, "icon48.png"));
const icon48Base64 = icon48Buf.toString("base64");

fs.copyFileSync(path.join(rootDir, "icon128.png"), path.join(assetsDir, "icon-128.png"));

// Reusable SVG definitions for Chrome Window & Google Meet Frame
function getChromeMeetFrame(options = {}) {
  const isMeet = options.isMeet !== false;
  const url = isMeet ? "https://meet.google.com/wqe-ptro-xyz" : "https://github.com/fwilhelm/meet-update-rotator";
  const title = isMeet ? "Daily Standup – Google Meet" : "GitHub · fwilhelm/meet-update-rotator";

  return `
  <defs>
    <!-- Dark Window Gradients -->
    <linearGradient id="winBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#181a1f" />
      <stop offset="100%" stop-color="#111317" />
    </linearGradient>
    <linearGradient id="meetBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#202124" />
      <stop offset="100%" stop-color="#17181b" />
    </linearGradient>
    <linearGradient id="tileGrad1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3b4252" />
      <stop offset="100%" stop-color="#2e3440" />
    </linearGradient>
    <linearGradient id="tileGrad2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#434c5e" />
      <stop offset="100%" stop-color="#2e3440" />
    </linearGradient>
    <linearGradient id="tileGrad3" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#4c566a" />
      <stop offset="100%" stop-color="#3b4252" />
    </linearGradient>
    <linearGradient id="tileGrad4" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2d3748" />
      <stop offset="100%" stop-color="#1a202c" />
    </linearGradient>
    <filter id="popupShadow" x="-30%" y="-20%" width="160%" height="160%">
      <feDropShadow dx="0" dy="18" stdDeviation="28" flood-color="#000000" flood-opacity="0.75" />
    </filter>
  </defs>

  <!-- Background Base Canvas -->
  <rect width="1280" height="800" fill="#0b0e14" />

  <!-- macOS Chrome Window Outer Frame -->
  <g transform="translate(16, 16)">
    <!-- Window Border & Outer Background -->
    <rect width="1248" height="768" rx="12" fill="url(#winBg)" stroke="#32363e" stroke-width="1" />

    <!-- Chrome Title Bar & Tabs Header -->
    <rect width="1248" height="42" rx="12" fill="#1f2228" />
    <rect y="30" width="1248" height="12" fill="#1f2228" />

    <!-- macOS Traffic Light Window Controls -->
    <circle cx="22" cy="21" r="6" fill="#ff5f56" stroke="#e0443e" stroke-width="0.5" />
    <circle cx="42" cy="21" r="6" fill="#ffbd2e" stroke="#dea123" stroke-width="0.5" />
    <circle cx="62" cy="21" r="6" fill="#27c93f" stroke="#1aab29" stroke-width="0.5" />

    <!-- Chrome Active Tab -->
    <g transform="translate(88, 8)">
      <path d="M 0,34 L 14,4 Q 18,0 26,0 L 210,0 Q 218,0 222,4 L 236,34 Z" fill="#2b2f38" />
      <!-- Meet / Web Icon -->
      ${
        isMeet
          ? `<rect x="24" y="9" width="16" height="16" rx="4" fill="#00897b" />
             <polygon points="34,13 38,15 38,20 34,22" fill="#ffffff" />
             <rect x="27" y="13" width="7" height="8" rx="1" fill="#ffffff" />`
          : `<circle cx="32" cy="17" r="7" fill="#ffffff" />
             <path d="M 32,10 A 7,7 0 0,0 25,17 C 25,20.8 28,23.5 32,23.5 C 36,23.5 39,20.8 39,17 Z" fill="#24292e" />`
      }
      <text x="46" y="21" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="500" fill="#f0f3f6">${title}</text>
      <text x="216" y="20" font-family="sans-serif" font-size="11" fill="#9ca3af">×</text>
    </g>

    <!-- Chrome + New Tab Button -->
    <text x="335" y="25" font-family="sans-serif" font-size="18" fill="#6b7280">+</text>

    <!-- Chrome Navigation & Omnibox Bar -->
    <g transform="translate(0, 42)">
      <rect width="1248" height="38" fill="#2b2f38" />
      <line x1="0" y1="38" x2="1248" y2="38" stroke="#373e4a" stroke-width="1" />

      <!-- Back, Forward, Reload -->
      <text x="20" y="24" font-family="sans-serif" font-size="15" fill="#6b7280">←</text>
      <text x="44" y="24" font-family="sans-serif" font-size="15" fill="#4b5563">→</text>
      <text x="68" y="23" font-family="sans-serif" font-size="14" fill="#9ca3af">↻</text>

      <!-- Omnibox (Address Bar) -->
      <g transform="translate(100, 5)">
        <rect width="970" height="28" rx="14" fill="#1a1d24" stroke="#3b4250" stroke-width="1" />
        <!-- Lock Icon -->
        <svg x="12" y="8" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <text x="30" y="19" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#e2e8f0">${url}</text>
      </g>

      <!-- Extension Toolbar Icons -->
      <g transform="translate(1085, 5)">
        <!-- Standard extension puzzle piece -->
        <rect x="0" y="4" width="20" height="20" rx="4" fill="transparent" />
        <svg x="2" y="4" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2">
          <path d="M19.439 7.85c0-1.571-1.274-2.85-2.845-2.85a2.85 2.85 0 0 0-2.844 2.85c0 .354.067.693.188 1.004H9.062A2.85 2.85 0 0 0 9.25 7.85c0-1.571-1.274-2.85-2.845-2.85A2.85 2.85 0 0 0 3.56 7.85c0 1.571 1.274 2.85 2.845 2.85.354 0 .693-.067 1.004-.188v5.026a2.85 2.85 0 0 0-1.004-.188c-1.571 0-2.845 1.279-2.845 2.85 0 1.571 1.274 2.85 2.845 2.85a2.85 2.85 0 0 0 2.845-2.85c0-.354-.067-.693-.188-1.004h5.026c-.121.311-.188.65-.188 1.004 0 1.571 1.274 2.85 2.844 2.85a2.85 2.85 0 0 0 2.845-2.85c0-1.571-1.274-2.85-2.845-2.85a2.85 2.85 0 0 0-.188.188V9.666c.121.121.46.188.814.188 1.571 0 2.845-1.279 2.845-2.85z"/>
        </svg>

        <!-- POPCORN Extension Active Button -->
        <g transform="translate(32, -2)">
          <rect width="32" height="32" rx="6" fill="#1f2937" stroke="#38bdf8" stroke-width="1.5" />
          <image href="data:image/png;base64,${icon48Base64}" x="4" y="4" width="24" height="24" />
        </g>

        <!-- Profile Avatar -->
        <circle cx="85" cy="14" r="12" fill="#3b82f6" />
        <text x="85" y="18" font-family="sans-serif" font-size="11" font-weight="700" fill="#ffffff" text-anchor="middle">F</text>
      </g>
    </g>

    <!-- Main Viewport Area (Google Meet or Web Content) -->
    <g transform="translate(0, 80)">
      <rect width="1248" height="688" fill="url(#meetBg)" />

      ${
        isMeet
          ? `
      <!-- Google Meet Video Grid (4 Participant Tiles) -->
      <g transform="translate(24, 20)">
        <!-- Video Tile 1: Alice Martin -->
        <g transform="translate(0, 0)">
          <rect width="400" height="260" rx="10" fill="url(#tileGrad1)" stroke="#374151" stroke-width="1" />
          <!-- Avatar Portrait Simulation -->
          <circle cx="200" cy="115" r="46" fill="#475569" />
          <path d="M 160,195 C 160,155 240,155 240,195 Z" fill="#334155" />
          <!-- Name Tag Bottom Left -->
          <rect x="14" y="222" width="120" height="24" rx="4" fill="rgba(0, 0, 0, 0.6)" />
          <text x="24" y="238" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="500" fill="#ffffff">Alice Martin</text>
          <!-- Mic icon -->
          <circle cx="376" cy="234" r="10" fill="rgba(0, 0, 0, 0.6)" />
          <text x="376" y="238" font-size="10" fill="#4ade80" text-anchor="middle">🎙️</text>
        </g>

        <!-- Video Tile 2: David Chen -->
        <g transform="translate(420, 0)">
          <rect width="400" height="260" rx="10" fill="url(#tileGrad2)" stroke="#374151" stroke-width="1" />
          <circle cx="200" cy="115" r="46" fill="#64748b" />
          <path d="M 160,195 C 160,155 240,155 240,195 Z" fill="#475569" />
          <rect x="14" y="222" width="115" height="24" rx="4" fill="rgba(0, 0, 0, 0.6)" />
          <text x="24" y="238" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="500" fill="#ffffff">David Chen</text>
          <circle cx="376" cy="234" r="10" fill="rgba(0, 0, 0, 0.6)" />
          <text x="376" y="238" font-size="10" fill="#9ca3af" text-anchor="middle">🔇</text>
        </g>

        <!-- Video Tile 3: Sarah Connor (Active Speaker Highlight) -->
        <g transform="translate(0, 280)">
          <rect width="400" height="260" rx="10" fill="url(#tileGrad3)" stroke="#38bdf8" stroke-width="2.5" />
          <circle cx="200" cy="115" r="46" fill="#0284c7" />
          <path d="M 160,195 C 160,155 240,155 240,195 Z" fill="#0369a1" />
          <rect x="14" y="222" width="130" height="24" rx="4" fill="rgba(0, 0, 0, 0.6)" />
          <text x="24" y="238" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="500" fill="#ffffff">Sarah Connor</text>
          <circle cx="376" cy="234" r="10" fill="rgba(56, 189, 248, 0.3)" />
          <text x="376" y="238" font-size="10" fill="#38bdf8" text-anchor="middle">🎙️</text>
        </g>

        <!-- Video Tile 4: You (Florian) -->
        <g transform="translate(420, 280)">
          <rect width="400" height="260" rx="10" fill="url(#tileGrad4)" stroke="#374151" stroke-width="1" />
          <circle cx="200" cy="115" r="46" fill="#4f46e5" />
          <path d="M 160,195 C 160,155 240,155 240,195 Z" fill="#3730a3" />
          <rect x="14" y="222" width="165" height="24" rx="4" fill="rgba(0, 0, 0, 0.6)" />
          <text x="24" y="238" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="500" fill="#ffffff">You (Florian Wilhelm)</text>
          <circle cx="376" cy="234" r="10" fill="rgba(0, 0, 0, 0.6)" />
          <text x="376" y="238" font-size="10" fill="#4ade80" text-anchor="middle">🎙️</text>
        </g>
      </g>

      <!-- Google Meet Bottom Control Dock -->
      <g transform="translate(0, 620)">
        <rect width="1248" height="68" fill="#181a1f" />
        
        <!-- Left: Meeting Code -->
        <text x="28" y="40" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#ffffff">wqe-ptro-xyz</text>
        <text x="135" y="40" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" fill="#9ca3af">| Daily Standup</text>

        <!-- Center: Round Call Control Buttons -->
        <g transform="translate(480, 14)">
          <circle cx="20" cy="20" r="20" fill="#374151" />
          <text x="20" y="25" font-size="15" fill="#ffffff" text-anchor="middle">🎙️</text>

          <circle cx="70" cy="20" r="20" fill="#374151" />
          <text x="70" y="25" font-size="15" fill="#ffffff" text-anchor="middle">📷</text>

          <circle cx="120" cy="20" r="20" fill="#374151" />
          <text x="120" y="25" font-size="13" font-weight="700" fill="#ffffff" text-anchor="middle">CC</text>

          <circle cx="170" cy="20" r="20" fill="#374151" />
          <text x="170" y="25" font-size="15" fill="#ffffff" text-anchor="middle">✋</text>

          <circle cx="220" cy="20" r="20" fill="#374151" />
          <text x="220" y="25" font-size="15" fill="#ffffff" text-anchor="middle">⬆️</text>

          <circle cx="270" cy="20" r="20" fill="#dc2626" />
          <text x="270" y="25" font-size="16" fill="#ffffff" text-anchor="middle">📞</text>
        </g>

        <!-- Right: Meet Sidebar Toggles -->
        <g transform="translate(1120, 18)">
          <text x="0" y="22" font-size="18" fill="#9ca3af">ℹ️</text>
          <text x="40" y="22" font-size="18" fill="#38bdf8">👥</text>
          <text x="58" y="15" font-family="sans-serif" font-size="10" font-weight="700" fill="#38bdf8">8</text>
          <text x="80" y="22" font-size="18" fill="#9ca3af">💬</text>
        </g>
      </g>`
          : `
      <!-- Generic Work Page (e.g. GitHub Workspace) -->
      <g transform="translate(40, 30)">
        <rect width="1168" height="628" rx="8" fill="#0d1117" stroke="#30363d" stroke-width="1" />
        <g transform="translate(30, 30)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">
          <text x="0" y="24" font-size="20" font-weight="700" fill="#f0f6fc">fwilhelm / meet-update-rotator</text>
          <rect x="0" y="50" width="1108" height="500" rx="6" fill="#161b22" stroke="#30363d" stroke-width="1" />
          <text x="30" y="90" font-size="15" font-weight="600" fill="#58a6ff">README.md</text>
          <text x="30" y="130" font-size="13" fill="#8b949e">POPCORN – Participant Order Picker for Candid On-call Reporting &amp; Notes</text>
          <line x1="30" y1="150" x2="1078" y2="150" stroke="#30363d" stroke-width="1" />
          <text x="30" y="190" font-size="13" fill="#c9d1d9">Fair speaker order and standup picker extension for Google Meet.</text>
        </g>
      </g>`
      }
    </g>
  </g>
  `;
}

// -------------------------------------------------------------
// SCREENSHOT 1: Real Standup Candidate Suggestions (Update Tab)
// -------------------------------------------------------------
const screenshot1Svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800" width="1280" height="800">
  ${getChromeMeetFrame({ isMeet: true })}

  <!-- POPCORN Real Extension Popup (Anchored top right) -->
  <g transform="translate(864, 94)" filter="url(#popupShadow)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
    <!-- Outer Container (Matches popup.css var(--ink) / var(--line)) -->
    <rect width="360" height="570" rx="10" fill="#0b0f14" stroke="#243042" stroke-width="1.2" />

    <!-- Header Section (.bar) -->
    <g transform="translate(0, 0)">
      <rect width="360" height="56" rx="10" fill="#121820" />
      <rect y="46" width="360" height="10" fill="#121820" />
      <line x1="0" y1="56" x2="360" y2="56" stroke="#243042" stroke-width="1" />

      <!-- Left Header: Eyebrow + Title -->
      <text x="16" y="20" font-size="10" font-weight="700" fill="#7d8b99" letter-spacing="0.08em">CURRENT MEETING</text>
      <text x="16" y="42" font-size="14" font-weight="700" fill="#f0f3f6">Daily Standup · Product Team</text>

      <!-- Right Header: Badge + Mascot -->
      <g transform="translate(230, 16)">
        <rect width="52" height="22" rx="11" fill="rgba(79, 185, 138, 0.16)" />
        <text x="26" y="15" font-family="ui-monospace, monospace" font-size="10" font-weight="700" fill="#4fb98a" text-anchor="middle" letter-spacing="0.08em">ACTIVE</text>
      </g>
      <!-- Mascot Header Logo -->
      <image href="data:image/png;base64,${icon48Base64}" x="296" y="10" width="36" height="36" />
    </g>

    <!-- Navigation Tabs Bar (.tabs) -->
    <g transform="translate(0, 56)">
      <rect width="360" height="38" fill="#121820" />
      <line x1="0" y1="38" x2="360" y2="38" stroke="#243042" stroke-width="1" />

      <!-- Tab 1: Update (ACTIVE) -->
      <text x="44" y="24" font-size="12" font-weight="600" fill="#f0f3f6" text-anchor="middle">Update</text>
      <line x1="16" y1="37" x2="72" y2="37" stroke="#38bdf8" stroke-width="2" />

      <!-- Tab 2: People -->
      <text x="120" y="24" font-size="12" font-weight="500" fill="#7d8b99" text-anchor="middle">People</text>

      <!-- Tab 3: Meetings -->
      <text x="204" y="24" font-size="12" font-weight="500" fill="#7d8b99" text-anchor="middle">Meetings</text>

      <!-- Tab 4: Settings (Gear SVG) -->
      <g transform="translate(315, 12)">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7d8b99" stroke-width="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0 2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </g>
    </g>

    <!-- Status Bar (.status) -->
    <g transform="translate(16, 106)">
      <rect width="328" height="26" rx="6" fill="rgba(56, 189, 248, 0.08)" stroke="rgba(56, 189, 248, 0.2)" stroke-width="1" />
      <text x="12" y="17" font-size="11" font-weight="500" fill="#38bdf8">7 present of 8 · 1 newly added</text>
    </g>

    <!-- Candidate List Items (.item) -->
    <!-- Candidate 1: Alice Martin -->
    <g transform="translate(16, 142)">
      <rect width="328" height="54" rx="8" fill="#17202e" stroke="#243042" stroke-width="1" />
      <circle cx="24" cy="27" r="12" fill="rgba(56, 189, 248, 0.14)" />
      <text x="24" y="31" font-size="11" font-weight="700" fill="#38bdf8" text-anchor="middle">1</text>
      
      <text x="46" y="24" font-size="13" font-weight="700" fill="#f0f3f6">Alice Martin</text>
      <text x="46" y="41" font-size="11" fill="#7d8b99">5 days overdue · Mon, 1 Sep</text>

      <rect x="256" y="12" width="60" height="30" rx="4" fill="#38bdf8" />
      <text x="286" y="31" font-size="12" font-weight="700" fill="#0b0f14" text-anchor="middle">Done</text>
    </g>

    <!-- Candidate 2: Florian Wilhelm -->
    <g transform="translate(16, 204)">
      <rect width="328" height="54" rx="8" fill="#17202e" stroke="#243042" stroke-width="1" />
      <circle cx="24" cy="27" r="12" fill="rgba(56, 189, 248, 0.14)" />
      <text x="24" y="31" font-size="11" font-weight="700" fill="#38bdf8" text-anchor="middle">2</text>
      
      <text x="46" y="24" font-size="13" font-weight="700" fill="#f0f3f6">Florian Wilhelm</text>
      <text x="46" y="41" font-size="11" fill="#7d8b99">3 days overdue · Wed, 3 Sep</text>

      <rect x="256" y="12" width="60" height="30" rx="4" fill="#38bdf8" />
      <text x="286" y="31" font-size="12" font-weight="700" fill="#0b0f14" text-anchor="middle">Done</text>
    </g>

    <!-- Candidate 3: Sarah Connor -->
    <g transform="translate(16, 266)">
      <rect width="328" height="54" rx="8" fill="#17202e" stroke="#243042" stroke-width="1" />
      <circle cx="24" cy="27" r="12" fill="rgba(56, 189, 248, 0.14)" />
      <text x="24" y="31" font-size="11" font-weight="700" fill="#38bdf8" text-anchor="middle">3</text>
      
      <text x="46" y="24" font-size="13" font-weight="700" fill="#f0f3f6">Sarah Connor</text>
      <text x="46" y="41" font-size="11" fill="#7d8b99">1 day overdue · Fri, 5 Sep</text>

      <rect x="256" y="12" width="60" height="30" rx="4" fill="#38bdf8" />
      <text x="286" y="31" font-size="12" font-weight="700" fill="#0b0f14" text-anchor="middle">Done</text>
    </g>

    <!-- Candidate 4: David Chen -->
    <g transform="translate(16, 328)">
      <rect width="328" height="54" rx="8" fill="#17202e" stroke="#243042" stroke-width="1" />
      <circle cx="24" cy="27" r="12" fill="rgba(56, 189, 248, 0.14)" />
      <text x="24" y="31" font-size="11" font-weight="700" fill="#38bdf8" text-anchor="middle">4</text>
      
      <text x="46" y="24" font-size="13" font-weight="700" fill="#f0f3f6">David Chen</text>
      <text x="46" y="41" font-size="11" fill="#7d8b99">Yesterday · Fri, 5 Sep</text>

      <rect x="256" y="12" width="60" height="30" rx="4" fill="#38bdf8" />
      <text x="286" y="31" font-size="12" font-weight="700" fill="#0b0f14" text-anchor="middle">Done</text>
    </g>

    <!-- Bottom Action Controls (.row) -->
    <g transform="translate(16, 396)">
      <!-- Next Candidates Button -->
      <rect width="280" height="36" rx="6" fill="#17202e" stroke="#243042" stroke-width="1" />
      <text x="140" y="23" font-size="12" font-weight="600" fill="#f0f3f6" text-anchor="middle">Next Candidates</text>

      <!-- Refresh Button -->
      <rect x="290" width="38" height="36" rx="6" fill="#17202e" stroke="#243042" stroke-width="1" />
      <text x="309" y="23" font-size="15" fill="#7d8b99" text-anchor="middle">🔄</text>
    </g>

    <!-- Start New Round Button -->
    <g transform="translate(16, 442)">
      <rect width="328" height="34" rx="6" fill="transparent" stroke="#243042" stroke-width="1" />
      <text x="164" y="22" font-size="12" font-weight="500" fill="#7d8b99" text-anchor="middle">Start New Round</text>
    </g>

    <!-- Include Absent Checkbox -->
    <g transform="translate(16, 492)">
      <rect x="0" y="0" width="14" height="14" rx="3" fill="#17202e" stroke="#243042" stroke-width="1" />
      <text x="24" y="12" font-size="11" fill="#7d8b99">Include absent participants</text>
    </g>
  </g>
</svg>`;
fs.writeFileSync(path.join(assetsDir, "screenshot1_standup_1280x800.svg"), screenshot1Svg);

// -------------------------------------------------------------
// SCREENSHOT 2: Real People / Roster Management (People Tab)
// -------------------------------------------------------------
const screenshot2Svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800" width="1280" height="800">
  ${getChromeMeetFrame({ isMeet: true })}

  <!-- POPCORN Real Extension Popup (People View) -->
  <g transform="translate(864, 94)" filter="url(#popupShadow)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
    <rect width="360" height="570" rx="10" fill="#0b0f14" stroke="#243042" stroke-width="1.2" />

    <!-- Header Section (.bar) -->
    <g transform="translate(0, 0)">
      <rect width="360" height="56" rx="10" fill="#121820" />
      <rect y="46" width="360" height="10" fill="#121820" />
      <line x1="0" y1="56" x2="360" y2="56" stroke="#243042" stroke-width="1" />

      <text x="16" y="20" font-size="10" font-weight="700" fill="#7d8b99" letter-spacing="0.08em">CURRENT MEETING</text>
      <text x="16" y="42" font-size="14" font-weight="700" fill="#f0f3f6">Daily Standup · Product Team</text>

      <g transform="translate(230, 16)">
        <rect width="52" height="22" rx="11" fill="rgba(79, 185, 138, 0.16)" />
        <text x="26" y="15" font-family="ui-monospace, monospace" font-size="10" font-weight="700" fill="#4fb98a" text-anchor="middle" letter-spacing="0.08em">ACTIVE</text>
      </g>
      <image href="data:image/png;base64,${icon48Base64}" x="296" y="10" width="36" height="36" />
    </g>

    <!-- Navigation Tabs Bar -->
    <g transform="translate(0, 56)">
      <rect width="360" height="38" fill="#121820" />
      <line x1="0" y1="38" x2="360" y2="38" stroke="#243042" stroke-width="1" />

      <text x="44" y="24" font-size="12" font-weight="500" fill="#7d8b99" text-anchor="middle">Update</text>

      <!-- Tab 2: People (ACTIVE) -->
      <text x="120" y="24" font-size="12" font-weight="600" fill="#f0f3f6" text-anchor="middle">People</text>
      <line x1="92" y1="37" x2="148" y2="37" stroke="#38bdf8" stroke-width="2" />

      <text x="204" y="24" font-size="12" font-weight="500" fill="#7d8b99" text-anchor="middle">Meetings</text>
      
      <g transform="translate(315, 12)">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7d8b99" stroke-width="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0 2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </g>
    </g>

    <!-- Add Person Input Bar -->
    <g transform="translate(16, 106)">
      <rect width="250" height="34" rx="6" fill="#17202e" stroke="#243042" stroke-width="1" />
      <text x="12" y="22" font-size="12" fill="#7d8b99">Add person...</text>

      <rect x="258" width="70" height="34" rx="6" fill="#17202e" stroke="#243042" stroke-width="1" />
      <text x="293" y="22" font-size="12" font-weight="600" fill="#f0f3f6" text-anchor="middle">+ Add</text>
    </g>

    <!-- Person Row List (.person-row) -->
    <!-- Person 1: Alice Martin -->
    <g transform="translate(16, 150)">
      <rect width="328" height="42" rx="6" fill="#17202e" stroke="#243042" stroke-width="1" />
      <circle cx="16" cy="21" r="4" fill="#4fb98a" />
      <text x="30" y="25" font-size="12" font-weight="700" fill="#f0f3f6">Alice Martin</text>
      
      <rect x="140" y="12" width="62" height="18" rx="4" fill="rgba(239, 68, 68, 0.12)" />
      <text x="171" y="25" font-size="10" font-weight="600" fill="#ef4444" text-anchor="middle">5d overdue</text>

      <!-- Action icons: Eye (ignore), Check (mark done), Trash -->
      <g transform="translate(240, 13)">
        <text x="10" y="15" font-size="12" fill="#7d8b99">👁️</text>
        <text x="36" y="15" font-size="12" fill="#7d8b99">📅</text>
        <text x="62" y="15" font-size="12" fill="#7d8b99">🗑️</text>
      </g>
    </g>

    <!-- Person 2: Florian Wilhelm -->
    <g transform="translate(16, 198)">
      <rect width="328" height="42" rx="6" fill="#17202e" stroke="#243042" stroke-width="1" />
      <circle cx="16" cy="21" r="4" fill="#4fb98a" />
      <text x="30" y="25" font-size="12" font-weight="700" fill="#f0f3f6">Florian Wilhelm</text>
      
      <rect x="140" y="12" width="62" height="18" rx="4" fill="rgba(245, 158, 11, 0.12)" />
      <text x="171" y="25" font-size="10" font-weight="600" fill="#f59e0b" text-anchor="middle">3d overdue</text>

      <g transform="translate(240, 13)">
        <text x="10" y="15" font-size="12" fill="#7d8b99">👁️</text>
        <text x="36" y="15" font-size="12" fill="#7d8b99">📅</text>
        <text x="62" y="15" font-size="12" fill="#7d8b99">🗑️</text>
      </g>
    </g>

    <!-- Person 3: Sarah Connor -->
    <g transform="translate(16, 246)">
      <rect width="328" height="42" rx="6" fill="#17202e" stroke="#243042" stroke-width="1" />
      <circle cx="16" cy="21" r="4" fill="#4fb98a" />
      <text x="30" y="25" font-size="12" font-weight="700" fill="#f0f3f6">Sarah Connor</text>
      
      <rect x="140" y="12" width="62" height="18" rx="4" fill="rgba(56, 189, 248, 0.12)" />
      <text x="171" y="25" font-size="10" font-weight="600" fill="#38bdf8" text-anchor="middle">1d overdue</text>

      <g transform="translate(240, 13)">
        <text x="10" y="15" font-size="12" fill="#7d8b99">👁️</text>
        <text x="36" y="15" font-size="12" fill="#7d8b99">📅</text>
        <text x="62" y="15" font-size="12" fill="#7d8b99">🗑️</text>
      </g>
    </g>

    <!-- Person 4: David Chen -->
    <g transform="translate(16, 294)">
      <rect width="328" height="42" rx="6" fill="#17202e" stroke="#243042" stroke-width="1" />
      <circle cx="16" cy="21" r="4" fill="#4fb98a" />
      <text x="30" y="25" font-size="12" font-weight="700" fill="#f0f3f6">David Chen</text>
      
      <rect x="140" y="12" width="62" height="18" rx="4" fill="rgba(79, 185, 138, 0.12)" />
      <text x="171" y="25" font-size="10" font-weight="600" fill="#4fb98a" text-anchor="middle">Today</text>

      <g transform="translate(240, 13)">
        <text x="10" y="15" font-size="12" fill="#7d8b99">👁️</text>
        <text x="36" y="15" font-size="12" fill="#7d8b99">📅</text>
        <text x="62" y="15" font-size="12" fill="#7d8b99">🗑️</text>
      </g>
    </g>

    <!-- Person 5: Elena Rostova (Absent) -->
    <g transform="translate(16, 342)">
      <rect width="328" height="42" rx="6" fill="#17202e" stroke="#243042" stroke-width="1" opacity="0.65" />
      <circle cx="16" cy="21" r="4" fill="#64748b" />
      <text x="30" y="25" font-size="12" font-weight="700" fill="#cbd5e1">Elena Rostova</text>
      
      <rect x="140" y="12" width="62" height="18" rx="4" fill="rgba(245, 158, 11, 0.12)" />
      <text x="171" y="25" font-size="10" font-weight="600" fill="#f59e0b" text-anchor="middle">3d overdue</text>

      <g transform="translate(240, 13)">
        <text x="10" y="15" font-size="12" fill="#7d8b99">👁️</text>
        <text x="36" y="15" font-size="12" fill="#7d8b99">📅</text>
        <text x="62" y="15" font-size="12" fill="#7d8b99">🗑️</text>
      </g>
    </g>

    <!-- Person 6: Marcus Brody (Absent & Never) -->
    <g transform="translate(16, 390)">
      <rect width="328" height="42" rx="6" fill="#17202e" stroke="#243042" stroke-width="1" opacity="0.65" />
      <circle cx="16" cy="21" r="4" fill="#64748b" />
      <text x="30" y="25" font-size="12" font-weight="700" fill="#cbd5e1">Marcus Brody</text>
      
      <rect x="140" y="12" width="62" height="18" rx="4" fill="rgba(100, 116, 139, 0.15)" />
      <text x="171" y="25" font-size="10" font-weight="600" fill="#94a3b8" text-anchor="middle">Never</text>

      <g transform="translate(240, 13)">
        <text x="10" y="15" font-size="12" fill="#7d8b99">👁️</text>
        <text x="36" y="15" font-size="12" fill="#7d8b99">📅</text>
        <text x="62" y="15" font-size="12" fill="#7d8b99">🗑️</text>
      </g>
    </g>

    <!-- Bottom Roster Bar -->
    <g transform="translate(16, 450)">
      <line x1="0" y1="0" x2="328" y2="0" stroke="#243042" stroke-width="1" />
      <text x="0" y="24" font-size="11" fill="#7d8b99">8 participants · 6 present</text>

      <rect x="238" y="8" width="90" height="26" rx="4" fill="transparent" stroke="#243042" stroke-width="1" />
      <text x="283" y="25" font-size="11" fill="#7d8b99" text-anchor="middle">Delete Mode</text>
    </g>
  </g>
</svg>`;
fs.writeFileSync(path.join(assetsDir, "screenshot2_people_1280x800.svg"), screenshot2Svg);

// -------------------------------------------------------------
// SCREENSHOT 3: Tracked Meetings List (Meetings Tab outside Meet)
// -------------------------------------------------------------
const screenshot3Svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800" width="1280" height="800">
  ${getChromeMeetFrame({ isMeet: false })}

  <!-- POPCORN Real Extension Popup (Meetings View) -->
  <g transform="translate(864, 94)" filter="url(#popupShadow)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
    <rect width="360" height="570" rx="10" fill="#0b0f14" stroke="#243042" stroke-width="1.2" />

    <!-- Header Section (.bar) -->
    <g transform="translate(0, 0)">
      <rect width="360" height="56" rx="10" fill="#121820" />
      <rect y="46" width="360" height="10" fill="#121820" />
      <line x1="0" y1="56" x2="360" y2="56" stroke="#243042" stroke-width="1" />

      <text x="16" y="20" font-size="10" font-weight="700" fill="#7d8b99" letter-spacing="0.08em">NO MEET TAB</text>
      <text x="16" y="42" font-size="14" font-weight="700" fill="#f0f3f6">No Meeting</text>

      <image href="data:image/png;base64,${icon48Base64}" x="296" y="10" width="36" height="36" />
    </g>

    <!-- Navigation Tabs Bar -->
    <g transform="translate(0, 56)">
      <rect width="360" height="38" fill="#121820" />
      <line x1="0" y1="38" x2="360" y2="38" stroke="#243042" stroke-width="1" />

      <text x="44" y="24" font-size="12" font-weight="500" fill="#475569" text-anchor="middle">Update</text>
      <text x="120" y="24" font-size="12" font-weight="500" fill="#475569" text-anchor="middle">People</text>

      <!-- Tab 3: Meetings (ACTIVE) -->
      <text x="204" y="24" font-size="12" font-weight="600" fill="#f0f3f6" text-anchor="middle">Meetings</text>
      <line x1="172" y1="37" x2="236" y2="37" stroke="#38bdf8" stroke-width="2" />

      <g transform="translate(315, 12)">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7d8b99" stroke-width="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0 2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </g>
    </g>

    <!-- Subheader: Tracked Meetings + New Button -->
    <g transform="translate(16, 110)">
      <text x="0" y="16" font-size="11" font-weight="700" fill="#7d8b99" letter-spacing="0.08em">TRACKED MEETINGS</text>
      
      <rect x="290" y="0" width="38" height="24" rx="4" fill="#17202e" stroke="#243042" stroke-width="1" />
      <text x="309" y="16" font-size="14" font-weight="700" fill="#38bdf8" text-anchor="middle">+</text>
    </g>

    <!-- Meeting Item 1: Daily Standup · Product -->
    <g transform="translate(16, 146)">
      <rect width="328" height="46" rx="6" fill="#17202e" stroke="#243042" stroke-width="1" />
      <text x="14" y="28" font-size="12" font-weight="700" fill="#f0f3f6">Daily Standup · Product</text>
      
      <rect x="180" y="13" width="38" height="20" rx="4" fill="#243042" />
      <text x="199" y="27" font-size="10" fill="#9ca3af" text-anchor="middle">👥 8</text>

      <g transform="translate(230, 15)">
        <text x="8" y="14" font-size="12" fill="#38bdf8" title="Open">↗</text>
        <text x="34" y="14" font-size="12" fill="#7d8b99" title="Markdown">✏️</text>
        <text x="58" y="14" font-size="12" fill="#7d8b99" title="Download">📥</text>
        <text x="82" y="14" font-size="12" fill="#7d8b99" title="Delete">🗑️</text>
      </g>
    </g>

    <!-- Meeting Item 2: Team Weekly DS & NLP -->
    <g transform="translate(16, 202)">
      <rect width="328" height="46" rx="6" fill="#17202e" stroke="#243042" stroke-width="1" />
      <text x="14" y="28" font-size="12" font-weight="700" fill="#f0f3f6">Team Weekly DS &amp; NLP</text>
      
      <rect x="180" y="13" width="38" height="20" rx="4" fill="#243042" />
      <text x="199" y="27" font-size="10" fill="#9ca3af" text-anchor="middle">👥 37</text>

      <g transform="translate(230, 15)">
        <text x="8" y="14" font-size="12" fill="#38bdf8">↗</text>
        <text x="34" y="14" font-size="12" fill="#7d8b99">✏️</text>
        <text x="58" y="14" font-size="12" fill="#7d8b99">📥</text>
        <text x="82" y="14" font-size="12" fill="#7d8b99">🗑️</text>
      </g>
    </g>

    <!-- Meeting Item 3: Sprint Retrospective & Sync -->
    <g transform="translate(16, 258)">
      <rect width="328" height="46" rx="6" fill="#17202e" stroke="#243042" stroke-width="1" />
      <text x="14" y="28" font-size="12" font-weight="700" fill="#f0f3f6">Sprint Retrospective &amp; Sync</text>
      
      <rect x="180" y="13" width="38" height="20" rx="4" fill="#243042" />
      <text x="199" y="27" font-size="10" fill="#9ca3af" text-anchor="middle">👥 12</text>

      <g transform="translate(230, 15)">
        <text x="8" y="14" font-size="12" fill="#38bdf8">↗</text>
        <text x="34" y="14" font-size="12" fill="#7d8b99">✏️</text>
        <text x="58" y="14" font-size="12" fill="#7d8b99">📥</text>
        <text x="82" y="14" font-size="12" fill="#7d8b99">🗑️</text>
      </g>
    </g>

    <!-- Meeting Item 4: Architecture Roundtable -->
    <g transform="translate(16, 314)">
      <rect width="328" height="46" rx="6" fill="#17202e" stroke="#243042" stroke-width="1" />
      <text x="14" y="28" font-size="12" font-weight="700" fill="#f0f3f6">Architecture Roundtable</text>
      
      <rect x="180" y="13" width="38" height="20" rx="4" fill="#243042" />
      <text x="199" y="27" font-size="10" fill="#9ca3af" text-anchor="middle">👥 6</text>

      <g transform="translate(230, 15)">
        <text x="8" y="14" font-size="12" fill="#38bdf8">↗</text>
        <text x="34" y="14" font-size="12" fill="#7d8b99">✏️</text>
        <text x="58" y="14" font-size="12" fill="#7d8b99">📥</text>
        <text x="82" y="14" font-size="12" fill="#7d8b99">🗑️</text>
      </g>
    </g>

    <!-- Bottom Actions: Export / Import JSON -->
    <g transform="translate(16, 380)">
      <rect width="328" height="34" rx="6" fill="#17202e" stroke="#243042" stroke-width="1" />
      <text x="164" y="22" font-size="12" font-weight="500" fill="#7d8b99" text-anchor="middle">Export all meetings (.json)</text>
    </g>
  </g>
</svg>`;
fs.writeFileSync(path.join(assetsDir, "screenshot3_meetings_1280x800.svg"), screenshot3Svg);

// -------------------------------------------------------------
// SCREENSHOT 4: Markdown Minutes & Notes Modal (#markdownModal)
// -------------------------------------------------------------
const screenshot4Svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800" width="1280" height="800">
  ${getChromeMeetFrame({ isMeet: true })}

  <!-- Backdrop Modal Overlay -->
  <rect x="16" y="96" width="1248" height="688" fill="rgba(0, 0, 0, 0.72)" />

  <!-- Centered Modal Container -->
  <g transform="translate(360, 120)" filter="url(#popupShadow)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
    <rect width="560" height="580" rx="12" fill="#0f141c" stroke="#243042" stroke-width="1.5" />

    <!-- Modal Header -->
    <g transform="translate(24, 24)">
      <text x="0" y="18" font-size="16" font-weight="700" fill="#f0f3f6">Daily Standup · Product Team — Markdown</text>
      <text x="500" y="18" font-size="16" fill="#7d8b99" cursor="pointer">✕</text>

      <text x="0" y="44" font-size="12" fill="#7d8b99">Edit attendance table, paste meeting minutes, or import from Markdown file.</text>
    </g>

    <!-- Textarea Code Block Container -->
    <g transform="translate(24, 80)">
      <rect width="512" height="390" rx="8" fill="#0b0f14" stroke="#243042" stroke-width="1" />
      
      <!-- Monospaced Markdown Text -->
      <g transform="translate(18, 26)" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="12">
        <text x="0" y="0" fill="#38bdf8" font-weight="700"># Daily Standup · Product Team</text>
        
        <text x="0" y="30" fill="#7d8b99">| Person | Last Update | Status |</text>
        <text x="0" y="48" fill="#7d8b99">| :--- | :--- | :--- |</text>
        
        <text x="0" y="74" fill="#f0f3f6">| Alice Martin | 2026-09-05 | Done |</text>
        <text x="0" y="98" fill="#f0f3f6">| Florian Wilhelm | 2026-09-05 | Done |</text>
        <text x="0" y="122" fill="#f0f3f6">| Sarah Connor | 2026-09-04 | Overdue (1d) |</text>
        <text x="0" y="146" fill="#f0f3f6">| David Chen | 2026-09-03 | Overdue (2d) |</text>
        <text x="0" y="170" fill="#f0f3f6">| Elena Rostova | 2026-09-02 | Overdue (3d) |</text>
        <text x="0" y="194" fill="#f0f3f6">| Marcus Brody | | Never |</text>
        <text x="0" y="218" fill="#9ca3af">| Thomas Clark | | Ignored |</text>
        <text x="0" y="242" fill="#9ca3af">| Jenny Wu | | Ignored |</text>

        <text x="0" y="280" fill="#38bdf8">## Action Items</text>
        <text x="0" y="304" fill="#7d8b99">- [x] Complete POPCORN v0.25 release candidate</text>
        <text x="0" y="326" fill="#7d8b99">- [ ] Publish to Chrome Web Store</text>
      </g>
    </g>

    <!-- Modal Footer Controls -->
    <g transform="translate(24, 490)">
      <line x1="0" y1="0" x2="512" y2="0" stroke="#243042" stroke-width="1" />

      <!-- Left Action: Copy Markdown -->
      <g transform="translate(0, 18)">
        <rect width="130" height="34" rx="6" fill="#17202e" stroke="#243042" stroke-width="1" />
        <text x="65" y="22" font-size="12" font-weight="600" fill="#f0f3f6" text-anchor="middle">📋 Copy Table</text>

        <rect x="140" width="110" height="34" rx="6" fill="#17202e" stroke="#243042" stroke-width="1" />
        <text x="195" y="22" font-size="12" font-weight="500" fill="#7d8b99" text-anchor="middle">📥 Download</text>
      </g>

      <!-- Right Actions: Cancel / Save -->
      <g transform="translate(320, 18)">
        <rect width="76" height="34" rx="6" fill="transparent" stroke="#243042" stroke-width="1" />
        <text x="38" y="22" font-size="12" font-weight="500" fill="#7d8b99" text-anchor="middle">Cancel</text>

        <rect x="86" width="106" height="34" rx="6" fill="#38bdf8" />
        <text x="139" y="22" font-size="12" font-weight="700" fill="#0b0f14" text-anchor="middle">Save Changes</text>
      </g>
    </g>
  </g>
</svg>`;
fs.writeFileSync(path.join(assetsDir, "screenshot4_markdown_1280x800.svg"), screenshot4Svg);

// -------------------------------------------------------------
// Gallery Preview HTML (Open in browser to see all screenshots)
// -------------------------------------------------------------
const previewHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>POPCORN – Chrome Web Store Assets Preview</title>
  <style>
    body {
      background: #0b0f14;
      color: #f0f3f6;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 40px;
    }
    h1 { font-size: 28px; margin-bottom: 8px; }
    p.lead { color: #7d8b99; margin-bottom: 40px; font-size: 15px; }
    .grid {
      display: flex;
      flex-direction: column;
      gap: 50px;
      max-width: 1280px;
      margin: 0 auto;
    }
    .card {
      background: #121820;
      border: 1px solid #243042;
      border-radius: 12px;
      padding: 24px;
    }
    .card h2 {
      font-size: 18px;
      margin-top: 0;
      margin-bottom: 6px;
      color: #38bdf8;
    }
    .card p {
      color: #7d8b99;
      font-size: 13px;
      margin-bottom: 16px;
    }
    .asset-img {
      width: 100%;
      height: auto;
      border-radius: 8px;
      box-shadow: 0 12px 30px rgba(0,0,0,0.5);
    }
  </style>
</head>
<body>
  <div style="max-width: 1280px; margin: 0 auto;">
    <h1>🍿 POPCORN – Store Assets &amp; Screenshots</h1>
    <p class="lead">Realistic high-definition screenshots and promotional banners for the Google Chrome Web Store.</p>
  </div>

  <div class="grid">
    <div class="card">
      <h2>Screenshot 1: Candidate Suggestions &amp; Standup Rotation (1280x800)</h2>
      <p>Shows POPCORN running live inside a Google Meet call with attendee presence and candidate rotation order.</p>
      <img class="asset-img" src="screenshot1_standup_1280x800.svg" alt="Standup view" />
    </div>

    <div class="card">
      <h2>Screenshot 2: Roster &amp; People Management (1280x800)</h2>
      <p>Shows attendee attendance, overdue status badges, ignore toggles, and manual participant management.</p>
      <img class="asset-img" src="screenshot2_people_1280x800.svg" alt="People view" />
    </div>

    <div class="card">
      <h2>Screenshot 3: Tracked Meetings List (1280x800)</h2>
      <p>Shows multi-meeting tracking and list management outside of active Google Meet calls.</p>
      <img class="asset-img" src="screenshot3_meetings_1280x800.svg" alt="Meetings view" />
    </div>

    <div class="card">
      <h2>Screenshot 4: Markdown Minutes Editor &amp; Export Modal (1280x800)</h2>
      <p>Shows in-app Markdown minutes editing, clipboard copy, and export features for Notion/Docs.</p>
      <img class="asset-img" src="screenshot4_markdown_1280x800.svg" alt="Markdown view" />
    </div>

    <div class="card">
      <h2>Promotional Marquee Tile (1400x560)</h2>
      <p>Store feature banner for promotion slots.</p>
      <img class="asset-img" src="promo_marquee_1400x560.svg" alt="Marquee banner" />
    </div>

    <div class="card">
      <h2>Small Promo Tile (440x280)</h2>
      <p>Search results and catalog preview card.</p>
      <img style="max-width: 440px;" class="asset-img" src="promo_small_440x280.svg" alt="Small promo tile" />
    </div>
  </div>
</body>
</html>`;
fs.writeFileSync(path.join(assetsDir, "preview.html"), previewHtml);

console.log("✅ Successfully generated all realistic Chrome Web Store screenshots & assets!");
