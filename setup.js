#!/usr/bin/env node

/**
 * HLS.js Player with Youbora Integration Setup
 * Modern replacement for setup.sh using Node.js
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// ANSI color codes for output
const COLORS = {
  GREEN: "\x1b[32m",
  BLUE: "\x1b[34m",
  YELLOW: "\x1b[33m",
  RED: "\x1b[31m",
  RESET: "\x1b[0m",
};

/**
 * Print colored message to console
 */
function print(message, color = COLORS.RESET) {
  console.log(`${color}${message}${COLORS.RESET}`);
}

/**
 * Execute a command and handle errors
 */
function execute(command, errorMessage) {
  try {
    print(`Running: ${command}`, COLORS.BLUE);
    execSync(command, { stdio: "inherit" });
    return true;
  } catch (error) {
    print(errorMessage, COLORS.YELLOW);
    return false;
  }
}

/**
 * Create a fallback build when everything else fails
 */
function createFallbackBuild() {
  print("Creating a simplified fallback build...", COLORS.RED);

  // Ensure dist directory exists
  if (!fs.existsSync("dist")) {
    fs.mkdirSync("dist");
  }

  // Copy static assets
  try {
    if (fs.existsSync("static")) {
      const staticFiles = fs.readdirSync("static");
      staticFiles.forEach((file) => {
        fs.copyFileSync(path.join("static", file), path.join("dist", file));
      });
    }
  } catch (error) {
    print(`Error copying static files: ${error.message}`, COLORS.RED);
  }

  // Create basic HTML file
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>HLS.js Player</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="video-container">
    <div id="error-container" class="error-overlay">
      <h1>HLS.JS 1.5.20</h1>
      <p class="url-params">URL Params: ?version=x.x.x&source=url</p>
      <div id="error-log"></div>
      <div id="player-status" class="player-status"></div>
    </div>
    <video id="video" controls></video>
  </div>
  <script src="bundle.js"></script>
</body>
</html>`;

  fs.writeFileSync("dist/index.html", htmlContent);

  // Create simplified bundle
  if (fs.existsSync("src/index.js")) {
    fs.copyFileSync("src/index.js", "dist/bundle.js");
  }

  print("Fallback build created successfully", COLORS.GREEN);
  return true;
}

/**
 * Main setup function
 */
async function setup() {
  print("Setting up HLS.js Player with Youbora Integration", COLORS.BLUE);

  // Check Node.js and npm installation
  try {
    const nodeVersion = execSync("node --version").toString().trim();
    print(`Node.js version: ${nodeVersion}`, COLORS.GREEN);

    const npmVersion = execSync("npm --version").toString().trim();
    print(`npm version: ${npmVersion}`, COLORS.GREEN);
  } catch (error) {
    print(
      "Node.js or npm is not installed. Please install Node.js 16+ before continuing.",
      COLORS.RED
    );
    process.exit(1);
  }

  // Install dependencies
  if (!execute("npm install", "Failed to install dependencies")) {
    print("Continuing despite npm install issues...", COLORS.YELLOW);
  }

  // Build the application with npm script
  if (!execute("npm run build:debug", "Build failed using npm script")) {
    // Try direct rollup as fallback
    print("Trying direct rollup call...", COLORS.YELLOW);

    if (
      !execute(
        "npx rollup -c --bundleConfigAsCjs --environment DEBUG:true",
        "Direct rollup build failed"
      )
    ) {
      // Last resort: create a minimal build
      if (!createFallbackBuild()) {
        print("All build attempts failed", COLORS.RED);
        process.exit(1);
      }
    }
  }

  // Start the server
  print("Setup complete! Starting the development server...", COLORS.GREEN);
  print(
    "If your browser doesn't open automatically, visit: http://localhost:3000",
    COLORS.YELLOW
  );

  // Start server
  execute("npm run dev-server", "Failed to start development server");
}

// Run setup
setup().catch((error) => {
  print(`Setup failed: ${error.message}`, COLORS.RED);
  process.exit(1);
});
