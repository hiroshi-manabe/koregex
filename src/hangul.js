const HANGUL_BASE = 0xac00;
const HANGUL_END = 0xd7a3;
const JUNG_COUNT = 21;
const JONG_COUNT = 28;
const SYLLABLE_COUNT = 11172;

export const INITIALS = [
  "ㄱ",
  "ㄲ",
  "ㄴ",
  "ㄷ",
  "ㄸ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅃ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅉ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];

export const VOWELS = [
  "ㅏ",
  "ㅐ",
  "ㅑ",
  "ㅒ",
  "ㅓ",
  "ㅔ",
  "ㅕ",
  "ㅖ",
  "ㅗ",
  "ㅘ",
  "ㅙ",
  "ㅚ",
  "ㅛ",
  "ㅜ",
  "ㅝ",
  "ㅞ",
  "ㅟ",
  "ㅠ",
  "ㅡ",
  "ㅢ",
  "ㅣ",
];

export const FINALS = [
  "",
  "ㄱ",
  "ㄲ",
  "ㄳ",
  "ㄴ",
  "ㄵ",
  "ㄶ",
  "ㄷ",
  "ㄹ",
  "ㄺ",
  "ㄻ",
  "ㄼ",
  "ㄽ",
  "ㄾ",
  "ㄿ",
  "ㅀ",
  "ㅁ",
  "ㅂ",
  "ㅄ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];

export const INITIAL_ALIASES = new Map([
  ["ㄱㄱ", "ㄲ"],
  ["ㄷㄷ", "ㄸ"],
  ["ㅂㅂ", "ㅃ"],
  ["ㅅㅅ", "ㅆ"],
  ["ㅈㅈ", "ㅉ"],
]);

export const VOWEL_ALIASES = new Map([
  ["ㅗㅏ", "ㅘ"],
  ["ㅗㅐ", "ㅙ"],
  ["ㅗㅣ", "ㅚ"],
  ["ㅜㅓ", "ㅝ"],
  ["ㅜㅔ", "ㅞ"],
  ["ㅜㅣ", "ㅟ"],
  ["ㅡㅣ", "ㅢ"],
]);

export const COMPOUND_FINALS = new Map([
  ["ㄱㄱ", "ㄲ"],
  ["ㄱㅅ", "ㄳ"],
  ["ㄴㅈ", "ㄵ"],
  ["ㄴㅎ", "ㄶ"],
  ["ㄹㄱ", "ㄺ"],
  ["ㄹㅁ", "ㄻ"],
  ["ㄹㅂ", "ㄼ"],
  ["ㄹㅅ", "ㄽ"],
  ["ㄹㅌ", "ㄾ"],
  ["ㄹㅍ", "ㄿ"],
  ["ㄹㅎ", "ㅀ"],
  ["ㅂㅅ", "ㅄ"],
  ["ㅅㅅ", "ㅆ"],
]);

const INITIAL_INDEX = new Map(INITIALS.map((value, index) => [value, index]));
const VOWEL_INDEX = new Map(VOWELS.map((value, index) => [value, index]));
const FINAL_INDEX = new Map(FINALS.map((value, index) => [value, index]));

export function isHangulSyllable(char) {
  const code = char.codePointAt(0);
  return code >= HANGUL_BASE && code <= HANGUL_END;
}

export function decomposeSyllable(char) {
  if (!isHangulSyllable(char)) {
    throw new Error(`Not a precomposed Hangul syllable: ${char}`);
  }

  const offset = char.codePointAt(0) - HANGUL_BASE;
  const initialIndex = Math.floor(offset / (JUNG_COUNT * JONG_COUNT));
  const vowelIndex = Math.floor((offset % (JUNG_COUNT * JONG_COUNT)) / JONG_COUNT);
  const finalIndex = offset % JONG_COUNT;

  return {
    initial: INITIALS[initialIndex],
    vowel: VOWELS[vowelIndex],
    final: FINALS[finalIndex],
  };
}

export function composeSyllable(initial, vowel, final = "") {
  const initialIndex = INITIAL_INDEX.get(initial);
  const vowelIndex = VOWEL_INDEX.get(vowel);
  const finalIndex = FINAL_INDEX.get(final);

  if (initialIndex === undefined || vowelIndex === undefined || finalIndex === undefined) {
    throw new Error(`Invalid Hangul syllable parts: ${initial}${vowel}${final}`);
  }

  return String.fromCodePoint(
    HANGUL_BASE + (initialIndex * JUNG_COUNT + vowelIndex) * JONG_COUNT + finalIndex,
  );
}

export function allHangulSyllables() {
  return Array.from({ length: SYLLABLE_COUNT }, (_, index) =>
    String.fromCodePoint(HANGUL_BASE + index),
  );
}
