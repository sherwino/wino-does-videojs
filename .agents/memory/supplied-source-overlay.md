---
name: Supplied-source overlay
description: User's display requirements for supplied playback URLs and overlay overflow.
---

When playing from a supplied `source`, do not render the media-list title or position. The user says the media list is not loaded in this case. Overlay overflow should be hidden, with ellipses for long lines, not scrollbars.

**Why:** The user repeated that Big Buck Bunny belongs to the sample list, not their supplied stream, and explicitly requested ellipsis truncation and overflow-hidden.

**How to apply:** Keep sample navigation and sample metadata separate from URL-source playback. Preserve this distinction when changing player events or overlay layout.
