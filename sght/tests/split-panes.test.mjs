import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSplitSettings, synchronizedAxis, splitViewportState } from "../engine/split-panes.js";

test("split settings default safely to one pane",()=>{assert.deepEqual(normalizeSplitSettings(),{mode:"none"});assert.deepEqual(normalizeSplitSettings({mode:"unknown"}),{mode:"none"});});
test("horizontal split keeps independent vertical positions and synchronizes horizontal",()=>{assert.equal(synchronizedAxis("horizontal"),"x");assert.deepEqual(splitViewportState("horizontal",{top:120,left:240},{top:900,left:0}),{primary:{top:120,left:240},secondary:{top:900,left:240},synchronizedAxis:"x"});});
test("vertical split keeps independent horizontal positions and synchronizes vertical",()=>{assert.equal(synchronizedAxis("vertical"),"y");assert.deepEqual(splitViewportState("vertical",{top:120,left:240},{top:0,left:900}),{primary:{top:120,left:240},secondary:{top:120,left:900},synchronizedAxis:"y"});});
test("disabled split does not couple viewports",()=>{assert.equal(synchronizedAxis("none"),null);assert.deepEqual(splitViewportState("none",{top:4,left:5},{top:8,left:9}),{primary:{top:4,left:5},secondary:{top:8,left:9},synchronizedAxis:null});});
