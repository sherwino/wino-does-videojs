// Global variables for logging
let errorLog;
let playerStatus;
let video;

// Global variable to store rendition info element
let renditionInfo;

// Default media sources to use as fallback if API fails
const DEFAULT_MEDIA = {
  testStream: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
  sintel: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
};

// Media collection to be populated from API
let MEDIA = DEFAULT_MEDIA;
// New variable to store the original entry array
let mediaEntries = [];

// API URL for fetching media entries
const MEDIA_API_URL =
  "https://assets-production.applicaster.com/zapp/assets/accounts/604f7bdcc52c90000804df10/static_feeds/feed-acccc248-5ec7-4eed-b98e-a751c2687b46.json";

// Initial media index
let currentMediaIndex = 0;

// Utility functions for logging
function logError(message) {
  if (!errorLog) return;

  const errorItem = document.createElement("div");
  errorItem.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
  errorLog.appendChild(errorItem);

  // Keep only the last 10 error messages
  while (errorLog.children.length > 10) {
    errorLog.removeChild(errorLog.firstChild);
  }

  // Also log to console
  console.error("[videojs-player]", message);
}

function clearErrorContainer() {
  if (!errorLog) return;

  // Remove all children from the error log
  while (errorLog.firstChild) {
    errorLog.removeChild(errorLog.firstChild);
  }
}

function logStatus(message) {
  if (!errorLog) return;

  const statusItem = document.createElement("div");
  statusItem.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
  statusItem.classList.add("status-message");
  errorLog.appendChild(statusItem);

  // Also update player status if available
  if (playerStatus) {
    playerStatus.innerHTML = `<span class="log-info">[info] ${message}</span>`;
  }

  // Also log to console
  console.log("[videojs-player]", message);

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    if (statusItem.parentNode === errorLog) {
      errorLog.removeChild(statusItem);
    }
  }, 5000);
}

// Function to log player status with different styles based on log level
function logPlayerStatus(type, ...args) {
  if (!playerStatus) return;

  // Convert arguments to string
  const message = args
    .map((arg) => {
      if (typeof arg === "object") {
        try {
          return JSON.stringify(arg);
        } catch (e) {
          return String(arg);
        }
      }
      return String(arg);
    })
    .join(" ");

  // Update the player status element
  playerStatus.innerHTML = `<span class="log-${type}">[${type}] ${message}</span>`;

  // Also log to console for debugging
  console[type]("[videojs-player]", ...args);
}

// Function to load media from API
async function loadMediaFromAPI() {
  try {
    logStatus("Loading media list from API...");
    const response = await fetch(MEDIA_API_URL);

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.entry || !Array.isArray(data.entry) || data.entry.length === 0) {
      throw new Error("No media entries found in API response");
    }

    // Store the original entry array
    mediaEntries = data.entry.filter(
      (entry) => entry.content && entry.content.src
    );

    if (mediaEntries.length === 0) {
      logError("No valid media URLs found in API response");
      return false;
    }

    // Keep compatibility with existing code
    MEDIA = {};
    mediaEntries.forEach((entry, index) => {
      const key = entry.title
        ? entry.title.replace(/[^a-zA-Z0-9]/g, "")
        : `stream${index + 1}`;
      MEDIA[key] = entry.content.src.trim();
    });

    logStatus(`Successfully loaded ${mediaEntries.length} media sources`);
    return true;
  } catch (error) {
    logError(`Failed to load media from API: ${error.message}`);
    logStatus("Using default media sources as fallback");
    MEDIA = DEFAULT_MEDIA;
    mediaEntries = []; // Clear entries array on error
    return false;
  }
}

// Parse URL parameters with type conversion for VideoJS options
function getUrlParams() {
  const params = {};
  const queryString = window.location.search.substring(1);
  const pairs = queryString.split("&");

  for (const pair of pairs) {
    if (pair === "") continue;
    const parts = pair.split("=");
    const key = decodeURIComponent(parts[0]);
    let value = decodeURIComponent(parts[1] || "");

    // Convert string values to appropriate types for VideoJS
    if (value === "true") value = true;
    else if (value === "false") value = false;
    else if (!isNaN(Number(value)) && value !== "") value = Number(value);
    // Handle array values (e.g., playbackRates=0.5,1,1.5,2)
    else if (value.includes(',')) {
      const arrayValues = value.split(',').map(v => {
        if (v === "true") return true;
        if (v === "false") return false;
        if (!isNaN(Number(v)) && v !== "") return Number(v);
        return v;
      });
      value = arrayValues;
    }

    params[key] = value;
  }

  return params;
}

