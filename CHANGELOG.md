# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [EffVer (Intended Effort Versioning)](https://jacobtomlinson.dev/effver/).

## [Unreleased]

### Changed
- **Locale-independent Markdown export**: Exported rosters now use `YYYY-MM-DD HH:mm` (local time) instead of the browser's locale format. Older exports in German, British, or US formats can still be imported.
- **Consistent name cleaning**: The popup now strips `(invited)` / `(eingeladen)` qualifiers from names just like the Meet scraper does, and treats whitespace-only names as invalid.

### Fixed
- Dates with impossible values (e.g. month 13 or day 32) are rejected on import instead of silently rolling over into another date.
- A v1 → v2 storage migration is now saved immediately instead of being repeated on every popup open until the next edit.

### Documentation
- Added `CLAUDE.md` with architecture notes, conventions, and release rules for AI coding agents.
- Translated `GEMINI.md` and `.agents/rules/git-tags.md` to English.

### Chore
- Translated remaining German code comments to English.
- Added ESLint and Prettier (`npm run lint`, `npm run format`, `npm run format:check`) and formatted the codebase once. The formatting commit is listed in `.git-blame-ignore-revs`.
- Removed dead code: unused helpers (`setStatus`, `copyMeetingMarkdown`, `stripQualifier`), unused parameters and scrape response fields, and unused CSS rules.
- Fixed the `.gitignore` entry for the screenshot renderer's temp directory (`.chrome-temp/`).
- Moved pure logic into shared modules in `src/lib/` (`names.js`, `meetings.js`, `markdown.js`). The content script and the popup no longer keep diverging copies of the name filters, and the two Markdown parsers were merged into one.
- Added unit tests with Node's built-in test runner (`npm test`) and an `npm run check` script that runs lint, format check, and tests.
- `npm run package` now bundles every non-hidden file in `src/` and verifies that all files referenced by `manifest.json` are present.

---

## [0.31.0] - 2026-09-10

### Changed
- **Dynamic rotation reordering for late joiners**: Participants who join a meeting late (or are detected in later DOM scraping passes) are now dynamically sorted into the pending speaker queue according to priority (`never` first by first name, then longest since last update), rather than unconditionally appended at the end of the round.
- **Fixed completed speaker positions**: Participants who have already completed their turn today (`doneToday` / checked off) maintain their fixed positions at the top of the meeting round and are neither shifted nor overtaken by late joiners.
- **Expanded popup window width**: Increased popup width from 384px to 420px so that the full POPCORN acronym subtitle in Settings fits cleanly on a single line without wrapping.

### Removed
- **JSON backup & export**: Removed the obsolete JSON export button and legacy JSON merge/import code. Roster sharing and backups are handled via clean, human-readable Markdown per meeting.

### Documentation
- Clarified browser extension toolbar pinning tip in `README.md`.
- Updated Markdown modal editor toolbar action descriptions in `README.md`.
- Updated Chrome Web Store screenshots and listing guide.


---

## [0.30.0] - 2026-09-08

### Changed
- **Unified icon toolbar**: Converted markdown modal action buttons into a sleek icon toolbar with dedicated Upload, Download, and Copy buttons.

---

## [0.29.0] - 2026-09-08

### Fixed
- **Google Meet sidebar state**: Preserved the attendees sidebar state when closing the POPCORN popup.
- **Roster noise filtering**: Filtered out additional Meet accessibility labels, action phrases, and UI noise from participant names.

---

## [0.28.3] - 2026-09-08

### Fixed
- **Sidebar & button flickering**: Prevented the Google Meet attendees sidebar from popping open automatically and resolved chat button blinking during attendance polling.

---

## [0.28.2] - 2026-09-08

### Fixed
- **Markdown modal rendering**: Resolved modal crash when opening markdown editor.
- **Save button state**: Ensured Save button activates immediately upon user edits in the markdown editor.

---

## [0.28.1] - 2026-09-07

### Changed
- **People toolbar styling**: Standardized ghost icon button appearance across the People list toolbar.

### Chore
- Added Git tag immutability and tagging rules to project guidelines.

---

## [0.28.0] - 2026-09-07

