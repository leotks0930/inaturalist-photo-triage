# iNaturalist Photo Triage

A Chrome Manifest V3 extension for reviewing iNaturalist upload drafts one photo at a time.

[繁體中文](README.zh-TW.md) | English

[Download the latest release](https://github.com/leotks0930/inaturalist-photo-triage/releases/latest)

## Features

- Open the iNaturalist upload page, then launch the extension from the Chrome toolbar.
- Upload local photos through the extension instead of using iNaturalist's upload button.
- Review one photo at a time and merge, create a new group, delete, or merge into an earlier group.
- The first photo uses “Set as group 1”; later photos use “New group”.
- Enforce iNaturalist's 20-photo limit per observation group.
- Display EXIF or iNaturalist capture time.
- Unlimited zoom with cursor-based wheel zoom, panning, double-click 2×, and keyboard controls.
- Unified edit workspace with crop and Photoshop-style color tools: exposure, contrast, highlights, shadows, whites, blacks, temperature, tint, saturation, vibrance, hue, live histogram, and RGB/R/G/B curves.
- Zoom, pan, and reset the image inside the edit workspace.
- Crop and color edits update the current photo in place and preserve its position in the review queue.
- Batch limits and behavior settings.
- Interface languages: English, Traditional Chinese, Simplified Chinese, Japanese, and Spanish.

## Safety

- The extension never presses “Submit observations”.
- The extension only reads local files selected by the user.
- Files are sent to iNaturalist only when the user chooses to upload photos or apply a crop.
- Delete removes draft items only; it does not delete local files.
- There is no backend and no account data collection.

## Install

See [INSTALL.en.md](INSTALL.en.md).

## Architecture

```text
Popup
  -> Background service worker
     -> page-bridge.js (MAIN world)
        -> iNaturalist React uploader store/actions
     -> shared/i18n.js + content/overlay.js (isolated world)
        -> Shadow DOM review interface

Options page
  -> chrome.storage.local
```

The extension uses iNaturalist's existing uploader actions instead of simulating HTML5 drag-and-drop. This preserves the uploader's own photo IDs and grouping state.

## Known limitations

- iNaturalist uploader internals may change and require updates to `src/page-bridge.js`.
- The extension targets the current React-based uploader.
- Reloading the iNaturalist upload page may clear the in-progress draft.

## License

Released under the [MIT License](LICENSE).