// Convert URL parameters to VideoJS options object
function urlParamsToVideoJSOptions(urlParams) {
  const videoJSOptions = {};
  
  // Remove non-VideoJS specific params
  const nonVideoJSParams = ['version', 'source'];
  
  Object.keys(urlParams).forEach(key => {
    if (!nonVideoJSParams.includes(key)) {
      videoJSOptions[key] = urlParams[key];
    }
  });

  return videoJSOptions;
}

// Function to get the current media source
function getCurrentMediaSource() {
  const urlParams = getUrlParams();

  // URL parameter takes precedence if provided
  if (urlParams.source) {
    return urlParams.source;
  }

  // Use the mediaEntries array if available
  if (mediaEntries.length > 0) {
    return mediaEntries[currentMediaIndex].content.src;
  }

  // Fall back to MEDIA object if no entries
  const mediaKeys = Object.keys(MEDIA);
  return MEDIA[mediaKeys[currentMediaIndex]];
}

// Update URL parameters display in HTML
function updateUrlParamsDisplay() {
  const urlParams = getUrlParams();
  const urlParamsElement = document.querySelector(".url-params");
  if (urlParamsElement) {
    const hasParams = Object.keys(urlParams).length > 0;
    if (hasParams) {
      urlParamsElement.textContent = "URL Params: " + JSON.stringify(urlParams);
      urlParamsElement.style.display = "block";
    } else {
      urlParamsElement.style.display = "none";
    }
  }

  // Update media info display
  updateMediaInfoDisplay();
}

// Update media info display
function updateMediaInfoDisplay() {
  const mediaInfoElement = document.querySelector(".media-info");
  if (!mediaInfoElement) {
    // Create it if it doesn't exist
    const container = document.querySelector("#error-container");
    if (container) {
      const infoElement = document.createElement("p");
      infoElement.className = "media-info";
      container.appendChild(infoElement);
    }
  }

  const mediaInfoElement2 = document.querySelector(".media-info");
  if (mediaInfoElement2) {
    if (mediaEntries.length > 0) {
      const currentEntry = mediaEntries[currentMediaIndex];
      mediaInfoElement2.textContent = `Media: ${currentEntry.title} (${
        currentMediaIndex + 1
      }/${mediaEntries.length})`;
      mediaInfoElement2.style.display = "block";
    } else {
      // Fall back to MEDIA object
      const mediaKeys = Object.keys(MEDIA);
      if (mediaKeys.length > 0) {
        const currentKey = mediaKeys[currentMediaIndex];
        mediaInfoElement2.textContent = `Media: ${currentKey} (${
          currentMediaIndex + 1
        }/${mediaKeys.length})`;
        mediaInfoElement2.style.display = "block";
      } else {
        mediaInfoElement2.textContent = "No media sources available";
      }
    }
  }
}

