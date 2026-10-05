# VideoJS Player with Dynamic Configuration

A modern VideoJS implementation with dynamic version loading and URL parameter configuration, built with Rollup.

## Features

- Dynamic VideoJS version loading via URL parameter
- URL parameter to VideoJS options mapping
- Keyboard controls for media switching and playback
- API-driven media list with fallback sources  
- Minification and sourcemaps for production/debugging
- Modern bundling with Rollup
- **Chrome 52+ compatibility** with automatic transpilation and polyfills

## Browser Compatibility

This project is compatible with:
- ✅ Chrome 52+ (July 2016)
- ✅ Firefox 48+ (August 2016)
- ✅ Safari 10+ (September 2016)
- ✅ Edge 14+ (August 2016)
- ✅ iOS Safari 10+
- ✅ Android Chrome 52+

The build process automatically transpiles modern JavaScript to ES5 and includes necessary polyfills. See [CHROME52-COMPATIBILITY.md](./CHROME52-COMPATIBILITY.md) for technical details.

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Easy Setup

For quick setup, run the included setup script:

```bash
# Run the setup script with npm
npm run setup
```

This will:

1. Install all dependencies
2. Build the application in debug mode
3. Start a local server on port 3000

### Manual Installation

```bash
# Clone the repository
git clone <repository-url>
cd <repository-directory>

# Install dependencies
npm install

# Start development build with live reload
npm start
# or
npm run dev

# Start a development server on a specific port
npm run dev-server  # Serves on port 3000
```

## Development

Development mode has two main components:

1. **Rollup build with livereload** (npm run dev)

   - Watches for file changes
   - Rebuilds automatically
   - Livereload on port 35729

2. **Development server** (npm run dev-server)
   - Serves the dist directory
   - Runs on port 3000
   - Accessible at http://localhost:3000

For the best development experience, use the combined script:

```bash
# Start both the build process and server in one command
npm start

# You'll see a message like:
# ┌───────────────────────────────────────┐
# │                                       │
# │   Serving!                            │
# │                                       │
# │   - Local:    http://localhost:3000   │
# │                                       │
# └───────────────────────────────────────┘
```

### Production Build

```bash
# Build for production (minified, no sourcemaps)
npm run build

# Build with sourcemaps for debugging
npm run build:debug

# Serve the built files
npm run serve
```

## Usage

### URL Parameters

You can configure the VideoJS player using URL parameters:

#### Core Parameters
- `version`: Specify which VideoJS version to load (e.g., `?version=7.14.3`)
- `source`: Specify the HLS stream URL (e.g., `?source=https://example.com/stream.m3u8`)

#### VideoJS Player Options
Any VideoJS player option can be passed as a URL parameter:

- `controls`: Enable/disable controls (`?controls=true`)
- `autoplay`: Enable autoplay with browser policy compliance (`?autoplay=true`) 
- `muted`: Start muted (`?muted=true`)
- `fluid`: Enable fluid sizing (`?fluid=true`)
- `playbackRates`: Set available playback rates (`?playbackRates=0.5,1,1.5,2`)
- `preload`: Set preload behavior (`?preload=auto`)
- `loop`: Enable video looping (`?loop=true`)

**Note on Autoplay**: The application enables autoplay by default with browser policy compliance:
- Videos autoplay muted by default to meet browser requirements
- Videos stay muted until the viewer unmutes with the volume control or **M** key. Download progress is not a user gesture.
- To disable autoplay: `?autoplay=false`
- To keep muted during autoplay: `?muted=true`
- An explicit `?muted=false` requests audible playback. Browsers may block audible autoplay; press Play or Enter to begin.

### Examples

```bash
# Default behavior (muted autoplay; viewer can unmute)
http://localhost:3000/

# Load specific VideoJS version with custom source (muted autoplay)
http://localhost:3000/?version=7.14.3&source=https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8

# Autoplay but keep muted
http://localhost:3000/?muted=true&source=https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8

# Disable autoplay completely
http://localhost:3000/?autoplay=false&source=https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8

# Combine version, source and player options
http://localhost:3000/?version=8.0.0&source=https://example.com/stream.m3u8&playbackRates=0.75,1,1.25,1.5
```

## Keyboard Controls

- **Up Arrow**: Switch to next video
- **Down Arrow**: Switch to previous video  
- **Right Arrow**: Skip forward 10 seconds
- **Left Arrow**: Skip backward 10 seconds
- **Enter**: Play/pause toggle
- **M**: Mute/unmute toggle

## Implementation Details

This project uses a clean approach:

- VideoJS is loaded dynamically from CDN based on URL parameter
- URL parameters are automatically converted to VideoJS player options
- All bundled with Rollup for optimal production builds
- No external analytics dependencies

