const { test, expect } = require("@playwright/test");

const source = "/fixtures/master.m3u8?session=a=b==&paths=one,two&sig=a+b%2F";
const url = `/?source=${encodeURIComponent(source)}`;
const playerState = (page) => page.evaluate(() => {
  const player = window.videojsPlayer;
  return player ? {
    time: player.currentTime(), muted: player.muted(), paused: player.paused(),
    ended: player.ended(), error: player.error(), source: player.currentSrc(),
    version: window.videojs.VERSION,
  } : null;
});

async function waitForPlayer(page) {
  await page.waitForFunction(() => window.videojsPlayer && window.videojsPlayer.readyState() >= 1);
  expect((await playerState(page)).error).toBeNull();
}

async function expectPhase(page, start, end, channel) {
  await page.waitForFunction(({ start, end }) => {
    const p = window.videojsPlayer;
    return p && p.currentTime() >= start && p.currentTime() < end && !p.paused();
  }, { start, end });
  const sample = await page.evaluate(() => {
    const video = document.querySelector(".vjs-tech");
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, 1, 1);
    return Array.from(ctx.getImageData(0, 0, 1, 1).data);
  });
  expect(sample[channel]).toBeGreaterThan(90);
  sample.slice(0, 3).forEach((value, index) => {
    if (index !== channel) expect(sample[channel]).toBeGreaterThan(value + 60);
  });
  expect((await playerState(page)).error).toBeNull();
  expect((await playerState(page)).muted).toBe(true);
  return sample;
}

test("naturally plays stitched content, ad, and resumed content", async ({ page, browser }, testInfo) => {
  const segments = [];
  page.on("response", (response) => {
    if (/\/fixtures\/.*\.ts/.test(response.url())) {
      segments.push({ file: new URL(response.url()).pathname, status: response.status() });
    }
  });
  await page.goto(url);
  await waitForPlayer(page);
  await expect(page.locator(".media-info")).toContainText("URL source");
  await expect(page.locator(".media-info")).toContainText("/fixtures/master.m3u8");
  await expect(page.locator(".media-info")).not.toContainText("Big Buck");
  await expect(page.locator(".media-info")).not.toContainText("session=");
  expect((await playerState(page)).version).toBe("7.14.3");
  const before = await expectPhase(page, 0.5, 3.5, 2);
  await page.screenshot({ path: testInfo.outputPath("content-before.png") });
  const ad = await expectPhase(page, 4.5, 7.5, 0);
  await page.screenshot({ path: testInfo.outputPath("ad.png") });
  const after = await expectPhase(page, 8.5, 11.5, 1);
  await page.screenshot({ path: testInfo.outputPath("content-after.png") });
  await page.waitForFunction(() => window.videojsPlayer.ended());
  const state = await playerState(page);
  expect(state.time).toBeGreaterThan(11);
  expect(state.source).toContain(source);
  expect(segments.some((s) => s.file.endsWith("/ad-0.ts") && s.status === 200)).toBe(true);
  expect(segments.some((s) => s.file.endsWith("/ad-1.ts") && s.status === 200)).toBe(true);
  expect(segments.some((s) => s.file.endsWith("/content-after-0.ts") && s.status === 200)).toBe(true);
  expect(segments.every((s) => s.status === 200)).toBe(true);
  expect(await page.evaluate(() => Object.values(videojs.players).filter(Boolean).length)).toBe(1);
  const evidence = { browser: browser.version(), videojs: state.version, before, ad, after, state, segments };
  console.log(JSON.stringify(evidence, null, 2));
  await testInfo.attach("playback-evidence", { body: JSON.stringify(evidence, null, 2), contentType: "application/json" });
});

test("manual audible playback, mute control, and ordinary source changes work", async ({ page }) => {
  await page.goto(`${url}&autoplay=false&muted=false`);
  await waitForPlayer(page);
  expect((await playerState(page)).paused).toBe(true);
  expect((await playerState(page)).muted).toBe(false);
  await page.locator(".vjs-big-play-button").click();
  await page.waitForFunction(() => window.videojsPlayer.currentTime() > 0.5);
  await page.keyboard.press("m");
  expect((await playerState(page)).muted).toBe(true);
  await page.evaluate(() => {
    window.videojsPlayer.src({ src: "/fixtures/ordinary.m3u8", type: "application/x-mpegURL" });
    return window.videojsPlayer.play();
  });
  await page.waitForFunction(() => window.videojsPlayer.currentTime() > 1);
  expect((await playerState(page)).source).toContain("/fixtures/ordinary.m3u8");
  expect((await playerState(page)).error).toBeNull();
  await expect(page.locator(".media-info")).toContainText("Custom source");
  await expect(page.locator(".media-info")).toContainText("/fixtures/ordinary.m3u8");
  await expect(page.locator(".rendition-info")).toContainText("640x360");
});

test("malformed source encoding fails explicitly without fallback", async ({ page }) => {
  await page.goto("/?source=%ZZprivate");
  await expect(page.locator("#error-log")).toContainText("Invalid URL encoding");
  expect(await page.evaluate(() => window.videojsPlayer)).toBeUndefined();
  await expect(page.locator("#error-log")).not.toContainText("private");
});

test("overlay follows external source changes rather than Big Buck Bunny feed position", async ({ page }) => {
  await page.route("**/static_feeds/*.json", (route) => route.fulfill({
    json: { entry: [
      { title: "Big Buck Bunny", content: { src: "/fixtures/ordinary.m3u8" } },
      { title: "Stitched test", content: { src: "/fixtures/master.m3u8" } },
    ] },
  }));
  await page.goto("/?autoplay=false");
  await waitForPlayer(page);
  await expect(page.locator(".media-info")).toContainText("Big Buck Bunny (1/2)");
  await page.evaluate(() => window.videojsPlayer.src({
    src: "/fixtures/master.m3u8?sig=private", type: "application/x-mpegURL",
  }));
  await expect(page.locator(".media-info")).toContainText("Custom source");
  await expect(page.locator(".media-info")).not.toContainText("Big Buck");
  await expect(page.locator(".media-info")).not.toContainText("private");
  await page.keyboard.press("ArrowUp");
  await expect(page.locator(".media-info")).toContainText("Stitched test (2/2)");
});
