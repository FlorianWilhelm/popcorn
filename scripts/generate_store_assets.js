const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const rootDir = path.resolve(__dirname, "..");
const assetsDir = path.join(rootDir, "store_assets");

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Read mascot base64
const icon128Buf = fs.readFileSync(path.join(rootDir, "icon128.png"));
const icon128Base64 = icon128Buf.toString("base64");
fs.copyFileSync(path.join(rootDir, "icon128.png"), path.join(assetsDir, "icon-128.png"));

// 1. Promo Small: 440 x 280
const promoSmallSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 280" width="440" height="280">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b1019" />
      <stop offset="50%" stop-color="#101826" />
      <stop offset="100%" stop-color="#0f1724" />
    </linearGradient>
    <linearGradient id="glowGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#818cf8" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="0.6" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="440" height="280" fill="url(#bgGrad)" />
  <circle cx="90" cy="140" r="110" fill="url(#glowGrad)" />

  <!-- Mascot -->
  <g filter="url(#shadow)">
    <image href="data:image/png;base64,${icon128Base64}" x="30" y="70" width="140" height="140" />
  </g>

  <!-- Title & Text -->
  <g font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
    <!-- Eyebrow badge -->
    <rect x="190" y="58" width="180" height="22" rx="11" fill="rgba(56, 189, 248, 0.12)" stroke="rgba(56, 189, 248, 0.3)" stroke-width="1" />
    <text x="280" y="73" font-size="10" font-weight="700" fill="#38bdf8" text-anchor="middle" letter-spacing="0.08em">GOOGLE MEET STANDUP</text>

    <!-- Main Title -->
    <text x="190" y="118" font-size="34" font-weight="900" fill="#ffffff" letter-spacing="0.04em">POPCORN</text>
    
    <!-- Subtitle -->
    <text x="190" y="145" font-size="14" font-weight="600" fill="#94a3b8">Fair &amp; Snappy Speaker Picker</text>

    <!-- Bullets -->
    <text x="190" y="180" font-size="12" fill="#cbd5e1">🍿 Popcorn-style attendee rotation</text>
    <text x="190" y="202" font-size="12" fill="#cbd5e1">⏱️ Tracks overdue update candidates</text>
    <text x="190" y="224" font-size="12" fill="#cbd5e1">🔒 100% private &amp; local in browser</text>
  </g>
</svg>`;
fs.writeFileSync(path.join(assetsDir, "promo_small_440x280.svg"), promoSmallSvg);

// 2. Promo Marquee: 1400 x 560
const promoMarqueeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 560" width="1400" height="560">
  <defs>
    <linearGradient id="marqBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#080c14" />
      <stop offset="40%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#090d16" />
    </linearGradient>
    <linearGradient id="marqGlow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0" />
    </linearGradient>
    <filter id="marqShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="24" flood-color="#000000" flood-opacity="0.7" />
    </filter>
  </defs>

  <rect width="1400" height="560" fill="url(#marqBg)" />
  <circle cx="280" cy="280" r="280" fill="url(#marqGlow)" />

  <!-- Mascot -->
  <g filter="url(#marqShadow)">
    <image href="data:image/png;base64,${icon128Base64}" x="100" y="120" width="320" height="320" />
  </g>

  <!-- Info Area -->
  <g font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
    <rect x="480" y="110" width="280" height="34" rx="17" fill="rgba(56, 189, 248, 0.12)" stroke="rgba(56, 189, 248, 0.35)" stroke-width="1.5" />
    <text x="620" y="132" font-size="13" font-weight="800" fill="#38bdf8" text-anchor="middle" letter-spacing="0.1em">GOOGLE MEET AGILITY TOOL</text>

    <text x="480" y="210" font-size="64" font-weight="900" fill="#ffffff" letter-spacing="0.04em">POPCORN</text>
    <text x="480" y="260" font-size="26" font-weight="600" fill="#94a3b8">Participant Order Picker for Candid On-call Reporting &amp; Notes</text>

    <text x="480" y="330" font-size="19" fill="#e2e8f0">✨ Effortless, fair daily standups and weekly team update rounds.</text>
    <text x="480" y="365" font-size="19" fill="#e2e8f0">🎯 Prioritizes teammates whose updates are most overdue automatically.</text>
    <text x="480" y="400" font-size="19" fill="#e2e8f0">📋 Markdown export &amp; import ready for meeting minutes and Slack/Docs.</text>
    <text x="480" y="435" font-size="19" fill="#e2e8f0">🛡️ Zero telemetry, zero external servers — 100% private in browser storage.</text>
  </g>
</svg>`;
fs.writeFileSync(path.join(assetsDir, "promo_marquee_1400x560.svg"), promoMarqueeSvg);

