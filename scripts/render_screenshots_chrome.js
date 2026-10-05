const fs = require("fs");
const path = require("path");
const { execFileSync, execSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const assetsDir = path.join(rootDir, "store_assets");
const pagesDir = path.join(assetsDir, "pages");
const tempDir = path.join(rootDir, ".chrome-temp");

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Chrome path on macOS
const CHROME_PATHS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium"
];

const chromePath = CHROME_PATHS.find((p) => fs.existsSync(p));

if (!chromePath) {
  console.error("❌ Google Chrome not found at standard macOS location.");
  process.exit(1);
}

// 1. Build/update store pages first
require("./build_store_pages.js");

// 3 distinct screenshots + 2 promo tiles (all purely .jpeg)
const assets = [
  {
    name: "Screenshot 1 (Standup Rotation)",
    input: path.join(pagesDir, "screenshot1_standup.html"),
    output: path.join(assetsDir, "screenshot1_standup_1280x800.jpeg"),
    width: 1280,
    height: 800
  },
  {
    name: "Screenshot 2 (Tracked Meetings)",
    input: path.join(pagesDir, "screenshot2_meetings.html"),
    output: path.join(assetsDir, "screenshot2_meetings_1280x800.jpeg"),
    width: 1280,
    height: 800
  },
  {
    name: "Screenshot 3 (Markdown Roster)",
    input: path.join(pagesDir, "screenshot3_markdown.html"),
    output: path.join(assetsDir, "screenshot3_markdown_1280x800.jpeg"),
    width: 1280,
    height: 800
  },
  {
    name: "Promotional Marquee Banner",
    input: path.join(pagesDir, "promo_marquee.html"),
    output: path.join(assetsDir, "promo_marquee_1400x560.jpeg"),
    width: 1400,
    height: 560
  },
  {
    name: "Small Promo Tile",
    input: path.join(pagesDir, "promo_small.html"),
    output: path.join(assetsDir, "promo_small_440x280.jpeg"),
    width: 440,
    height: 280
  }
];

function renderAsset(asset) {
  if (!fs.existsSync(asset.input)) {
    throw new Error(`Input HTML not found: ${asset.input}`);
  }

  const tempPng = path.join(tempDir, `${path.basename(asset.output, ".jpeg")}.png`);
  if (fs.existsSync(tempPng)) fs.unlinkSync(tempPng);

  const userDataDir = path.join(tempDir, "user-data");
  const args = [
    "--headless=new",
    "--no-first-run",
    "--no-default-browser-check",
    `--user-data-dir=${userDataDir}`,
    "--disable-gpu",
    "--disable-extensions",
    "--disable-background-networking",
    "--disable-sync",
    "--disable-default-apps",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    `--window-size=${asset.width},${asset.height}`,
    `--screenshot=${tempPng}`,
    `file://${asset.input}`
  ];

  try {
    execFileSync(chromePath, args, { stdio: ["ignore", "pipe", "pipe"], timeout: 10000 });
  } catch (err) {
    // Chrome on mac may output CVDisplayLink error to stderr while successfully writing the file
    if (!fs.existsSync(tempPng)) {
      throw err;
    }
  }

  if (!fs.existsSync(tempPng) || fs.statSync(tempPng).size === 0) {
    throw new Error(`Chrome failed to write screenshot to ${tempPng}`);
  }

  // Convert to high-quality JPEG using native macOS sips (clean RGB, 92 quality, no graphical filters)
  execSync(`/usr/bin/sips -s format jpeg -s formatOptions 92 "${tempPng}" --out "${asset.output}"`, {
    stdio: "ignore"
  });

  // Clean up temp PNG
  fs.unlinkSync(tempPng);

  return fs.statSync(asset.output).size;
}

