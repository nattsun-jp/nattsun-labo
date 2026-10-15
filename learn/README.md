# LABOことばトレーニング v1

Static, API-free beginner practice for six languages. 60 everyday/business scene questions plus ten contextual Japanese readings. Each question has an original inline SVG scene. Modes: target-language multiple choice, typed/OS-dictated registered-answer grading, listening comprehension with browser speech synthesis. Vocabulary and independent learned/heard/spoken/starred checklists share the same question IDs.

## Boundaries
- Uses the OS keyboard's microphone; no website audio recording, STT API, or pronunciation scoring.
- Text grading is registered-variant matching, never a claim of arbitrary semantic/grammar understanding. Unknown expressions get no numeric score; known alternatives are shown.
- Listening needs an installed language voice and a user click; no paid fallback.
- User progress is saved locally under `nattsun-labo-language-v1`. JSON export/import enables manual transfer. Import adds records and overwrites matching question fields. No accounts or automatic cross-device sync.
- Normalization retains accents, numbers and negation, while removing punctuation/whitespace and treating kana readings consistently. Future data additions require alternative-answer and distractor validation.
- Chinese lessons use simplified Mandarin. Russian/French gendered greetings have alternatives where applicable. Curriculum is introductory, not a promise of professional fluency.

## Checks
`node --test learn/tests/learning.test.cjs`
`node --check learn/app.js`

No third-party images, fonts, packages, or API keys. Lesson text and SVG code were created for this feature. Browser/OS speech is user-device functionality.
