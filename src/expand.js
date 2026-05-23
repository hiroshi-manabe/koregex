import {
  COMPOUND_FINALS,
  FINALS,
  INITIAL_ALIASES,
  INITIALS,
  VOWEL_ALIASES,
  VOWELS,
  allHangulSyllables,
  decomposeSyllable,
  isHangulSyllable,
} from "./hangul.js?v=2026-05-23-3";

function uniq(values) {
  return [...new Set(values)];
}

function asRegexCharClass(chars) {
  return `[${chars.map(escapeCharClassChar).join("")}]`;
}

function escapeCharClassChar(char) {
  return char.replace(/[\\\]\-\^]/g, "\\$&");
}

function isRegexQuantifier(block) {
  return /^\d+(?:,\d*)?$/.test(block);
}

function composeSlotValue(source) {
  const composed =
    INITIAL_ALIASES.get(source) ?? VOWEL_ALIASES.get(source) ?? COMPOUND_FINALS.get(source);

  if (composed === undefined) {
    throw new Error(`Invalid slot composition: {${source}}`);
  }

  return composed;
}

function tokenizeHangulBlock(body) {
  const chars = [...body];
  const tokens = [];

  for (let index = 0; index < chars.length; index += 1) {
    if (chars[index] !== "{") {
      tokens.push(chars[index]);
      continue;
    }

    const endIndex = chars.indexOf("}", index + 1);
    if (endIndex === -1) {
      throw new Error("Unclosed slot composition");
    }

    const source = chars.slice(index + 1, endIndex).join("");
    if (source.includes("{") || source.includes("}")) {
      throw new Error("Nested slot compositions are not supported");
    }

    tokens.push(composeSlotValue(source));
    index = endIndex;
  }

  return tokens;
}

function parseClass(tokens, startIndex, slotName, allowedValues) {
  if (tokens[startIndex] !== "[") {
    return undefined;
  }

  const endIndex = tokens.indexOf("]", startIndex + 1);
  if (endIndex === -1) {
    throw new Error(`Unclosed ${slotName} character class`);
  }

  const rawValues = tokens.slice(startIndex + 1, endIndex);
  const negated = rawValues[0] === "^";
  const values = negated ? rawValues.slice(1) : rawValues;

  if (values.length === 0) {
    throw new Error(`Empty ${slotName} character class`);
  }
  if (values.includes("-")) {
    throw new Error(`Ranges are not supported in ${slotName} character classes`);
  }
  if (values.includes("\\")) {
    throw new Error(`Escapes are not supported in ${slotName} character classes`);
  }

  for (const value of values) {
    if (!allowedValues.includes(value)) {
      throw new Error(`Invalid ${slotName} class value: ${value}`);
    }
  }

  const uniqueValues = uniq(values);
  const resolvedValues = negated
    ? allowedValues.filter((value) => !uniqueValues.includes(value))
    : uniqueValues;

  if (resolvedValues.length === 0) {
    throw new Error(`${slotName} character class excludes every value`);
  }

  return { values: resolvedValues, nextIndex: endIndex + 1 };
}

function parseInitial(tokens, startIndex) {
  const initial = tokens[startIndex];
  const parsedClass = parseClass(tokens, startIndex, "initial", INITIALS);

  if (parsedClass !== undefined) {
    return parsedClass;
  }

  if (initial === "?") {
    throw new Error("? is only allowed after a final-position token");
  }
  if (initial === ".") {
    return { values: INITIALS, nextIndex: startIndex + 1 };
  }
  if (INITIALS.includes(initial)) {
    return { values: [initial], nextIndex: startIndex + 1 };
  }

  throw new Error(`Invalid initial slot: ${initial ?? ""}`);
}

function parseVowel(tokens, startIndex) {
  const vowel = tokens[startIndex];
  const parsedClass = parseClass(tokens, startIndex, "vowel", VOWELS);

  if (parsedClass !== undefined) {
    return parsedClass;
  }

  if (vowel === "?" || vowel === undefined) {
    throw new Error("? is only allowed after a final-position token");
  }
  if (vowel === ".") {
    return { values: VOWELS, nextIndex: startIndex + 1 };
  }
  if (VOWELS.includes(vowel)) {
    return { values: [vowel], nextIndex: startIndex + 1 };
  }

  throw new Error(`Invalid vowel slot: ${vowel ?? ""}`);
}

