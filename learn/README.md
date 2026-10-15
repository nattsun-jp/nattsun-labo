# LABOことばトレーニング v2

API-free English / Japanese-kanji learning for GitHub Pages. No AI conversation, account, recording API, or paid fallback.

- Japanese: 2136 Joyo characters / 4388 official stage-labelled readings; 3630 distinct character/type/stage tasks. 140 contextual words × reading/written-input = 280 more. Total 3910 Japanese questions.
- English: 240 vocabulary records + 180 original sentence/scene records = 420 questions. Elementary/middle/high major topics and 30 daily / 30 business expressions. Not a complete 4000–5000-word school lexicon.
- Practice choices, text/OS-dictation entry, English listening, word/kanji cards, learned/heard/spoken/starred checks.
- 20/50/100-question exams always total 100 points. No duplicate questions. Answers hidden until submission. Unknown input remains pending, yielding a transparent score range rather than false zero grading.
- Exam draft, last 100 results, and progress are browser-local under `nattsun-labo-language-v2`. JSON export/import. No automatic sync. Original v1 key remains untouched.
- US/UK browser synthesis when the device provides a matching voice. No native-speaker recording or pronunciation scoring claim.

## Sources
`kanji-data.js` was transformed from MEXT's 2017 school-stage reading table (https://www.mext.go.jp/a_menu/shotou/new-cs/1385768.htm). Credit and processing scope appear in `sources.html`. Elementary counts verified as 80/160/200/202/193/191 and full set 2136. KANJIDIC2 metadata was used for independent checks, not bundled. No dictionary translations, identifiers or example sentences were copied. Contextual words, English examples and SVG scenes are authored for this feature.

`curriculum/build.py` rebuilds compact English/context data from TSV and official source extraction. The compact `kanji-data.js` is the retained canonical source for official facts; the builder reuses it. PDF extraction has a documented visual correction for 𠮟.

## Validation
`node --test learn/tests/learning.test.cjs`
`node --check learn/app.js`

The tests verify counts, all accepted answers, distinct distractors, rejected negations/numbers, 100-point totals, no duplicate test items, pending-input grading, and safe progress/exam restoration. Real iOS dictation, installed voices and visual browser checks require an available browser QA environment.
