# Meet Update Rotator

Chrome extension that suggests the five attendees present in a Google Meet whose last project update was the longest ago.

Tracking is linked to the **name of the meeting**, not to the specific calendar event, weekday, or meeting code. A meeting occurring on Mondays some weeks and Thursdays other weeks is still recognized as the same meeting.

## Installation

1. Unzip the archive.
2. In Chrome, open `chrome://extensions`.
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked** and select the `meet-update-rotator` folder.
5. Pin the extension to your toolbar.

## Core Principle

By default, the extension is **off** in every meeting. It only reads the meeting name without touching the participant list.

### Enabling Tracking

Click the extension icon during the desired meeting. The extension displays the recognized name, for example `Team Weekly DS & NLP`. You can adjust the name before enabling, then click **Enable Tracking**.

For ad-hoc meetings without a calendar event, the page title only contains the meeting code. In this case, the name field remains empty and you enter the name manually. Tracking will match on this name from then on.

### Flow in a Tracked Meeting

1. On first launch, all detected attendees are added with timestamp 0 (January 1, 1970).
2. Present attendees are displayed, sorted in ascending order by their last update.
3. The top 5 are shown with toggles. Enabling the toggle sets today's date; disabling it restores the previous timestamp.
4. On subsequent meetings with the same name, it continues from step 2.

- **More People**: forces a new selection of the next candidates. This happens automatically after six hours.
- **Refresh (🔄 icon)**: re-reads attendance manually while keeping the current selection intact so items don't shift while checking off.
- **Include absent**: also includes participants who are not currently in the call.

## Tabs & Navigation

- **Update**: current candidates for the next update in the active meeting.
- **People**: full participant list of the meeting; add people (`+`), remove via trash icon (`🗑`), or adjust timestamps using toggles.
- **Meetings**: all tracked meetings.
  - **Meeting Box**: inline editable name, attendee count badge (`👤 36`), and integrated open icon (`↗`) to switch to its participant list.
  - **Pencil (✏️)**: opens the Markdown editor modal to view, edit, or copy the Markdown table to your clipboard.
  - **Download (⬇)**: exports the meeting directly as a readable `.md` file.
  - **Trash (🗑)**: stops tracking and deletes the saved history of the meeting.
  - **+ Button (toolbar)**: opens the modal to create a new meeting from pasted Markdown or load a file from disk.
- **Settings (⚙️ gear)**:
  - Configure the number of update candidates (default: 5).
  - Configure automatic live refresh during meetings (default: every 2 seconds).
  - **Export full backup (JSON)**: complete export of all meetings and settings.

## When Calendar Titles Change

Two seamless approaches:

- The extension usually continues recognizing the meeting by its meeting code and automatically associates the new title as an alias, indicating this in the status area.
- Otherwise, the activation screen appears. Select the existing list in the dropdown and click **Link**. The new title is added as an alias and the history is preserved.

Old names remain saved for recognition, so renaming back in your calendar won't break anything.

## Storage & Export

Data is stored in `chrome.storage.local`.

### Markdown Export (Single Meeting)

```markdown
# Team Weekly DS & NLP

| Person | Last Update |
| --- | --- |
| Max Mustermann | 24.08.2026, 10:15:00 |
| Erika Musterfrau | 17.08.2026, 09:30:00 |
| Collin Rogowski |  |
```

### JSON Backup (All Meetings)

```json
{
  "version": 2,
  "meetings": {
    "m_abc123_x9f2k": {
      "id": "m_abc123_x9f2k",
      "name": "Team Weekly DS & NLP",
      "aliases": ["team weekly ds & nlp", "team weekly ds and nlp"],
      "codes": ["abc-defg-hij"],
      "people": {
        "erika mustermann": { "name": "Erika Mustermann", "last": 1755000000000, "prev": 0 }
      }
    }
  }
}
```

`last` is a Unix timestamp in milliseconds (`0` means never updated). When importing JSON, the extension asks whether to replace or merge lists. When importing Markdown, matching meeting names will prompt before overwriting.

## Limitations

- Google Meet does not provide a public browser API for attendee lists or meeting titles. The extension reads the DOM and `document.title`. If Google changes the markup, `content.js` may need adjustments. The code relies on stable attributes like `role="listitem"`, `data-participant-id`, and the page title rather than obfuscated class names.
- Invited attendees who have not joined are only displayed by Meet in specific calendar configurations. Missing participants can be added manually in the People tab.
- Names serve as keys. Two participants with identical display names are tracked as one person.
