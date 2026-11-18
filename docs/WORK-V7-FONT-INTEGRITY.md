# HAI ĐẤT OFFICE WORK V7 — Font Integrity

**Development branch:** `v7-development`  
**Base:** `v6-development`  
**Scope:** prevent silent font and layout loss during file import, editing, saving, and export.

## Non-negotiable behavior

1. Never silently claim a file was preserved when the importer discarded formatting.
2. Keep Unicode text intact; do not convert Vietnamese content through legacy encodings.
3. Preserve source font declarations and run/paragraph formatting where the format exposes them.
4. Keep original files untouched. Import creates a separate Writer document.
5. Distinguish exact preservation, best-effort conversion, and unsupported formats in the UI.
6. Do not silently substitute a missing font. Browser fallback is a display fallback only; the imported font-family declaration remains in the document where supported.

## Format compatibility matrix

| Format | V7 status | Font/layout handling |
|---|---|---|
| DOCX | Best-effort import | Direct run font family (including East Asian font), size, color, highlight/shading, bold, italic, underline, strike, sub/superscript; paragraph alignment, indents and spacing; basic tables. Style inheritance, numbering, images, headers/footers, fields and advanced layout still require dedicated work. |
| ODT | Best-effort import | Common named text and paragraph styles: font family, size, color, weight, italic, underline, alignment and indents. Complex styles, embedded fonts, tables, images and page layout need further work. |
| HTML/HTM | Sanitized import | Keeps safe inline CSS declarations, including font family, size, color, weight, style, alignment and spacing. Unsafe CSS and unsupported elements are removed. |
| RTF | Lossy text conversion | Current parser strips control words and does not faithfully map font tables, sizes, colors or paragraph properties. Do not use it for round-trip fidelity. |
| TXT/MD | Text-only | These formats generally carry no reliable font metadata. UTF-8 text is retained; presentation must be applied in Writer. |
| CSV | Data-only | CSV has no font metadata. Import is a basic comma-separated table; quoted commas/escaped fields need a proper CSV parser. |
| DOC (binary) | Unsupported for direct import | Convert with Microsoft Word or LibreOffice to DOCX first. |
| PDF | Unsupported for editable import | PDF is a fixed-layout format; use a dedicated PDF text/layout extraction pipeline or convert externally before editing. |

## Implementation stages

- [x] Create isolated `v7-development` branch from V6.
- [x] Replace DOCX text flattening with common run and paragraph style extraction.
- [x] Replace ODT plain-text flattening with common named-style extraction.
- [x] Show honest compatibility notes and include DOC/PDF in the file picker so unsupported cases produce an explicit explanation.
- [x] Add regression checks for DOCX/ODT style extraction and compatibility warnings.
- [ ] Parse DOCX `styles.xml` inheritance, numbering, hyperlinks, images, headers/footers, theme fonts and section/page layout.
- [ ] Expand ODT style inheritance, tables, images, page styles and embedded fonts.
- [ ] Implement a real RTF tokenizer with font/color tables and scoped groups.
- [ ] Add standards-compliant CSV parsing.
- [ ] Add local/offline DOC and PDF conversion or clearly retain explicit unsupported status.
- [ ] Add round-trip fixture tests against files produced by Word and LibreOffice.
- [ ] Verify actual display on Android Chrome and desktop browsers.

## QA boundary

A passing static/CI test confirms code-level regression assertions only. It does not prove pixel-identical rendering in Microsoft Word, LibreOffice, Google Docs or on a physical phone. V7 must not be called stable until representative fixture files have been imported, exported, reopened and visually compared in those applications.
