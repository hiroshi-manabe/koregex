# Koregex

Koregex is a proposed Hangul-aware regex preprocessor.

The goal is to let users write compact patterns for Korean Hangul syllables and
convert them into ordinary regular expressions that can be used in existing
regex engines.

For example:

```regex
{..ㄴ}
```

means:

```text
any initial consonant + any vowel + final ㄴ
```

and should match syllables such as `간`, `난`, `단`, and `한`.

## Core Idea

Normal regex syntax is preserved outside `{...}`.

Only content inside `{...}` is treated as a Hangul syllable pattern. Each
`{...}` block describes one Hangul syllable.

```regex
나는 {..ㄴ}다
```

The preprocessor expands the Hangul-aware parts into standard regex, while the
rest of the pattern is left unchanged.

## Hangul Slots

A Hangul syllable is modeled as three slots:

```text
initial + vowel + final
```

In Korean terms:

```text
choseong + jungseong + jongseong
```

The final slot may be absent in actual Hangul syllables.

## Unicode Jamo Policy

Unicode has multiple blocks that contain Hangul letter-like characters. Koregex
should be explicit about which ones are accepted in pattern syntax.

The most relevant blocks are:

```text
Hangul Compatibility Jamo  U+3130..U+318F  ㄱ, ㄴ, ㄷ, ㅏ, ㅓ, ...
Hangul Jamo                U+1100..U+11FF  ᄀ, ᄂ, ᅡ, ᆨ, ᆫ, ...
Hangul Syllables           U+AC00..U+D7A3  가, 각, 간, ...
```

For human-written patterns, the primary syntax should use Hangul Compatibility
Jamo, because these are the characters Korean users normally type as standalone
letters:

```regex
{ㅎㅏㄴ}
{..ㄴ}
{하.?}
```

Internally, the converter should map these compatibility jamo to the canonical
initial, vowel, and final indices used by Unicode Hangul syllable composition.

Canonical Hangul Jamo from `U+1100..U+11FF` may be supported later as an input
normalization feature, but they should not be the primary documented syntax for
v1. They are position-specific characters, so accepting them requires additional
validation:

```text
ᄀ  choseong ㄱ
ᅡ  jungseong ㅏ
ᆨ  jongseong ㄱ
```

Recommended v1 policy:

```text
Accept Hangul Compatibility Jamo in `{...}`.
Accept precomposed Hangul syllables in `{...}`.
Reject or warn on canonical Hangul Jamo until normalization rules are defined.
```

This keeps the first version aligned with what users naturally type while
leaving room for stricter Unicode-aware input later.

## Basic Syntax

Inside `{...}`, users can write jamo patterns:

```regex
{ㅎㅏㄴ}
{.ㅏㄴ}
{ㅎ.ㄴ}
{..ㄴ}
{ㅎ..}
{.ㅏ.}
```

Meanings:

```text
{ㅎㅏㄴ}  exactly 한
{.ㅏㄴ}  any initial, vowel ㅏ, final ㄴ
{ㅎ.ㄴ}  initial ㅎ, any vowel, final ㄴ
{..ㄴ}   any initial, any vowel, final ㄴ
{ㅎ..}   initial ㅎ, any vowel, any non-empty final
{.ㅏ.}   any initial, vowel ㅏ, any non-empty final
```

The `.` wildcard represents any valid value for that slot.

For the final slot:

```text
.   means any non-empty final consonant
.?  means no final or any final consonant
```

This distinction lets users express both "must have batchim" and "may or may
not have batchim".

## Slot Compositions

Koregex accepts multi-jamo spellings only when they are wrapped in an inner
`{...}` slot composition.

The outer `{...}` describes one Hangul syllable pattern. An inner `{...}`
describes one composed slot value.

Supported initial compositions:

```text
{ㄱㄱ} -> ㄲ
{ㄷㄷ} -> ㄸ
{ㅂㅂ} -> ㅃ
{ㅅㅅ} -> ㅆ
{ㅈㅈ} -> ㅉ
```

Supported vowel compositions:

```text
{ㅗㅏ} -> ㅘ
{ㅗㅐ} -> ㅙ
{ㅗㅣ} -> ㅚ
{ㅜㅓ} -> ㅝ
{ㅜㅔ} -> ㅞ
{ㅜㅣ} -> ㅟ
{ㅡㅣ} -> ㅢ
```

Supported final compositions:

```text
{ㄱㄱ} -> ㄲ
{ㄱㅅ} -> ㄳ
{ㄴㅈ} -> ㄵ
{ㄴㅎ} -> ㄶ
{ㄹㄱ} -> ㄺ
{ㄹㅁ} -> ㄻ
{ㄹㅂ} -> ㄼ
{ㄹㅅ} -> ㄽ
{ㄹㅌ} -> ㄾ
{ㄹㅍ} -> ㄿ
{ㄹㅎ} -> ㅀ
{ㅂㅅ} -> ㅄ
{ㅅㅅ} -> ㅆ
```

Examples:

```regex
{{ㄱㄱ}.}
{.{ㅗㅏ}}
{..{ㄹㄱ}}
```

Meanings:

```text
{{ㄱㄱ}.}  initial ㄲ, any vowel, no final
{.{ㅗㅏ}}  any initial, vowel ㅘ, no final
{..{ㄹㄱ}} any initial, any vowel, final ㄺ
```

Silent composition is not supported:

```regex
{ㄱㄱ.}
{.ㅗㅏ}
{..ㄹㄱ}
```

Unsupported decompositions also remain invalid, even when wrapped:

```regex
{.{ㅏㅣ}}
{.ㅏㅣ}
```

These should not be treated as `{.ㅐ}`. The composition rule is intentionally
limited to modern Unicode Hangul slot values listed above.

## Character Classes

Koregex supports slot-local character classes inside `{...}`.

Positive classes include the listed slot values:

```regex
{[ㄱㄴㄷ]ㅏㄴ}
{ㄱ[ㅏㅓㅗ]ㄴ}
{ㄱㅏ[ㄴㄹㄺ]}
```

Meanings:

```text
{[ㄱㄴㄷ]ㅏㄴ}  initial ㄱ, ㄴ, or ㄷ; vowel ㅏ; final ㄴ
{ㄱ[ㅏㅓㅗ]ㄴ}  initial ㄱ; vowel ㅏ, ㅓ, or ㅗ; final ㄴ
{ㄱㅏ[ㄴㄹㄺ]}  initial ㄱ; vowel ㅏ; final ㄴ, ㄹ, or ㄺ
```

Negated classes exclude the listed slot values:

```regex
{[^ㄱㄴㄷ]ㅏㄴ}
{ㄱ[^ㅏㅓㅗ]ㄴ}
{ㄱㅏ[^ㄴㄹ]}
```

Meanings:

```text
{[^ㄱㄴㄷ]ㅏㄴ}  any initial except ㄱ, ㄴ, or ㄷ; vowel ㅏ; final ㄴ
{ㄱ[^ㅏㅓㅗ]ㄴ}  initial ㄱ; any vowel except ㅏ, ㅓ, or ㅗ; final ㄴ
{ㄱㅏ[^ㄴㄹ]}   initial ㄱ; vowel ㅏ; any non-empty final except ㄴ or ㄹ
```

For final classes, the empty final is not included unless `?` is added:

```regex
{ㄱㅏ[^ㄴ]}
{ㄱㅏ[^ㄴ]?}
```

Meanings:

```text
{ㄱㅏ[^ㄴ]}   final must be non-empty and not ㄴ
{ㄱㅏ[^ㄴ]?}  no final, or a non-empty final other than ㄴ
```

Class contents are explicit slot values. Inner slot compositions may be used
inside classes when a combined value is needed.

```regex
{[ㄱㄱㄴ]ㅏ}
{ㄱㅏ[ㄹㄱ]}
{[{ㄱㄱ}ㄴ]ㅏ}
{ㄱㅏ[ㄴ{ㄹㄱ}]}
```

Meanings:

```text
{[ㄱㄱㄴ]ㅏ}    initial ㄱ or ㄴ, not ㄲ
{ㄱㅏ[ㄹㄱ]}    final ㄹ or ㄱ, not ㄺ
{[{ㄱㄱ}ㄴ]ㅏ}  initial ㄲ or ㄴ
{ㄱㅏ[ㄴ{ㄹㄱ}]} final ㄴ or ㄺ
```

Composed compatibility jamo may also be written directly:

```regex
{[ㄱㄲㄴ]ㅏ}
{ㄱ[ㅘㅝ]ㄴ}
{ㄱㅏ[ㄴㄺ]}
```

Unsupported class syntax for v1:

```regex
{[ㄱ-ㅎ]ㅏ}
{ㄱ[]}
{ㄱ[^]}
```

Ranges, escapes, empty classes, and regex-like class operations are not
supported.

## Optional Final Slot

`?` is allowed only after the final-position token.

It means that the final slot may be absent.

```regex
{ㅎㅏㄴ?}
{ㅎ..?}
{..ㄴ?}
{.ㅏㄴ?}
```