// 3. Screenshot 1: Standup Speaker Picker (1280 x 800)
const screenshot1Svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800" width="1280" height="800">
  <defs>
    <linearGradient id="sc1Bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <filter id="modalShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="30" flood-color="#000000" flood-opacity="0.8" />
    </filter>
  </defs>

  <rect width="1280" height="800" fill="url(#sc1Bg)" />

  <!-- Background Meet Mock -->
  <g opacity="0.25">
    <rect x="60" y="40" width="1160" height="720" rx="16" fill="#1e293b" />
    <circle cx="300" cy="240" r="70" fill="#334155" />
    <circle cx="640" cy="240" r="70" fill="#334155" />
    <circle cx="980" cy="240" r="70" fill="#334155" />
    <circle cx="300" cy="500" r="70" fill="#334155" />
    <circle cx="640" cy="500" r="70" fill="#334155" />
    <circle cx="980" cy="500" r="70" fill="#334155" />
  </g>

  <!-- Popup Mock Window -->
  <g transform="translate(420, 80)" filter="url(#modalShadow)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
    <!-- Container -->
    <rect width="440" height="640" rx="14" fill="#0f141c" stroke="#243042" stroke-width="1.5" />

    <!-- Header -->
    <text x="24" y="38" font-size="10" font-weight="700" fill="#64748b" letter-spacing="0.1em">CURRENT MEETING</text>
    <text x="24" y="66" font-size="19" font-weight="800" fill="#f8fafc">Daily Standup · Product Team</text>
    
    <!-- Header Right (Badge + Mascot) -->
    <rect x="300" y="38" width="56" height="22" rx="11" fill="rgba(79, 185, 138, 0.16)" />
    <text x="328" y="53" font-size="10" font-weight="800" fill="#4fb98a" text-anchor="middle">ACTIVE</text>
    <image href="data:image/png;base64,${icon128Base64}" x="370" y="30" width="40" height="40" />

    <!-- Tabs Bar -->
    <line x1="0" y1="92" x2="440" y2="92" stroke="#1e293b" stroke-width="1" />
    
    <!-- Tab 1: Update (Active) -->
    <text x="50" y="116" font-size="13" font-weight="700" fill="#f8fafc">Update</text>
    <line x1="24" y1="128" x2="110" y2="128" stroke="#38bdf8" stroke-width="2.5" />
    
    <!-- Tab 2: People -->
    <text x="160" y="116" font-size="13" font-weight="500" fill="#64748b">People</text>
    
    <!-- Tab 3: Meetings -->
    <text x="260" y="116" font-size="13" font-weight="500" fill="#64748b">Meetings</text>
    
    <!-- Tab 4: Settings -->
    <circle cx="390" cy="112" r="7" fill="none" stroke="#64748b" stroke-width="1.5" />

    <!-- Status Bar -->
    <rect x="24" y="142" width="392" height="26" rx="6" fill="rgba(56, 189, 248, 0.08)" />
    <text x="36" y="159" font-size="11" fill="#38bdf8">8 present of 8 · Rotation in progress</text>

    <!-- Candidate List -->
    <!-- Candidate 1 -->
    <g transform="translate(24, 182)">
      <rect width="392" height="52" rx="8" fill="#17202e" stroke="#243042" stroke-width="1" />
      <circle cx="28" cy="26" r="14" fill="#38bdf8" fill-opacity="0.2" />
      <text x="28" y="31" font-size="12" font-weight="800" fill="#38bdf8" text-anchor="middle">1</text>
      <text x="54" y="24" font-size="14" font-weight="700" fill="#ffffff">Alice Martin</text>
      <text x="54" y="40" font-size="11" fill="#64748b">Overdue: 6 days ago</text>
      <rect x="312" y="12" width="66" height="28" rx="6" fill="#38bdf8" />
      <text x="345" y="30" font-size="12" font-weight="700" fill="#080c14" text-anchor="middle">Done</text>
    </g>

    <!-- Candidate 2 -->
    <g transform="translate(24, 244)">
      <rect width="392" height="52" rx="8" fill="#17202e" stroke="#243042" stroke-width="1" />
      <circle cx="28" cy="26" r="14" fill="#38bdf8" fill-opacity="0.2" />
      <text x="28" y="31" font-size="12" font-weight="800" fill="#38bdf8" text-anchor="middle">2</text>
      <text x="54" y="24" font-size="14" font-weight="700" fill="#ffffff">Florian Wilhelm</text>
      <text x="54" y="40" font-size="11" fill="#64748b">Overdue: 4 days ago</text>
      <rect x="312" y="12" width="66" height="28" rx="6" fill="#38bdf8" />
      <text x="345" y="30" font-size="12" font-weight="700" fill="#080c14" text-anchor="middle">Done</text>
    </g>

    <!-- Candidate 3 -->
    <g transform="translate(24, 306)">
      <rect width="392" height="52" rx="8" fill="#17202e" stroke="#243042" stroke-width="1" />
      <circle cx="28" cy="26" r="14" fill="#38bdf8" fill-opacity="0.2" />
      <text x="28" y="31" font-size="12" font-weight="800" fill="#38bdf8" text-anchor="middle">3</text>
      <text x="54" y="24" font-size="14" font-weight="700" fill="#ffffff">Sarah Connor</text>
      <text x="54" y="40" font-size="11" fill="#64748b">Overdue: 2 days ago</text>
      <rect x="312" y="12" width="66" height="28" rx="6" fill="#38bdf8" />
      <text x="345" y="30" font-size="12" font-weight="700" fill="#080c14" text-anchor="middle">Done</text>
    </g>

    <!-- Candidate 4 -->
    <g transform="translate(24, 368)">
      <rect width="392" height="52" rx="8" fill="#17202e" stroke="#243042" stroke-width="1" />
      <circle cx="28" cy="26" r="14" fill="#38bdf8" fill-opacity="0.2" />
      <text x="28" y="31" font-size="12" font-weight="800" fill="#38bdf8" text-anchor="middle">4</text>
      <text x="54" y="24" font-size="14" font-weight="700" fill="#ffffff">David Chen</text>
      <text x="54" y="40" font-size="11" fill="#64748b">Overdue: yesterday</text>
      <rect x="312" y="12" width="66" height="28" rx="6" fill="#38bdf8" />
      <text x="345" y="30" font-size="12" font-weight="700" fill="#080c14" text-anchor="middle">Done</text>
    </g>

    <!-- Action Buttons -->
    <g transform="translate(24, 440)">
      <rect width="338" height="36" rx="6" fill="#243042" />
      <text x="169" y="23" font-size="13" font-weight="700" fill="#f8fafc" text-anchor="middle">Next Candidates</text>
      <rect x="350" y="0" width="42" height="36" rx="6" fill="#243042" />
      <text x="371" y="23" font-size="15" fill="#94a3b8" text-anchor="middle">🔄</text>
    </g>

    <!-- Secondary Actions -->
    <g transform="translate(24, 490)">
      <rect width="392" height="34" rx="6" fill="transparent" stroke="#243042" stroke-width="1" />
      <text x="196" y="22" font-size="12" font-weight="600" fill="#94a3b8" text-anchor="middle">Start New Round</text>
    </g>
  </g>

  <!-- Feature Badge Overlay -->
  <g transform="translate(60, 100)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">
    <rect width="280" height="90" rx="12" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5" />
    <text x="20" y="35" font-size="15" font-weight="800" fill="#38bdf8">🎯 Automatic Candidate Rotation</text>
    <text x="20" y="60" font-size="12" fill="#94a3b8">Identifies teammates whose updates</text>
    <text x="20" y="76" font-size="12" fill="#94a3b8">are most overdue for fair standups.</text>
  </g>
