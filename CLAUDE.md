# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

Quick setup:
```bash
npm run setup    # Installs dependencies, builds debug, starts server
```

Development workflow:
```bash
npm start        # Runs both build watcher and dev server
npm run dev      # Build watcher with live reload (port 35729)
npm run dev-server  # Serves dist/ on port 3000
```

Build commands:
```bash
npm run build         # Production build (minified)
npm run build:debug   # Debug build with sourcemaps
npm run serve         # Serve built files
```

## Architecture Overview

This is a VideoJS player with dynamic version loading and URL parameter configuration, built with Rollup bundling.

### Key Components

- **Dynamic VideoJS Loading**: VideoJS version loaded from CDN based on URL parameter `?version=x.x.x`
- **URL Parameter Mapping**: Any VideoJS player option can be passed as URL parameters
- **Media Management**: API-driven media list with fallback to hardcoded sources
- **Keyboard Controls**: Arrow keys for media switching, Enter for play/pause, M for mute

### Core Files

- `src/index.js` - Main application logic with VideoJS player initialization and event handling
- `rollup.config.js` - Build configuration with HTML template generation and livereload
- `setup.js` - Cross-platform setup script with fallback mechanisms
- `static/` - Contains CSS and favicon assets copied to dist/

### Build System

Uses Rollup with plugins:
- `@rollup/plugin-html` for dynamic HTML generation
- `rollup-plugin-livereload` for development hot reload
- `@rollup/plugin-terser` for production minification
- Environment-based debug mode via `DEBUG=true`

### URL Parameters

Core parameters:
- `version` - VideoJS version (defaults to 7.14.3)
- `source` - Custom HLS stream URL

VideoJS player options (any can be passed):
- `controls` - Enable/disable controls
- `autoplay` - Enable autoplay
- `muted` - Initial mute state
- `fluid` - Enable fluid sizing
- `playbackRates` - Available playback rates (comma-separated)
- `preload` - Preload behavior
- `loop` - Enable looping

### URL Parameter Processing

The application includes sophisticated URL parameter handling:
- **Type Conversion**: Automatically converts strings to appropriate types (boolean, number, arrays)
- **Array Support**: Comma-separated values become arrays (e.g., `playbackRates=0.5,1,1.5,2`)
- **Option Filtering**: Separates VideoJS options from application-specific parameters
- **Default Merging**: Merges URL parameters with sensible defaults

### Media API Integration

Fetches media list from external API (`MEDIA_API_URL`) with fallback to `DEFAULT_MEDIA` sources. Supports media switching with Up/Down arrow keys.

## Development Notes

- Debug mode enables sourcemaps and detailed logging
- Setup script includes fallback mechanisms for build failures
- Player uses VideoJS with HLS support for cross-browser compatibility
- No external analytics dependencies - clean VideoJS implementation
- Auto-plays next video when current one ends
- Keyboard controls work globally when player is active

## Key Functions

- `getUrlParams()` - Parses and converts URL parameters with type conversion
- `urlParamsToVideoJSOptions()` - Filters and maps parameters to VideoJS options
- `loadVideoJSVersion()` - Dynamically loads VideoJS from CDN with fallback
- `initPlayer()` - Initializes VideoJS player with merged options
- `handleKeyDown()` - Manages keyboard shortcuts for player control