# SPEC — QuickDraw Explorer

This document says what the app does and what it is expected to do. It describes the code as it is in `index.html`; where the code falls short of the intent, that is listed under [Backlog](#backlog). Read it together with `AGENTS.md`.

## 1. Purpose and scope

A single-page, offline tool to inspect and lightly edit drawings from Google's Quick, Draw! dataset, and export them as SVG.

- Runs entirely on the user's machine. No server, no account, no network use except loading the Outfit font from Google Fonts.
- One HTML file (`index.html`) with no dependencies. An Electron wrapper (`main.js`) turns it into a Windows app.
- **Non-goals:** drawing new pictures from scratch, recognising drawings, editing the dataset in place, cloud storage, user accounts.

## 2. Input format

An `.ndjson` file: one JSON object per line. The app uses only two fields:

| Field | Type | Use |
| --- | --- | --- |
| `drawing` | array of strokes; each stroke is `[xs, ys]` (simplified data) or `[xs, ys, ts]` (raw data) | The geometry. Only `xs` and `ys` are read; `ts` is ignored. |
| `word` | string | Label shown under the drawing and used in export filenames. Optional. |

Other fields (`countrycode`, `recognized`, `timestamp`, `key_id`) are ignored.

Example line (simplified format):

```json
{"word":"house","countrycode":"FR","recognized":true,"drawing":[[[10,80,80,10,10],[60,60,140,140,60]],[[10,45,80],[60,20,60]]]}
```

The file picker accepts `.ndjson`, `.json` and `.txt`.

## 3. Coordinate system and data model

- Source coordinates are used only to compute a bounding box.
- Every drawing is **normalized** to a 300 × 300 space: scale = `min(252 / width, 252 / height)` (24-unit margin on each side), centred. Width and height are floored at 1.
- In memory a drawing is `polylines`: `Array<Array<{x:number, y:number}>>`, one inner array per stroke, in the 300 × 300 space.
- The file is read as one string and split on `\n`; empty lines are dropped. A line is parsed with `JSON.parse` only when it is displayed or sampled. A line that cannot be parsed, or has no `drawing`, shows "Can't read this drawing (line N)".
- The "N drawings" figure is the number of **non-empty lines**.

## 4. Functional requirements

All items below are implemented unless marked otherwise.

### Main window

| ID | Requirement |
| --- | --- |
| M1 | Open a local file through a file picker. |
| M2 | Show the number of drawings after loading ("N drawings"). |
| M3 | Display one drawing at a time, in the blue accent colour, stroke width 5, round caps and joins, with its `word` (or "(no label)") and "i / N". |
| M4 | Previous / next with the two arrow buttons and the `←` / `→` keys. Navigation wraps around. |
| M5 | "Random" shows a random drawing (it may be the current one). |
| M6 | "Export SVG" downloads the displayed drawing (see §7). |
| M7 | "Edit" opens the editor window for the displayed drawing. |
| M8 | "Collection preview" opens the preview window. |
| M9 | A FR \| EN switch translates the whole interface, including open secondary windows, and is remembered in `localStorage` under `qd-lang`. First run: English if the browser language starts with `en`, otherwise French. |
| M10 | A "CC BY 4.0 / Made by Martin Guillaumie" badge is shown in every window. It is not translated. |
| M11 | Buttons that need data stay disabled until a file with at least one line is loaded. |

### Editor window (`window.open`, name `quickdraw_editor_<index>`)

| ID | Requirement |
| --- | --- |
| E1 | Show the drawing at 420 × 420 with every point as a small circle. |
| E2 | Drag a point to move it; coordinates are clamped to 0–300. |
| E3 | Click a point to select it; Shift+click adds or removes a point from the selection. |
| E4 | Drag a rectangle on the empty background to select every point inside it. A click on the background clears the selection. |
| E5 | Click a line segment (invisible 14-unit-wide hit area) to select it; the selected segment is highlighted. |
| E6 | Delete the selection with the button or the `Delete` / `Backspace` key. Deleting points removes them from their strokes. Deleting a segment splits its stroke into two. Any stroke left with fewer than 2 points is removed. |
| E7 | "Reset" restores the drawing as it was when the window opened. |
| E8 | "Send back to sketchbook" posts the strokes to the main window, which redraws the current drawing. Ignored if the main window is no longer on the same drawing index. |
| E9 | "Export as SVG" downloads the edited drawing (see §7). |

### Preview window (`window.open`, name `quickdraw_preview`)

| ID | Requirement |
| --- | --- |
| P1 | Show up to 200 distinct random drawings (fewer if the file has fewer) in a 10-column grid, on a plain white background, with no border around the drawings, stroke width 9 in the 300-unit space. |
| P2 | Show "N drawings out of TOTAL". |
| P3 | "New preview" asks the main window for a new random sample and re-renders in place, without closing the window. |
| P4 | "Export as SVG" downloads the whole grid as one SVG (see §7). |

## 5. Messages between windows

Secondary windows are separate documents written with `document.write`; they share no variables with the main window. All communication uses `postMessage` with target origin `'*'`.

| `type` | From → to | Payload | Effect |
| --- | --- | --- | --- |
| `quickdraw-edit-update` | editor → main (`window.opener`) | `{index, strokes}` | Main applies it only if `index` equals the current index. |
| `quickdraw-request-preview` | preview → main | none | Main samples again and replies with `quickdraw-preview-data` to `event.source`. |
| `quickdraw-preview-data` | main → preview | `{payload: {items:[{word, polylines}], cols, total}}` | Preview replaces its data and re-renders. |
| `quickdraw-lang` | main → every open secondary window | `{lang, strings}` | Window replaces its strings and re-applies them. |

The main window keeps references to the windows it opened in `openWins` and drops closed ones on each language change.

## 6. Internationalisation

- All user-visible text lives in the `I18N` object (`fr` and `en`) inside the `/*I18N_START*/ … /*I18N_END*/` block of the script.
- Elements in the main page carry `data-i18n` (text), `data-i18n-html` (HTML) or `data-i18n-title` (tooltip). Dynamic text (count, empty message, caption) is re-rendered from stored state by `applyLang()`.
- Secondary windows receive the whole dictionary for the current language when created, and again on every language change.
- Numbers use `fr-FR` or `en-US` formatting.

## 7. Export formats

All three are plain SVG files built by string concatenation, coordinates with one decimal.

| Export | Root element | Content | Filename |
| --- | --- | --- | --- |
| Drawing (main window) | `viewBox="0 0 300 300" width="600" height="600"` | White `<rect>`, then one `<polyline>` per stroke: `fill="none"`, `stroke="#325be5"`, `stroke-width="5"`, round caps and joins. | `<word or dessin>_<index+1>.svg` |
| Edited drawing | same | same | `<word or dessin>_<index+1>_edite.svg` |
| Preview grid | `viewBox="0 0 W H"`, `W = cols×130 + (cols−1)×8`, `H = rows×130 + (rows−1)×8` (1372 × 2752 for 10 × 20) | White background; one `<g transform="translate(x,y) scale(130/300)">` per drawing, stroke width 9. | `apercu_collection_<count>.svg` |

Filenames are sanitised with `[^a-z0-9_-]` → `_`.

## 8. Visual design

The look follows a "Lisa / Mac System 1" blue theme, inlined from a `theme.css` that is not in this repo.

- One accent colour `#325be5` on white; `#e6ecfc` for light tints.
- Font Outfit 400 and 700, falling back to `system-ui`.
- **No rounded corners, no transitions or animations, no blurred shadows.** Shadows are hard offsets in the accent colour. Hover and active states invert background and text.
- Components: `.window` (bordered box with filled title bar), `.btn`, `.btn-sm`, `.btn-group.is-joined`, `.badge`, `.credit`.
- The theme CSS exists twice in the file: once in the page `<style>` and once as the `THEME_CSS` string injected into the secondary windows. Keep both in sync.

## 9. Windows wrapper

`main.js` creates a 760 × 940 `BrowserWindow` with no menu, `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`, loads `index.html`, and allows `window.open` for the editor and preview with the same secure options. There is no preload script. **This wrapper has never been run.**

## 10. Verification status

Implemented does not mean tested. See the README section "What was and was not tested". In short: loading, navigation, language switching, opening both windows and Shift+click point selection were exercised; dragging, box selection, segment deletion, undo-less editing flows, SVG download and the Electron app were not.

## 11. Backlog

Roughly by usefulness, none of it started.

1. **Save edits.** Write edited drawings back to a new `.ndjson`, so editing has a lasting effect.
2. **Large files.** Read in chunks (`File.slice` + `TextDecoder`) or index line offsets instead of loading one huge string.
3. **Undo / redo** and **add a point** in the editor.
4. **Automated tests.** A Playwright script that loads a small sample file and exercises every requirement above; see `AGENTS.md`.
5. **Export options.** Keep original coordinates, choose stroke width and colour.
6. **Navigation.** Jump to a given index, filter by `word`.
7. **Pointer events** instead of mouse events, for touch screens.
8. **Bundle the Outfit font** (base64 or a local file) so the app is fully offline.
9. **Fix filenames** (`_edite`, `apercu_collection`) to English.
10. **Windows build.** Upgrade Electron, run and test the app on Windows, add an installer or code signing if wanted.

## 12. Manual acceptance checklist

Use a small file of 3 or more drawings.

1. Open the file: the badge shows the right count and the first drawing appears with its label and `1 / N`.
2. Press `→` past the last drawing: it wraps to the first. Press `←` from the first: it wraps to the last.
3. Switch to EN and FR: every visible string changes, including the count and the label of an unlabeled drawing.
4. Open the editor: every point has a circle. Drag one: the line follows and stays inside the frame.
5. Click a point, then Shift+click another: both are selected. Press `Delete`: both disappear.
6. Drag a box over several points: they are selected.
7. Click a line segment, press `Delete`: the stroke splits in two. Press "Reset": the original comes back.
8. In the editor press "Send back to sketchbook": the main window shows the edit. Navigate away and back: the edit is gone.
9. Export from the main window and from the editor: both files open as valid SVG with the expected look.
10. Open the preview with a file of at least 200 drawings: 200 cells, 10 per row, white background, no borders. Press "New preview": the set changes and the window stays open. Export: one SVG with all cells.
11. With the editor open, switch language in the main window: the editor's text changes and its points are untouched.
12. With a file that contains one invalid line: that line shows "Can't read this drawing (line N)" and navigation keeps working.
