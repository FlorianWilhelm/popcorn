import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["dist/", "store_assets/", ".chrome-user-data/", ".chrome-temp/"]
  },
  js.configs.recommended,
  {
    rules: {
      // Best-effort DOM and messaging calls intentionally swallow errors with `catch {}`.
      "no-empty": ["error", { allowEmptyCatch: true }]
    }
  },
  {
    // Extension code runs as classic scripts in the popup and the Meet isolated world.
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        ...globals.browser,
        ...globals.webextensions
      }
    }
  },
  {
    files: ["scripts/**/*.js", "test/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: globals.node
    }
  }
];
