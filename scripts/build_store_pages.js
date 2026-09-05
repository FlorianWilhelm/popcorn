const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const pagesDir = path.join(rootDir, 'store_assets', 'pages');

if (!fs.existsSync(pagesDir)) {
  fs.mkdirSync(pagesDir, { recursive: true });
}

// Read popup.css to embed directly or link
const popupCss = fs.readFileSync(path.join(rootDir, 'popup.css'), 'utf-8');
const icon48Base64 = fs.readFileSync(path.join(rootDir, 'icon48.png')).toString('base64');
const icon128Base64 = fs.readFileSync(path.join(rootDir, 'icon128.png')).toString('base64');

// Common Chrome Browser Frame CSS & HTML
function getChromeWindowWrap(title, url, isMeetActive, contentHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap');

  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 0;
    width: 1280px;
    height: 800px;
    overflow: hidden;
    background: #1e1f22;
    font-family: 'Google Sans', Roboto, -apple-system, BlinkMacSystemFont, sans-serif;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  /* Chrome macOS Window Header */
  .chrome-window {
    width: 1280px;
    height: 800px;
    display: flex;
    flex-direction: column;
    background: #202124;
  }

  .chrome-top-bar {
    height: 42px;
    background: #1f2023;
    display: flex;
    align-items: center;
    padding-left: 14px;
    position: relative;
    border-bottom: 1px solid #141517;
  }

  .traffic-lights {
    display: flex;
    gap: 8px;
    margin-right: 18px;
  }
  .traffic-light {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }
  .tl-red { background: #ff5f56; }
  .tl-yellow { background: #ffbd2e; }
  .tl-green { background: #27c93f; }

  .chrome-tab {
    height: 34px;
    background: #2b2f38;
    border-radius: 8px 8px 0 0;
    padding: 0 14px;
    display: flex;
    align-items: center;
    gap: 9px;
    color: #e8eaed;
    font-size: 12px;
    font-weight: 500;
    width: 250px;
    position: relative;
  }
  .chrome-tab::after {
    content: "×";
    position: absolute;
    right: 12px;
    color: #9ca3af;
    font-size: 14px;
  }
  .chrome-new-tab {
    color: #6b7280;
    font-size: 18px;
    margin-left: 10px;
    cursor: default;
  }

  /* Omnibox URL Bar */
  .chrome-nav-bar {
    height: 40px;
    background: #2b2f38;
    display: flex;
    align-items: center;
    padding: 0 14px;
    gap: 14px;
    border-bottom: 1px solid #373e4a;
  }
  .nav-arrow {
    color: #9ca3af;
    font-size: 15px;
    font-weight: bold;
    cursor: default;
  }
  .nav-arrow.disabled { color: #4b5563; }
  .omnibox {
    flex: 1;
    height: 28px;
    background: #1a1d24;
    border: 1px solid #3b4250;
    border-radius: 14px;
    display: flex;
    align-items: center;
    padding: 0 12px;
    gap: 8px;
    color: #e2e8f0;
    font-size: 12.5px;
  }
  .omnibox svg {
    color: #9ca3af;
    flex-shrink: 0;
  }

  .extension-icons {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .puzzle-btn {
    color: #9ca3af;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .popcorn-btn {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background: #1f2937;
    border: ${isMeetActive ? '1.5px solid #38bdf8' : '1px solid #374151'};
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: ${isMeetActive ? '0 0 10px rgba(56, 189, 248, 0.4)' : 'none'};
  }
  .profile-btn {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #1a73e8;
    color: white;
    font-size: 11px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Viewport Container */
  .viewport {
    flex: 1;
    position: relative;
    background: #141414;
    overflow: hidden;
  }
</style>
</head>
<body>
<div class="chrome-window">
  <!-- Top Tab Bar -->
  <div class="chrome-top-bar">
    <div class="traffic-lights">
      <div class="traffic-light tl-red"></div>
      <div class="traffic-light tl-yellow"></div>
      <div class="traffic-light tl-green"></div>
    </div>
    <div class="chrome-tab">
      ${
        url.includes('meet.google.com')
          ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="#00ac47"><rect width="16" height="16" rx="3" x="2" y="4"></rect><path d="M18 9l4-3v12l-4-3V9z"></path></svg>`
          : `<svg width="15" height="15" viewBox="0 0 24 24" fill="#ffffff"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>`
      }
      <span>${title}</span>
    </div>
    <div class="chrome-new-tab">+</div>
  </div>

  <!-- Omnibox Bar -->
  <div class="chrome-nav-bar">
    <div class="nav-arrow">←</div>
    <div class="nav-arrow disabled">→</div>
    <div class="nav-arrow">↻</div>
    <div class="omnibox">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
      <span>${url}</span>
    </div>
    <div class="extension-icons">
      <div class="puzzle-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19.439 7.85c0-1.571-1.274-2.85-2.845-2.85a2.85 2.85 0 0 0-2.844 2.85c0 .354.067.693.188 1.004H9.062A2.85 2.85 0 0 0 9.25 7.85c0-1.571-1.274-2.85-2.845-2.85A2.85 2.85 0 0 0 3.56 7.85c0 1.571 1.274 2.85 2.845 2.85.354 0 .693-.067 1.004-.188v5.026a2.85 2.85 0 0 0-1.004-.188c-1.571 0-2.845 1.279-2.845 2.85 0 1.571 1.274 2.85 2.845 2.85a2.85 2.85 0 0 0 2.845-2.85c0-.354-.067-.693-.188-1.004h5.026c-.121.311-.188.65-.188 1.004 0 1.571 1.274 2.85 2.844 2.85a2.85 2.85 0 0 0 2.845-2.85c0-1.571-1.274-2.85-2.845-2.85a2.85 2.85 0 0 0-.188.188V9.666c.121.121.46.188.814.188 1.571 0 2.845-1.279 2.845-2.85z"/>
        </svg>
      </div>
      <div class="popcorn-btn">
        <img src="data:image/png;base64,${icon48Base64}" width="22" height="22" alt="POPCORN" />
      </div>
      <div class="profile-btn">F</div>
    </div>
  </div>

  <!-- Viewport -->
  <div class="viewport">
    ${contentHtml}
  </div>
</div>
</body>
</html>`;
}

// Google Meet Call HTML Layout
function getGoogleMeetCallHtml(popupHtml, isModal = false) {
  return `
  <style>
    /* Google Meet Styling */
    .meet-container {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      background: #141414;
      position: relative;
      padding: 12px 16px 14px;
    }

    /* Top Meeting Header */
    .meet-top-header {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #ffffff;
      font-size: 13.5px;
      font-weight: 500;
      margin-bottom: 12px;
      padding-left: 6px;
    }
    .meet-time { font-weight: 600; }
    .meet-sep { color: #5f6368; }
    .meet-title { font-weight: 500; }
    .meet-info-icon {
      width: 17px;
      height: 17px;
      border: 1.5px solid #9ca3af;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      color: #9ca3af;
      font-weight: bold;
      margin-left: 4px;
    }

    /* Video Grid (2x2) */
    .meet-grid {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }

    .video-tile {
      background: #3c4043;
      border-radius: 14px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .video-tile.active-speaker {
      border: 3px solid #8ab4f8;
    }

    .avatar-circle {
      width: 90px;
      height: 90px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 38px;
      font-weight: 500;
      color: white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }

    .tile-name {
      position: absolute;
      bottom: 14px;
      left: 16px;
      color: white;
      font-size: 13.5px;
      font-weight: 500;
      text-shadow: 0 1px 3px rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .eq-wave {
      display: inline-flex;
      align-items: flex-end;
      gap: 2px;
      height: 14px;
    }
    .eq-bar {
      width: 2.5px;
      background: #81c995;
      border-radius: 1px;
    }
    .eq-1 { height: 8px; }
    .eq-2 { height: 14px; }
    .eq-3 { height: 6px; }

    .tile-mic {
      position: absolute;
      top: 14px;
      right: 14px;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .tile-mic.left-side {
      right: auto;
      left: 170px;
    }

    .tile-menu-btn {
      position: absolute;
      top: 14px;
      right: 14px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #1a73e8;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      letter-spacing: 1px;
    }

    /* Google Meet Bottom Bar */
    .meet-bottom-bar {
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    /* Floating Center Pill Dock */
    .meet-dock {
      background: #1e2020;
      border-radius: 28px;
      height: 52px;
      padding: 0 6px;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    }

    .dock-split-pill {
      height: 40px;
      border-radius: 20px;
      display: flex;
      overflow: hidden;
    }
    .dock-sub-left {
      width: 36px;
      background: #282a2c;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #8ab4f8;
      font-size: 12px;
      font-weight: bold;
    }
    .dock-sub-right {
      width: 46px;
      background: #333637;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .dock-btn {
      width: 44px;
      height: 40px;
      border-radius: 20px;
      background: #333637;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .dock-btn.more-btn {
      width: 32px;
      border-radius: 16px;
    }
    .dock-btn.end-btn {
      width: 66px;
      border-radius: 20px;
      background: #db372c;
    }

    /* Bottom Right Actions */
    .meet-right-actions {
      position: absolute;
      right: 14px;
      display: flex;
      align-items: center;
      gap: 14px;
      color: #e8eaed;
    }
    .action-badge-group {
      position: relative;
      display: flex;
      align-items: center;
    }
    .people-badge {
      position: absolute;
      top: -6px;
      right: -8px;
      background: #5f6368;
      color: white;
      font-size: 9px;
      font-weight: bold;
      border-radius: 10px;
      padding: 1px 4px;
    }

    /* POPCORN Extension Floating Container */
    .popcorn-popup-wrapper {
      position: absolute;
      top: 14px;
      right: 18px;
      z-index: 1000;
      box-shadow: 0 20px 48px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      overflow: hidden;
    }
  </style>

  <div class="meet-container">
    <!-- Top Header -->
    <div class="meet-top-header">
      <span class="meet-time">10:15 AM</span>
      <span class="meet-sep">|</span>
      <span class="meet-title">Daily Standup · Product Team</span>
      <span class="meet-info-icon">i</span>
    </div>

    <!-- Video Grid (2x2) -->
    <div class="meet-grid">
      <!-- Tile 1: Alice Martin -->
      <div class="video-tile">
        <div class="avatar-circle" style="background: #c2185b;">A</div>
        <div class="tile-mic">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
        </div>
        <div class="tile-name">Alice Martin</div>
      </div>

      <!-- Tile 2: David Chen -->
      <div class="video-tile">
        <div class="avatar-circle" style="background: #137333; margin-right: 200px;">D</div>
        <div class="tile-mic left-side">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="white"><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/></svg>
        </div>
        <div class="tile-name">David Chen</div>
      </div>

      <!-- Tile 3: Sarah Connor (Active Speaker) -->
      <div class="video-tile active-speaker">
        <div class="avatar-circle" style="background: #7b1fa2;">S</div>
        <div class="tile-menu-btn">⋮</div>
        <div class="tile-name">
          <span>Sarah Connor</span>
          <div class="eq-wave">
            <div class="eq-bar eq-1"></div>
            <div class="eq-bar eq-2"></div>
            <div class="eq-bar eq-3"></div>
          </div>
        </div>
      </div>

      <!-- Tile 4: Florian Wilhelm (You) -->
      <div class="video-tile">
        <div class="avatar-circle" style="background: #1a73e8; margin-right: 200px;">F</div>
        <div class="tile-mic left-side">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
        </div>
        <div class="tile-name">You (Florian Wilhelm)</div>
      </div>
    </div>

    <!-- Authentic Center Floating Dock -->
    <div class="meet-bottom-bar">
      <div class="meet-dock">
        <!-- 1: Mic Pill -->
        <div class="dock-split-pill">
          <div class="dock-sub-left">
            <span style="letter-spacing: 2px; font-size: 14px;">...</span>
          </div>
          <div class="dock-sub-right">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
          </div>
        </div>

        <!-- 2: Cam Pill -->
        <div class="dock-split-pill">
          <div class="dock-sub-left">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8ab4f8" stroke-width="2.5"><path d="M18 15l-6-6-6 6"/></svg>
          </div>
          <div class="dock-sub-right">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="2" y="5" width="14" height="14" rx="2"/><path d="M16 10l5-4v12l-5-4v-4z" fill="white"/></svg>
          </div>
        </div>

        <!-- 3: Present Screen (Laptop + Arrow) -->
        <div class="dock-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <rect x="3" y="4" width="18" height="12" rx="2"/>
            <path d="M12 7l-3 3.5h2v3h2v-3h2L12 7z" fill="white" stroke="none"/>
            <line x1="1" y1="19" x2="23" y2="19" stroke-linecap="round"/>
          </svg>
        </div>

        <!-- 4: Reactions (Smiley) -->
        <div class="dock-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <circle cx="12" cy="12" r="9"/>
            <circle cx="9" cy="10" r="1" fill="white"/>
            <circle cx="15" cy="10" r="1" fill="white"/>
            <path d="M8 14c1 2 3 2.5 4 2.5s3-.5 4-2.5" fill="white" stroke="none"/>
          </svg>
        </div>

        <!-- 5: CC -->
        <div class="dock-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <rect x="2" y="5" width="20" height="14" rx="2.5"/>
            <path d="M8.5 10H7c-.8 0-.8 4 0 4h1.5M15.5 10H14c-.8 0-.8 4 0 4h1.5" stroke-linecap="round"/>
          </svg>
        </div>

        <!-- 6: Hand -->
        <div class="dock-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v4M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v6M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8M6 14a2 2 0 0 0-2-2 2 2 0 0 0-2 2c0 5 4 9 9 9h3c5 0 8-4 8-9v-3a2 2 0 0 0-2-2 2 2 0 0 0-2 2"/>
          </svg>
        </div>

        <!-- 7: More -->
        <div class="dock-btn more-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
        </div>

        <!-- 8: End Call -->
        <div class="dock-btn end-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.996.996 0 0 1 0-1.41C3.42 8.47 7.48 6.64 12 6.64c4.52 0 8.58 1.83 11.71 5.03.39.39.39 1.02 0 1.41l-2.48 2.48c-.18.18-.43.29-.71.29s-.52-.11-.7-.28c-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/></svg>
        </div>
      </div>

      <!-- Right Action Icons -->
      <div class="meet-right-actions">
        <!-- People + Badge -->
        <div class="action-badge-group">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <span class="people-badge">8</span>
        </div>

        <!-- Chat -->
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>

        <!-- Activities (Shapes) -->
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="12,2 17,10 7,10"/>
          <rect x="6" y="13" width="5" height="5"/>
          <circle cx="16.5" cy="15.5" r="2.8"/>
        </svg>

        <!-- Host Lock -->
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          <rect x="9.5" y="11" width="5" height="4" rx="1" fill="currentColor"></rect>
        </svg>
      </div>
    </div>

    <!-- Extension Popup or Modal Overlay -->
    ${isModal ? popupHtml : `<div class="popcorn-popup-wrapper">${popupHtml}</div>`}
  </div>`;
}

// -------------------------------------------------------------
// SCREENSHOT 1: Standup Tab (Update Tab)
// -------------------------------------------------------------
const s1Popup = `
<style>${popupCss}</style>
<div style="width: 384px; background: var(--ink); color: var(--text); font-family: var(--sans);">
  <header class="bar">
    <div class="bar-main">
      <span class="eyebrow">Current Meeting</span>
      <h1>Daily Standup · Product Team</h1>
    </div>
    <div class="bar-side">
      <span class="badge active">active</span>
      <img class="header-logo" src="data:image/png;base64,${icon48Base64}" width="34" height="34" alt="POPCORN" />
    </div>
  </header>

  <nav class="tabs">
    <button class="tab active">Update</button>
    <button class="tab">People</button>
    <button class="tab">Meetings</button>
    <button class="tab icon-tab" title="Settings">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0 2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
  <section style="display: block; padding: 0 16px 14px;">
    <div class="round-presence" style="display: flex; align-items: center; justify-content: space-between; margin: 10px 0 4px;">
      <span>7 present of 8 · 1 newly added</span>
    </div>
    <ol class="list" style="padding: 0; margin: 10px 0;">
      <!-- Item 1: Alice Martin (Done) -->
      <li class="item">
        <span class="pos">01</span>
        <label class="check-item">
          <input type="checkbox" checked style="accent-color: #38bdf8; background: #38bdf8;" />
        </label>
        <span class="name" style="text-decoration: line-through; color: var(--muted); flex: 1;">Alice Martin</span>
        <span class="due-tag due-today" style="margin-left: auto;">today · 10:15</span>
      </li>

      <!-- Item 2: Florian Wilhelm -->
      <li class="item">
        <span class="pos">02</span>
        <label class="check-item">
          <input type="checkbox" />
        </label>
        <span class="name" style="flex: 1; font-weight: 500;">Florian Wilhelm</span>
        <span class="due-tag due-overdue-medium">3d ago · 3 Sep</span>
      </li>

      <!-- Item 3: Sarah Connor -->
      <li class="item">
        <span class="pos">03</span>
        <label class="check-item">
          <input type="checkbox" />
        </label>
        <span class="name" style="flex: 1; font-weight: 500;">Sarah Connor</span>
        <span class="due-tag due-overdue-low">1d ago · 5 Sep</span>
      </li>

      <!-- Item 4: David Chen -->
      <li class="item">
        <span class="pos">04</span>
        <label class="check-item">
          <input type="checkbox" />
        </label>
        <span class="name" style="flex: 1; font-weight: 500;">David Chen</span>
        <span class="due-tag due-overdue-low">yesterday</span>
      </li>

      <!-- Item 5: Elena Rostova (Random Name) -->
      <li class="item">
        <span class="pos">05</span>
        <label class="check-item">
          <input type="checkbox" />
        </label>
        <span class="name" style="flex: 1; font-weight: 500;">Elena Rostova</span>
        <span class="due-tag due-overdue-high">4d ago · 2 Sep</span>
      </li>

      <!-- Item 6: Liam Vance (Random Name) -->
      <li class="item">
        <span class="pos">06</span>
        <label class="check-item">
          <input type="checkbox" />
        </label>
        <span class="name" style="flex: 1; font-weight: 500;">Liam Vance</span>
        <span class="due-tag due-overdue-high">5d ago · 1 Sep</span>
      </li>
    </ol>

    <div class="row" style="display: flex; gap: 8px; margin-top: 14px;">
      <button class="primary btn-with-icon" style="flex: 1; height: 38px;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M16 3h5v5"></path>
          <path d="M4 20L21 3"></path>
          <path d="M21 16v5h-5"></path>
          <path d="M15 15l6 6"></path>
          <path d="M4 4l5 5"></path>
        </svg>
        <span style="font-weight: 600;">More People</span>
      </button>
      <button class="ghost icon-btn" style="width: 38px; height: 38px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
          <path d="M21 3v5h-5"/>
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
          <path d="M3 21v-5h5"/>
        </svg>
      </button>
    </div>

    <label class="check" style="display: flex; align-items: center; gap: 8px; margin-top: 10px; font-size: 12px; color: var(--muted);">
      <input type="checkbox" />
      <span>Include absent</span>
    </label>
  </section>
</div>
`;

const s1Html = getChromeWindowWrap(
  "Daily Standup - Google Meet",
  "https://meet.google.com/wqe-ptro-xyz",
  true,
  getGoogleMeetCallHtml(s1Popup)
);
fs.writeFileSync(path.join(pagesDir, 'screenshot1_standup.html'), s1Html);


// -------------------------------------------------------------
// SCREENSHOT 2: People Tab (Attendance & Statuses)
// -------------------------------------------------------------
const s2Popup = `
<style>${popupCss}</style>
<div style="width: 384px; background: var(--ink); color: var(--text); font-family: var(--sans);">
  <header class="bar">
    <div class="bar-main">
      <span class="eyebrow">Current Meeting</span>
      <h1>Daily Standup · Product Team</h1>
    </div>
    <div class="bar-side">
      <span class="badge active">active</span>
      <img class="header-logo" src="data:image/png;base64,${icon48Base64}" width="34" height="34" alt="POPCORN" />
    </div>
  </header>

  <nav class="tabs">
    <button class="tab">Update</button>
    <button class="tab active">People</button>
    <button class="tab">Meetings</button>
    <button class="tab icon-tab" title="Settings">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0 2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
    </button>
  </nav>

  <section style="display: block; padding: 12px 16px 14px;">
    <!-- Add Person Input Row -->
    <div class="row add" style="display: flex; gap: 8px; margin-bottom: 12px;">
      <input type="text" placeholder="Add person..." style="flex: 1; height: 36px; background: var(--ink-2); border: 1px solid var(--line); border-radius: 6px; padding: 0 10px; color: var(--text); font-size: 13px;" />
      <button class="primary btn-with-icon" style="height: 36px; padding: 0 14px;">
        <span style="font-weight: 600;">+ Add</span>
      </button>
    </div>

    <!-- Attendees List -->
    <ul class="list plain" style="padding: 0; margin: 0; max-height: 270px; overflow-y: hidden;">
      <li class="item">
        <span class="status-dot present" title="Present"></span>
        <span class="name" style="flex: 1; font-weight: 500;">Alice Martin</span>
        <button class="ghost icon-btn btn-ignore" style="margin-right: 6px; width: 26px; height: 26px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        <span class="due-tag due-overdue-high">5d overdue</span>
      </li>

      <li class="item">
        <span class="status-dot present" title="Present"></span>
        <span class="name" style="flex: 1; font-weight: 500;">Florian Wilhelm</span>
        <button class="ghost icon-btn btn-ignore" style="margin-right: 6px; width: 26px; height: 26px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        <span class="due-tag due-overdue-medium">3d overdue</span>
      </li>

      <li class="item">
        <span class="status-dot present" title="Present"></span>
        <span class="name" style="flex: 1; font-weight: 500;">Sarah Connor</span>
        <button class="ghost icon-btn btn-ignore" style="margin-right: 6px; width: 26px; height: 26px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        <span class="due-tag due-overdue-low">1d overdue</span>
      </li>

      <li class="item">
        <span class="status-dot present" title="Present"></span>
        <span class="name" style="flex: 1; font-weight: 500;">David Chen</span>
        <button class="ghost icon-btn btn-ignore" style="margin-right: 6px; width: 26px; height: 26px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        <span class="due-tag due-today">Today</span>
      </li>

      <li class="item">
        <span class="status-dot absent" title="Absent"></span>
        <span class="name" style="flex: 1; color: var(--muted);">Elena Rostova</span>
        <button class="ghost icon-btn btn-ignore" style="margin-right: 6px; width: 26px; height: 26px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        <span class="due-tag due-overdue-medium">3d overdue</span>
      </li>

      <li class="item">
        <span class="status-dot ignored" title="Ignored"></span>
        <span class="name" style="flex: 1; color: var(--muted); text-decoration: line-through;">Marcus Brody</span>
        <button class="ghost icon-btn btn-ignore is-ignored" style="margin-right: 6px; width: 26px; height: 26px; color: #ef4444;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        </button>
        <span class="due-tag due-ignored">Ignored</span>
      </li>
    </ul>

    <!-- Footer Stats & Actions -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--line); font-size: 11.5px; color: var(--muted);">
      <span>8 participants · 6 present</span>
      <button class="ghost" style="font-size: 11px; padding: 4px 8px; border-radius: 4px;">Delete Mode</button>
    </div>
  </section>
</div>
`;

const s2Html = getChromeWindowWrap(
  "Daily Standup - Google Meet",
  "https://meet.google.com/wqe-ptro-xyz",
  true,
  getGoogleMeetCallHtml(s2Popup)
);
fs.writeFileSync(path.join(pagesDir, 'screenshot2_people.html'), s2Html);


// -------------------------------------------------------------
// SCREENSHOT 3: Meetings Tab (Google Meet in Background)
// -------------------------------------------------------------
const s3Popup = `
<style>${popupCss}</style>
<div style="width: 384px; background: var(--ink); color: var(--text); font-family: var(--sans);">
  <header class="bar">
    <div class="bar-main">
      <span class="eyebrow">Current Meeting</span>
      <h1>Daily Standup · Product Team</h1>
    </div>
    <div class="bar-side">
      <span class="badge active">active</span>
      <img class="header-logo" src="data:image/png;base64,${icon48Base64}" width="34" height="34" alt="POPCORN" />
    </div>
  </header>

  <nav class="tabs">
    <button class="tab">Update</button>
    <button class="tab">People</button>
    <button class="tab active">Meetings</button>
    <button class="tab icon-tab" title="Settings">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0 2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
    </button>
  </nav>

  <section style="display: block; padding: 12px 16px 14px;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
      <span class="eyebrow" style="font-size: 11px;">Tracked Meetings</span>
      <button class="ghost icon-btn" style="width: 24px; height: 24px; font-size: 16px; font-weight: bold;">+</button>
    </div>

    <!-- Meeting Cards -->
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <!-- Meeting 1 -->
      <div style="background: var(--ink-2); border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div style="font-weight: 600; font-size: 13px; color: var(--text);">Daily Standup · Product Team</div>
          <div style="font-size: 11px; color: var(--muted); margin-top: 2px;">8 members · synced 2h ago</div>
        </div>
        <div style="display: flex; gap: 6px;">
          <button class="ghost icon-btn" style="width: 28px; height: 28px;" title="Open link">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </button>
          <button class="ghost icon-btn" style="width: 28px; height: 28px;" title="Edit Markdown">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </button>
          <button class="ghost icon-btn" style="width: 28px; height: 28px;" title="Export">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
        </div>
      </div>

      <!-- Meeting 2 -->
      <div style="background: var(--ink-2); border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div style="font-weight: 600; font-size: 13px; color: var(--text);">Team Weekly DS &amp; NLP</div>
          <div style="font-size: 11px; color: var(--muted); margin-top: 2px;">37 members · synced yesterday</div>
        </div>
        <div style="display: flex; gap: 6px;">
          <button class="ghost icon-btn" style="width: 28px; height: 28px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></button>
          <button class="ghost icon-btn" style="width: 28px; height: 28px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></button>
          <button class="ghost icon-btn" style="width: 28px; height: 28px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>
        </div>
      </div>

      <!-- Meeting 3 -->
      <div style="background: var(--ink-2); border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div style="font-weight: 600; font-size: 13px; color: var(--text);">Sprint Retrospective &amp; Sync</div>
          <div style="font-size: 11px; color: var(--muted); margin-top: 2px;">12 members · synced 3d ago</div>
        </div>
        <div style="display: flex; gap: 6px;">
          <button class="ghost icon-btn" style="width: 28px; height: 28px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></button>
          <button class="ghost icon-btn" style="width: 28px; height: 28px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></button>
          <button class="ghost icon-btn" style="width: 28px; height: 28px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>
        </div>
      </div>
    </div>

    <!-- Export Button -->
    <div style="margin-top: 14px;">
      <button class="ghost" style="width: 100%; height: 36px; font-weight: 500; font-size: 12.5px;">Export all meetings (.json)</button>
    </div>
  </section>
</div>
`;

const s3Html = getChromeWindowWrap(
  "Daily Standup - Google Meet",
  "https://meet.google.com/wqe-ptro-xyz",
  true,
  getGoogleMeetCallHtml(s3Popup)
);
fs.writeFileSync(path.join(pagesDir, 'screenshot3_meetings.html'), s3Html);


// -------------------------------------------------------------
// SCREENSHOT 4: Markdown Minutes & Table Modal
// -------------------------------------------------------------
const s4Popup = `
<style>${popupCss}</style>
<div style="width: 384px; height: 520px; background: var(--ink); color: var(--text); font-family: var(--sans); position: relative; overflow: hidden; display: flex; flex-direction: column; box-sizing: border-box;">
  <!-- Real POPCORN Markdown Overlay View (Fills entire overlay window) -->
  <div class="modal-backdrop" style="position: absolute; inset: 0;">
    <div class="modal-box">
      <div class="modal-header">
        <span class="modal-title">Edit "Daily Standup · Product Team"</span>
      </div>
      <p class="modal-hint">View, edit, or copy the Markdown table of this meeting:</p>
      <textarea rows="13" wrap="off" spellcheck="false" style="outline: 2px solid var(--accent); outline-offset: 1px; flex: 1 1 auto;"># Daily Standup · Product Team

| Person | Last Update |
| --- | --- |
| Alice Martin | 05/09/2026, 10:14:20 |
| Florian Wilhelm | 05/09/2026, 10:12:05 |
| Sarah Connor | 04/09/2026, 10:15:30 |
| David Chen | 03/09/2026, 10:11:45 |
| Elena Rostova | 02/09/2026, 10:09:12 |
| Liam Vance | 01/09/2026, 10:15:00 |
| Marcus Brody | 25/08/2026, 10:05:18 |
| Thomas Clark | ignored |
| Jenny Wu | ignored |</textarea>
      <div class="modal-footer">
        <div class="modal-footer-left">
          <button class="ghost mini btn-with-icon" title="Copy Markdown to clipboard">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>Copy</span>
          </button>
          <button class="ghost mini btn-with-icon" title="Load Markdown file from disk">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>Load file</span>
          </button>
        </div>
        <div class="modal-footer-right">
          <button class="ghost mini">Cancel</button>
          <button class="primary mini">Save Changes</button>
        </div>
      </div>
    </div>
  </div>
</div>
`;

const s4Html = getChromeWindowWrap(
  "Daily Standup - Google Meet",
  "https://meet.google.com/wqe-ptro-xyz",
  true,
  getGoogleMeetCallHtml(s4Popup, false)
);
fs.writeFileSync(path.join(pagesDir, 'screenshot4_markdown.html'), s4Html);


// -------------------------------------------------------------
// PROMOTIONAL ASSETS: Marquee (1400x560) & Small (440x280)
// -------------------------------------------------------------
const marqueeHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700;800&family=Inter:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; }
  body {
    margin: 0;
    width: 1400px;
    height: 560px;
    background: radial-gradient(circle at 75% 30%, #1e293b 0%, #0a0e17 70%, #05070a 100%);
    color: white;
    font-family: 'Google Sans', 'Inter', sans-serif;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 90px;
    overflow: hidden;
    position: relative;
  }
  .bg-glow {
    position: absolute;
    width: 600px;
    height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, transparent 70%);
    top: -150px;
    right: 200px;
    pointer-events: none;
  }
  .left {
    max-width: 620px;
    z-index: 2;
  }
  .badge-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 20px;
    background: rgba(56, 189, 248, 0.12);
    border: 1px solid rgba(56, 189, 248, 0.35);
    color: #38bdf8;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.5px;
    margin-bottom: 20px;
  }
  h1 {
    font-size: 56px;
    font-weight: 800;
    line-height: 1.1;
    margin: 0 0 16px;
    letter-spacing: -1px;
    background: linear-gradient(135deg, #ffffff 40%, #93c5fd 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  p {
    font-size: 20px;
    line-height: 1.5;
    color: #94a3b8;
    margin: 0 0 32px;
  }
  .feature-pills {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
  .pill {
    padding: 8px 16px;
    background: #1e2530;
    border: 1px solid #334155;
    border-radius: 8px;
    font-size: 13.5px;
    font-weight: 600;
    color: #e2e8f0;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .right {
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .mascot-card {
    width: 440px;
    background: #111827;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 20px;
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.65), 0 0 40px rgba(56, 189, 248, 0.15);
    padding: 30px;
    text-align: center;
    position: relative;
  }
  .mascot-img {
    width: 140px;
    height: 140px;
    object-fit: contain;
    filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.5));
    margin-bottom: 16px;
  }
  .card-title {
    font-size: 24px;
    font-weight: 700;
    color: white;
    margin-bottom: 6px;
  }
  .card-sub {
    font-size: 14px;
    color: #38bdf8;
    font-weight: 600;
  }
</style>
</head>
<body>
  <div class="bg-glow"></div>
  <div class="left">
    <div class="badge-tag">
      <span>🍿</span>
      <span>FOR GOOGLE MEET &amp; AGILE TEAMS</span>
    </div>
    <h1>Standup &amp; Speaker Picker</h1>
    <p>Fair, randomized speaker rotation for daily standups, retrospectives, and agile team meetings.</p>
    <div class="feature-pills">
      <div class="pill"><span>🎯</span> Fair Rotation Algorithm</div>
      <div class="pill"><span>👥</span> Real-Time Attendance</div>
      <div class="pill"><span>📝</span> Markdown Export</div>
    </div>
  </div>
  <div class="right">
    <div class="mascot-card">
      <img class="mascot-img" src="data:image/png;base64,${icon128Base64}" alt="POPCORN Mascot" />
      <div class="card-title">POPCORN</div>
      <div class="card-sub">Next speaker, fair &amp; candid</div>
    </div>
  </div>
</body>
</html>`;
fs.writeFileSync(path.join(pagesDir, 'promo_marquee.html'), marqueeHtml);

const promoSmallHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@700;800&family=Inter:wght@600;700&display=swap');
  * { box-sizing: border-box; }
  body {
    margin: 0;
    width: 440px;
    height: 280px;
    background: radial-gradient(circle at 60% 40%, #1e293b 0%, #0a0e17 80%);
    color: white;
    font-family: 'Google Sans', 'Inter', sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    text-align: center;
    overflow: hidden;
  }
  .logo-img {
    width: 82px;
    height: 82px;
    object-fit: contain;
    filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.6));
    margin-bottom: 12px;
  }
  h1 {
    font-size: 26px;
    font-weight: 800;
    margin: 0 0 6px;
    letter-spacing: -0.5px;
    color: white;
  }
  p {
    font-size: 13px;
    color: #94a3b8;
    margin: 0;
    font-weight: 500;
  }
  .tag {
    margin-top: 10px;
    padding: 3px 10px;
    background: rgba(56, 189, 248, 0.15);
    border: 1px solid rgba(56, 189, 248, 0.3);
    border-radius: 12px;
    color: #38bdf8;
    font-size: 11px;
    font-weight: 700;
  }
</style>
</head>
<body>
  <img class="logo-img" src="data:image/png;base64,${icon128Base64}" alt="POPCORN" />
  <h1>POPCORN</h1>
  <p>Google Meet Standup &amp; Speaker Picker</p>
  <div class="tag">FAIR SPEAKER ORDER</div>
</body>
</html>`;
fs.writeFileSync(path.join(pagesDir, 'promo_small.html'), promoSmallHtml);

console.log("✅ Successfully generated all authentic HTML pages in store_assets/pages/");
