// Synthetic media, not a provider session or proof of ad fill.
// Requires ffmpeg with libx264; generated segments stay out of the production build.
import { mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve("tests/fixtures/hls");
mkdirSync(root, { recursive: true });
const parts = [
  { name: "content-before", color: "blue", frequency: 440 },
  { name: "ad", color: "red", frequency: 880 },
  { name: "content-after", color: "green", frequency: 440 },
];
for (const part of parts) {
  execFileSync("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y",
    "-f", "lavfi", "-i", `color=c=${part.color}:s=640x360:r=30`,
    "-f", "lavfi", "-i", `sine=frequency=${part.frequency}:sample_rate=48000`,
    "-t", "4", "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p",
    "-g", "60", "-sc_threshold", "0", "-c:a", "aac", "-b:a", "96k",
    "-f", "hls", "-hls_time", "2", "-hls_list_size", "0",
    "-hls_segment_filename", `${root}/${part.name}-%d.ts`, `${root}/${part.name}.m3u8`,
  ]);
}
const header = "#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:2\n#EXT-X-MEDIA-SEQUENCE:0\n#EXT-X-PLAYLIST-TYPE:VOD\n";
let stitched = header;
parts.forEach((part, index) => {
  if (index > 0) stitched += "#EXT-X-DISCONTINUITY\n";
  if (index === 1) stitched += "#EXT-X-CUE-OUT:4\n";
  if (index === 2) stitched += "#EXT-X-CUE-IN\n";
  for (let i = 0; i < 2; i++) stitched += `#EXTINF:2.000000,\n${part.name}-${i}.ts\n`;
});
writeFileSync(`${root}/stitched.m3u8`, stitched + "#EXT-X-ENDLIST\n");
writeFileSync(`${root}/master.m3u8`,
  '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=300000,CODECS="avc1.42c01e,mp4a.40.2",RESOLUTION=640x360\nstitched.m3u8\n');
writeFileSync(`${root}/ordinary.m3u8`, header +
  "#EXTINF:2.000000,\ncontent-before-0.ts\n#EXTINF:2.000000,\ncontent-before-1.ts\n#EXT-X-ENDLIST\n");
console.log("Generated 12s fixture: blue content (0–4s), red ad (4–8s), green content (8–12s).");
