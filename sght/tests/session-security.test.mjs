import test from "node:test";
import assert from "node:assert/strict";
import { describeDevice, normalizeUserAgent, isSessionIdleExpired, hasUserAgentChanged, SESSION_IDLE_TTL_MS, SESSION_ABSOLUTE_TTL_MS } from "../server/session-security.js";
test("normalizes untrusted user-agent text and bounds its length",()=>{
  assert.equal(normalizeUserAgent("  Mozilla\\n/5.0  "), "Mozilla /5.0");
  assert.equal(normalizeUserAgent("x".repeat(700)).length,500);
  assert.equal(normalizeUserAgent(null),"");
});
test("describes common browsers and platforms without exposing raw user-agent",()=>{
  assert.equal(describeDevice("Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36"),"Chrome · Android");
  assert.equal(describeDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1"),"Safari · iOS");
  assert.equal(describeDevice(""),"Thiết bị không xác định");
});
test("idle timeout is strict at 30 minutes and fails closed on invalid timestamps",()=>{
  const now=Date.parse("2026-11-20T12:00:00Z");
  assert.equal(SESSION_IDLE_TTL_MS,1800000);
  assert.equal(isSessionIdleExpired(now-SESSION_IDLE_TTL_MS+1,now),false);
  assert.equal(isSessionIdleExpired(now-SESSION_IDLE_TTL_MS,now),true);
  assert.equal(isSessionIdleExpired("not-a-date",now),true);
});
test("absolute session lifetime remains eight hours",()=>assert.equal(SESSION_ABSOLUTE_TTL_MS,28800000));
test("user-agent changes are a warning signal, not an identity assertion",()=>{
  assert.equal(hasUserAgentChanged("Chrome Android","Chrome Android"),false);
  assert.equal(hasUserAgentChanged("Chrome Android","Firefox Windows"),true);
  assert.equal(hasUserAgentChanged("","Firefox Windows"),false);
});