### URL Parameter to VideoJS Options Mapping

The application automatically converts URL parameters to VideoJS configuration:

1. **Type Conversion**: String parameters are converted to appropriate types
   - `"true"/"false"` → boolean
   - Numbers → number
   - Comma-separated values → arrays

2. **Option Filtering**: Special parameters (`version`, `source`) are handled separately from VideoJS options

3. **Default Options**: Sensible defaults are provided and can be overridden via URL parameters

### Stitched SSAI playback

The player plays HLS ads when the SSAI provider has already inserted the ad **media segments** into the playlist. Video.js 7.14.3 includes the HLS playback engine; no New Relic tracker, Brightcove SSAI plugin, or ad analytics is required for this playback-only use case. Brightcove's plugin registry describes plugins for Brightcove Player, not a universal plugin requirement for plain Video.js.

Use the provider's **stitched playback manifest**, not the original content manifest, VAST URL, tracking endpoint, or session-initialization JSON URL. This app does not create SSAI sessions. For client-initialized services, obtain the playback URL through the provider's initialization process first.

Encode the **entire** nested source URL once so its `&`, `+`, `=`, commas, and already-encoded values survive the outer player query:

```javascript
const stitchedUrl = "https://cdn.example/playlist.m3u8?session=a=b==&paths=one,two&sig=a+b%2F";
const playerUrl = "/?source=" + encodeURIComponent(stitchedUrl) + "&version=7.14.3";
```

`source` and `version` remain strings; other player options retain their boolean, numeric, and comma-array conversions. Raw ampersands belong to the outer query, so a source containing query parameters must be encoded. Malformed percent encoding, empty sources, and invalid version values produce an initialization error instead of silently selecting a sample video. The full source URL is hidden from application status logs and the parameter display. The media overlay identifies the actual selected source by host/path, without URL credentials, query values, or fragments; it never substitutes an unrelated feed title such as Big Buck Bunny. The full URL remains available in browser network tools and `window.videojsPlayer.currentSrc()`. Do not share signed playback URLs or browser traces publicly.

A supplied source does not depend on the sample-feed API and remains selected when it ends. Up/Down can still select the built-in sample streams, deliberately leaving that supplied session.

**Provider requirements and limitations**

- The provider must fill the break and include playable ad segments in the media playlist. A no-fill break cannot produce an ad.
- `EXT-X-CUE-OUT`, SCTE-35, or `EXT-X-DATERANGE` tags alone do not make this player fetch VAST or insert separate ad assets. HLS interstitials using separate asset URIs (server-guided insertion) are not supported by this implementation.
- Codec/container changes, timestamp resets, and encryption changes must be represented correctly in the HLS stream (including discontinuities and keys where required).
- The master/media playlists, content/ad segments, and encryption keys must be reachable. Cross-origin playback must permit the necessary CORS requests; signed URLs must be valid. HTTPS pages must not request HTTP-only media.
- Ad beacons, impressions, quartiles, ad UI, and preventing seeks through ads are intentionally not implemented. Configure reporting with your provider separately if needed.

See [SSAI verification results](docs/ssai-verification.md) for what was actually tested and the remaining coverage limits.

### Playback regression checks

```bash
npm test                 # URL parsing and playback-policy checks
npm run build
npm run test:fixture     # Requires ffmpeg with libx264; creates synthetic media
npm run preview          # Serves dist/ on port 5000 and local test fixtures
```

In another terminal:

```bash
# Use an installed Chromium that supports H.264/AAC, or Playwright's installed browser.
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/to/chromium npm run test:playback
```

`PLAYBACK_BASE_URL` can point the tests at another preview origin. For Replit's installed browser, the executable is `/repl/tools/bin/chromium`. The fixture is **synthetic**, not an ad-provider session: blue content (0–4 seconds), red ad (4–8), green content (8–12). Both boundaries reset timestamps and use `EXT-X-DISCONTINUITY`. Tests confirm frame colors, successful segment requests, natural playback, muted autoplay, manual audible play, source changes, and explicit malformed-query failure. Generated media and browser outputs are ignored by Git and never copied into the production build.

## Troubleshooting

If you encounter build errors, try the following:

1. Use the bundleConfigAsCjs flag if you see ES module errors:

   ```
   rollup -c --bundleConfigAsCjs --environment DEBUG:true
   ```

2. If you see JSON parsing errors, make sure the @rollup/plugin-json package is installed:

   ```
   npm install --save-dev @rollup/plugin-json
   ```

3. The setup.js script includes fallback mechanisms to handle most common build issues.

## License

MIT