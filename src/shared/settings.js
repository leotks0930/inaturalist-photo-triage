export const DEFAULT_SETTINGS = Object.freeze({
  batchLimit: 20,
  autoAdvance: true,
  confirmDelete: true,
  showFilename: true,
  language: "auto"
});

export const MIN_BATCH_LIMIT = 1;
export const MAX_BATCH_LIMIT = 100;

export async function loadSettings() {
  const stored = await chrome.storage.local.get(DEFAULT_SETTINGS);
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    batchLimit: Math.min(
      MAX_BATCH_LIMIT,
      Math.max(MIN_BATCH_LIMIT, Number(stored.batchLimit) || DEFAULT_SETTINGS.batchLimit)
    )
  };
}

export async function saveSettings(settings) {
  const normalized = {
    batchLimit: Math.min(
      MAX_BATCH_LIMIT,
      Math.max(MIN_BATCH_LIMIT, Number(settings.batchLimit) || DEFAULT_SETTINGS.batchLimit)
    ),
    autoAdvance: Boolean(settings.autoAdvance),
    confirmDelete: Boolean(settings.confirmDelete),
    showFilename: Boolean(settings.showFilename),
    language: settings.language || DEFAULT_SETTINGS.language
  };
  await chrome.storage.local.set(normalized);
  return normalized;
}
