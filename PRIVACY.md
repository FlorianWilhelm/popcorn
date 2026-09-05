# Privacy Policy for POPCORN

**Last updated:** September 5, 2026

**POPCORN – Google Meet Standup & Speaker Picker** ("the Extension") is designed from the ground up to respect and protect your privacy.

---

## 1. Zero Data Collection & Zero Telemetry
- **No Personal Data Collected:** POPCORN does not collect, record, track, transmit, or sell any personal data, usage analytics, or telemetry.
- **No Remote Servers:** The Extension does not connect to any external server or backend. All calculations and operations run 100% locally on your computer.

---

## 2. Local Storage
- Meeting names, participant lists, attendance timestamps, and custom settings (such as candidate count and auto-refresh intervals) are stored exclusively in your browser's local storage via `chrome.storage.local`.
- This data never leaves your device and is never synchronized with any third-party service unless you explicitly export it using the Markdown/JSON export feature.

---

## 3. Permissions Used
The Extension requests only the minimum permissions necessary to function:
- `storage`: Required to store your meeting participant names and update history locally in your browser.
- `scripting` & `activeTab`: Required to read participant names and live attendance status from the active Google Meet call when the extension is in use.
- `tabs`: Required to detect the active Google Meet tab and read the meeting room title and meeting code.
- `host_permissions` (`https://meet.google.com/*`): Required exclusively to inspect the DOM of Google Meet calls for participant names and audio status without transmitting any information over the network.

---

## 4. User Control & Data Deletion
- You can edit, delete, or reset meeting data at any time directly in the Extension popup.
- Uninstalling the Extension completely removes all stored data from your browser.

---

## 5. Contact
If you have any questions or concerns regarding this Privacy Policy, please open an issue on the official GitHub repository:
https://github.com/fwilhelm/meet-update-rotator