</svg>`;
fs.writeFileSync(path.join(assetsDir, "screenshot1_standup_1280x800.svg"), screenshot1Svg);

// 4. Screenshot 2: Meeting Management (1280 x 800)
const screenshot2Svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800" width="1280" height="800">
  <defs>
    <linearGradient id="sc2Bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <filter id="modalShadow2" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="30" flood-color="#000000" flood-opacity="0.8" />
    </filter>
  </defs>

  <rect width="1280" height="800" fill="url(#sc2Bg)" />

  <g transform="translate(420, 80)" filter="url(#modalShadow2)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
    <rect width="440" height="640" rx="14" fill="#0f141c" stroke="#243042" stroke-width="1.5" />

    <!-- Header -->
    <text x="24" y="38" font-size="10" font-weight="700" fill="#64748b" letter-spacing="0.1em">NO MEET TAB</text>
    <text x="24" y="66" font-size="19" font-weight="800" fill="#f8fafc">No Meeting</text>
    <image href="data:image/png;base64,${icon128Base64}" x="370" y="30" width="40" height="40" />

    <!-- Tabs Bar -->
    <line x1="0" y1="92" x2="440" y2="92" stroke="#1e293b" stroke-width="1" />
    <text x="50" y="116" font-size="13" font-weight="500" fill="#64748b">Update</text>
    <text x="160" y="116" font-size="13" font-weight="500" fill="#64748b">People</text>
    
    <!-- Meetings Tab Active -->
    <text x="260" y="116" font-size="13" font-weight="700" fill="#f8fafc">Meetings</text>
    <line x1="240" y1="128" x2="320" y2="128" stroke="#38bdf8" stroke-width="2.5" />
    <circle cx="390" cy="112" r="7" fill="none" stroke="#64748b" stroke-width="1.5" />

    <!-- Subheader -->
    <text x="24" y="160" font-size="11" font-weight="700" fill="#64748b" letter-spacing="0.08em">TRACKED MEETINGS</text>
    <rect x="380" y="145" width="36" height="24" rx="4" fill="#243042" />
    <text x="398" y="161" font-size="14" fill="#f8fafc" text-anchor="middle">+</text>

    <!-- Meeting Item 1 -->
    <g transform="translate(24, 180)">
      <rect width="392" height="44" rx="6" fill="#17202e" stroke="#243042" stroke-width="1" />
      <text x="16" y="27" font-size="13" font-weight="700" fill="#f8fafc">Daily Standup · Product</text>
      <rect x="235" y="12" width="46" height="20" rx="4" fill="#243042" />
      <text x="258" y="26" font-size="11" fill="#94a3b8" text-anchor="middle">👥 8</text>
      <text x="300" y="27" font-size="13" fill="#38bdf8">↗</text>
      <text x="335" y="27" font-size="13" fill="#94a3b8">✏️</text>
      <text x="368" y="27" font-size="13" fill="#94a3b8">📥</text>
    </g>

    <!-- Meeting Item 2 -->
    <g transform="translate(24, 235)">
      <rect width="392" height="44" rx="6" fill="#17202e" stroke="#243042" stroke-width="1" />
      <text x="16" y="27" font-size="13" font-weight="700" fill="#f8fafc">Team Weekly DS &amp; NLP</text>
      <rect x="235" y="12" width="46" height="20" rx="4" fill="#243042" />
      <text x="258" y="26" font-size="11" fill="#94a3b8" text-anchor="middle">👥 37</text>
      <text x="300" y="27" font-size="13" fill="#38bdf8">↗</text>
      <text x="335" y="27" font-size="13" fill="#94a3b8">✏️</text>
      <text x="368" y="27" font-size="13" fill="#94a3b8">📥</text>
    </g>

    <!-- Meeting Item 3 -->
    <g transform="translate(24, 290)">
      <rect width="392" height="44" rx="6" fill="#17202e" stroke="#243042" stroke-width="1" />
      <text x="16" y="27" font-size="13" font-weight="700" fill="#f8fafc">Engineering Sync (EU/US)</text>
      <rect x="235" y="12" width="46" height="20" rx="4" fill="#243042" />
      <text x="258" y="26" font-size="11" fill="#94a3b8" text-anchor="middle">👥 14</text>
      <text x="300" y="27" font-size="13" fill="#38bdf8">↗</text>
      <text x="335" y="27" font-size="13" fill="#94a3b8">✏️</text>
      <text x="368" y="27" font-size="13" fill="#94a3b8">📥</text>
    </g>
  </g>

  <!-- Feature Callout -->
  <g transform="translate(60, 100)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">
    <rect width="280" height="90" rx="12" fill="#0f172a" stroke="#818cf8" stroke-width="1.5" />
    <text x="20" y="35" font-size="15" font-weight="800" fill="#818cf8">📋 Multiple Meeting Support</text>
    <text x="20" y="60" font-size="12" fill="#94a3b8">Organize standups, weekly syncs,</text>
    <text x="20" y="76" font-size="12" fill="#94a3b8">and cross-team roundtables.</text>
  </g>
</svg>`;
fs.writeFileSync(path.join(assetsDir, "screenshot2_meetings_1280x800.svg"), screenshot2Svg);

