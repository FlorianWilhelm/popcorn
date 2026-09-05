const fs = require("fs");
const path = require("path");
const { spawn, execSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const assetsDir = path.join(rootDir, "store_assets");
const pagesDir = path.join(assetsDir, "pages");
const userDataDir = path.join(rootDir, ".chrome-user-data");

// Chrome path on macOS
const CHROME_PATHS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium"
];

const chromePath = CHROME_PATHS.find(p => fs.existsSync(p));

if (!chromePath) {
  console.error("❌ Google Chrome not found at standard macOS location.");
  process.exit(1);
}

// Ensure pages are generated first
try {
  require("./build_store_pages.js");
} catch (e) {
  console.log("Building store pages...", e.message);
}

const assets = [
  {
    name: "Screenshot 1 (Standup)",
    input: path.join(pagesDir, "screenshot1_standup.html"),
    output: path.join(assetsDir, "screenshot1_standup_1280x800.jpeg"),
    width: 1280,
    height: 800
  },
  {
    name: "Screenshot 2 (People)",
    input: path.join(pagesDir, "screenshot2_people.html"),
    output: path.join(assetsDir, "screenshot2_people_1280x800.jpeg"),
    width: 1280,
    height: 800
  },
  {
    name: "Screenshot 3 (Meetings)",
    input: path.join(pagesDir, "screenshot3_meetings.html"),
    output: path.join(assetsDir, "screenshot3_meetings_1280x800.jpeg"),
    width: 1280,
    height: 800
  },
  {
    name: "Screenshot 4 (Markdown)",
    input: path.join(pagesDir, "screenshot4_markdown.html"),
    output: path.join(assetsDir, "screenshot4_markdown_1280x800.jpeg"),
    width: 1280,
    height: 800
  },
  {
    name: "Promotional Marquee Tile",
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

function renderScreenshot(asset) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(asset.input)) {
      return reject(new Error(`Input HTML not found: ${asset.input}`));
    }

    const tempPng = asset.output.replace(/\.jpeg$/, ".temp.png");

    if (fs.existsSync(tempPng)) fs.unlinkSync(tempPng);
    if (fs.existsSync(asset.output)) fs.unlinkSync(asset.output);

    const args = [
      "--headless=new",
      `--user-data-dir=${userDataDir}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-gpu",
      "--disable-extensions",
      "--disable-background-networking",
      "--disable-sync",
      "--disable-default-apps",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "--virtual-time-budget=2000",
      "--run-all-compositor-stages-before-draw",
      `--window-size=${asset.width},${asset.height}`,
      `--screenshot=${tempPng}`,
      `file://${asset.input}`
    ];

    const child = spawn(chromePath, args, { stdio: ["ignore", "pipe", "pipe"] });
    let resolved = false;

    const convertToJpeg = () => {
      if (resolved) return;
      if (fs.existsSync(tempPng) && fs.statSync(tempPng).size > 1000) {
        resolved = true;
        try { child.kill("SIGKILL"); } catch (_) {}
        try {
          // Use macOS native sips to produce pure JPEG without filters
          execSync(`/usr/bin/sips -s format jpeg -s formatOptions 92 "${tempPng}" --out "${asset.output}"`, { stdio: "ignore" });
          if (fs.existsSync(tempPng)) fs.unlinkSync(tempPng);
          const finalSize = fs.statSync(asset.output).size;
          resolve(finalSize);
        } catch (sipsErr) {
          // Fallback: move tempPng to output
          fs.renameSync(tempPng, asset.output);
          resolve(fs.statSync(asset.output).size);
        }
      }
    };

    const interval = setInterval(convertToJpeg, 100);

    child.on("exit", () => {
      clearInterval(interval);
      if (!resolved) {
        setTimeout(convertToJpeg, 200);
      }
    });

    child.on("error", err => {
      clearInterval(interval);
      if (!resolved) {
        resolved = true;
        reject(err);
      }
    });

    // Timeout after 15s
    setTimeout(() => {
      if (!resolved) {
        clearInterval(interval);
        try { child.kill("SIGKILL"); } catch (_) {}
        convertToJpeg();
        if (!resolved) {
          resolved = true;
          reject(new Error(`Timeout rendering ${asset.name}`));
        }
      }
    }, 15000);
  });
}

async function run() {
  console.log(`🚀 Rendering Chrome Web Store screenshots directly from HTML using Chrome: ${chromePath}\n`);

  for (const asset of assets) {
    process.stdout.write(`⏳ Rendering ${asset.name} (${asset.width}x${asset.height})... `);
    try {
      const bytes = await renderScreenshot(asset);
      const kb = Math.round(bytes / 1024);

      console.log(`✅ Done (${kb} KB) -> ${path.basename(asset.output)}`);
    } catch (err) {
      console.log(`❌ Error: ${err.message}`);
    }
  }

  // Clean up user data dir
  try {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  } catch (_) {}

  console.log("\n🎉 All Chrome Store screenshots generated directly in JPEG format without filters!");
  process.exit(0);
}

run();