Meanings:

```text
{ㅎㅏㄴ?}  하 or 한
{ㅎ..?}   any syllable starting with ㅎ, with or without a final
{..ㄴ?}   any syllable with no final or final ㄴ
{.ㅏㄴ?}  any initial, vowel ㅏ, with no final or final ㄴ
```

`?` does not mean "any final". It only makes the preceding final-position token
optional.

Recommended final-slot behavior:

```text
ㄴ   exactly final ㄴ
.   any non-empty final
ㄴ?  no final or final ㄴ
.?  no final or any final
```

## Compound Final Consonants

Some Hangul syllables have compound final consonants, such as `ㄳ`, `ㄵ`, `ㄶ`,
`ㄺ`, and `ㅄ`.

Conceptually, these are still one final slot value in Unicode Hangul syllable
composition. Therefore, `.` in the final slot should match one complete final
slot value, not append an additional consonant to an existing final.

For example:

```regex
{할.}
```

should be invalid, not a pattern that matches `핡`.

Reason:

```text
할 already has final ㄹ.
The final slot is already filled.
. cannot add another consonant to make ㄺ.
```

For user convenience, Koregex allows users to spell compound final consonants
with an inner slot composition.

Examples:

```regex
{..{ㄹㄱ}}
{하{ㄹㄱ}}
{하{ㄹㄱ}?}
```

Meanings:

```text
{..{ㄹㄱ}}   any initial, any vowel, final ㄺ
{하{ㄹㄱ}}   핡
{하{ㄹㄱ}?}  하 or 핡
```

Compound finals are accepted when written explicitly as a slot composition, but
they are not constructed silently and are not created by appending `.` after a
syllable that already has a final.

Invalid examples:

```regex
{ㅎㅏ?}
{ㅎ?ㅏㄴ}
```

These are invalid because `?` is not attached to a final-position token.

## Composed Hangul Inside Patterns

Precomposed Hangul syllables may also be used inside `{...}` when they fit the
remaining syllable slots.

The syllable is decomposed into its initial, vowel, and optional final, then
merged with the remaining tokens.

Examples:

```regex
{한}
{하.}
{하.?}
{가ㄴ}
{가ㄴ?}
{한?}
```

Meanings:

```text
{한}    exactly 한
{하.}   initial ㅎ, vowel ㅏ, any non-empty final
{하.?}  하, 학, 한, 핟, 할, ...
{가ㄴ}  간
{가ㄴ?} 가 or 간
{한?}   하 or 한
```

`{한?}` is logically valid because the final `ㄴ` from `한` is made optional.
However, it is visually less clear than `{하ㄴ?}` or `{ㅎㅏㄴ?}`, so it should
be allowed but not emphasized in documentation examples.

Invalid examples:

```regex
{한ㄱ}
{한.}
{하ㅏ}
{가ㅏㄴ}
```

Each `{...}` block describes exactly one Hangul syllable pattern. A composed
syllable fills the slots it already contains. Additional tokens may only fill
empty slots.

## Expansion Strategy

The first implementation can use a simple brute-force strategy:

1. Iterate through all precomposed Hangul syllables from `가` to `힣`.
2. Decompose each syllable into initial, vowel, and final.
3. Keep syllables that match the parsed `{...}` pattern.
4. Emit a standard regex character class or range expression.

The initial output may list matching characters directly. Later versions can
compress adjacent matches into ranges for shorter output.

## Initial UI

The first GitHub Pages UI is intentionally small:

```text
input textarea
readonly output textarea
copy button
syntax/error message area
examples
```

The page should focus on conversion, not on becoming a full regex playground.

A test-string matcher can be added later, but it is not required for the first
usable version.

The static page lives at the repository root:

```text
index.html
styles.css
app.js
```

## Suggested Project Shape

The project should be library-first so the converter is not tied to the web UI.

Possible structure:

```text
src/
  hangul.ts
  parser.ts
  expand.ts
  compress-ranges.ts
  index.ts

web/
  app
```

The GitHub Pages app should consume the core converter library.

## Development

Run the logic tests with:

```sh
npm test
```

Preview the static UI locally with:

```sh
npm run serve
```

In environments where Homebrew binaries are not on `PATH`, use:

```sh
PATH=/usr/local/bin:$PATH npm test
PATH=/usr/local/bin:$PATH npm run serve
```

## Open Questions

- Whether to support multiple regex flavors, such as JavaScript, Python, and PCRE.
- Whether output should prefer explicit character lists or compressed ranges.
- Whether the UI should show warnings for valid but visually surprising patterns
  such as `{한?}`.
