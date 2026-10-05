# 🍿 Chrome Web Store Publishing Guide for POPCORN

Everything is prepared and packaged to submit **POPCORN** to the Chrome Web Store.

---

## 🚀 Quick Step-by-Step Submission

1. **Go to the Chrome Developer Dashboard**:
   👉 [https://chrome.google.com/webstore/devconsole](https://chrome.google.com/webstore/devconsole)
   *(If you don't have a developer account yet, there is a one-time \$5 registration fee from Google).*

2. **Click "New Item"** (top right) and upload the ready-made ZIP file:
   📂 `dist/popcorn-v0.31.0.zip`
   *(You can rebuild it anytime by running `npm run package`)*

3. **Fill out the fields below (Copy & Paste ready)**:

---

## 📝 1. Store Listing Details

### **Item Title** (Max 45-75 chars)
```text
POPCORN – Google Meet Standup & Speaker Picker
```

### **Short Description** (Max 132 chars)
```text
Fair speaker order & standup picker for Google Meet. Rotates attendees popcorn-style for smooth daily updates and notes.
```

### **Detailed Description**
```markdown
🍿 POPCORN – Participant Order Picker for Candid On-call Reporting & Notes

Bring fair, effortless, and fun "Popcorn-style" speaker rotation to your Google Meet daily standups, weekly syncs, and team roundtables.

POPCORN automatically tracks when attendees last gave a project update and suggests the candidates whose turns are most overdue — taking away the awkward silence and cognitive load of asking "Who wants to go next?".

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌟 KEY FEATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 Smart Popcorn Rotation:
• Automatically suggests the next speakers based on who hasn't spoken in the longest time.
• One-click checkboxes mark participants done for today with an instant strikethrough.
• Scrollable active rotation list displaying all present attendees in priority order (01, 02, ...).
• Dual sorting modes: toggle between fair rotation priority and alphabetical view at any time.

👥 Automatic Roster & Presence Tracking:
• Automatically detects attendees currently present in your Google Meet call.
• Filters out screen shares, presentation tiles, and UI noise icons.
• Supports attendee ignore toggles and manual roster adjustments.

📋 Multi-Meeting & History Management:
• Keep separate histories for different standups (e.g. "Core Team", "Sprint Review", "Cross-Team Sync").
• Seamlessly reconnects even if calendar titles or meeting codes change.

📝 Full Markdown Import & Export:
• Everything can also be exported and imported as clean, human-readable Markdown!
• In-app Markdown editor with live validation to view, edit, or copy meeting rosters & update timestamps directly to clipboard.
• Export or import any meeting to/from Markdown files (.md) or paste directly into Notion, Obsidian, GitHub Discussions, or Google Docs.

🔒 100% Privacy & Zero Telemetry:
• No backend, no external servers, no tracking, and no ads.
• All meeting rosters and history stay exclusively in your browser's local storage (`chrome.storage.local`).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 HOW TO USE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Join any Google Meet call.
2. Click the POPCORN mascot icon in your Chrome toolbar.
3. Click "Enable Tracking" for the current meeting.
4. Open the Meet People panel once so POPCORN can detect all attendees.
5. Watch POPCORN order attendees fairly, and simply check them off as each teammate completes their update!

Keep your daily standups snappy, engaging, and fair with POPCORN! 🍿🎙️
```

### **Category**
- **Primary Category:** `Productivity`
- **Secondary Category (if asked):** `Workflow & Planning`

### **Language**
- `English`

---

## 🎨 2. Graphic Assets (in `store_assets/`)

| Asset | File Path | Size Required | Description |
| :--- | :--- | :--- | :--- |
| **Store Icon** | `src/icons/icon128.png` | 128 x 128 px | Official POPCORN mascot store icon |
| **Small Promo Tile** | `store_assets/promo_small_440x280.jpeg` | 440 x 280 px | Search catalog promo card (JPEG, no filters) |
| **Marquee Banner** | `store_assets/promo_marquee_1400x560.jpeg` | 1400 x 560 px | Featured store showcase banner (JPEG, no filters) |
| **Screenshot 1 (Standup)** | `store_assets/screenshot1_standup_1280x800.jpeg` | 1280 x 800 px | Live Google Meet call with popcorn candidate rotation (JPEG) |
| **Screenshot 2 (Meetings)** | `store_assets/screenshot2_meetings_1280x800.jpeg` | 1280 x 800 px | Multi-meeting tracking & history list (JPEG) |
| **Screenshot 3 (Markdown)** | `store_assets/screenshot3_markdown_1280x800.jpeg` | 1280 x 800 px | In-app Markdown editor, roster table & export/import (JPEG) |

> 💡 **Tip:** All screenshots are generated in `store_assets/` as compliant `.jpeg` files (without graphical filters, fully compliant with Chrome Web Store guidelines). Open `store_assets/preview.html` in your browser to preview all screenshots and assets.

---

## 🛡️ 3. Privacy & Justifications Tab (Crucial for Approval)

### **Single Purpose Description**
```text
To facilitate fair popcorn-style speaker rotation and track update turns for attendees during Google Meet meetings.
```

### **Permission Justifications**

| Permission | Justification Text to Enter |
| :--- | :--- |
| **`storage`** | `To save attendee update history, meeting names, and user preferences locally in the browser.` |
| **`scripting`** | `To read participant names and live attendance from Google Meet calls when the user opens the extension.` |
| **`activeTab`** | `To interact with the active Google Meet tab when the popup is opened.` |
| **`tabs`** | `To identify the active Google Meet tab and read the meeting room title and code.` |
| **Host Permission (`https://meet.google.com/*`)** | `To inspect the DOM of Google Meet calls for participant rosters without sending any data over the network.` |

### **Data Usage Disclosures**
- **Data Collection:** Check **"I do not collect or use personal data."**
- **Certification:** Check **"I certify that my extension complies with the Chrome Web Store Developer Program Policies."**
- **Privacy Policy URL:**
  ```text
  https://github.com/FlorianWilhelm/popcorn/blob/main/PRIVACY.md
  ```

---

## 📦 4. Building New Releases
After bumping the version with `npm run bump -- <macro|meso|micro>`:
```bash
npm run package
```
This will automatically generate a clean `dist/popcorn-v<version>.zip` ready for upload.
