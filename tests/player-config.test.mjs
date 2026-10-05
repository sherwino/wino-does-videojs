import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parsePlayerQuery, applyPlaybackPolicy, displayParams } from "../src/player-config.mjs";

test("preserves an encoded SSAI URL including signatures and delimiters", () => {
  const source = "https://cdn.example/playlist.m3u8?session=a=b==&paths=one,two&sig=a+b%2F%26";
  const params = parsePlayerQuery(`?source=${encodeURIComponent(source)}&autoplay=false`);
  assert.equal(params.source, source);
  assert.equal(params.autoplay, false);
});

test("only splits a parameter at its first equals sign", () => {
  assert.equal(parsePlayerQuery("?source=https://cdn.example/main.m3u8?sig=abc==").source,
    "https://cdn.example/main.m3u8?sig=abc==");
});

test("source and version always stay strings", () => {
  for (const source of ["true", "false", "123", "/main,a.m3u8"]) {
    assert.equal(parsePlayerQuery(`?source=${encodeURIComponent(source)}`).source, source);
  }
  assert.equal(parsePlayerQuery("?version=7.14.3").version, "7.14.3");
});

test("retains boolean, numeric, array, and form decoding behavior", () => {
  const params = parsePlayerQuery("?controls=false&fluid=true&volume=0.5&playbackRates=0.5,1,2&label=hello+world");
  assert.equal(params.controls, false);
  assert.equal(params.fluid, true);
  assert.equal(params.volume, 0.5);
  assert.deepEqual(params.playbackRates, [0.5, 1, 2]);
  assert.equal(params.label, "hello world");
});

test("reports malformed encoding without echoing the signed URL", () => {
  assert.throws(() => parsePlayerQuery("?source=https%ZZsecret"), /Invalid URL encoding/);
  try { parsePlayerQuery("?source=%ZZsecret"); } catch (error) {
    assert.equal(error.message.includes("secret"), false);
  }
});

test("rejects empty source, invalid version, and prototype options", () => {
  assert.throws(() => parsePlayerQuery("?source="), /source parameter is empty/);
  assert.throws(() => parsePlayerQuery("?version=bad"), /Invalid Video.js version/);
  assert.throws(() => parsePlayerQuery("?__proto__=true"), /Unsupported player option/);
});

test("default autoplay remains muted", () => {
  assert.deepEqual(applyPlaybackPolicy({ autoplay: true }), { autoplay: "muted", muted: true });
});

test("explicit mute and autoplay preferences are preserved", () => {
  assert.deepEqual(applyPlaybackPolicy({ autoplay: false }), { autoplay: false, muted: false });
  assert.deepEqual(applyPlaybackPolicy({ autoplay: false, muted: true }), { autoplay: false, muted: true });
  assert.deepEqual(applyPlaybackPolicy({ autoplay: true, muted: false }), { autoplay: true, muted: false });
  assert.deepEqual(applyPlaybackPolicy({ autoplay: "any" }), { autoplay: "any", muted: true });
});

test("policy does not mutate the original options", () => {
  const options = { autoplay: true };
  applyPlaybackPolicy(options);
  assert.deepEqual(options, { autoplay: true });
});

test("source is hidden in displayed configuration", () => {
  const params = parsePlayerQuery("?source=https%3A%2F%2Fcdn.example%2Fmain.m3u8%3Ftoken%3Dsecret");
  assert.equal(JSON.stringify(displayParams(params)).includes("secret"), false);
  assert.ok(params.source.includes("secret"));
});

test("single initialization and no download-triggered unmute", () => {
  const template = readFileSync("rollup.config.js", "utf8");
  const app = readFileSync("src/index.js", "utf8");
  assert.equal(template.includes('data-setup="{}"'), false);
  assert.equal(app.includes("player.on('progress'"), false);
  assert.ok(app.includes("if (sourceOverrideActive)"));
});
