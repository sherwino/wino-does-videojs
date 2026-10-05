---
name: SSAI playback scope
description: Customer's distinction between stitched ad playback and tracking.
---

The customer wants ads already served in the m3u8 to play, not SSAI tracking. Do not add analytics or an ad tracker simply to enable stitched segment playback.

**Why:** The customer explicitly said, “we are not trying to do tracking we just want to ensure ads play when served.”

**How to apply:** Keep playback compatibility separate from provider-session creation and tracking. Explain the difference between actual stitched ad segments and cue-only signaling before proposing additional integrations.
