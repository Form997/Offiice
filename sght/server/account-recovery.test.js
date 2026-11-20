import test from "node:test";
import assert from "node:assert/strict";
import {normalizeRecoveryEmail} from "./account-recovery.js";

test("normalizes valid recovery email addresses",()=>{
  assert.equal(normalizeRecoveryEmail("  USER@Example.TEST  "),"user@example.test");
});
test("rejects malformed, non-string, and oversized email values",()=>{
  for(const value of [null,undefined,42,"","no-at-sign","a@b","a@b.","x".repeat(255)+"@a.test"]) {
    assert.equal(normalizeRecoveryEmail(value),"");
  }
});
test("does not trim or alter the local part beyond case normalization",()=>{
  assert.equal(normalizeRecoveryEmail(" First.Last+tag@Example.COM "),"first.last+tag@example.com");
});
