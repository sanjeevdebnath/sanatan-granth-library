# Multilingual content model

The Sanatan Granth Library treats Sanskrit as the canonical text anchor while allowing each source edition to provide language-specific translations, meanings, commentary, and transliterations.

## Principles

- A Sanskrit shloka is not duplicated for every language.
- A meaning may cover one shloka or a contiguous group of shlokas, matching the source edition.
- A language source is tracked independently because different editions may segment or phrase meanings differently.
- Translation, meaning, commentary, and transliteration are separate content roles.
- Kannada and other Indian languages use their own Unicode text and typography; the UI must not depend on Devanagari fonts.

## Initial languages

- sa — Sanskrit
- hi — Hindi
- kn — Kannada
- en — English
- Future: te, ta, mr, bn, gu, ml, and others.

## Kannada Shiva Purana source

The attached Kannada edition is a scanned book in which Sanskrit verses and Kannada explanatory passages occur in the same reading sequence. The source will therefore be transcribed and mapped by sequence, preserving the source's grouping instead of forcing a one-to-one shloka/meaning relationship.

See books/shivamahapurana/sources.json for source metadata.