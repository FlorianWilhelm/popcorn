# 🍿 POPCORN – Participant Order Picker for Candid On-call Reporting & Notes

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
- 🔄 **Replenishment & Cycling**: "More People" removes checked participants and brings in fresh candidates from the pool seamlessly.
- 👁️ **Ignore Toggle**: Mute or exclude specific participants (e.g. guests or passive listeners) with a single click.
- 🗑️ **Delete Mode**: Clean up outdated or temporary participants easily.
- 📅 **Meeting Aliasing**: Recognizes recurring meetings even if calendar titles or meeting codes change.
- 📝 **Markdown & JSON Export**: Import/export full meeting rosters as readable Markdown tables or complete JSON backups.
- 🔒 **Zero Telemetry / Local-Only**: Everything is saved locally in `chrome.storage.local`. No external servers.

---

## 🛠️ Installation

1. In Chrome, navigate to `chrome://extensions`.
2. Enable **Developer mode** in the top-right corner.
3. Click **Load unpacked** and select this directory.
4. Pin **POPCORN (🍿)** to your extension toolbar.

---

## 📖 How It Works

### 1. Activating a Meeting
By default, POPCORN is completely passive in untracked meetings. When you open the popup in Google Meet:
- If tracking is disabled, verify or adjust the meeting name and click **Enable Tracking**.
- From that moment on, POPCORN remembers attendance and rotation history for all future occurrences.

### 2. Giving Updates
- The **Update** tab displays the top candidates for today's meeting.
- As someone finishes their update, click their checkbox. The person is marked `doneToday` with a strikethrough.
- Click **More People** to cycle in new candidates.
- Click the **Refresh (🔄)** icon to re-sync live attendance from Meet anytime.

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

## 📄 License

MIT License. Feel free to use and adapt for your team's standups!

