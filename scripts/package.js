const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const srcDir = path.join(rootDir, "src");
const distDir = path.join(rootDir, "dist");

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// 1. Read manifest
const manifestPath = path.join(srcDir, "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const version = manifest.version;
const zipFileName = `popcorn-v${version}.zip`;
const zipFilePath = path.join(distDir, zipFileName);

// Remove existing zip if any
if (fs.existsSync(zipFilePath)) {
  fs.unlinkSync(zipFilePath);
}

// Files to include in the extension bundle
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

// Create ZIP using native zip command
console.log(`Packaging POPCORN v${version} from src/ into ${zipFileName}...`);
const zipCmd = `zip -q -9 "${zipFilePath}" ${bundleFiles.map(f => `"${f}"`).join(" ")}`;
cp.execSync(zipCmd, { cwd: srcDir });

const stats = fs.statSync(zipFilePath);
console.log(`\n✅ Successfully generated package:`);
console.log(`   Path: ${zipFilePath}`);
console.log(`   Size: ${(stats.size / 1024).toFixed(1)} KB`);
console.log(`   Included files: \n     - ${bundleFiles.join("\n     - ")}`);