// Function to dynamically load VideoJS based on URL parameter
async function loadVideoJSVersion() {
  const urlParams = getUrlParams();
  const defaultVersion = "7.14.3";
  const version = urlParams.version || defaultVersion;
  const vjsCSS = `https://cdnjs.cloudflare.com/ajax/libs/video.js/${version}/video-js.css`;
  const vjsJS = `https://cdnjs.cloudflare.com/ajax/libs/video.js/${version}/video.min.js`;

  logStatus(`Loading VideoJS version ${version}...`);

  try {
    // Load CSS first
    const cssLink = document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.href = vjsCSS;
    document.head.appendChild(cssLink);

    // Check if version exists and load the script
    const response = await fetch(vjsJS, { method: "HEAD" });
    if (!response.ok) {
      throw new Error(`VideoJS version ${version} not found`);
    }

    // Load the script dynamically
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = vjsJS;
      script.onload = () => {
        logStatus(`VideoJS ${version} loaded successfully`);
        resolve();
      };
      script.onerror = () =>
        reject(new Error(`Failed to load VideoJS ${version}`));
      document.head.appendChild(script);
    });

    // Update UI with version
    document.title = `VideoJS ${version}`;
    const headerEl = document.querySelector("h1");
    if (headerEl) {
      headerEl.textContent = `VideoJS v${version}`;
    }

    return true;
  } catch (error) {
    logError(`Failed to load VideoJS v${version}: ${error.message}`);

    // Try loading default version as fallback
    if (version !== defaultVersion) {
      logStatus(`Trying fallback to VideoJS ${defaultVersion}...`);
      const fallbackCSS = `https://cdnjs.cloudflare.com/ajax/libs/video.js/${defaultVersion}/video-js.css`;
      const fallbackJS = `https://cdnjs.cloudflare.com/ajax/libs/video.js/${defaultVersion}/video.min.js`;

      try {
        // Load fallback CSS
        const cssLink = document.createElement("link");
        cssLink.rel = "stylesheet";
        cssLink.href = fallbackCSS;
        document.head.appendChild(cssLink);

        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = fallbackJS;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });

        document.title = `VideoJS ${defaultVersion} (fallback)`;
        const headerEl = document.querySelector("h1");
        if (headerEl) {
          headerEl.textContent = `VideoJS v${defaultVersion} (fallback)`;
        }

        return true;
      } catch (fallbackError) {
        logError(`Failed to load fallback VideoJS: ${fallbackError.message}`);
        return false;
      }
    }

    return false;
  }
}

// Play next video function
function playNextVideo() {
  if (mediaEntries.length > 0) {
    currentMediaIndex = (currentMediaIndex + 1) % mediaEntries.length;
    const nextMedia = mediaEntries[currentMediaIndex];

    clearErrorContainer();
    logStatus(`Playing next video: ${nextMedia.title}`);

    // Check if VideoJS player is available
    if (window.videojsPlayer) {
      // Load the new source
      window.videojsPlayer.src({
        src: nextMedia.content.src,
        type: 'application/x-mpegURL'
      });

      // Update the UI
      updateMediaInfoDisplay();
    }
  } else {
    // Fall back to MEDIA object
    const mediaKeys = Object.keys(MEDIA);
    currentMediaIndex = (currentMediaIndex + 1) % mediaKeys.length;
    const nextMedia = MEDIA[mediaKeys[currentMediaIndex]];

    clearErrorContainer();
    logStatus(`Video ended. Playing next: ${mediaKeys[currentMediaIndex]}`);

    // Check if VideoJS player is available
    if (window.videojsPlayer) {
      // Load the new source
      window.videojsPlayer.src({
        src: nextMedia,
        type: 'application/x-mpegURL'
      });

      // Update the UI
      updateMediaInfoDisplay();
    }
  }
}

// Check if media is playing
function isVideoPlaying() {
  if (!window.videojsPlayer) return false;
  return !window.videojsPlayer.paused();
}

