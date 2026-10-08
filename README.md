# QuickDraw Explorer

> ## Status: finished for my needs — no longer developed
>
> This project does what I needed, and I am not developing it any further. It is rough, but it works. **Fork it, change it, do whatever you want with it.** Issues and pull requests will most likely go unanswered.
>
> It was built with Claude (Anthropic). To make it easy to carry on with another AI, the repo includes [`AGENTS.md`](AGENTS.md) (instructions for coding agents) and [`SPEC.md`](SPEC.md) (what the app is supposed to do). Give an AI the code plus these two files and it should be able to pick up where I stopped.

Buy me a cofee if you want : [![Soutenir sur Liberapay](https://liberapay.com/assets/widgets/donate.svg)](https://liberapay.com/martin_guillaumie/donate)

An offline viewer and editor for the `.ndjson` drawing files of Google's [Quick, Draw!](https://github.com/googlecreativelab/quickdraw-dataset) dataset. Open a file, see how many drawings it contains, flip through them, move or delete points, preview a random grid of 200 drawings, and export SVG.

Not affiliated with or endorsed by Google.

A one-page visual guide is in [`docs/QuickDraw-Explorer-guide.pdf`](docs/QuickDraw-Explorer-guide.pdf).

You can find all the ndjson made by google quick draw here : https://console.cloud.google.com/storage/browser/quickdraw_dataset/full/simplified;tab=objects?pli=1&prefix=&forceOnObjectsSortingFiltering=false
## What it does

- **Open** a local `.ndjson` file (nothing is uploaded; there is no server).
- **Count** the drawings in the file.
- **Browse** them with the arrow buttons or the `←` / `→` keys, or jump to a random one.
- **Edit** a drawing in a separate window: drag points, select points (click, Shift+click, or drag a box), select a line segment, delete the selection. Deleting a segment splits the stroke in two, which is how you open a closed outline.
- **Preview** the collection: 200 random drawings in a 10-column grid, with a "New preview" button to reshuffle without closing the window.
- **Export** the current drawing, the edited drawing, or the whole preview grid as SVG.
- **Switch language** between English and French (FR | EN, remembered between sessions).

## Run it

### In a browser

Open `index.html` in a recent Chromium-based browser (Chrome, Edge). That is the whole app: one file, no build step, no dependencies.

You need a QuickDraw file. The dataset is **not** included; download category files (for example `cat.ndjson`) from the [dataset repository](https://github.com/googlecreativelab/quickdraw-dataset). The editor and preview open in separate windows, so allow pop-ups for the page if your browser blocks them.

### As a Windows app (Electron)

`main.js` and `package.json` wrap `index.html` in an Electron window. To build a portable folder with an `.exe`:

```bash
npm install
npm run build:win
```

The result is in `dist/`. Building a Windows target from Linux or macOS needs Wine; on Windows it does not. Electron is pinned to 32.2.7 because that is the version I used; it is old, so bump it before distributing anything.

## Known limitations

This is a list of things I know are rough, not a promise to fix them.

- **The whole file is read into memory.** Large category files can make the page slow or fail.
- **Edits are not saved to the `.ndjson`.** You can only export SVG. Navigating to another drawing discards unsaved edits.
- **Exported SVGs are normalized.** Each drawing is rescaled to fit a 300 × 300 box, so the original 0–255 coordinates are not preserved. Stroke width and colour are fixed. Timing data in raw files is ignored.
- **The editor is basic.** Mouse only (no touch), no undo (only "Reset"), and you cannot add points.
- **The drawing count is the number of non-empty lines**, not the number of valid drawings. A broken line is counted and then shows "Can't read this drawing".
- **Fonts need the network once.** The Outfit font is loaded from Google Fonts; offline, the app falls back to the system font. Everything else works offline.
- **Some export filenames are still French** (`..._edite.svg`, `apercu_collection_...svg`).

## What was and was not tested

There is no automated test suite in this repo. During development I only did these ad hoc checks:

- Syntax checks of the page script and of the HTML generated for the editor and preview windows.
- A simulated-DOM (jsdom) run covering the language switch, loading a small file and navigating.
- Headless Chromium runs that loaded a generated sample file, opened both secondary windows, selected points with Shift+click and took the screenshots used in the PDF.

**Not tested:** the Windows `.exe` (it was built from Linux and never run, so the Electron wrapper, its pop-up windows and file downloads are unverified), Firefox and Safari, touch screens, very large files, and the dragging, box selection, segment deletion and SVG download interactions in a real browser.

## Built with AI

The code was written with Claude (Anthropic) from my requirements. Treat it as AI-generated code: read it before you rely on it. If you continue with an AI assistant, start with [`AGENTS.md`](AGENTS.md) and [`SPEC.md`](SPEC.md).

## Files

| File | What it is |
| --- | --- |
| `index.html` | The entire app: interface, logic, FR/EN strings, and the editor and preview windows (generated from templates inside the script). |
| `main.js`, `package.json` | Electron wrapper and build command for the Windows version. |
| `SPEC.md` | What the app does and should do, data formats, messages between windows, backlog. |
| `AGENTS.md` | Instructions for AI coding agents working on this repo. |
| `docs/QuickDraw-Explorer-guide.pdf` | One-page illustrated guide (screenshots use generated sample drawings). |
| `LICENSE` | MIT license (code). |

## License and credits

- **Code:** [MIT](LICENSE) © 2026 Martin Guillaumie. Keep the copyright notice in copies.
- **Documentation, screenshots and the "Made by" badge:** [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Credit Martin Guillaumie.
- **Quick, Draw! dataset:** © Google, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Not included in this repo.
- **Outfit font:** SIL Open Font License 1.1, loaded from Google Fonts.
- **Electron** (Windows build): MIT. A built app also bundles Chromium; its license notices are in the build output and must stay with it.
