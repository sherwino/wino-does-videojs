---
name: HLS browser verification
description: Non-equivalent media support in the available preview browsers.
---

The static screenshot capture reported an unsupported-source error for the same controlled H.264/AAC stitched fixture that the installed Chromium successfully played. Do not use a static capture alone to confirm or reject HLS playback.

**Why:** Real browser tests verified decoded content/ad/content frames and successful segment requests despite the capture browser's error.

**How to apply:** Verify HLS playback with a codec-capable installed browser and record decoded frames, timeline advancement, and network results. State native Safari and legacy-device coverage separately when not available.
