import assert from "node:assert/strict";
import test from "node:test";

import { expandHangulBlock, expandKoregex, parseHangulBlock } from "../src/expand.js";

function expandedRegex(source) {
  return new RegExp(`^${expandKoregex(source)}$`, "u");
}

test("expands exact jamo blocks", () => {
  assert.equal(expandHangulBlock("ㅎㅏㄴ"), "한");
});

test("expands final-consonant wildcard blocks", () => {
  const regex = expandedRegex("{..ㄴ}");

  assert.match("한", regex);
  assert.match("간", regex);
  assert.doesNotMatch("하", regex);
  assert.doesNotMatch("할", regex);
});

test("supports vowel wildcard with exact final consonants", () => {
  const regex = expandedRegex("{ㅎ.ㄴ}");

  assert.match("한", regex);
  assert.match("헌", regex);
  assert.match("훈", regex);
  assert.doesNotMatch("간", regex);
  assert.doesNotMatch("하", regex);
  assert.doesNotMatch("할", regex);
});

test("supports vowel wildcard with no final consonant", () => {
  const regex = expandedRegex("{ㅎ.}");

  assert.match("하", regex);
  assert.match("허", regex);
  assert.match("후", regex);
  assert.doesNotMatch("한", regex);
  assert.doesNotMatch("가", regex);
});

test("supports explicit initial compositions", () => {
  assert.equal(expandHangulBlock("{ㄱㄱ}ㅏ"), "까");

  const regex = expandedRegex("{{ㄱㄱ}.}");
  assert.match("까", regex);
  assert.match("꺼", regex);
  assert.doesNotMatch("가", regex);
  assert.doesNotMatch("깍", regex);
});

test("supports explicit vowel compositions", () => {
  assert.equal(expandHangulBlock("ㄱ{ㅗㅏ}"), "과");

  const regex = expandedRegex("{.{ㅗㅏ}}");
  assert.match("과", regex);
  assert.match("꽈", regex);
  assert.match("화", regex);
  assert.doesNotMatch("고", regex);
  assert.doesNotMatch("광", regex);
});

test("rejects silent and unsupported vowel decompositions", () => {
  assert.throws(() => expandHangulBlock("ㄱㅗㅏ"), /Invalid final slot/);
  assert.throws(() => expandHangulBlock(".ㅏㅣ"), /Invalid final slot/);
  assert.throws(() => expandHangulBlock(".{ㅏㅣ}"), /Invalid slot composition/);
});

test("supports positive character classes in each slot", () => {
  const initialRegex = expandedRegex("{[ㄱㄴㄷ]ㅏㄴ}");
  assert.match("간", initialRegex);
  assert.match("난", initialRegex);
  assert.match("단", initialRegex);
  assert.doesNotMatch("란", initialRegex);

  const vowelRegex = expandedRegex("{ㄱ[ㅏㅓㅗ]ㄴ}");
  assert.match("간", vowelRegex);
  assert.match("건", vowelRegex);
  assert.match("곤", vowelRegex);
  assert.doesNotMatch("군", vowelRegex);

  const finalRegex = expandedRegex("{ㄱㅏ[ㄴㄹㄺ]}");
  assert.match("간", finalRegex);
  assert.match("갈", finalRegex);
  assert.match("갉", finalRegex);
  assert.doesNotMatch("각", finalRegex);
  assert.doesNotMatch("가", finalRegex);
});

test("supports explicit slot compositions inside character classes", () => {
  const initialRegex = expandedRegex("{[{ㄱㄱ}ㄴㄷ]ㅏㄴ}");
  assert.match("깐", initialRegex);
  assert.match("난", initialRegex);
  assert.match("단", initialRegex);
  assert.doesNotMatch("간", initialRegex);

  const vowelRegex = expandedRegex("{ㄱ[{ㅗㅏ}{ㅜㅓ}]ㄴ}");
  assert.match("관", vowelRegex);
  assert.match("권", vowelRegex);
  assert.doesNotMatch("곤", vowelRegex);

  const finalRegex = expandedRegex("{ㄱㅏ[ㄴ{ㄹㄱ}]}");
  assert.match("간", finalRegex);
  assert.match("갉", finalRegex);
  assert.doesNotMatch("갈", finalRegex);
});

