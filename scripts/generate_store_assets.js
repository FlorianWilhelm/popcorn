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

// Genuine Google Meet & Google Material Vector Icons (No emojis)
const MEET_ICONS = {
  meetFavicon: `
    <g transform="translate(0, 0)">
      <rect x="0" y="2" width="10" height="10" rx="1.5" fill="#00ac47" />
      <polygon points="10,5 15,2 15,12 10,9" fill="#00832d" />
      <polygon points="10,2 10,5 15,2" fill="#2684fc" />
      <polygon points="10,9 10,12 15,12" fill="#ea4335" />
      <rect x="8.5" y="2" width="1.5" height="3" fill="#ffba00" />
    </g>
  `,
  mic: `
    <g transform="translate(-10, -10)" fill="#ffffff">
      <rect x="7" y="3" width="6" height="9" rx="3" />
      <path d="M4 8.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" />
      <line x1="9.5" y1="14" x2="9.5" y2="17.5" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" />
      <line x1="6.5" y1="17.5" x2="12.5" y2="17.5" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" />
    </g>
  `,
  video: `
    <g transform="translate(-10, -10)" fill="#ffffff">
      <rect x="2" y="4" width="11" height="11" rx="2" />
      <polygon points="13,7.5 18,4 18,15 13,11.5" />
    </g>
  `,
  cc: `
    <g transform="translate(-11, -9)">
      <rect x="1" y="2" width="20" height="14" rx="2.5" fill="none" stroke="#ffffff" stroke-width="1.8" />
      <text x="11" y="12" font-family="'Google Sans', Roboto, sans-serif" font-size="8.5" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="0.5">CC</text>
    </g>
  `,
  reactions: `
    <g transform="translate(-10, -10)" fill="none" stroke="#ffffff" stroke-width="1.7">
      <circle cx="10" cy="10" r="8" />
      <circle cx="7" cy="8" r="0.9" fill="#ffffff" stroke="none" />
      <circle cx="13" cy="8" r="0.9" fill="#ffffff" stroke="none" />
      <path d="M6 11.5 C7.2 14.2 12.8 14.2 14 11.5" stroke-linecap="round" />
    </g>
  `,
  present: `
    <g transform="translate(-10, -10)">
      <rect x="2" y="2.5" width="16" height="11.5" rx="1.5" fill="none" stroke="#ffffff" stroke-width="1.7" />
      <path d="M10 5.5 L6.5 9 H8.5 V12 H11.5 V9 H13.5 Z" fill="#ffffff" />
      <line x1="6" y1="16.5" x2="14" y2="16.5" stroke="#ffffff" stroke-width="1.7" stroke-linecap="round" />
    </g>
  `,
  hand: `
    <g transform="translate(-10, -10)" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round">
      <path d="M10 1.5a1.2 1.2 0 0 1 1.2 1.2v5.5h.4a1.2 1.2 0 0 1 1.2-1.2 1.2 1.2 0 0 1 1.2 1.2V9.5h.4a1.2 1.2 0 0 1 1.2 1.2v2.8c0 3-2.4 5.5-5.4 5.5h-.4C6.9 19 4.5 16.6 4.5 13.7l-.2-4.7a1.2 1.2 0 0 1 1.2-1.2c.7 0 1.2.5 1.2 1.2V9.5h.4V2.7a1.2 1.2 0 0 1 1.2-1.2c.7 0 1.2.5 1.2 1.2V8.5h.4V2.7c0-.7.5-1.2 1.2-1.2z"/>
    </g>
  `,
  more: `
    <g transform="translate(-10, -10)" fill="#ffffff">
      <circle cx="10" cy="5" r="1.6" />
      <circle cx="10" cy="10" r="1.6" />
      <circle cx="10" cy="15" r="1.6" />
    </g>
  `,
  callEnd: `
    <g transform="translate(17, 10)" fill="#ffffff">
      <path d="M11 2.5c-3.8 0-7.2 1.5-9.7 4-.35.35-.35.95 0 1.3l2.2 2.2c.35.35.95.35 1.3 0 1.3-1.3 3.1-2.1 5.1-2.1 2 0 3.8.8 5.1 2.1.35.35.95.35 1.3 0l2.2-2.2c.35-.35.35-.95 0-1.3C18.2 4 14.8 2.5 11 2.5z" />
    </g>
  `,
  info: `
    <g transform="translate(-10, -10)" fill="none" stroke="#e8eaed" stroke-width="1.7">
      <circle cx="10" cy="10" r="8" />
      <circle cx="10" cy="6.5" r="0.9" fill="#e8eaed" stroke="none" />
      <line x1="10" y1="9.5" x2="10" y2="14" stroke-linecap="round" />
    </g>
  `,
  people: `
    <g transform="translate(-10, -10)" fill="#e8eaed">
      <path d="M13.5 9c1.4 0 2.5-1.1 2.5-2.5S14.9 4 13.5 4 11 5.1 11 6.5s1.1 2.5 2.5 2.5zm-7 0C7.9 9 9 7.9 9 6.5S7.9 4 6.5 4 4 5.1 4 6.5 5.1 9 6.5 9zm0 1.7C4.5 10.7.5 11.7.5 13.7v2.1h12v-2.1c0-2-4-3-6-3zm7 0c-.2 0-.5 0-.8.1 1 .7 1.7 1.7 1.7 2.9v2.1h5.1v-2.1c0-2-4-3-6-3z" transform="scale(0.95) translate(0.5, 0.5)"/>
    </g>
  `,
  chat: `
    <g transform="translate(-10, -10)" fill="#e8eaed">
      <path d="M17 2H3c-1.1 0-2 .9-2 2v15l3.5-3.5H17c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 11.5H4l-1.5 1.5V4h14.5v9.5z"/>
      <line x1="5.5" y1="6" x2="14.5" y2="6" stroke="#e8eaed" stroke-width="1.3" stroke-linecap="round"/>
      <line x1="5.5" y1="8.5" x2="12" y2="8.5" stroke="#e8eaed" stroke-width="1.3" stroke-linecap="round"/>
    </g>
  `,
  activities: `
    <g transform="translate(-10, -10)" fill="#e8eaed">
      <path d="M5.5 3 L9.5 10 H1.5 Z" />
      <circle cx="14.5" cy="6.5" r="3.2" />
      <rect x="5.5" y="12" width="6.5" height="6.5" rx="1" />
    </g>
  `,
  host: `
    <g transform="translate(-10, -10)" fill="none" stroke="#e8eaed" stroke-width="1.6">
      <path d="M10 2 L3.5 5 V9.5 c0 4.5 2.8 8.7 6.5 9.7 3.7-1 6.5-5.2 6.5-9.7 V5 L10 2 z" />
      <rect x="8.5" y="9.5" width="3" height="3" rx="0.5" fill="#e8eaed" stroke="none" />
      <path d="M9 9.5 V8.3 a1 1 0 0 1 2 0 V9.5" stroke-width="1" />
    </g>
  `,
  micTile: `
    <g transform="translate(-8, -8)" fill="#ffffff">
      <rect x="5.5" y="2" width="5" height="7.5" rx="2.5" />
      <path d="M3 6.5c0 2.5 2 4.5 4.5 4.5s4.5-2 4.5-4.5" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" />
      <line x1="7.5" y1="11" x2="7.5" y2="14" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" />
      <line x1="5" y1="14" x2="10" y2="14" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" />
    </g>
  `,
  micOffTile: `
    <g transform="translate(-8, -8)">
      <rect x="5.5" y="2" width="5" height="7.5" rx="2.5" fill="#ffffff" />
      <path d="M3 6.5c0 2.5 2 4.5 4.5 4.5s4.5-2 4.5-4.5" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" />
      <line x1="7.5" y1="11" x2="7.5" y2="14" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" />
      <line x1="5" y1="14" x2="10" y2="14" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" />
      <line x1="2" y1="2" x2="14" y2="14" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" />
    </g>
  `,
  audioEqualizer: `
    <g transform="translate(0, 0)">
      <rect x="0" y="3" width="2.5" height="10" rx="1" fill="#81c995" />
      <rect x="4.5" y="0" width="2.5" height="16" rx="1" fill="#81c995" />
      <rect x="9" y="4" width="2.5" height="8" rx="1" fill="#81c995" />
    </g>
  `
};

