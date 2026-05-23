import assert from "node:assert/strict";
import test from "node:test";

import { composeSyllable, decomposeSyllable } from "../src/hangul.js";

test("decomposes a Hangul syllable into compatibility jamo slots", () => {
  assert.deepEqual(decomposeSyllable("한"), {
    initial: "ㅎ",
    vowel: "ㅏ",
    final: "ㄴ",
  });
});

test("decomposes syllables without a final consonant", () => {
  assert.deepEqual(decomposeSyllable("하"), {
    initial: "ㅎ",
    vowel: "ㅏ",
    final: "",
  });
});

test("composes compatibility jamo slots into a Hangul syllable", () => {
  assert.equal(composeSyllable("ㅎ", "ㅏ", "ㄴ"), "한");
  assert.equal(composeSyllable("ㅎ", "ㅏ"), "하");
  assert.equal(composeSyllable("ㅎ", "ㅏ", "ㄺ"), "핡");
});