function parseFinal(tokens, startIndex) {
  const rest = tokens.slice(startIndex).join("");
  const parsedClass = parseClass(tokens, startIndex, "final", FINALS.slice(1));

  if (parsedClass !== undefined) {
    if (parsedClass.nextIndex !== tokens.length) {
      const unexpected = tokens.slice(parsedClass.nextIndex).join("");
      throw new Error(`Unexpected tokens after final character class: ${unexpected}`);
    }
    return parsedClass;
  }
  if (rest.includes("?")) {
    throw new Error("? is only allowed after a final-position token");
  }
  if (rest === ".") {
    return { values: FINALS.slice(1), nextIndex: tokens.length };
  }
  if (FINALS.includes(rest) && rest !== "") {
    return { values: [rest], nextIndex: tokens.length };
  }
  throw new Error(`Invalid final slot: ${rest}`);
}

export function parseHangulBlock(block) {
  const optionalFinal = block.endsWith("?");
  const body = optionalFinal ? block.slice(0, -1) : block;
  const tokens = tokenizeHangulBlock(body);
  const slots = {
    initial: undefined,
    vowel: undefined,
    final: undefined,
  };
  let index = 0;

  if (tokens.length === 0) {
    throw new Error("Empty Hangul block");
  }

  if (isHangulSyllable(tokens[index])) {
    const decomposed = decomposeSyllable(tokens[index]);
    slots.initial = [decomposed.initial];
    slots.vowel = [decomposed.vowel];
    if (decomposed.final) {
      slots.final = [decomposed.final];
    }
    index += 1;
  }

  if (slots.initial === undefined) {
    const parsedInitial = parseInitial(tokens, index);
    slots.initial = parsedInitial.values;
    index = parsedInitial.nextIndex;
  }

  if (slots.vowel === undefined) {
    const parsedVowel = parseVowel(tokens, index);
    slots.vowel = parsedVowel.values;
    index = parsedVowel.nextIndex;
  }

  if (index < tokens.length) {
    if (slots.final !== undefined) {
      throw new Error("Final slot is already filled");
    }
    const parsedFinal = parseFinal(tokens, index);
    slots.final = parsedFinal.values;
    index = parsedFinal.nextIndex;
  }

  if (index !== tokens.length) {
    throw new Error(`Unexpected tokens in Hangul block: ${tokens.slice(index).join("")}`);
  }

  if (optionalFinal && slots.final === undefined) {
    throw new Error("? is only allowed after a final-position token");
  }

  return {
    initial: uniq(slots.initial),
    vowel: uniq(slots.vowel),
    final: optionalFinal ? ["", ...uniq(slots.final)] : uniq(slots.final ?? [""]),
  };
}

export function expandHangulBlock(block) {
  const pattern = parseHangulBlock(block);
  const matches = allHangulSyllables().filter((syllable) => {
    const parts = decomposeSyllable(syllable);
    return (
      pattern.initial.includes(parts.initial) &&
      pattern.vowel.includes(parts.vowel) &&
      pattern.final.includes(parts.final)
    );
  });

  if (matches.length === 0) {
    throw new Error(`Hangul block matched no syllables: ${block}`);
  }

  return matches.length === 1 ? matches[0] : asRegexCharClass(matches);
}

export function expandKoregex(input) {
  let output = "";

  for (let index = 0; index < input.length; index += 1) {
    if (input[index] !== "{") {
      output += input[index];
      continue;
    }

    let depth = 1;
    let endIndex = index + 1;

    for (; endIndex < input.length; endIndex += 1) {
      if (input[endIndex] === "{") {
        depth += 1;
      } else if (input[endIndex] === "}") {
        depth -= 1;
        if (depth === 0) {
          break;
        }
      }
    }

    if (depth !== 0) {
      throw new Error("Unclosed Hangul block");
    }

    const block = input.slice(index + 1, endIndex);
    output += isRegexQuantifier(block) ? `{${block}}` : expandHangulBlock(block);
    index = endIndex;
  }

  return output;
}
