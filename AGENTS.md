# AGENTS.md — instructions for AI coding agents

You are continuing a small, finished-but-rough project. The human author no longer develops it, so you will not get answers to questions. Make reasonable decisions, keep changes small, and say clearly what you did and did not verify.

**Read `SPEC.md` first.** It defines the behaviour, data formats, messages between windows and the backlog. `README.md` lists known limitations and what was tested.

## What this repo is

QuickDraw Explorer: an offline viewer/editor for Google Quick, Draw! `.ndjson` drawing files. One self-contained `index.html` (no framework, no dependencies, no build step) plus a tiny Electron wrapper for Windows.

## Files

| Path | Role |
| --- | --- |
| `index.html` | The whole app. Edit this for almost every task. |
| `main.js`, `package.json` | Electron wrapper and the `build:win` command. |
| `SPEC.md` | Behaviour and backlog. Update it when behaviour changes. |
| `README.md` | Public description, limitations, test status. Keep it honest. |
| `docs/` | The illustrated PDF guide. |

## Layout of `index.html`

1. `<style>`: theme tokens and layout for the main page.
2. `<body>`: the main window markup. Texts carry `data-i18n*` attributes.
3. One `<script>` containing a single IIFE, in this order:
   - the `I18N` dictionary (between `/*I18N_START*/` and `/*I18N_END*/`), `THEME_CSS` and `CREDIT_HTML` strings;
   - language handling (`t()`, `applyLang()`, state for the count and empty message);
   - file loading, `buildScaledPolylines()`, navigation, SVG export;
   - `buildEditorHtml(payload)`: returns the **entire HTML document of the editor window** as a template string, including its own `<script>`;
   - `pickPreviewSample()` and `buildPreviewHtml(payload)`: same idea for the preview window;
   - `applyLang()` is called last to start the app.

## Rules

- **Keep it dependency-free and single-file.** Do not add a framework, bundler, TypeScript or npm packages to the web app unless the task explicitly asks for it. (The Electron build already has its own dev dependency.)
- **Nothing leaves the machine.** Do not add analytics, uploads or network calls. The only network use is the Outfit font link.
- **Every user-visible string goes through `I18N`** with both `fr` and `en` entries. No hard-coded text in markup or JS, except the credit badge, which is deliberately not translated.
- **Keep the visual rules** in `SPEC.md` §8: no border radius, no transitions, hard shadows only, one accent colour. The theme CSS exists in two places (page `<style>` and the `THEME_CSS` string); change both.
- **Keep the credit badge** ("CC BY 4.0 / Made by Martin Guillaumie") and the license files in place.
- **Do not claim something works unless you ran it.** If you could not test it, say so in your summary and in the README's test section.

## Gotchas (these have already caused trouble)

1. **The editor and preview pages are JavaScript strings.** `buildEditorHtml` and `buildPreviewHtml` return template literals that contain a `<script>`. Inside them:
   - write the closing tag as `<\/script>`, never `</script>`, or the outer page breaks (the file must contain exactly one literal `</script>`);
   - `${...}` is interpolated by the *outer* template, so inner code must use string concatenation, not template literals or backticks;
   - a backslash in the inner code must be doubled in the outer source (this is why the SVG strings contain `\\"`). Prefer building strings with single quotes via `String.fromCharCode(39)` as the preview export does.
2. **Secondary windows share nothing with the main window.** State travels only through `postMessage` (SPEC §5). If you add a feature to a popup, add a message type and document it.
3. **Do not let a stylesheet block a popup's script.** The Google Fonts `<link>` uses `media="print" onload="this.media='all'"` so scripts do not wait for it. A plain blocking `<link>` froze the popups when the network was slow. Keep that pattern.
4. **Pop-ups can be blocked.** `window.open` returns `null` then; the code shows an alert. Keep that check.
5. **Browser-only APIs.** Downloads use a Blob and a temporary `<a download>`. Their behaviour inside Electron is untested.
6. The file contains the text `<script>` three times (the page and the two generated windows). When extracting the page script, take the first `<script>` and the last `</script>`.

## How to verify your changes

There is no test suite. Do at least the first two checks after any edit, and add real tests if you have time (backlog item 4).

**1. Syntax of the page script**

```bash
python3 - <<'EOF'
h = open('index.html', encoding='utf-8').read()
s, e = h.find('<script>'), h.rfind('</script>')
open('/tmp/app.js', 'w', encoding='utf-8').write(h[s+8:e])
EOF
node --check /tmp/app.js && echo OK
```

**2. Syntax of the generated windows.** Copy the `I18N` block, `THEME_CSS`, `CREDIT_HTML`, a `let lang = 'en'`, and the text of `buildEditorHtml` / `buildPreviewHtml` into a scratch Node file, call them with a small payload, cut out the `<script>…</script>` of the returned string and run `node --check` on it. Do this for both languages.

**3. Behaviour in a real browser.** Use Playwright (Chromium) against `index.html`:

- create a small sample `.ndjson` (see the example line in `SPEC.md` §2) with a few drawings, plus at least 200 lines to test the preview;
- `page.set_input_files('#fileInput', path)`, then click buttons by id: `#prevBtn`, `#nextBtn`, `#randomBtn`, `#editBtn`, `#exportBtn`, `#previewBtn`, and the language buttons `[data-lang="fr"]` / `[data-lang="en"]`;
- popups open with `context.expect_page()`; the editor has `#ec` (SVG), `circle.pt`, `#delBtn`, `#resetBtn`, `#sendBtn`, `#expBtn`; the preview has `#grid`, `.cell`, `#count`, `#newBtn`, `#expBtn`;
- block or stub `fonts.googleapis.com` so a sandbox without internet does not hang;
- use `page.expect_download()` to check the SVG exports.

Then walk through the checklist in `SPEC.md` §12.

**4. Windows build** (only if you touched `main.js` or `package.json`): `npm install && npm run build:win`. Building a Windows target on Linux needs Wine. Running the result needs a Windows machine.

## Good first tasks

Take them from `SPEC.md` §11, in order. Item 4 (automated tests) is the best start: it makes every later change safer.

## When you finish

Update `SPEC.md` if behaviour changed, update the README's "What was and was not tested" with what you actually ran, and give the user a short summary: what changed, how you checked it, what remains unverified.