test("supports negated character classes in each slot", () => {
  const initialRegex = expandedRegex("{[^ㄱㄴㄷ]ㅏㄴ}");
  assert.match("란", initialRegex);
  assert.doesNotMatch("간", initialRegex);
  assert.doesNotMatch("난", initialRegex);
  assert.doesNotMatch("단", initialRegex);

  const vowelRegex = expandedRegex("{ㄱ[^ㅏㅓㅗ]ㄴ}");
  assert.match("군", vowelRegex);
  assert.doesNotMatch("간", vowelRegex);
  assert.doesNotMatch("건", vowelRegex);
  assert.doesNotMatch("곤", vowelRegex);

  const finalRegex = expandedRegex("{ㄱㅏ[^ㄴㄹ]}");
  assert.match("각", finalRegex);
  assert.match("갉", finalRegex);
  assert.doesNotMatch("가", finalRegex);
  assert.doesNotMatch("간", finalRegex);
  assert.doesNotMatch("갈", finalRegex);
});

test("supports optional negated final character classes", () => {
  const regex = expandedRegex("{ㄱㅏ[^ㄴ]?}");

  assert.match("가", regex);
  assert.match("각", regex);
  assert.match("갈", regex);
  assert.doesNotMatch("간", regex);
});

test("treats direct class contents as explicit slot values, not compositions", () => {
  const initialRegex = expandedRegex("{[ㄱㄱㄴ]ㅏ}");
  assert.match("가", initialRegex);
  assert.match("나", initialRegex);
  assert.doesNotMatch("까", initialRegex);

  const finalRegex = expandedRegex("{ㄱㅏ[ㄹㄱ]}");
  assert.match("갈", finalRegex);
  assert.match("각", finalRegex);
  assert.doesNotMatch("갉", finalRegex);
});

test("rejects unsupported character class syntax", () => {
  assert.throws(() => expandHangulBlock("[ㄱ-ㅎ]ㅏ"), /Ranges are not supported/);
  assert.throws(() => expandHangulBlock("ㄱ[]"), /Empty vowel character class/);
  assert.throws(() => expandHangulBlock("ㄱ[^]"), /Empty vowel character class/);
  assert.throws(() => expandHangulBlock("ㄱ[ㄱ]"), /Invalid vowel class value/);
  assert.throws(() => expandHangulBlock("ㄱㅏ[ㅏ]"), /Invalid final class value/);
});

test("treats final dot as any non-empty final", () => {
  const regex = expandedRegex("{하.}");

  assert.match("한", regex);
  assert.match("할", regex);
  assert.doesNotMatch("하", regex);
});

test("supports optional final tokens", () => {
  const regex = expandedRegex("{..ㄴ?}");

  assert.match("하", regex);
  assert.match("한", regex);
  assert.match("가", regex);
  assert.match("간", regex);
  assert.doesNotMatch("할", regex);
});

test("supports optional any-final wildcard", () => {
  const regex = expandedRegex("{ㅎ..?}");

  assert.match("하", regex);
  assert.match("한", regex);
  assert.match("힣", regex);
  assert.doesNotMatch("간", regex);
});

test("supports composed Hangul inside blocks", () => {
  assert.equal(expandHangulBlock("한"), "한");
  assert.equal(expandHangulBlock("가ㄴ"), "간");

  const regex = expandedRegex("{한?}");
  assert.match("하", regex);
  assert.match("한", regex);
  assert.doesNotMatch("할", regex);
});

test("allows explicit compound final spelling", () => {
  assert.equal(expandHangulBlock("하{ㄹㄱ}"), "핡");
  assert.equal(expandHangulBlock("하{ㄱㄱ}"), "핚");

  const regex = expandedRegex("{..{ㄹㄱ}}");
  assert.match("핡", regex);
  assert.match("읽", regex);
  assert.doesNotMatch("할", regex);
});

test("rejects silent initial and final compositions", () => {
  assert.throws(() => expandHangulBlock("ㄱㄱㅏ"), /Invalid vowel slot/);
  assert.throws(() => expandHangulBlock("하ㄹㄱ"), /Invalid final slot/);
});

test("does not append to an already-filled final slot", () => {
  assert.throws(() => expandHangulBlock("할."), /Final slot is already filled/);
});

test("rejects optional marker outside final position", () => {
  assert.throws(
    () => parseHangulBlock("ㅎㅏ?"),
    /\? is only allowed after a final-position token/,
  );
  assert.throws(
    () => parseHangulBlock("ㅎ?ㅏㄴ"),
    /\? is only allowed after a final-position token/,
  );
  assert.throws(
    () => parseHangulBlock("?ㅏㄴ"),
    /\? is only allowed after a final-position token/,
  );
  assert.throws(
    () => parseHangulBlock("ㅎ?"),
    /\? is only allowed after a final-position token/,
  );
});

test("preserves ordinary regex outside Hangul blocks", () => {
  const regex = expandedRegex("나는 {..ㄴ}다");

  assert.match("나는 한다", regex);
  assert.doesNotMatch("나는 하다", regex);
});