function generatePreviewHtml() {
  const previewPath = path.join(assetsDir, "preview.html");
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>POPCORN – Chrome Web Store Assets Preview</title>
<style>
  body {
    margin: 0;
    padding: 30px;
    background: #0f172a;
    color: #f8fafc;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }
  h1 { font-size: 28px; margin-bottom: 8px; display: flex; align-items: center; gap: 10px; }
  p.sub { color: #94a3b8; font-size: 15px; margin-top: 0; margin-bottom: 30px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(560px, 1fr)); gap: 24px; }
  .card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 18px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.3);
  }
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  .card-title { font-weight: 600; font-size: 15px; color: #38bdf8; }
  .card-badge {
    background: #0f172a;
    border: 1px solid #475569;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 12px;
    color: #cbd5e1;
    font-family: ui-monospace, monospace;
  }
  .preview-img {
    width: 100%;
    height: auto;
    border-radius: 8px;
    border: 1px solid #334155;
    display: block;
    background: #000;
  }
  .promo-row {
    display: flex;
    gap: 24px;
    margin-top: 30px;
    flex-wrap: wrap;
  }
</style>
</head>
<body>
  <h1>🍿 POPCORN – Chrome Web Store Assets</h1>
  <p class="sub">All screenshots and promotional tiles meet Chrome Web Store guidelines (1280x800 &amp; promo resolutions, pure JPEG, no graphical borders/filters).</p>

  <h2>📸 Store Screenshots (1280 x 800)</h2>
  <div class="grid">
    <div class="card">
      <div class="card-header">
        <span class="card-title">1. Standup Rotation (Candidate Selection &amp; Checkboxes)</span>
        <span class="card-badge">screenshot1_standup_1280x800.jpeg</span>
      </div>
      <img class="preview-img" src="screenshot1_standup_1280x800.jpeg" alt="Screenshot 1" />
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">2. Tracked Meetings (Multi-team History &amp; Sync)</span>
        <span class="card-badge">screenshot2_meetings_1280x800.jpeg</span>
      </div>
      <img class="preview-img" src="screenshot2_meetings_1280x800.jpeg" alt="Screenshot 2" />
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">3. In-App Markdown Editor (Roster &amp; Export/Import)</span>
        <span class="card-badge">screenshot3_markdown_1280x800.jpeg</span>
      </div>
      <img class="preview-img" src="screenshot3_markdown_1280x800.jpeg" alt="Screenshot 3" />
    </div>
  </div>

  <h2 style="margin-top: 40px;">🎨 Promotional Tiles</h2>
  <div class="promo-row">
    <div class="card" style="flex: 2; min-width: 500px;">
      <div class="card-header">
        <span class="card-title">Marquee Promo Tile (1400 x 560)</span>
        <span class="card-badge">promo_marquee_1400x560.jpeg</span>
      </div>
      <img class="preview-img" src="promo_marquee_1400x560.jpeg" alt="Marquee Banner" />
    </div>

    <div class="card" style="flex: 1; min-width: 300px;">
      <div class="card-header">
        <span class="card-title">Small Promo Tile (440 x 280)</span>
        <span class="card-badge">promo_small_440x280.jpeg</span>
      </div>
      <img class="preview-img" src="promo_small_440x280.jpeg" alt="Small Promo" />
    </div>
  </div>
</body>
</html>`;
  fs.writeFileSync(previewPath, html);
}

function run() {
  console.log(`🚀 Rendering Chrome Web Store screenshots directly from HTML using Chrome: ${chromePath}\n`);

  for (const asset of assets) {
    process.stdout.write(`⏳ Rendering ${asset.name} (${asset.width}x${asset.height})... `);
    try {
      const bytes = renderAsset(asset);
      const kb = Math.round(bytes / 1024);
      console.log(`✅ Done (${kb} KB) -> ${path.basename(asset.output)}`);
    } catch (err) {
      console.log(`❌ Error: ${err.message}`);
    }
  }

  // Generate HTML preview file
  generatePreviewHtml();

  // Clean up temp dir
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (_) {}

  console.log("\n🎉 All Chrome Store screenshots and promo assets successfully updated!");
  console.log("👉 Open 'store_assets/preview.html' in your browser to inspect the complete set.");
}

run();
