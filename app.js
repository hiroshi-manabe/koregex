import { CACHE_VERSION } from "./src/cache-version.js?v=2026-05-23-4";

const { expandKoregex } = await import(`./src/expand.js?v=${CACHE_VERSION}`);

const LANGUAGE_STORAGE_KEY = "koregex.referenceLanguage";

const translations = {
  en: {
    "syntax.title": "Syntax",
    "syntax.language": "Language",
    "block.title": "Hangul Block",
    "block.body":
      "<code>{초중종}</code> describes one Hangul syllable. Outside braces, regex is preserved.",
    "block.exact": "exactly 한",
    "block.final": "any initial, any vowel, final ㄴ",
    "block.optional": "하, 학, 한, ...",
    "wildcard.title": "Wildcards",
    "wildcard.body":
      "<code>.</code> means any value for that slot. In final position, it means any non-empty final.",
    "wildcard.noFinal": "ㅎ + any vowel + no final",
    "wildcard.anyFinal": "ㅎ + any vowel + any final",
    "wildcard.optionalFinal": "ㅎ + any vowel, with or without final",
    "composition.title": "Composition",
    "composition.body": "Use inner braces to compose one slot value.",
    "composition.initial": "initial ㄲ + any vowel + no final",
    "composition.vowel": "any initial + vowel ㅘ + no final",
    "composition.final": "any initial + any vowel + final ㄺ",
    "classes.title": "Classes",
    "classes.body": "Classes are slot-local. <code>^</code> negates the listed values.",
    "classes.initial": "initial ㄱ, ㄴ, or ㄷ",
    "classes.negated": "no final, or a final other than ㄴ",
    "classes.composed": "final ㄴ or ㄺ",
  },
  ko: {
    "syntax.title": "문법",
    "syntax.language": "언어",
    "block.title": "한글 블록",
    "block.body":
      "<code>{초중종}</code>은 한 글자의 한글 음절 패턴입니다. 바깥쪽 정규식은 그대로 유지됩니다.",
    "block.exact": "정확히 한",
    "block.final": "초성 아무거나, 중성 아무거나, 종성 ㄴ",
    "block.optional": "하, 학, 한, ...",
    "wildcard.title": "와일드카드",
    "wildcard.body":
      "<code>.</code>은 해당 슬롯의 아무 값입니다. 종성 위치에서는 비어 있지 않은 종성을 뜻합니다.",
    "wildcard.noFinal": "ㅎ + 중성 아무거나 + 종성 없음",
    "wildcard.anyFinal": "ㅎ + 중성 아무거나 + 종성 아무거나",
    "wildcard.optionalFinal": "ㅎ + 중성 아무거나, 종성은 있어도 없어도 됨",
    "composition.title": "조합",
    "composition.body": "안쪽 중괄호로 슬롯 값 하나를 조합합니다.",
    "composition.initial": "초성 ㄲ + 중성 아무거나 + 종성 없음",
    "composition.vowel": "초성 아무거나 + 중성 ㅘ + 종성 없음",
    "composition.final": "초성 아무거나 + 중성 아무거나 + 종성 ㄺ",
    "classes.title": "클래스",
    "classes.body": "클래스는 슬롯 단위입니다. <code>^</code>는 나열한 값을 제외합니다.",
    "classes.initial": "초성 ㄱ, ㄴ, 또는 ㄷ",
    "classes.negated": "종성 없음, 또는 ㄴ이 아닌 종성",
    "classes.composed": "종성 ㄴ 또는 ㄺ",
  },
  ja: {
    "syntax.title": "構文",
    "syntax.language": "言語",
    "block.title": "ハングルブロック",
    "block.body":
      "<code>{初中終}</code> は1文字分のハングル音節パターンです。外側の正規表現はそのまま残ります。",
    "block.exact": "ちょうど 한",
    "block.final": "任意の初声、任意の中声、終声 ㄴ",
    "block.optional": "하, 학, 한, ...",
    "wildcard.title": "ワイルドカード",
    "wildcard.body":
      "<code>.</code> はそのスロットの任意の値です。終声位置では空でない終声を表します。",
    "wildcard.noFinal": "ㅎ + 任意の中声 + 終声なし",
    "wildcard.anyFinal": "ㅎ + 任意の中声 + 任意の終声",
    "wildcard.optionalFinal": "ㅎ + 任意の中声、終声はあってもなくてもよい",
    "composition.title": "組み合わせ",
    "composition.body": "内側の中括弧で1つのスロット値を組み合わせます。",
    "composition.initial": "初声 ㄲ + 任意の中声 + 終声なし",
    "composition.vowel": "任意の初声 + 中声 ㅘ + 終声なし",
    "composition.final": "任意の初声 + 任意の中声 + 終声 ㄺ",
    "classes.title": "クラス",
    "classes.body": "クラスはスロット単位です。<code>^</code> は列挙した値を除外します。",
    "classes.initial": "初声 ㄱ, ㄴ, または ㄷ",
    "classes.negated": "終声なし、または ㄴ 以外の終声",
    "classes.composed": "終声 ㄴ または ㄺ",
  },
};

const source = document.querySelector("#source");
const output = document.querySelector("#output");
const status = document.querySelector("#status");
const clear = document.querySelector("#clear");
const copy = document.querySelector("#copy");
const examples = document.querySelectorAll("[data-example]");
const language = document.querySelector("#language");
const translatedText = document.querySelectorAll("[data-i18n]");
const translatedHtml = document.querySelectorAll("[data-i18n-html]");

function getSavedLanguage() {
  const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return translations[savedLanguage] ? savedLanguage : "en";
}

function applyLanguage(nextLanguage) {
  const dictionary = translations[nextLanguage] ?? translations.en;

  document.documentElement.lang = nextLanguage;
  language.value = nextLanguage;

  for (const element of translatedText) {
    element.textContent = dictionary[element.dataset.i18n];
  }

  for (const element of translatedHtml) {
    element.innerHTML = dictionary[element.dataset.i18nHtml];
  }

  localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
}

function convert() {
  try {
    output.value = expandKoregex(source.value);
    status.textContent = "Ready";
    status.classList.remove("error");
    clear.disabled = source.value.length === 0;
    copy.disabled = output.value.length === 0;
  } catch (error) {
    output.value = "";
    status.textContent = error.message;
    status.classList.add("error");
    clear.disabled = source.value.length === 0;
    copy.disabled = true;
  }
}

function clearInput() {
  source.value = "";
  convert();
  source.focus();
}

async function copyOutput() {
  if (output.value.length === 0) {
    return;
  }

  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(output.value);
    } else {
      output.select();
      document.execCommand("copy");
      output.setSelectionRange(0, 0);
    }
    status.textContent = "Copied";
    status.classList.remove("error");
  } catch (error) {
    status.textContent = error.message;
    status.classList.add("error");
  }
}

source.addEventListener("input", convert);
clear.addEventListener("click", clearInput);
copy.addEventListener("click", copyOutput);
language.addEventListener("change", () => applyLanguage(language.value));

for (const example of examples) {
  example.addEventListener("click", () => {
    source.value = example.dataset.example;
    convert();
    source.focus();
  });
}

applyLanguage(getSavedLanguage());
convert();