// Vector icons for POPCORN extension popup (identical to popup.js / popup.html)
const POPCORN_ICONS = {
  shuffle: `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 3h5v5"></path><path d="M4 20L21 3"></path><path d="M21 16v5h-5"></path><path d="M15 15l6 6"></path><path d="M4 4l5 5"></path>
    </svg>
  `,
  refresh: `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7d8b99" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
      <path d="M21 3v5h-5"/>
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
      <path d="M3 21v-5h5"/>
    </svg>
  `,
  eye: `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7d8b99" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  `,
  eyeIgnored: `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
  `,
  trash: `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7d8b99" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  `,
  edit: `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7d8b99" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
    </svg>
  `,
  download: `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7d8b99" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  `,
  openExternal: `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>
  `,
  userIcon: `
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
    </svg>
  `,
  clipboard: `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f0f3f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
    </svg>
  `
};

// Reusable SVG definitions for Chrome Window & Genuine Google Meet Frame
function getChromeMeetFrame(options = {}) {
  const isMeet = options.isMeet !== false;
  const url = isMeet ? "https://meet.google.com/wqe-ptro-xyz" : "https://github.com/fwilhelm/meet-update-rotator";
  const title = isMeet ? "Daily Standup - Google Meet" : "GitHub · fwilhelm/meet-update-rotator";

  return `
  <defs>
    <filter id="popupShadow" x="-15%" y="-10%" width="130%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="20" flood-color="#000000" flood-opacity="0.8" />
    </filter>
  </defs>

  <!-- Background Base Canvas -->
  <rect width="1280" height="800" fill="#0b0e14" />

  <!-- macOS Chrome Window Outer Frame -->
  <g transform="translate(16, 16)">
    <!-- Window Border & Outer Background -->
    <rect width="1248" height="768" rx="12" fill="#202124" stroke="#32363e" stroke-width="1" />

    <!-- Chrome Title Bar & Tabs Header -->
    <rect width="1248" height="42" rx="12" fill="#1f2228" />
    <rect y="30" width="1248" height="12" fill="#1f2228" />

    <!-- macOS Traffic Light Window Controls -->
    <circle cx="22" cy="21" r="6" fill="#ff5f56" stroke="#e0443e" stroke-width="0.5" />
    <circle cx="42" cy="21" r="6" fill="#ffbd2e" stroke="#dea123" stroke-width="0.5" />
    <circle cx="62" cy="21" r="6" fill="#27c93f" stroke="#1aab29" stroke-width="0.5" />

    <!-- Chrome Active Tab -->
    <g transform="translate(88, 8)">
      <path d="M 0,34 L 14,4 Q 18,0 26,0 L 236,0 Q 244,0 248,4 L 262,34 Z" fill="#202124" />
      
      <!-- Meet 4-Color Icon or Web Icon -->
      <g transform="translate(24, 11)">
        ${
          isMeet
            ? MEET_ICONS.meetFavicon
            : `<circle cx="7" cy="7" r="7" fill="#ffffff" /><path d="M 7,2 A 5,5 0 0,0 2,7 C 2,10 5,12 7,12 C 9,12 12,10 12,7 Z" fill="#24292e" />`
        }
      </g>
      <text x="46" y="21" font-family="'Google Sans', Roboto, sans-serif" font-size="12" font-weight="500" fill="#e8eaed">${title}</text>
      <text x="242" y="20" font-family="sans-serif" font-size="11" fill="#9ca3af">×</text>
    </g>

    <!-- Chrome + New Tab Button -->
    <text x="365" y="25" font-family="sans-serif" font-size="18" fill="#6b7280">+</text>

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
        <text x="32" y="19" font-family="'Google Sans', Roboto, sans-serif" font-size="12" fill="#e2e8f0">${url}</text>
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
        <circle cx="85" cy="14" r="12" fill="#1a73e8" />
        <text x="85" y="18" font-family="'Google Sans', Roboto, sans-serif" font-size="11" font-weight="700" fill="#ffffff" text-anchor="middle">F</text>
      </g>
    </g>

    <!-- Main Viewport Area (Genuine Google Meet or Web Content) -->
    <g transform="translate(0, 80)">
      <rect width="1248" height="688" fill="#141414" />

      ${
        isMeet
          ? `
      <!-- Google Meet Top Header: Meeting Time, Title, and Info Icon (Direct from Real Meet Screenshot) -->
      <g transform="translate(24, 18)">
        <text x="0" y="14" font-family="'Google Sans', Roboto, Arial, sans-serif" font-size="13.5" font-weight="500" fill="#ffffff">10:15 AM</text>
        <text x="64" y="14" font-family="'Google Sans', Roboto, Arial, sans-serif" font-size="13.5" fill="#5f6368">|</text>
        <text x="76" y="14" font-family="'Google Sans', Roboto, Arial, sans-serif" font-size="13.5" font-weight="500" fill="#ffffff">Daily Standup · Product Team</text>
        <!-- Info circle icon ⓘ -->
        <circle cx="280" cy="10" r="7.5" fill="none" stroke="#9ca3af" stroke-width="1.4" />
        <text x="280" y="13.5" font-family="'Google Sans', Roboto, sans-serif" font-size="10" font-weight="700" fill="#9ca3af" text-anchor="middle">i</text>
      </g>

      <!-- Google Meet Video Grid (2x2 Balanced Layout, rx=14 matching real Meet) -->
      <!-- Tile 1: Alice Martin (Top Left) -->
      <g transform="translate(20, 42)">
        <rect width="594" height="268" rx="14" fill="#3c4043" />
        <circle cx="297" cy="122" r="48" fill="#c2185b" />
        <text x="297" y="136" font-family="'Google Sans', Roboto, Arial, sans-serif" font-size="40" font-weight="500" fill="#ffffff" text-anchor="middle">A</text>
        <text x="16" y="248" font-family="'Google Sans', Roboto, Arial, sans-serif" font-size="13.5" font-weight="500" fill="#ffffff" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.8))">Alice Martin</text>
        <!-- Mic Top Right -->
        <g transform="translate(560, 14)">
          <path d="M 4 2 A 2.5 2.5 0 0 1 9 2 V 7 A 2.5 2.5 0 0 1 4 7 Z" fill="#ffffff" />
          <path d="M 2 5.5 A 4.5 4.5 0 0 0 11 5.5" fill="none" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" />
          <line x1="6.5" y1="10" x2="6.5" y2="13" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" />
          <line x1="4" y1="13" x2="9" y2="13" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" />
        </g>
      </g>

      <!-- Tile 2: David Chen (Top Right, Muted) -->
      <g transform="translate(634, 42)">
        <rect width="594" height="268" rx="14" fill="#3c4043" />
        <!-- Avatar placed left so it remains visible next to popup -->
        <circle cx="115" cy="122" r="48" fill="#137333" />
        <text x="115" y="136" font-family="'Google Sans', Roboto, Arial, sans-serif" font-size="40" font-weight="500" fill="#ffffff" text-anchor="middle">D</text>
        <text x="16" y="248" font-family="'Google Sans', Roboto, Arial, sans-serif" font-size="13.5" font-weight="500" fill="#ffffff" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.8))">David Chen</text>
        <!-- Muted Mic Top Left (visible next to popup) -->
        <g transform="translate(200, 14)">
          <path d="M 4 2 A 2.5 2.5 0 0 1 9 2 V 7 A 2.5 2.5 0 0 1 4 7 Z" fill="#ffffff" />
          <path d="M 2 5.5 A 4.5 4.5 0 0 0 11 5.5" fill="none" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" />
          <line x1="6.5" y1="10" x2="6.5" y2="13" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" />
          <line x1="4" y1="13" x2="9" y2="13" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" />
          <line x1="1" y1="1" x2="12" y2="14" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" />
        </g>
      </g>

      <!-- Tile 3: Sarah Connor (Bottom Left, Active Speaker) -->
      <g transform="translate(20, 322)">
        <!-- Google Active Speaker Blue 300 Border -->
        <rect width="594" height="268" rx="14" fill="#3c4043" stroke="#8ab4f8" stroke-width="3" />
        <circle cx="297" cy="122" r="48" fill="#7b1fa2" />
        <text x="297" y="136" font-family="'Google Sans', Roboto, Arial, sans-serif" font-size="40" font-weight="500" fill="#ffffff" text-anchor="middle">S</text>
        
        <text x="16" y="248" font-family="'Google Sans', Roboto, Arial, sans-serif" font-size="13.5" font-weight="500" fill="#ffffff" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.8))">Sarah Connor</text>
        <g transform="translate(112, 237)">
          <rect x="0" y="3" width="2.5" height="9" rx="1" fill="#81c995" />
          <rect x="4.5" y="0" width="2.5" height="14" rx="1" fill="#81c995" />
          <rect x="9" y="4" width="2.5" height="7" rx="1" fill="#81c995" />
        </g>

        <!-- Active Speaker Blue 3-Dots Menu Top Right -->
        <circle cx="570" cy="22" r="12" fill="#1a73e8" />
        <circle cx="565" cy="22" r="1.3" fill="#ffffff" />
        <circle cx="570" cy="22" r="1.3" fill="#ffffff" />
        <circle cx="575" cy="22" r="1.3" fill="#ffffff" />
      </g>

      <!-- Tile 4: You / Florian Wilhelm (Bottom Right) -->
      <g transform="translate(634, 322)">
        <rect width="594" height="268" rx="14" fill="#3c4043" />
        <!-- Avatar placed left so it remains visible next to popup -->
        <circle cx="115" cy="122" r="48" fill="#1a73e8" />
        <text x="115" y="136" font-family="'Google Sans', Roboto, Arial, sans-serif" font-size="40" font-weight="500" fill="#ffffff" text-anchor="middle">F</text>
        <text x="16" y="248" font-family="'Google Sans', Roboto, Arial, sans-serif" font-size="13.5" font-weight="500" fill="#ffffff" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.8))">You</text>
        <g transform="translate(200, 14)">
          <path d="M 4 2 A 2.5 2.5 0 0 1 9 2 V 7 A 2.5 2.5 0 0 1 4 7 Z" fill="#ffffff" />
          <path d="M 2 5.5 A 4.5 4.5 0 0 0 11 5.5" fill="none" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" />
          <line x1="6.5" y1="10" x2="6.5" y2="13" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" />
          <line x1="4" y1="13" x2="9" y2="13" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" />
        </g>
      </g>

      <!-- Google Meet Authentic Floating Bottom Dock & Actions (100% Match to Real Meet Capture) -->
      <g transform="translate(0, 604)">
        <!-- Center Floating Rounded Pill Dock -->
        <g transform="translate(374, 12)">
          <!-- Outer Dock Pill (Matches User Uploaded Screenshot #1e2020) -->
          <rect width="500" height="52" rx="26" fill="#1e2020" />

          <!-- 1: Microphone Segmented Pill (x=6, w=82, h=40, rx=20) -->
          <g transform="translate(6, 6)">
            <!-- Left sub-pill (3 horizontal dots) -->
            <path d="M 20 0 H 36 V 40 H 20 A 20 20 0 0 1 0 20 A 20 20 0 0 1 20 0 Z" fill="#282a2c" />
            <circle cx="12" cy="20" r="1.5" fill="#8ab4f8" />
            <circle cx="18" cy="20" r="1.5" fill="#8ab4f8" />
            <circle cx="24" cy="20" r="1.5" fill="#8ab4f8" />

            <!-- Right sub-circle/pill (Mic Icon) -->
            <rect x="36" width="46" height="40" rx="20" fill="#333637" />
            <g transform="translate(59, 20)">
              <rect x="-3" y="-8" width="6" height="10" rx="3" fill="#ffffff" />
              <path d="M -5.5 -1 C -5.5 3, 5.5 3, 5.5 -1" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" />
              <line x1="0" y1="3" x2="0" y2="7" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" />
              <line x1="-3" y1="7" x2="3" y2="7" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" />
            </g>
          </g>

          <!-- 2: Camera Segmented Pill (x=94, w=82, h=40, rx=20) -->
          <g transform="translate(94, 6)">
            <!-- Left sub-pill (Caret ^) -->
            <path d="M 20 0 H 36 V 40 H 20 A 20 20 0 0 1 0 20 A 20 20 0 0 1 20 0 Z" fill="#282a2c" />
            <path d="M 14 22 L 18 18 L 22 22" fill="none" stroke="#8ab4f8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />

            <!-- Right sub-circle/pill (Outline Camera Icon) -->
            <rect x="36" width="46" height="40" rx="20" fill="#333637" />
            <g transform="translate(59, 20)">
              <rect x="-8.5" y="-6" width="11.5" height="12" rx="2" fill="none" stroke="#ffffff" stroke-width="1.6" />
              <path d="M 3 -3 L 8 -6 V 6 L 3 3 Z" fill="#ffffff" stroke="none" />
            </g>
          </g>

          <!-- 3: Present Screen (Laptop with Solid Up Arrow) (x=182, w=46, h=40, rx=20) -->
          <g transform="translate(182, 6)">
            <rect width="46" height="40" rx="20" fill="#333637" />
            <g transform="translate(23, 20)">
              <!-- Laptop Screen Outline -->
              <rect x="-8.5" y="-7.5" width="17" height="11" rx="1.8" fill="none" stroke="#ffffff" stroke-width="1.6" />
              <!-- Solid Up Arrow inside Screen -->
              <path d="M 0 -5 L -3 -1.5 H -1 V 1.5 H 1 V -1.5 H 3 Z" fill="#ffffff" />
              <!-- Laptop Keyboard Base Line -->
              <rect x="-10.5" y="5" width="21" height="1.8" rx="0.9" fill="#ffffff" />
            </g>
          </g>

          <!-- 4: Reactions / Smiley (x=234, w=46, h=40, rx=20) -->
          <g transform="translate(234, 6)">
            <rect width="46" height="40" rx="20" fill="#333637" />
            <g transform="translate(23, 20)">
              <circle cx="0" cy="0" r="8.5" fill="none" stroke="#ffffff" stroke-width="1.6" />
              <circle cx="-3" cy="-2" r="1.1" fill="#ffffff" />
              <circle cx="3" cy="-2" r="1.1" fill="#ffffff" />
              <path d="M -4 1 C -4 4.5, 4 4.5, 4 1 Z" fill="#ffffff" />
            </g>
          </g>

          <!-- 5: Closed Captions CC (x=286, w=46, h=40, rx=20) -->
          <g transform="translate(286, 6)">
            <rect width="46" height="40" rx="20" fill="#333637" />
            <g transform="translate(23, 20)">
              <rect x="-9" y="-6.5" width="18" height="13" rx="2" fill="none" stroke="#ffffff" stroke-width="1.6" />
              <path d="M -1.5 -3.5 H -4.5 C -5.8 -3.5, -5.8 3.5, -4.5 3.5 H -1.5" fill="none" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" />
              <path d="M 5.5 -3.5 H 2.5 C 1.2 -3.5, 1.2 3.5, 2.5 3.5 H 5.5" fill="none" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" />
            </g>
          </g>

          <!-- 6: Raise Hand (Outline Hand) (x=338, w=46, h=40, rx=20) -->
          <g transform="translate(338, 6)">
            <rect width="46" height="40" rx="20" fill="#333637" />
            <g transform="translate(23, 20)">
              <path d="M -5.5 0 L -5.5 2.5 C -5.5 6, -2 8, 1.5 8 C 5 8 6.5 5.5 6.5 2 V -3.5 C 6.5 -4.2, 5.9 -4.8, 5.2 -4.8 C 4.5 -4.8, 3.9 -4.2, 3.9 -3.5 V -1.5 H 3.5 V -6 C 3.5 -6.7, 2.9 -7.3, 2.2 -7.3 C 1.5 -7.3, 0.9 -6.7, 0.9 -6 V -1.5 H 0.5 V -7 C 0.5 -7.7, -0.1 -8.3, -0.8 -8.3 C -1.5 -8.3, -2.1 -7.7, -2.1 -7 V -1.5 H -2.5 V -4.5 C -2.5 -5.2, -3.1 -5.8, -3.8 -5.8 C -4.5 -5.8, -5.1 -5.2, -5.1 -4.5 V 0 Z" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </g>
          </g>

          <!-- 7: More Options (3 Vertical Dots) (x=390, w=32, h=40, rx=16) -->
          <g transform="translate(390, 6)">
            <rect width="32" height="40" rx="16" fill="#333637" />
            <circle cx="16" cy="13" r="1.8" fill="#ffffff" />
            <circle cx="16" cy="20" r="1.8" fill="#ffffff" />
            <circle cx="16" cy="27" r="1.8" fill="#ffffff" />
          </g>

          <!-- 8: End Call Red Pill (x=428, w=66, h=40, rx=20) -->
          <g transform="translate(428, 6)">
            <rect width="66" height="40" rx="20" fill="#db372c" />
            <!-- White Handset curved downwards -->
            <g transform="translate(33, 20)">
              <path d="M -11 3.5 C -12 2, -11.5 0, -9.5 -1.2 C -5 -4.8, 5 -4.8, 9.5 -1.2 C 11.5 0, 12 2, 11 3.5 L 9 5.5 C 8.2 6.3, 7 6.3, 6.2 5.5 L 4 3.5 C 3.2 2.7, 2 3, 1 3.5 C -1 3.5, -2.2 2.7, -3 3.5 L -5.2 5.5 C -6 6.3, -7.2 6.3, -8 5.5 Z" fill="#ffffff" />
            </g>
          </g>
        </g>

        <!-- Right Side Controls (Matching user screenshot: People, Chat, Activities, Host Controls) -->
        <g transform="translate(1040, 18)">
          <!-- People + Badge -->
          <g transform="translate(0, 8)">
            <path d="M 12.5 12.5 A 3 3 0 1 0 12.5 6.5 A 3 3 0 0 0 12.5 12.5 Z M 6.5 12.5 A 2.5 2.5 0 1 0 6.5 7.5 A 2.5 2.5 0 0 0 6.5 12.5 Z M 6.5 14.5 C 4.5 14.5 1 15.5 1 17.5 V 19 H 12 V 17.5 C 12 15.5 8.5 14.5 6.5 14.5 Z M 12.5 14.5 C 12.1 14.5 11.7 14.5 11.2 14.7 C 12.2 15.4 13 16.3 13 17.5 V 19 H 17 V 17.5 C 17 15.5 14.5 14.5 12.5 14.5 Z" fill="#e8eaed" />
            <circle cx="18.5" cy="4.5" r="6.5" fill="#5f6368" />
            <text x="18.5" y="7.5" font-family="'Google Sans', Roboto, sans-serif" font-size="9" font-weight="700" fill="#ffffff" text-anchor="middle">8</text>
          </g>

          <!-- Chat -->
          <g transform="translate(42, 8)">
            <path d="M 2 2 H 20 C 21.1 2 22 2.9 22 4 V 16 C 22 17.1 21.1 18 20 18 H 6 L 2 22 Z" fill="none" stroke="#e8eaed" stroke-width="1.8" stroke-linejoin="round" />
            <line x1="6" y1="7" x2="16" y2="7" stroke="#e8eaed" stroke-width="1.8" stroke-linecap="round" />
            <line x1="6" y1="11" x2="13" y2="11" stroke="#e8eaed" stroke-width="1.8" stroke-linecap="round" />
          </g>

          <!-- Activities (Geometric Shapes: Triangle, Square, Circle) -->
          <g transform="translate(84, 8)">
            <path d="M 12 3 L 16.5 10.5 H 7.5 Z" fill="#e8eaed" />
            <rect x="6.5" y="13" width="5.5" height="5.5" rx="1" fill="#e8eaed" />
            <circle cx="17.5" cy="16" r="3" fill="#e8eaed" />
          </g>

          <!-- Host Controls -->
          <g transform="translate(126, 8)">
            <path d="M 12 2 L 4 5.5 V 11 C 4 16 7.4 20.6 12 22 C 16.6 20.6 20 16 20 11 V 5.5 Z" fill="none" stroke="#e8eaed" stroke-width="1.8" stroke-linejoin="round" />
            <rect x="9.5" y="11" width="5" height="4.5" rx="0.8" fill="#e8eaed" />
            <path d="M 10.5 11 V 9.5 A 1.5 1.5 0 0 1 13.5 9.5 V 11" fill="none" stroke="#e8eaed" stroke-width="1.2" />
          </g>
        </g>
      </g>`
          : `
      <!-- Generic Work Page (e.g. GitHub Workspace) -->
      <g transform="translate(40, 30)">
        <rect width="1168" height="628" rx="8" fill="#0d1117" stroke="#30363d" stroke-width="1" />
        <g transform="translate(30, 30)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">
          <text x="0" y="24" font-size="20" font-weight="700" fill="#f0f3f6">fwilhelm / meet-update-rotator</text>
          <rect x="0" y="50" width="1108" height="500" rx="6" fill="#161b22" stroke="#30363d" stroke-width="1" />
          <text x="30" y="90" font-size="15" font-weight="600" fill="#58a6ff">README.md</text>
          <text x="30" y="130" font-size="13" fill="#8b949e">POPCORN - Participant Order Picker for Candid On-call Reporting &amp; Notes</text>
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
    <!-- Outer Container (Matches popup.css var ink / line) -->
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
    <!-- Candidate 1: Alice Martin (Checked / Done) -->
    <g transform="translate(16, 142)">
      <rect width="328" height="50" rx="8" fill="#17202e" stroke="#243042" stroke-width="1" />
      <text x="22" y="30" font-family="monospace" font-size="11" font-weight="600" fill="#7d8b99" text-anchor="middle">01</text>
      <rect x="36" y="17" width="16" height="16" rx="4" fill="#4fb98a" stroke="#4fb98a" />
      <polyline points="40,25 44,29 48,21" fill="none" stroke="#0b0f14" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <text x="62" y="30" font-size="13" font-weight="600" fill="#7d8b99" text-decoration="line-through">Alice Martin</text>
      <text x="314" y="30" font-size="11" fill="#4fb98a" text-anchor="end">today · 10:15</text>
    </g>

    <!-- Candidate 2: Florian Wilhelm (Unchecked) -->
    <g transform="translate(16, 200)">
      <rect width="328" height="50" rx="8" fill="#17202e" stroke="#243042" stroke-width="1" />
      <text x="22" y="30" font-family="monospace" font-size="11" font-weight="600" fill="#7d8b99" text-anchor="middle">02</text>
      <rect x="36" y="17" width="16" height="16" rx="4" fill="#17202e" stroke="#243042" stroke-width="1.5" />
      <text x="62" y="30" font-size="13" font-weight="700" fill="#f0f3f6">Florian Wilhelm</text>
      <text x="314" y="30" font-size="11" fill="#7d8b99" text-anchor="end">3d ago · 3 Sep</text>
    </g>

    <!-- Candidate 3: Sarah Connor (Unchecked) -->
    <g transform="translate(16, 258)">
      <rect width="328" height="50" rx="8" fill="#17202e" stroke="#243042" stroke-width="1" />
      <text x="22" y="30" font-family="monospace" font-size="11" font-weight="600" fill="#7d8b99" text-anchor="middle">03</text>
      <rect x="36" y="17" width="16" height="16" rx="4" fill="#17202e" stroke="#243042" stroke-width="1.5" />
      <text x="62" y="30" font-size="13" font-weight="700" fill="#f0f3f6">Sarah Connor</text>
      <text x="314" y="30" font-size="11" fill="#7d8b99" text-anchor="end">1d ago · 5 Sep</text>
    </g>

    <!-- Candidate 4: David Chen (Unchecked) -->
    <g transform="translate(16, 316)">
      <rect width="328" height="50" rx="8" fill="#17202e" stroke="#243042" stroke-width="1" />
      <text x="22" y="30" font-family="monospace" font-size="11" font-weight="600" fill="#7d8b99" text-anchor="middle">04</text>
      <rect x="36" y="17" width="16" height="16" rx="4" fill="#17202e" stroke="#243042" stroke-width="1.5" />
      <text x="62" y="30" font-size="13" font-weight="700" fill="#f0f3f6">David Chen</text>
      <text x="314" y="30" font-size="11" fill="#7d8b99" text-anchor="end">yesterday</text>
    </g>

    <!-- Bottom Action Controls (.row) -->
    <g transform="translate(16, 380)">
      <!-- More People Button -->
      <g>
        <rect width="280" height="36" rx="6" fill="#38bdf8" />
        <g transform="translate(85, 11)" stroke="#0b0f14">
          ${POPCORN_ICONS.shuffle}
        </g>
        <text x="148" y="23" font-size="13" font-weight="700" fill="#0b0f14" text-anchor="middle">More People</text>
      </g>

      <!-- Refresh Button (Vector SVG, no emoji) -->
      <g transform="translate(290, 0)">
        <rect width="38" height="36" rx="6" fill="#17202e" stroke="#243042" stroke-width="1" />
        <g transform="translate(11, 10)">
          ${POPCORN_ICONS.refresh}
        </g>
      </g>
    </g>

    <!-- Include Absent Checkbox -->
    <g transform="translate(16, 432)">
      <rect x="0" y="0" width="14" height="14" rx="3" fill="#17202e" stroke="#243042" stroke-width="1" />
      <text x="24" y="12" font-size="11" fill="#7d8b99">Include absent</text>
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
      <g transform="translate(116, 14)">
        ${POPCORN_ICONS.eye}
      </g>
      
      <rect x="250" y="12" width="68" height="18" rx="4" fill="rgba(239, 68, 68, 0.12)" />
      <text x="284" y="25" font-size="10" font-weight="600" fill="#ef4444" text-anchor="middle">5d overdue</text>
    </g>

    <!-- Person 2: Florian Wilhelm -->
    <g transform="translate(16, 198)">
      <rect width="328" height="42" rx="6" fill="#17202e" stroke="#243042" stroke-width="1" />
      <circle cx="16" cy="21" r="4" fill="#4fb98a" />
      <text x="30" y="25" font-size="12" font-weight="700" fill="#f0f3f6">Florian Wilhelm</text>
      <g transform="translate(132, 14)">
        ${POPCORN_ICONS.eye}
      </g>
      
      <rect x="250" y="12" width="68" height="18" rx="4" fill="rgba(245, 158, 11, 0.12)" />
      <text x="284" y="25" font-size="10" font-weight="600" fill="#f59e0b" text-anchor="middle">3d overdue</text>
    </g>

    <!-- Person 3: Sarah Connor -->
    <g transform="translate(16, 246)">
      <rect width="328" height="42" rx="6" fill="#17202e" stroke="#243042" stroke-width="1" />
      <circle cx="16" cy="21" r="4" fill="#4fb98a" />
      <text x="30" y="25" font-size="12" font-weight="700" fill="#f0f3f6">Sarah Connor</text>
      <g transform="translate(122, 14)">
        ${POPCORN_ICONS.eye}
      </g>
      
      <rect x="250" y="12" width="68" height="18" rx="4" fill="rgba(56, 189, 248, 0.12)" />
      <text x="284" y="25" font-size="10" font-weight="600" fill="#38bdf8" text-anchor="middle">1d overdue</text>
    </g>

    <!-- Person 4: David Chen -->
    <g transform="translate(16, 294)">
      <rect width="328" height="42" rx="6" fill="#17202e" stroke="#243042" stroke-width="1" />
      <circle cx="16" cy="21" r="4" fill="#4fb98a" />
      <text x="30" y="25" font-size="12" font-weight="700" fill="#f0f3f6">David Chen</text>
      <g transform="translate(112, 14)">
        ${POPCORN_ICONS.eye}
      </g>
      
      <rect x="258" y="12" width="60" height="18" rx="4" fill="rgba(79, 185, 138, 0.12)" />
      <text x="288" y="25" font-size="10" font-weight="600" fill="#4fb98a" text-anchor="middle">Today</text>
    </g>

    <!-- Person 5: Elena Rostova (Absent) -->
    <g transform="translate(16, 342)">
      <rect width="328" height="42" rx="6" fill="#17202e" stroke="#243042" stroke-width="1" opacity="0.65" />
      <circle cx="16" cy="21" r="4" fill="#64748b" />
      <text x="30" y="25" font-size="12" font-weight="700" fill="#cbd5e1">Elena Rostova</text>
      <g transform="translate(125, 14)">
        ${POPCORN_ICONS.eye}
      </g>
      
      <rect x="250" y="12" width="68" height="18" rx="4" fill="rgba(245, 158, 11, 0.12)" />
      <text x="284" y="25" font-size="10" font-weight="600" fill="#f59e0b" text-anchor="middle">3d overdue</text>
    </g>

    <!-- Person 6: Marcus Brody (Ignored) -->
    <g transform="translate(16, 390)">
      <rect width="328" height="42" rx="6" fill="#17202e" stroke="#243042" stroke-width="1" opacity="0.65" />
      <circle cx="16" cy="21" r="4" fill="#64748b" />
      <text x="30" y="25" font-size="12" font-weight="700" fill="#7d8b99">Marcus Brody</text>
      <g transform="translate(124, 14)">
        ${POPCORN_ICONS.eyeIgnored}
      </g>
      
      <rect x="262" y="12" width="56" height="18" rx="4" fill="rgba(100, 116, 139, 0.15)" />
      <text x="290" y="25" font-size="10" font-weight="600" fill="#94a3b8" text-anchor="middle">ignored</text>
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
      
      <g transform="translate(180, 13)">
        <rect width="34" height="20" rx="4" fill="#243042" />
        <g transform="translate(5, 4.5)">${POPCORN_ICONS.userIcon}</g>
        <text x="23" y="14" font-size="10" font-weight="600" fill="#9ca3af" text-anchor="middle">8</text>
      </g>

      <g transform="translate(226, 14)">
        <g transform="translate(4, 2)">${POPCORN_ICONS.openExternal}</g>
        <g transform="translate(26, 2)">${POPCORN_ICONS.edit}</g>
        <g transform="translate(48, 2)">${POPCORN_ICONS.download}</g>
        <g transform="translate(70, 2)">${POPCORN_ICONS.trash}</g>
      </g>
    </g>

    <!-- Meeting Item 2: Team Weekly DS & NLP -->
    <g transform="translate(16, 202)">
      <rect width="328" height="46" rx="6" fill="#17202e" stroke="#243042" stroke-width="1" />
      <text x="14" y="28" font-size="12" font-weight="700" fill="#f0f3f6">Team Weekly DS &amp; NLP</text>
      
      <g transform="translate(180, 13)">
        <rect width="34" height="20" rx="4" fill="#243042" />
        <g transform="translate(5, 4.5)">${POPCORN_ICONS.userIcon}</g>
        <text x="23" y="14" font-size="10" font-weight="600" fill="#9ca3af" text-anchor="middle">37</text>
      </g>

      <g transform="translate(226, 14)">
        <g transform="translate(4, 2)">${POPCORN_ICONS.openExternal}</g>
        <g transform="translate(26, 2)">${POPCORN_ICONS.edit}</g>
        <g transform="translate(48, 2)">${POPCORN_ICONS.download}</g>
        <g transform="translate(70, 2)">${POPCORN_ICONS.trash}</g>
      </g>
    </g>

    <!-- Meeting Item 3: Sprint Retrospective & Sync -->
    <g transform="translate(16, 258)">
      <rect width="328" height="46" rx="6" fill="#17202e" stroke="#243042" stroke-width="1" />
      <text x="14" y="28" font-size="12" font-weight="700" fill="#f0f3f6">Sprint Retrospective &amp; Sync</text>
      
      <g transform="translate(180, 13)">
        <rect width="34" height="20" rx="4" fill="#243042" />
        <g transform="translate(5, 4.5)">${POPCORN_ICONS.userIcon}</g>
        <text x="23" y="14" font-size="10" font-weight="600" fill="#9ca3af" text-anchor="middle">12</text>
      </g>

      <g transform="translate(226, 14)">
        <g transform="translate(4, 2)">${POPCORN_ICONS.openExternal}</g>
        <g transform="translate(26, 2)">${POPCORN_ICONS.edit}</g>
        <g transform="translate(48, 2)">${POPCORN_ICONS.download}</g>
        <g transform="translate(70, 2)">${POPCORN_ICONS.trash}</g>
      </g>
    </g>

    <!-- Meeting Item 4: Architecture Roundtable -->
    <g transform="translate(16, 314)">
      <rect width="328" height="46" rx="6" fill="#17202e" stroke="#243042" stroke-width="1" />
      <text x="14" y="28" font-size="12" font-weight="700" fill="#f0f3f6">Architecture Roundtable</text>
      
      <g transform="translate(180, 13)">
        <rect width="34" height="20" rx="4" fill="#243042" />
        <g transform="translate(5, 4.5)">${POPCORN_ICONS.userIcon}</g>
        <text x="23" y="14" font-size="10" font-weight="600" fill="#9ca3af" text-anchor="middle">6</text>
      </g>

      <g transform="translate(226, 14)">
        <g transform="translate(4, 2)">${POPCORN_ICONS.openExternal}</g>
        <g transform="translate(26, 2)">${POPCORN_ICONS.edit}</g>
        <g transform="translate(48, 2)">${POPCORN_ICONS.download}</g>
        <g transform="translate(70, 2)">${POPCORN_ICONS.trash}</g>
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
  <g transform="translate(360, 120)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
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

      <!-- Left Action: Copy Markdown & Download -->
      <g transform="translate(0, 18)">
        <rect width="130" height="34" rx="6" fill="#17202e" stroke="#243042" stroke-width="1" />
        <g transform="translate(14, 9)">${POPCORN_ICONS.clipboard}</g>
        <text x="76" y="22" font-size="12" font-weight="600" fill="#f0f3f6" text-anchor="middle">Copy Table</text>

        <rect x="140" width="116" height="34" rx="6" fill="#17202e" stroke="#243042" stroke-width="1" />
        <g transform="translate(154, 9)">${POPCORN_ICONS.download}</g>
        <text x="198" y="22" font-size="12" font-weight="500" fill="#7d8b99" text-anchor="middle">Download</text>
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
      <img class="asset-img" src="screenshot1_standup_1280x800.jpeg" alt="Standup view" />
    </div>

    <div class="card">
      <h2>Screenshot 2: Roster &amp; People Management (1280x800)</h2>
      <p>Shows attendee attendance, overdue status badges, ignore toggles, and manual participant management.</p>
      <img class="asset-img" src="screenshot2_people_1280x800.jpeg" alt="People view" />
    </div>

    <div class="card">
      <h2>Screenshot 3: Tracked Meetings List (1280x800)</h2>
      <p>Shows multi-meeting tracking and list management outside of active Google Meet calls.</p>
      <img class="asset-img" src="screenshot3_meetings_1280x800.jpeg" alt="Meetings view" />
    </div>

    <div class="card">
      <h2>Screenshot 4: Markdown Minutes Editor &amp; Export Modal (1280x800)</h2>
      <p>Shows in-app Markdown minutes editing, clipboard copy, and export features for Notion/Docs.</p>
      <img class="asset-img" src="screenshot4_markdown_1280x800.jpeg" alt="Markdown view" />
    </div>

    <div class="card">
      <h2>Promotional Marquee Tile (1400x560)</h2>
      <p>Store feature banner for promotion slots.</p>
      <img class="asset-img" src="promo_marquee_1400x560.jpeg" alt="Marquee banner" />
    </div>

    <div class="card">
      <h2>Small Promo Tile (440x280)</h2>
      <p>Search results and catalog preview card.</p>
      <img style="max-width: 440px;" class="asset-img" src="promo_small_440x280.jpeg" alt="Small promo tile" />
    </div>
  </div>
</body>
</html>`;
fs.writeFileSync(path.join(assetsDir, "preview.html"), previewHtml);

console.log("✅ Successfully generated all realistic Chrome Web Store screenshots & assets!");