// Handle key press events
function handleKeyDown(event) {
  if (!window.videojsPlayer) return;

  const currentPosition = window.videojsPlayer.currentTime();

  switch (event.key) {
    case "ArrowUp":
      if (mediaEntries.length > 0) {
        // Move to next video, loop back to first if at the end
        currentMediaIndex = (currentMediaIndex + 1) % mediaEntries.length;
        const nextEntry = mediaEntries[currentMediaIndex];
        clearErrorContainer();
        logStatus(`Switching to: ${nextEntry.title}`);

        window.videojsPlayer.src({
          src: nextEntry.content.src,
          type: 'application/x-mpegURL'
        });
      } else {
        // Fall back to MEDIA object
        const mediaKeys = Object.keys(MEDIA);
        currentMediaIndex = (currentMediaIndex + 1) % mediaKeys.length;
        const nextMedia = MEDIA[mediaKeys[currentMediaIndex]];
        clearErrorContainer();
        logStatus(`Switching to: ${mediaKeys[currentMediaIndex]}`);

        window.videojsPlayer.src({
          src: nextMedia,
          type: 'application/x-mpegURL'
        });
      }
      updateMediaInfoDisplay();
      break;
    case "ArrowDown":
      if (mediaEntries.length > 0) {
        // Move to previous video, loop to last if at the beginning
        currentMediaIndex =
          (currentMediaIndex - 1 + mediaEntries.length) % mediaEntries.length;
        const prevEntry = mediaEntries[currentMediaIndex];
        clearErrorContainer();
        logStatus(`Switching to: ${prevEntry.title}`);

        window.videojsPlayer.src({
          src: prevEntry.content.src,
          type: 'application/x-mpegURL'
        });
      } else {
        // Fall back to MEDIA object
        const mediaKeys = Object.keys(MEDIA);
        currentMediaIndex =
          (currentMediaIndex - 1 + mediaKeys.length) % mediaKeys.length;
        const prevMedia = MEDIA[mediaKeys[currentMediaIndex]];
        clearErrorContainer();
        logStatus(`Switching to: ${mediaKeys[currentMediaIndex]}`);

        window.videojsPlayer.src({
          src: prevMedia,
          type: 'application/x-mpegURL'
        });
      }
      updateMediaInfoDisplay();
      break;
    case "ArrowRight":
      window.videojsPlayer.currentTime(currentPosition + 10);
      break;
    case "ArrowLeft":
      window.videojsPlayer.currentTime(currentPosition - 10);
      break;
    case "Enter":
      if (isVideoPlaying()) {
        window.videojsPlayer.pause();
      } else {
        window.videojsPlayer.play();
      }
      break;
    case "m":
      // Toggle mute
      window.videojsPlayer.muted(!window.videojsPlayer.muted());
      logStatus(`Video ${window.videojsPlayer.muted() ? "muted" : "unmuted"}`);
      break;
    default:
      break;
  }
}

// Handle autoplay with browser policy compliance
function handleAutoplay(player, playerOptions) {
  logStatus("Attempting autoplay...");
  
  // First, try to detect if autoplay is allowed
  if (player.autoplay && player.autoplay() !== false) {
    // VideoJS autoplay is enabled, let it handle automatically
    logStatus("VideoJS autoplay enabled, letting VideoJS handle");
    return;
  }
  
  // Manual autoplay handling with mute-first strategy
  const wasOriginallyMuted = playerOptions.muted;
  
  // Step 1: Ensure video is muted for autoplay compliance
  player.muted(true);
  
  // Step 2: Attempt to play
  const playPromise = player.play();
  
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        logStatus("Autoplay succeeded (muted)");
        
        // Step 3: If originally not meant to be muted, try to unmute after a delay
        if (!wasOriginallyMuted) {
          setTimeout(() => {
            // Check if user hasn't manually muted in the meantime
            if (player.muted()) {
              player.muted(false);
              logStatus("Unmuted after successful autoplay");
            }
          }, 1000); // Wait 1 second before unmuting
        }
      })
      .catch((error) => {
        logError(`Autoplay failed: ${error.message}`);
        
        // Fallback: Try with explicit user interaction detection
        logStatus("Waiting for user interaction to enable autoplay");
        
        // Add one-time click listener to start playback
        const startPlayback = () => {
          player.muted(wasOriginallyMuted);
          player.play().then(() => {
            logStatus("Playback started after user interaction");
          }).catch((err) => {
            logError(`Playback failed even after interaction: ${err.message}`);
          });
          
          // Remove listeners
          document.removeEventListener('click', startPlayback);
          document.removeEventListener('keydown', startPlayback);
        };
        
        document.addEventListener('click', startPlayback, { once: true });
        document.addEventListener('keydown', startPlayback, { once: true });
      });
  } else {
    // Older browser or VideoJS version
    logStatus("Legacy autoplay attempt");
    try {
      player.muted(true);
      player.currentTime(0);
      if (!wasOriginallyMuted) {
        setTimeout(() => player.muted(false), 1000);
      }
    } catch (error) {
      logError(`Legacy autoplay failed: ${error.message}`);
    }
  }
}

