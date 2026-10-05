# CLAUDE.md

Guidance for AI coding agents working on POPCORN, a Manifest V3 Chrome extension that suggests a fair speaker order for Google Meet standups. See [README.md](README.md) for the user-facing feature description.

## Language

Everything in this repository is written in English: code, identifiers, comments, UI strings, commit messages, and documentation. The only exceptions are the German (and other non-English) Google Meet UI phrases in the name/noise filters and the legacy German keywords accepted by the Markdown importer (`noch nie`, `ignoriert`, `letztes update`). Those strings are data that must keep matching.

## Project Layout

```
src/                     The extension itself, loaded as-is via "Load unpacked"
  manifest.json          MV3 manifest (permissions, content script registration)
  content.js             Content script running on meet.google.com: DOM scraping
  popup.html/.css/.js    Popup UI: state, Meet communication, rendering, events
  lib/                   Pure, unit-tested logic shared as classic scripts
    names.js             Name cleaning and Meet UI noise filters (popup + content script)
    meetings.js          Data model: storage migration, meeting matching, roster, rotation
    markdown.js          Markdown roster export and parsing
  icons/                 Extension icons (PNG)
test/                    Unit tests for src/lib/ (node:test)
scripts/
  package.js             Verifies versions and builds dist/popcorn-vX.Y.Z.zip
  bump_version.js        EffVer bump across all files that contain the version
  build_store_pages.js   Generates HTML mockups for Chrome Web Store assets
  render_screenshots_chrome.js  Renders store assets with local Chrome (macOS only)
assets/                  Source artwork that is not shipped (icon.svg)
store_assets/            Generated store screenshots and promo tiles
.github/workflows/       release.yml: builds the ZIP and creates a GitHub Release on tags
```

## Tech Constraints

- Plain JavaScript with no framework, no bundler, no transpiler, and no runtime dependencies. `src/` is shipped exactly as written. Node.js is only needed for tooling (tests, lint, packaging scripts).
- There is no background service worker. All logic lives in the popup and the content script.
- [scripts/package.js](scripts/package.js) bundles every non-hidden file in `src/`, so keep only shippable files there.
- **Shared modules** in `src/lib/` use a small UMD wrapper: in the browser they assign `globalThis.PopcornNames`, `PopcornMeetings`, and `PopcornMarkdown`; in Node they use `module.exports` and `require()`. They must not touch the DOM or `chrome.*`, and they take time (`now`) and presence (`presentKeys`) as parameters so they stay testable.
- **Load order**: `lib/names.js` must load before `content.js` (see `content_scripts` in the manifest and the `executeScript` fallback in `popup.js`). `popup.html` loads `names.js`, `meetings.js`, and `markdown.js` before `popup.js`.

## Architecture

- **Popup ↔ content script messaging**: The popup sends `POPCORN_SCRAPE` (`withPeople`, `openIfClosed`) and `POPCORN_POPUP_CLOSING` via `chrome.tabs.sendMessage`. If no content script answers, the popup injects `lib/names.js` and `content.js` with `chrome.scripting.executeScript` and retries.
- **Session port**: The popup opens a long-lived port named `popcorn-session`. While it is connected, the content script polls the attendee list once per second (`startLiveRoster`) so people who briefly drop out of Meet's virtualized list are kept. When it disconnects (popup closed), polling stops and the content script restores the Meet side panel to its state before POPCORN touched it (`captureInitialState` / `restoreInitialState`). Nothing runs in Meet tabs while the popup is closed.
- **Re-injection safety**: `content.js` can be injected several times into the same tab. It is wrapped in an IIFE and cleans up the previous instance through `window.__popcornCleanup`. Scripts injected into Meet must never declare top-level `const`/`let`/`class`, because re-injection would throw a redeclaration error.
- **Storage**: All data lives in `chrome.storage.local` under the key `mur_v1`. The `mur` prefix is a leftover from the project's original name ("Meet Update Rotator"). Do not rename the key without a migration, because that would wipe users' data.
- **Meeting matching**: A Meet tab is mapped to a tracked meeting by normalized title/aliases first, then by Meet code. New titles and codes are learned automatically.
- **Rotation**: `syncMeetingOrder` in `lib/meetings.js` keeps people checked off within the last 24 hours fixed at the top (in the order they were checked off) and sorts everyone else by `last` ascending (never-updated first), with name as a tie-breaker.
- **Markdown format**: Exports write `YYYY-MM-DD HH:mm` in local time. The parser still accepts older locale-formatted exports (`10.9.2026, 10:15:00`, `9/10/2026, 10:15:00 AM`).

## Google Meet DOM Scraping

The Meet DOM is undocumented, obfuscated, and changes without notice. The scraping in `content.js` therefore relies on layered heuristics (ARIA labels, roles, geometry, bilingual German/English text patterns) rather than single selectors. When changing it:

- Keep every existing fallback unless you have verified it is obsolete.
- Remember that users run Meet in different UI languages. Add German and English variants for any new phrase.
- Prefer filtering out noise over loosening `looksLikeName`. False positives end up permanently stored in users' rosters.

## Development Workflow

- **Install tooling**: `npm install` (dev dependencies only: ESLint, Prettier).
- **Before committing**: run `npm run check` (lint, format check, unit tests). `npm run format` fixes formatting.
- **Tests**: `npm test` runs `node:test` suites in `test/`. Add tests for every change to `src/lib/`. Code in `content.js` and `popup.js` depends on the DOM and `chrome.*` and is not unit-tested, so keep logic out of those files where possible.
- **Run locally**: Open `chrome://extensions`, enable Developer mode, choose "Load unpacked", and select `src/`. Reload the extension after changes. Content script changes also need a Meet tab reload (or are re-injected by the popup).
- **Package**: `npm run package` builds `dist/popcorn-v<version>.zip` after checking that versions match.
- **Store assets**: `npm run screenshots` regenerates the images in `store_assets/` (requires Google Chrome on macOS).

## Versioning, Changelog, and Commits

- The project uses [EffVer](https://jacobtomlinson.dev/effver/) (`macro.meso.micro`). Bump with `npm run bump -- micro|meso|macro`. Never edit version strings by hand, because the version appears in `package.json`, `src/manifest.json`, `src/popup.html`, `CHROME_STORE_LISTING.md`, and `CHANGELOG.md`.
- Record every notable change under `## [Unreleased]` in [CHANGELOG.md](CHANGELOG.md) following [Keep a Changelog](https://keepachangelog.com/). The bump script promotes that section to a release.
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `style:`, `chore:`), optionally with a scope such as `fix(store):`.

## Git Tags and Releases

- Never overwrite an existing Git tag and never force-push tags.
- Pushed tags are immutable. If changes are needed after a tag has been pushed, create a new release tag with the appropriate EffVer bump (for example, a micro bump to `v0.28.1`).
- Overwriting or force-pushing tags is allowed only with the user's explicit permission.
- Pushing a tag matching `v*` triggers [release.yml](.github/workflows/release.yml), which publishes a GitHub Release with the ZIP bundle.
