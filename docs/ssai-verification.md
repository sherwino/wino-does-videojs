# SSAI playback verification

## Result

On October 5, 2026, Video.js **7.14.3** in installed Chromium **152.0.7977.64** played a controlled stitched HLS playlist through content → ad → content without an SSAI tracking plugin. This confirms the player's basic stitched-HLS playback path, **not** a customer's actual provider session, ad fill, tracking, or every browser/device.

## Evidence

The locally generated master playlist selects a 12-second H.264/AAC media playlist:

| Period | Time | Expected picture | Observed sampled RGB |
| --- | --- | --- | --- |
| Content before | 0–4 seconds | Blue | 0, 14, 253 |
| Ad | 4–8 seconds | Red | 255, 24, 0 |
| Content after | 8–12 seconds | Green | 0, 109, 2 |

Each period was independently encoded with reset timestamps. `EXT-X-DISCONTINUITY` separates the periods, and cue-out/cue-in tags mark the ad. The ad is present as actual media segments, not solely as signaling.

- Natural playback reached **12.010664 seconds** with `ended=true` and no player error; the test did not seek across boundaries.
- All six content/ad segment requests returned **HTTP 200**, including both ad segments and resumed content.
- Default autoplay stayed muted throughout. Manual audible Play, the M mute control, and a change to ordinary non-ad HLS worked.
- The selected source retained its embedded equals signs, comma, signature plus sign, and encoded delimiter.
- Only one active Video.js player existed. The supplied stream stayed selected after ending.
- For a URL-provided source, the overlay omits the media-list label entirely and withholds signed query values. Sample feed loading and Up/Down sample navigation are bypassed.
- Narrow-screen checks verify hidden overflow and single-line ellipses for long parameters and diagnostics, without overlay or log scrollbars.
- A separate browser case started with a mocked Big Buck Bunny feed entry, changed the player source directly, and confirmed the overlay followed the actual stream. Keyboard navigation then correctly displayed the newly selected feed entry.
- Malformed URL encoding produced an actionable error without loading a fallback stream.

Verification commands: `npm test` (14 checks), `npm run build`, and `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/repl/tools/bin/chromium npm run test:playback` (5 browser cases). Browser checks are in `tests/playback.spec.cjs`; screenshots and JSON evidence are generated under ignored `test-results/`.

## Limitations

No actual stitched customer/provider URL was supplied. The existing media feed contained ordinary sample streams, so it was not evidence of SSAI ad fill. The synthetic fixture does not verify MediaTailor session initialization, live manifest refresh/ad insertion, provider authentication, DRM, all codec transitions, alternate renditions, or CORS across provider domains.

Native HLS in Safari/iOS and the project's older-browser targets were not tested. The production JavaScript transpilation target remains Chrome 52; no Video.js upgrade was necessary for the tested path.

The workspace screenshot capture browser reported an unsupported-source error for this H.264 fixture, while the installed Chromium browser successfully rendered and decoded all three phases. Playback verification therefore used the codec-capable installed browser rather than inferring playback from the static capture.

The site must be republished to apply these changes to the public deployment.