// Initialize player after VideoJS is loaded
async function initPlayer() {
  try {
    // Wait for VideoJS to load
    const vjsLoaded = await loadVideoJSVersion();
    if (!vjsLoaded || typeof videojs === "undefined") {
      throw new Error("Failed to load VideoJS");
    }

    logStatus("Creating VideoJS player...");

    // Get URL parameters and convert to VideoJS options
    const urlParams = getUrlParams();
    const videoJSOptions = urlParamsToVideoJSOptions(urlParams);

    // Set default options
    const defaultOptions = {
      fluid: true,
      responsive: true,
      playbackRates: [0.5, 1, 1.25, 1.5, 2],
      controls: true,
      preload: 'auto'
    };

    // Merge default options with URL parameters
    const playerOptions = { ...defaultOptions, ...videoJSOptions };
    
    // Store original autoplay preference and disable VideoJS autoplay for manual handling
    const wantsAutoplay = playerOptions.autoplay;
    if (wantsAutoplay) {
      // Disable VideoJS autoplay, we'll handle it manually
      playerOptions.autoplay = false;
      // Store the original preference for our custom handler
      playerOptions._customAutoplay = true;
    }

    // Get stream URL from getCurrentMediaSource (handles params and media list)
    const source = getCurrentMediaSource();

    // Add source to options
    playerOptions.sources = [{
      src: source,
      type: 'application/x-mpegURL'
    }];

    logStatus(`Loading stream: ${source}`);
    logStatus(`Player options: ${JSON.stringify(playerOptions)}`);

    // Initialize VideoJS player
    const player = videojs('video', playerOptions);

    // Add event handlers
    player.ready(function() {
      logStatus("VideoJS player is ready");
      
      // Handle autoplay with proper browser policy compliance
      if (playerOptions._customAutoplay) {
        handleAutoplay(player, playerOptions);
      }
    });

    player.on('loadedmetadata', function() {
      logStatus("Stream metadata loaded");
      
      // Update rendition info if available
      updateRenditionDisplay(player);
      
      // Try autoplay again after metadata is loaded (more reliable)
      if (playerOptions._customAutoplay && !player.hasStarted()) {
        handleAutoplay(player, playerOptions);
      }
    });

    player.on('ended', function() {
      logStatus("Video ended, playing next");
      playNextVideo();
    });

    player.on('error', function() {
      const error = player.error();
      if (error) {
        logError(`VideoJS error: ${error.message} (Code: ${error.code})`);
      }
    });

    // Store player globally for debugging and keyboard controls
    window.videojsPlayer = player;

    // Add keyboard event listeners
    document.addEventListener("keydown", handleKeyDown);

    // Update UI displays
    updateUrlParamsDisplay();
    updateMediaInfoDisplay();

    logStatus("✅ Player initialization complete!");
  } catch (error) {
    logError(`Player initialization failed: ${error.message}`);
  }
}

// Function to update rendition information display
function updateRenditionDisplay(player) {
  if (!renditionInfo) {
    // Create it if it doesn't exist
    const container = document.querySelector("#error-container");
    if (container) {
      renditionInfo = document.createElement("p");
      renditionInfo.className = "rendition-info";
      container.appendChild(renditionInfo);
    }
  }

  if (!renditionInfo || !player) return;

  // Get video element dimensions
  const videoEl = player.el().querySelector('video');
  if (videoEl) {
    const width = videoEl.videoWidth || 0;
    const height = videoEl.videoHeight || 0;
    
    // VideoJS doesn't expose bitrate as easily as HLS.js
    // but we can show resolution info
    renditionInfo.textContent = `Resolution: ${width}x${height}`;
    renditionInfo.style.display = "block";
  } else {
    renditionInfo.textContent = "Resolution: Waiting for video data...";
    renditionInfo.style.display = "block";
  }
}

// Initialize application when DOM is ready
async function initialize() {
  // Initialize DOM element references
  errorLog = document.getElementById("error-log");
  playerStatus = document.getElementById("player-status");

  if (!errorLog) {
    console.error("Required DOM elements not found, retrying in 100ms");
    setTimeout(initialize, 100);
    return;
  }

  clearErrorContainer();
  logStatus("Starting VideoJS player initialization...");

  // First load media from API
  await loadMediaFromAPI();

  // Then initialize player with loaded media
  initPlayer();
}

// Start initialization when page loads - two approaches for compatibility
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize);
} else {
  // DOM already loaded
  initialize();
}