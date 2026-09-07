const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const srcDir = path.join(rootDir, "src");
const distDir = path.join(rootDir, "dist");
const pkgPath = path.join(rootDir, "package.json");
const manifestPath = path.join(srcDir, "manifest.json");
const popupHtmlPath = path.join(srcDir, "popup.html");

function parseVersion(v) {
  if (!v || typeof v !== "string") return null;
  const cleaned = v.trim().replace(/^v/, "");
  const parts = cleaned.split(".").map(n => parseInt(n, 10));
  if (parts.some(isNaN)) return null;
  return {
    raw: cleaned,
    major: parts[0] ?? 0,
    minor: parts[1] ?? 0,
    patch: parts[2] ?? 0
  };
}

function areVersionsCompatible(v1, v2) {
  const p1 = parseVersion(v1);
  const p2 = parseVersion(v2);
  if (!p1 || !p2) return false;
  return p1.major === p2.major && p1.minor === p2.minor && p1.patch === p2.patch;
}

// 1. Verify versions across files
if (!fs.existsSync(pkgPath) || !fs.existsSync(manifestPath)) {
  console.error("ERROR: Missing package.json or src/manifest.json");
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const pkgVersion = pkg.version;
const manifestVersion = manifest.version;
const releaseVersionArg = process.argv[2] || process.env.RELEASE_VERSION;

console.log("🔍 Checking version consistency across project...");
console.log(`   package.json:      ${pkgVersion}`);
console.log(`   src/manifest.json:  ${manifestVersion}`);
if (releaseVersionArg) {
  console.log(`   Git tag/release:   ${releaseVersionArg}`);
}

// Validate package.json vs manifest.json
if (!areVersionsCompatible(pkgVersion, manifestVersion)) {
  console.error(`\n❌ VERSION MISMATCH ERROR:`);
  console.error(`   package.json version (${pkgVersion}) and src/manifest.json version (${manifestVersion}) do not match!`);
  console.error(`   Run "npm run bump -- <version>" to synchronize versions across all files.`);
  process.exit(1);
}

// Validate Git tag / release version if provided
if (releaseVersionArg && releaseVersionArg.trim()) {
  const tagVersion = releaseVersionArg.trim();
  if (!areVersionsCompatible(tagVersion, manifestVersion)) {
    console.error(`\n❌ RELEASE VERSION MISMATCH ERROR:`);
    console.error(`   Git tag / release version (${tagVersion}) does not match project version (${manifestVersion})!`);
    console.error(`   package.json has "${pkgVersion}" and src/manifest.json has "${manifestVersion}".`);
    console.error(`   Please update versions in package.json and src/manifest.json before creating tag "${tagVersion}".`);
    console.error(`   Tip: Run "npm run bump -- ${tagVersion.replace(/^v/, '')}" before tagging.`);
    process.exit(1);
  }
}

// Ensure src/popup.html has matching version
if (fs.existsSync(popupHtmlPath)) {
  let html = fs.readFileSync(popupHtmlPath, "utf8");
  const oldHtml = html;
  html = html.replace(/title="POPCORN v[^"]*"/g, `title="POPCORN v${manifestVersion}"`);
  html = html.replace(/<span id="appVersion">[^<]*<\/span>/g, `<span id="appVersion">${manifestVersion}</span>`);
  if (html !== oldHtml) {
    fs.writeFileSync(popupHtmlPath, html, "utf8");
    console.log(`   ✓ Synced version in src/popup.html to match manifest.json (${manifestVersion})`);
  }
}

console.log("✅ All versions verified successfully.\n");

// 2. Prepare dist directory and clean old zip files
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
} else {
  for (const file of fs.readdirSync(distDir)) {
    if (file.endsWith(".zip")) {
      fs.unlinkSync(path.join(distDir, file));
    }
  }
}

const version = manifestVersion;
const zipFileName = `popcorn-v${version}.zip`;
const zipFilePath = path.join(distDir, zipFileName);

// 3. Files to include in the extension bundle
const bundleFiles = [
  "manifest.json",
  "popup.html",
  "popup.css",
  "popup.js",
  "content.js",
  "icons/icon16.png",
  "icons/icon48.png",
  "icons/icon128.png",
  "icons/icon.svg"
];

// Validate all files exist
for (const file of bundleFiles) {
  const fullPath = path.join(srcDir, file);
  if (!fs.existsSync(fullPath)) {
    console.error(`ERROR: Missing required bundle file: ${file}`);
    process.exit(1);
  }
}

// 4. Create ZIP using native zip command
console.log(`Packaging POPCORN v${version} from src/ into ${zipFileName}...`);
const zipCmd = `zip -q -9 "${zipFilePath}" ${bundleFiles.map(f => `"${f}"`).join(" ")}`;
cp.execSync(zipCmd, { cwd: srcDir });

const stats = fs.statSync(zipFilePath);
console.log(`\n✅ Successfully generated package:`);
console.log(`   Path: ${zipFilePath}`);
console.log(`   Size: ${(stats.size / 1024).toFixed(1)} KB`);
console.log(`   Included files: \n     - ${bundleFiles.join("\n     - ")}`);
