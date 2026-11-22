# Installation

This is a Chrome Manifest V3 extension. No installer or server is required.

## 1. Extract the ZIP

1. Locate `inaturalist-photo-triage-v0.6.4.zip`.
2. macOS: double-click the ZIP.
3. Windows: right-click the ZIP and choose “Extract All”.
4. Open the extracted folder and confirm it directly contains:

```text
manifest.json
README.md
INSTALL.md
src/
icons/
```

If `manifest.json` is not visible, you selected the wrong folder.

## 2. Load in Chrome

1. Open:

```text
chrome://extensions
```

2. Enable “Developer mode”.
3. Click “Load unpacked”.
4. Select the folder that contains `manifest.json`.
5. The extension appears as “iNaturalist Photo Triage”.

## 3. Pin the extension

1. Click the puzzle-piece icon in the Chrome toolbar.
2. Find “iNaturalist Photo Triage”.
3. Click the pin icon.

## 4. First use

1. Sign in to iNaturalist.
2. Open:

```text
https://www.inaturalist.org/observations/upload
```

3. Click the extension icon.
4. If the upload page is empty, click “Open and upload local photos”.
5. In the extension, click “Upload local photos”.
6. Select local originals. The extension sends them to the iNaturalist uploader.
7. Review the photos one by one.

The first photo uses “Set as group 1”. Later photos use “New group”. Crop and color tools share one edit workspace, which supports zooming and panning.

## 5. Languages

Open the extension settings and choose Automatic, English, Traditional Chinese, Simplified Chinese, Japanese, or Spanish.

## Common issues

- “Manifest file missing”: select the folder containing `manifest.json`, not the ZIP.
- Extension icon missing: pin it from Chrome's puzzle-piece menu.
- “Not on upload page”: open the iNaturalist upload URL first.
- Upload stuck: reload the extension, refresh the iNaturalist upload page, and try again.
