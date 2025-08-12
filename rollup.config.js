const resolve = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");
const terser = require("@rollup/plugin-terser");
const replace = require("@rollup/plugin-replace");
const html = require("@rollup/plugin-html");
const json = require("@rollup/plugin-json");
const copy = require("rollup-plugin-copy");
const livereload = require("rollup-plugin-livereload");

// Check if we're in debug mode
const debug = process.env.DEBUG === "true";

// LiveReload port
const LR_PORT = 35729;

// HTML template for index.html
const template = ({ attributes, files, meta, publicPath }) => {
  const scripts = files.js
    .map(
      ({ fileName }) => `<script src="${publicPath}${fileName}" defer></script>`
    )
    .join("\n    ");

  const css = `<link rel="stylesheet" href="${publicPath}style.css">`;

  return `<!DOCTYPE html>
<html ${attributes.html}>
<head>
  <meta charset="utf-8">
  <title>VideoJS Player</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" href="${publicPath}favicon.ico">
  ${css}
</head>
<body>
  <div class="video-container">
    <div id="error-container" class="error-overlay">
      <h1>VideoJS 7.14.3</h1>
      <p class="url-params">URL Params: ?version=x.x.x&source=url&controls=true&autoplay=false</p>
      <div id="error-log"></div>
      <div id="player-status" class="player-status"></div>
    </div>
    <video-js id="video" class="vjs-default-skin" controls preload="auto" width="640" height="264" data-setup="{}">
      <p class="vjs-no-js">
        To view this video please enable JavaScript, and consider upgrading to a web browser that
        <a href="https://videojs.com/html5-video-support/" target="_blank">supports HTML5 video</a>.
      </p>
    </video-js>
  </div>
  ${scripts}
</body>
</html>`;
};

module.exports = {
  input: "src/index.js",
  output: {
    dir: "dist",
    format: "iife",
    sourcemap: debug,
    name: "app",
    plugins: !debug ? [terser()] : [],
  },
  plugins: [
    // Resolve node modules
    resolve({
      browser: true,
      mainFields: ["browser", "module", "main"],
    }),

    // Convert CommonJS modules to ES6
    commonjs(),

    // Handle JSON files
    json(),

    // Replace process.env.NODE_ENV
    replace({
      "process.env.NODE_ENV": JSON.stringify(
        debug ? "development" : "production"
      ),
      "process.env.DEBUG": JSON.stringify(debug),
      preventAssignment: true,
    }),

    // Generate HTML file
    html({
      template,
      publicPath: "",
    }),

    // Copy static assets
    copy({
      targets: [
        { src: "static/*", dest: "dist" },
        { src: "static/style.css", dest: "dist" },
      ],
      flatten: false,
    }),

    // Live reload for development
    debug &&
      livereload({
        watch: "dist",
        verbose: true,
        port: LR_PORT,
      }),
  ].filter(Boolean),
};
