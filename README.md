# 🍿 POPCORN – Participant Order Picker for Candid On-call Reporting & Notes

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-POPCORN-blue?logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/popcorn-%E2%80%93-google-meet-sta/ohfgelbmjoepoocbcmmlhlfcholfogmb)
[![EffVer Versioning](https://img.shields.io/badge/version_scheme-EffVer-0097a7)](https://jacobtomlinson.dev/effver)

**POPCORN** is a lightweight, privacy-friendly Chrome extension that brings fair and effortless "Popcorn-style" update rotation to Google Meet. It automatically tracks when participants last gave a project update and suggests the candidates whose updates are most overdue.

---

## 💡 Why POPCORN?

- **P**articipant
- **O**rder
- **P**icker for
- **C**andid
- **O**n-call
- **R**eporting &
- **N**otes

In agile team culture, passing the microphone organically is known as *"Popcorn style"*. POPCORN takes away the cognitive burden of asking *"Who hasn't given an update in a while?"* while keeping standups and weekly syncs fun, snappy, and fair.

---

## 🚀 Key Features

- 🎯 **Smart Rotation**: Suggests the top attendees present in the call who haven't spoken the longest.
- ✅ **One-Click Check-Off**: Click a participant's checkbox to mark their update complete with an instant strikethrough.
- 👥 **Real-Time Attendance**: Syncs live attendees from Google Meet and highlights newly joined teammates.
- 👁️ **Ignore Toggle**: Mute or exclude specific participants (e.g. guests or passive listeners) with a single click.
- 🗑️ **Delete Mode**: Clean up outdated or temporary participants easily.
- 📅 **Meeting Aliasing & History**: Recognizes recurring meetings and tracks multiple meetings across teams.
- 📝 **Full Markdown & JSON Import/Export**: View, edit, copy, and share meetings effortlessly as clean Markdown tables across Notion, Obsidian, GitHub, and Docs.
- 🔒 **Zero Telemetry / Local-Only**: Everything is saved locally in `chrome.storage.local`. No external servers.

---

## 🛠️ Installation

### Option 1: Chrome Web Store (Recommended & Quickest)
Install POPCORN directly from the official Google Chrome Web Store with automatic background updates:

👉 **[Install from Chrome Web Store](https://chromewebstore.google.com/detail/popcorn-%E2%80%93-google-meet-sta/ohfgelbmjoepoocbcmmlhlfcholfogmb)**

### Option 2: Release Bundle (.zip)
1. Download the `popcorn-v*.zip` bundle from the latest [GitHub Release](https://github.com/FlorianWilhelm/popcorn/releases).
2. Unzip the downloaded file into a folder.
3. In Chrome (or any Chromium browser like Brave or Edge), navigate to `chrome://extensions`.
4. Enable **Developer mode** in the top-right corner.
5. Click **Load unpacked** and select the unzipped folder.
6. Pin **POPCORN (🍿)** to your extension toolbar.

### Option 3: From Source (Developers)
1. Clone this repository: `git clone https://github.com/FlorianWilhelm/popcorn.git`
2. In Chrome, navigate to `chrome://extensions`.
3. Enable **Developer mode** in the top-right corner.
4. Click **Load unpacked** and select the `src/` directory in this repository.
5. Pin **POPCORN (🍿)** to your extension toolbar.

---

## 📖 How It Works

### 1. Activating a Meeting
By default, POPCORN is completely passive in untracked meetings. When you open the popup in Google Meet:
- If tracking is disabled, verify or adjust the meeting name and click **Enable Tracking**.
- From that moment on, POPCORN remembers attendance and rotation history for all future occurrences.

### 2. Giving Updates & Rotation
- The **People** tab displays attendance presence and the fair speaker rotation order for today's meeting.
- As someone finishes their update, click their checkbox. The person is marked done with a strikethrough and timestamp.
- Click the **Refresh (🔄)** icon to re-sync live attendance from Meet anytime.
- Use the toolbar buttons to sort alphabetically, add participants, toggle delete mode, or show absent/ignored members.

### 3. Managing Attendees
- In the **People** tab, view everyone ever tracked for the meeting, sorted by their last update date.
- Click the eye icon (**👁️ / 🚫**) on any row to ignore/unignore participants.
- Toggle the **Delete Mode (🗑)** icon in the toolbar to remove former teammates.
- Manually add attendees via the **+ Add** input field.

### 4. Settings & Backups
- Adjust the number of candidates shown per round (default: 5).
- Configure automatic live refresh intervals.
- Export/import single meetings as Markdown or full database backups as JSON.

---

## 🏷️ Versioning

This project follows **[EffVer (Intended Effort Versioning)](https://jacobtomlinson.dev/effver/)** (`Macro.Meso.Micro`):

- **Macro**: Significant effort required to adopt (major rework, extensive breaking changes).
- **Meso**: Some small effort required to adopt (minor breaking adjustments, changes affecting workarounds).
- **Micro**: No effort required (bug fixes, enhancements, seamless updates).

To bump the version across all files, run:
```bash
npm run bump -- micro    # No effort to adopt (e.g. 0.28.0 -> 0.28.1)
npm run bump -- meso     # Some effort to adopt (e.g. 0.28.0 -> 0.29.0)
npm run bump -- macro    # Large effort to adopt (e.g. 0.28.0 -> 1.0.0)
```

---

## 📄 License

Distributed under the [MIT License](LICENSE). Feel free to use and adapt for your team's standups!

