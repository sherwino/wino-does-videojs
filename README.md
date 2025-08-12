# VideoJS Player with Dynamic Configuration

A modern VideoJS implementation with dynamic version loading and URL parameter configuration, built with Rollup.

## Features

- Dynamic VideoJS version loading via URL parameter
- URL parameter to VideoJS options mapping
- Keyboard controls for media switching and playback
- API-driven media list with fallback sources  
- Minification and sourcemaps for production/debugging
- Modern bundling with Rollup

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

**Note on Autoplay**: The application implements smart autoplay handling that complies with browser autoplay policies:
- Videos start muted to meet autoplay requirements
- If `muted=false` is specified, the video unmutes after 1 second of successful playback
- If autoplay fails, it waits for user interaction before starting playback

### Examples

```bash
# Load specific VideoJS version with custom source
http://localhost:3000/?version=7.14.3&source=https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8

# Configure player options via URL
http://localhost:3000/?autoplay=true&muted=false&controls=true&playbackRates=0.75,1,1.25,1.5

# Combine version, source and player options
http://localhost:3000/?version=8.0.0&source=https://example.com/stream.m3u8&autoplay=true&fluid=false
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