### Added
- **EffVer versioning**: Adopted [EffVer (Intended Effort Versioning)](https://jacobtomlinson.dev/effver/) (`macro.meso.micro`) across the project.
- **Automated version bumper**: Added `scripts/bump_version.js` for one-command version synchronization.
- **Release workflow**: Automated extension packaging and GitHub Release creation via GitHub Actions (`.github/workflows/release.yml`).
- **Version tooltip**: Display version info when hovering over the POPCORN mascot header icon.

### Fixed
- Improved Google Meet side panel lifecycle handling.

---

## [0.27.0] - 2026-09-07

### Changed
- **Status badge**: Simplified Meet connection status badge to a clean binary on/off indicator.

### Documentation
- Highlighted full Markdown table export/import capabilities in `README.md`.
- Added MIT license file.

---

## [0.26.0] - 2026-09-05

### Added
- **Markdown syntax validation**: Live line-by-line syntax checking and error highlighting in the markdown roster editor.
- **Full-screen modal**: Enhanced modal dialog for viewing and editing meeting rosters.

### Changed
- Reorganized codebase structure into the `src/` directory.

---

## [0.25.0] - 2026-09-05

### Added
- **Store publishing assets**: High-definition Chrome Web Store promotional images, authentic screenshots, and listing documentation.
- **Packaging automation**: Added `scripts/package.js` to create production-ready ZIP bundles.

### Fixed
- Active tab indicator synchronization when navigating non-Meet tabs.

---

## [0.24.0] - 2026-09-04

### Added
- Cool popcorn mascot artwork featuring sunglasses and microphone.
- Header logo branding and Google Meet SEO metadata optimizations.

---

## [0.23.0] - 2026-09-04

### Changed
- Redesigned popcorn icon artwork with clean transparency, toasted kernel centers, and organic fluffy butter shading.

---

## [0.22.0] - 2026-09-04

### Changed
- Rebranded application to **POPCORN** (*Participant Order Picker for Candid On-call Reporting & Notes*) with updated metadata and branding.

---

## [0.21.0] - 2026-09-04

### Fixed
- Presence detection for overflow participants in large Google Meet calls.

### Changed
- Stabilized live roster DOM scraping and added rotating refresh animation.

---

## [0.20.0] - 2026-09-04

### Changed
- Compact single-line row layout for participant cards.
- Improved candidate replenishment when all participants have given updates.

---

## [0.19.0] - 2026-09-03

### Added
- Participant ignore toggle (eye icon) to exclude guests and passive listeners.
- Dedicated delete mode with trash icon in the People list.

---

## [0.18.0] - 2026-08-31

### Added
- Integrated Markdown table editor modal with clipboard copy and live editing.

### Changed
- Redesigned meeting rows with integrated open icon and streamlined toolbar.

---

## [0.17.0] - 2026-08-31

### Changed
- Translated entire user interface and documentation to English.
- Streamlined single-line meeting list view.

### Added
- Clipboard Markdown import support for meeting rosters.

---

## [0.16.0] - 2026-08-28

### Changed
- Standardized Markdown export headers (`Person`, `Last Update`) and formatted empty cells for missing updates.

---

## [0.15.0] - 2026-08-27

### Changed
- Switched to content-script DOM polling instead of redundant popup refresh timeouts.

---

## [0.14.0] - 2026-08-27

### Added
- Continuous background roster tracking and automatic expansion of Google Meet attendee panels.
- Multi-pass fast roster refresh.

---

## [0.13.0] - 2026-08-27

### Fixed
- Enhanced Meet DOM selectors, remote mute parsing, and live UI noise filtering.

---

## [0.12.0] - 2026-08-27

### Fixed
- Filtered out RSVP status headers, backgrounds & visual effects, and UI buttons from attendee lists.

---

## [0.11.0] - 2026-08-24

### Documentation
- Updated `README.md` with icon changes and Markdown table schema.

---

## [0.10.0] - 2026-08-24

### Changed
- Standardized SVG icons across all actions and settings.

---

## [0.9.0] - 2026-08-24

### Added
- Per-meeting Markdown export (copy to clipboard and `.md` file download) and import with overwrite confirmation.

---

## [0.8.0] - 2026-08-24

### Changed
- Adopted `0.X` versioning scheme and added version display in settings.

---

## [0.7.0] - 2026-08-24

### Fixed
- Auto-expand "View everyone in this call" panel in Google Meet.

---

## [0.6.0] - 2026-08-24

### Changed
- Renamed main action button to "More People" and added compact refresh button.

---

## [0.5.0] - 2026-08-24

### Fixed
- Filtered out UI buttons (e.g., Reframe) from attendee scraping.

---

## [0.4.0] - 2026-08-24

### Fixed
- Filtered out presentation tiles and screen shares from attendee tracking.

---

## [0.3.0] - 2026-08-24

### Added
- Automatic attendee refresh, settings tab with candidate count, and check-off update tracking.

---

## [0.2.0] - 2026-08-24

### Fixed
- Participant name cleaning and stripping of Meet action phrases.

---

## [0.1.0] - 2026-08-24

### Added
- Initial release of Meet Update Rotator.

[Unreleased]: https://github.com/FlorianWilhelm/popcorn/compare/v0.31.0...HEAD
[0.31.0]: https://github.com/FlorianWilhelm/popcorn/compare/v0.30.0...v0.31.0
[0.30.0]: https://github.com/FlorianWilhelm/popcorn/compare/v0.29.0...v0.30.0
[0.29.0]: https://github.com/FlorianWilhelm/popcorn/compare/v0.28.3...v0.29.0
[0.28.3]: https://github.com/FlorianWilhelm/popcorn/compare/v0.28.2...v0.28.3
[0.28.2]: https://github.com/FlorianWilhelm/popcorn/compare/v0.28.1...v0.28.2
[0.28.1]: https://github.com/FlorianWilhelm/popcorn/compare/v0.28.0...v0.28.1
[0.28.0]: https://github.com/FlorianWilhelm/popcorn/compare/v0.27...v0.28.0
[0.27.0]: https://github.com/FlorianWilhelm/popcorn/compare/v0.26...v0.27
[0.26.0]: https://github.com/FlorianWilhelm/popcorn/compare/v0.25...v0.26
[0.25.0]: https://github.com/FlorianWilhelm/popcorn/compare/v0.24...v0.25
[0.24.0]: https://github.com/FlorianWilhelm/popcorn/compare/v0.23...v0.24
[0.23.0]: https://github.com/FlorianWilhelm/popcorn/compare/v0.22...v0.23
[0.22.0]: https://github.com/FlorianWilhelm/popcorn/compare/v0.21...v0.22
[0.21.0]: https://github.com/FlorianWilhelm/popcorn/compare/v0.20...v0.21
[0.20.0]: https://github.com/FlorianWilhelm/popcorn/compare/v0.19...v0.20
[0.19.0]: https://github.com/FlorianWilhelm/popcorn/compare/v0.18...v0.19
[0.18.0]: https://github.com/FlorianWilhelm/popcorn/compare/v0.17...v0.18
[0.17.0]: https://github.com/FlorianWilhelm/popcorn/compare/v0.16...v0.17
[0.16.0]: https://github.com/FlorianWilhelm/popcorn/compare/v0.15...v0.16
[0.15.0]: https://github.com/FlorianWilhelm/popcorn/compare/v0.14...v0.15
[0.14.0]: https://github.com/FlorianWilhelm/popcorn/compare/v0.13...v0.14
[0.13.0]: https://github.com/FlorianWilhelm/popcorn/compare/v0.12...v0.13
[0.12.0]: https://github.com/FlorianWilhelm/popcorn/compare/v0.11...v0.12
[0.11.0]: https://github.com/FlorianWilhelm/popcorn/compare/v0.10...v0.11
[0.10.0]: https://github.com/FlorianWilhelm/popcorn/compare/v0.9...v0.10
[0.9.0]: https://github.com/FlorianWilhelm/popcorn/compare/v0.8...v0.9
[0.8.0]: https://github.com/FlorianWilhelm/popcorn/compare/v0.7...v0.8
[0.7.0]: https://github.com/FlorianWilhelm/popcorn/compare/v0.6...v0.7
[0.6.0]: https://github.com/FlorianWilhelm/popcorn/compare/v0.5...v0.6
[0.5.0]: https://github.com/FlorianWilhelm/popcorn/compare/v0.4...v0.5
[0.4.0]: https://github.com/FlorianWilhelm/popcorn/compare/v0.3...v0.4
[0.3.0]: https://github.com/FlorianWilhelm/popcorn/compare/v0.2...v0.3
[0.2.0]: https://github.com/FlorianWilhelm/popcorn/compare/v0.1...v0.2
[0.1.0]: https://github.com/FlorianWilhelm/popcorn/releases/tag/v0.1
