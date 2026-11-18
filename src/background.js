const DEFAULT_SETTINGS = {
  batchLimit: 20,
  autoAdvance: true,
  confirmDelete: true,
  showFilename: true,
  language: "auto"
};

const UPLOAD_PATH = /^\/observations\/upload\/?$/;

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.local.get(DEFAULT_SETTINGS);
  await chrome.storage.local.set({
    ...DEFAULT_SETTINGS,
    ...stored
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "INAT_GET_POPUP_STATE") {
    getPopupState()
      .then(sendResponse)
      .catch(error => sendResponse({ ok: false, error: toMessage(error) }));
    return true;
  }

  if (message?.type === "INAT_START_REVIEW") {
    startReview(message.tabId)
      .then(sendResponse)
      .catch(error => sendResponse({ ok: false, error: toMessage(error) }));
    return true;
  }

  return false;
});

async function getPopupState() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const settings = await loadSettings();

  if (!tab?.id) {
    return { ok: false, reason: "no_tab", settings };
  }

  if (!isUploadPage(tab.url)) {
    return {
      ok: true,
      tabId: tab.id,
      isUploadPage: false,
      settings
    };
  }

  await injectPageBridge(tab.id);
  const snapshot = await readSnapshot(tab.id);
  const uiStatus = await readUiStatus(tab.id);

  return {
    ok: true,
    tabId: tab.id,
    isUploadPage: true,
    photoCount: snapshot?.photos?.length || 0,
    groupCount: snapshot?.groups?.length || 0,
    uiStatus,
    settings
  };
}

async function startReview(tabId) {
  if (!Number.isInteger(tabId)) {
    throw new Error("找不到目前分頁。");
  }

  const tab = await chrome.tabs.get(tabId);
  if (!isUploadPage(tab.url)) {
    throw new Error("請先開啟 iNaturalist 的上傳頁。");
  }

  await injectPageBridge(tabId);
  const snapshot = await readSnapshot(tabId);
  if (!snapshot) {
    throw new Error("讀不到 iNaturalist 上傳器，請重新整理頁面後再試。");
  }

  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["src/shared/i18n.js", "src/content/overlay.js"]
  });

  return {
    ok: true,
    photoCount: snapshot.photos.length,
    groupCount: snapshot.groups.length
  };
}

async function loadSettings() {
  const stored = await chrome.storage.local.get(DEFAULT_SETTINGS);
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    batchLimit: Math.min(
      100,
      Math.max(1, Number(stored.batchLimit) || DEFAULT_SETTINGS.batchLimit)
    )
  };
}

async function injectPageBridge(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["src/page-bridge.js"],
    world: "MAIN"
  });
}

async function readSnapshot(tabId) {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    func: () => {
      try {
        return window.__INAT_REVIEW_BRIDGE__?.snapshot?.() || null;
      } catch {
        return null;
      }
    }
  });
  return results[0]?.result || null;
}

async function readUiStatus(tabId) {
  try {
    return await chrome.tabs.sendMessage(tabId, {
      type: "INAT_REVIEW_GET_UI_STATUS"
    });
  } catch {
    return null;
  }
}

function isUploadPage(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.endsWith("inaturalist.org") && UPLOAD_PATH.test(parsed.pathname);
  } catch {
    return false;
  }
}

function toMessage(error) {
  return error instanceof Error ? error.message : String(error || "未知錯誤");
}
