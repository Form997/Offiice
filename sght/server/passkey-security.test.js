import test from "node:test";
import assert from "node:assert/strict";
import {hasSignatureCounterAnomaly} from "./passkey-security.js";

test("zero counters remain valid for authenticators without counter support",()=>{
  assert.equal(hasSignatureCounterAnomaly(0,0),false);
  assert.equal(hasSignatureCounterAnomaly(0,1),false);
  assert.equal(hasSignatureCounterAnomaly(7,0),false);
});
test("strictly increasing non-zero counters are accepted",()=>{
  assert.equal(hasSignatureCounterAnomaly(1,2),false);
  assert.equal(hasSignatureCounterAnomaly(42,43),false);
});
test("non-increasing non-zero counters are flagged as possible cloning",()=>{
  assert.equal(hasSignatureCounterAnomaly(42,42),true);
  assert.equal(hasSignatureCounterAnomaly(42,3),true);
});
test("invalid counters are rejected rather than silently coerced",()=>{
  for(const pair of [[-1,1],[1,-1],[NaN,1],[1,Infinity],["x",1]]) {
    assert.throws(()=>hasSignatureCounterAnomaly(...pair),TypeError);
  }
});
