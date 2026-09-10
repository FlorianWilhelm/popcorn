const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const pkgPath = path.join(rootDir, "package.json");
const manifestPath = path.join(rootDir, "src", "manifest.json");
const popupHtmlPath = path.join(rootDir, "src", "popup.html");
const listingPath = path.join(rootDir, "CHROME_STORE_LISTING.md");
const changelogPath = path.join(rootDir, "CHANGELOG.md");

const target = process.argv[2];

function printUsage() {
  console.log(`
EffVer (Intended Effort Versioning) Bump Helper:
  https://jacobtomlinson.dev/effver/

Usage:
  npm run bump -- <macro|meso|micro|version>

Options:
  micro           No effort to adopt (bugfixes, non-breaking features, no-ops)
  meso            Some effort to adopt (workaround changes, small breaking tweaks)
  macro           Significant effort to adopt (major overhauls, large breaking changes)
  <x.y.z>         Explicit version number (e.g. 0.28.1, 0.29.0, 1.0.0)

Examples:
  npm run bump -- micro     # e.g. 0.28.0 -> 0.28.1
  npm run bump -- meso      # e.g. 0.28.0 -> 0.29.0
  npm run bump -- macro     # e.g. 0.28.0 -> 1.0.0
  npm run bump -- 0.29.0    # sets exact version
`);
}

if (!target) {
  printUsage();
  process.exit(1);
}

// Read current version from package.json or manifest.json
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const currentRaw = (pkg.version || "0.0.0").trim().replace(/^v/, "");
const currentParts = currentRaw.split(".").map(n => parseInt(n, 10));

let curMacro = currentParts[0] ?? 0;
let curMeso = currentParts[1] ?? 0;
let curMicro = currentParts[2] ?? 0;

let newMacro = curMacro;
let newMeso = curMeso;
let newMicro = curMicro;
let effortDesc = "";

const mode = target.trim().toLowerCase();
if (mode === "micro" || mode === "patch") {
  newMicro += 1;
  effortDesc = "Micro (No effort expected to adopt)";
} else if (mode === "meso" || mode === "minor") {
  newMeso += 1;
  newMicro = 0;
  effortDesc = "Meso (Some small effort expected to adopt)";
} else if (mode === "macro" || mode === "major") {
  newMacro += 1;
  newMeso = 0;
  newMicro = 0;
  effortDesc = "Macro (Significant effort expected to adopt)";
} else {
  // Explicit version
  const cleaned = target.trim().replace(/^v/, "");
  const parts = cleaned.split(".").map(n => parseInt(n, 10));
  if (parts.length < 2 || parts.some(isNaN)) {
    console.error(`ERROR: Invalid version or keyword "${target}".`);
    printUsage();
    process.exit(1);
  }
  newMacro = parts[0];
  newMeso = parts[1];
  newMicro = parts[2] !== undefined ? parts[2] : 0;
  effortDesc = "Explicit version";
}

const newVersion = `${newMacro}.${newMeso}.${newMicro}`;
const tagVersion = `v${newVersion}`;

console.log(`\n🚀 EffVer Bump: ${currentRaw} -> ${newVersion}`);
console.log(`   Effort category: ${effortDesc}\n`);

// 1. Update package.json
let pkgRaw = fs.readFileSync(pkgPath, "utf8");
const pkgMatch = pkgRaw.match(/"version":\s*"([^"]+)"/);
const oldPkgVersion = pkgMatch ? pkgMatch[1] : "unknown";
pkgRaw = pkgRaw.replace(/"version":\s*"[^"]+"/, `"version": "${newVersion}"`);
fs.writeFileSync(pkgPath, pkgRaw, "utf8");
console.log(`  ✓ package.json:          ${oldPkgVersion} -> ${newVersion}`);

// 2. Update src/manifest.json
let manifestRaw = fs.readFileSync(manifestPath, "utf8");
const manifestMatch = manifestRaw.match(/"version":\s*"([^"]+)"/);
const oldManifestVersion = manifestMatch ? manifestMatch[1] : "unknown";
manifestRaw = manifestRaw.replace(/"version":\s*"[^"]+"/, `"version": "${newVersion}"`);
fs.writeFileSync(manifestPath, manifestRaw, "utf8");
console.log(`  ✓ src/manifest.json:     ${oldManifestVersion} -> ${newVersion}`);

// 3. Update src/popup.html
if (fs.existsSync(popupHtmlPath)) {
  let html = fs.readFileSync(popupHtmlPath, "utf8");
  const oldHtml = html;
  html = html.replace(/title="POPCORN v[^"]*"/g, `title="POPCORN v${newVersion}"`);
  html = html.replace(/<span id="appVersion">[^<]*<\/span>/g, `<span id="appVersion">${newVersion}</span>`);
  if (html !== oldHtml) {
    fs.writeFileSync(popupHtmlPath, html, "utf8");
    console.log(`  ✓ src/popup.html:        synced display to v${newVersion}`);
  }
}

// 4. Update CHROME_STORE_LISTING.md
if (fs.existsSync(listingPath)) {
  let listing = fs.readFileSync(listingPath, "utf8");
  const updatedListing = listing.replace(/popcorn-v[0-9.]+\.zip/g, `popcorn-v${newVersion}.zip`);
  if (updatedListing !== listing) {
    fs.writeFileSync(listingPath, updatedListing, "utf8");
    console.log(`  ✓ CHROME_STORE_LISTING:  updated bundle to popcorn-v${newVersion}.zip`);
  }
}

// 5. Update CHANGELOG.md
if (fs.existsSync(changelogPath)) {
  let changelog = fs.readFileSync(changelogPath, "utf8");
  const today = new Date().toISOString().slice(0, 10);
  const pattern = /## \[Unreleased\]\s*\n([\s\S]*?)(?=\n---\s*\n## \[\d|\n## \[\d|$)/;
  const match = changelog.match(pattern);

  if (match && match[1].trim().length > 0) {
    const unreleasedBody = match[1].trim();
    const newReleaseBlock = `## [Unreleased]\n\n---\n\n## [${newVersion}] - ${today}\n\n${unreleasedBody}\n\n`;
    changelog = changelog.replace(pattern, newReleaseBlock);

    // Update link references at bottom
    const repoUrl = "https://github.com/FlorianWilhelm/popcorn";
    const unreleasedLink = `[Unreleased]: ${repoUrl}/compare/v${newVersion}...HEAD`;
    const prevTag = `v${currentRaw}`;
    const newTag = `v${newVersion}`;
    const newReleaseLink = `[${newVersion}]: ${repoUrl}/compare/${prevTag}...${newTag}`;

    changelog = changelog.replace(
      /\[Unreleased\]: [^\n]+/,
      `${unreleasedLink}\n${newReleaseLink}`
    );

    fs.writeFileSync(changelogPath, changelog, "utf8");
    console.log(`  ✓ CHANGELOG.md:          promoted [Unreleased] to [${newVersion}] - ${today}`);
  } else {
    console.log(`  ℹ CHANGELOG.md:          no unreleased changes found, keeping [Unreleased]`);
  }
}

console.log(`\n✅ Successfully updated all files to EffVer ${newVersion}!`);
console.log(`Next steps:`);
console.log(`  git commit -am "chore: bump version to ${tagVersion}"`);
console.log(`  git tag ${tagVersion}`);
console.log(`  git push && git push --tags\n`);