// 5. Screenshot 3: Markdown Editor & Notes Modal (1280 x 800)
const screenshot3Svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800" width="1280" height="800">
  <defs>
    <linearGradient id="sc3Bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <filter id="modalShadow3" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="30" flood-color="#000000" flood-opacity="0.8" />
    </filter>
  </defs>

  <rect width="1280" height="800" fill="url(#sc3Bg)" />

  <g transform="translate(360, 70)" filter="url(#modalShadow3)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
    <rect width="560" height="660" rx="14" fill="#0f141c" stroke="#243042" stroke-width="1.5" />

    <!-- Modal Header -->
    <text x="30" y="45" font-size="18" font-weight="800" fill="#f8fafc">Daily Standup · Markdown Minutes</text>
    <text x="510" y="45" font-size="18" fill="#64748b">✕</text>

    <!-- Subtitle -->
    <text x="30" y="75" font-size="12" fill="#94a3b8">Edit attendance tables, import meeting rosters, or copy to clipboard.</text>

    <!-- Editor Text Area -->
    <rect x="30" y="95" width="500" height="480" rx="8" fill="#090d16" stroke="#243042" stroke-width="1" />
    
    <g font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="12" fill="#e2e8f0">
      <text x="50" y="130" fill="#38bdf8"># Daily Standup · Product Team</text>
      <text x="50" y="165" fill="#64748b">| Person | Last Update |</text>
      <text x="50" y="185" fill="#64748b">| :--- | :--- |</text>
      <text x="50" y="210">| Alice Martin | 2026-09-05 |</text>
      <text x="50" y="235">| Florian Wilhelm | 2026-09-05 |</text>
      <text x="50" y="260">| Sarah Connor | 2026-09-04 |</text>
      <text x="50" y="285">| David Chen | 2026-09-03 |</text>
      <text x="50" y="310">| Elena Rostova | 2026-09-02 |</text>
      <text x="50" y="335">| Marcus Brody | 2026-09-01 |</text>
      <text x="50" y="360" fill="#94a3b8">| Thomas Clark | |</text>
      <text x="50" y="385" fill="#94a3b8">| Jenny Wu | |</text>
    </g>

    <!-- Footer Controls -->
    <rect x="30" y="595" width="130" height="36" rx="6" fill="#243042" />
    <text x="95" y="618" font-size="12" font-weight="700" fill="#f8fafc" text-anchor="middle">📋 Copy Markdown</text>

    <rect x="420" y="595" width="110" height="36" rx="6" fill="#38bdf8" />
    <text x="475" y="618" font-size="12" font-weight="700" fill="#080c14" text-anchor="middle">Save Changes</text>
  </g>

  <!-- Feature Callout -->
  <g transform="translate(60, 100)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">
    <rect width="260" height="90" rx="12" fill="#0f172a" stroke="#4fb98a" stroke-width="1.5" />
    <text x="20" y="35" font-size="15" font-weight="800" fill="#4fb98a">📝 Markdown Integration</text>
    <text x="20" y="60" font-size="12" fill="#94a3b8">Instantly sync rosters with</text>
    <text x="20" y="76" font-size="12" fill="#94a3b8">Notion, Obsidian, or Google Docs.</text>
  </g>
</svg>`;
fs.writeFileSync(path.join(assetsDir, "screenshot3_markdown_1280x800.svg"), screenshot3Svg);

console.log("All store screenshots and promo graphics generated successfully!");

