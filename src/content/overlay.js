(() => {
  const UI_VERSION = 16;
  const CHANNEL = "inat-photo-triage-v10";
  const MAX_GROUP_PHOTOS = 20;
  const UPLOAD_CHUNK_SIZE = 5;
  const DELETE_CONFIRM_WINDOW_MS = 3000;
  const CROP_JPEG_QUALITY = 0.98;
  const IMAGE_FILE_PATTERN =
    /\.(avif|bmp|cr2|cr3|dng|gif|heic|heif|jpe?g|nef|orf|png|rw2|tiff?|webp)$/i;
  const COLOR_ADJUSTMENTS = [
    { key: "exposure", label: "曝光", min: -2, max: 2, step: 0.05 },
    { key: "contrast", label: "對比", min: -100, max: 100, step: 1 },
    { key: "highlights", label: "亮部", min: -100, max: 100, step: 1 },
    { key: "shadows", label: "陰影", min: -100, max: 100, step: 1 },
    { key: "whites", label: "白色", min: -100, max: 100, step: 1 },
    { key: "blacks", label: "黑色", min: -100, max: 100, step: 1 },
    { key: "temperature", label: "色溫", min: -100, max: 100, step: 1 },
    { key: "tint", label: "色調", min: -100, max: 100, step: 1 },
    { key: "saturation", label: "飽和度", min: -100, max: 100, step: 1 },
    { key: "vibrance", label: "鮮豔度", min: -100, max: 100, step: 1 },
    { key: "hue", label: "色相", min: -180, max: 180, step: 1 }
  ];

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  if (window.__INAT_REVIEW_UI__?.version === UI_VERSION) {
    window.__INAT_REVIEW_UI__.open();
    return;
  }

  if (window.__INAT_REVIEW_UI__?.close) {
    try {
      window.__INAT_REVIEW_UI__.close();
    } catch {
      // Ignore failures from an older UI instance.
    }
  }

  const DEFAULT_SETTINGS = {
    batchLimit: 20,
    autoAdvance: true,
    confirmDelete: true,
    showFilename: true,
    language: "auto"
  };
  const I18N = globalThis.INATI18N || {
    SUPPORTED: [],
    setLanguage: () => "zh-TW",
    t: source => source,
    format: (source, variables = {}) =>
      String(source).replace(
        /\{(\w+)\}/g,
        (match, key) =>
          variables[key] === undefined ? match : String(variables[key])
      ),
    translateDom: () => {}
  };

  const state = {
    uiReady: false,
    visible: false,
    busy: false,
    settings: { ...DEFAULT_SETTINGS },
    snapshot: null,
    localEntries: [],
    localByPhotoId: new Map(),
    fileInputPurpose: null,
    crop: null,
    color: null,
    session: null,
    currentIndex: 0,
    processedFileIds: new Set(),
    counts: { merged: 0, separated: 0, deleted: 0 },
    modal: null,
    deleteArmTimer: null,
    toastTimer: null,
    scrollPrevious: null,
    zoom: {
      scale: 1,
      translateX: 0,
      translateY: 0,
      dragging: null,
      photoId: null
    }
  };

  const pending = new Map();
  let host = null;
  let shadow = null;
  let elements = null;
  let nextRequestId = 1;
  let uiInitialization = null;

  window.addEventListener("message", event => {
    if (event.source !== window) {
      return;
    }
    const message = event.data;
    if (
      !message ||
      message.channel !== CHANNEL ||
      message.direction !== "from-bridge" ||
      !message.requestId
    ) {
      return;
    }

    const request = pending.get(message.requestId);
    if (!request) {
      return;
    }
    pending.delete(message.requestId);
    window.clearTimeout(request.timer);

    if (message.ok) {
      request.resolve(message.data);
    } else {
      request.reject(new Error(message.error || "iNaturalist 操作失敗。"));
    }
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "INAT_REVIEW_GET_UI_STATUS") {
      sendResponse(getUiStatus());
      return false;
    }

    if (message?.type === "INAT_REVIEW_OPEN") {
      open();
      sendResponse({ ok: true });
      return false;
    }

    return false;
  });

  window.__INAT_REVIEW_UI__ = {
    version: UI_VERSION,
    open,
    close,
    getStatus: getUiStatus
  };

  open();

  async function open() {
    if (!state.uiReady) {
      await ensureUi();
    }

    if (state.visible) {
      showToast("整理介面已經開啟。");
      return;
    }

    state.visible = true;
    host.style.display = "block";
    state.scrollPrevious = {
      htmlOverflow: document.documentElement.style.overflow,
      bodyOverflow: document.body.style.overflow
    };
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => {
      elements.shell.classList.add("is-open");
      elements.shell.setAttribute("aria-hidden", "false");
    });

    await refreshAndOpenSession();
  }

  function close() {
    if (!state.visible) {
      return;
    }

    state.visible = false;
    state.modal = null;
    state.crop = null;
    state.color = null;
    elements.shell.classList.remove("is-open");
    elements.shell.setAttribute("aria-hidden", "true");
    renderModal();

    if (state.scrollPrevious) {
      document.documentElement.style.overflow = state.scrollPrevious.htmlOverflow;
      document.body.style.overflow = state.scrollPrevious.bodyOverflow;
      state.scrollPrevious = null;
    }

    window.setTimeout(() => {
      if (!state.visible) {
        host.style.display = "none";
      }
    }, 220);
  }

  async function ensureUi() {
    if (uiInitialization) {
      return uiInitialization;
    }

    uiInitialization = (async () => {
      await loadSettings();
      await createHost();
      I18N.translateDom(shadow);
      attachUiEvents();
      state.uiReady = true;
    })();
    return uiInitialization;
  }

  async function loadSettings() {
    const stored = await chrome.storage.local.get(DEFAULT_SETTINGS);
    state.settings = {
      ...DEFAULT_SETTINGS,
      ...stored,
      batchLimit: Math.min(
        100,
        Math.max(1, Number(stored.batchLimit) || DEFAULT_SETTINGS.batchLimit)
      )
    };
    I18N.setLanguage(state.settings.language);
  }

  async function loadLocalFiles(fileList) {
    const selection = await prepareLocalEntries(fileList);
    const { loaded, skipped } = selection;
    if (!loaded.length) {
      showToast(buildFileSelectionError(selection), "error");
      return;
    }

    appendLocalEntries(loaded);
    matchLocalFilesToPhotos();
    state.zoom.photoId = null;
    resetZoom();
    render();

    const message = skipped.length
      ? I18N.format(
          "已載入 {count} 張本機原圖，匹配 {matched} 張。 {skipped} 張無法讀取。",
          {
            count: loaded.length,
            matched: state.localByPhotoId.size,
            skipped: skipped.length
          }
        )
      : I18N.format("已載入 {count} 張本機原圖，匹配 {matched} 張。", {
          count: loaded.length,
          matched: state.localByPhotoId.size
        });
    showToast(
      message,
      state.localByPhotoId.size ? "success" : "error"
    );
  }

  async function uploadLocalFiles(fileList) {
    const selection = await prepareLocalEntries(fileList, {
      allowUndecodable: true
    });
    const { loaded, skipped } = selection;
    if (!loaded.length) {
      showUploadEmptyState(buildFileSelectionError(selection));
      return;
    }

    appendLocalEntries(loaded);
    showUploadProgress(loaded.length);
    state.busy = true;
    setActionBusy(true);

    try {
      const uploadedFileMappings = [];
      let snapshot = null;

      for (let start = 0; start < loaded.length; start += UPLOAD_CHUNK_SIZE) {
        const chunk = loaded.slice(start, start + UPLOAD_CHUNK_SIZE);
        const payloadFiles = [];
        const transfer = [];

        for (const entry of chunk) {
          const arrayBuffer = await entry.file.arrayBuffer();
          payloadFiles.push({
            name: entry.file.name,
            type: entry.file.type || "image/jpeg",
            lastModified: entry.file.lastModified,
            arrayBuffer
          });
          transfer.push(arrayBuffer);
        }

        const chunkSnapshot = await bridgeRequest(
          "uploadPhotoFiles",
          { files: payloadFiles },
          70000,
          transfer
        );
        snapshot = chunkSnapshot;
        state.snapshot = chunkSnapshot;
        for (const mapping of chunkSnapshot.uploadedFileMappings || []) {
          uploadedFileMappings.push({
            ...mapping,
            requestIndex: start + mapping.requestIndex
          });
        }
        updateUploadProgress(
          Math.min(start + chunk.length, loaded.length),
          loaded.length
        );
      }

      const mappedIds = new Set(
        uploadedFileMappings.map(mapping => mapping.fileId)
      );
      const mappedPhotos = snapshot.photos.filter(photo =>
        mappedIds.has(photo.fileId)
      );
      snapshot = {
        ...snapshot,
        uploadedFileMappings,
        missingPhotoCount: Math.max(
          0,
          loaded.length - uploadedFileMappings.length
        ),
        failedUploadNames: mappedPhotos
          .filter(photo => photo.uploadState === "failed")
          .map(photo => photo.name),
        pendingUploadCount:
          mappedPhotos.filter(
            photo =>
              photo.uploadState !== "uploaded" &&
              photo.uploadState !== "failed"
          ).length +
          Math.max(0, loaded.length - uploadedFileMappings.length)
      };
      state.snapshot = snapshot;
      matchLocalFilesToPhotos();
      for (const mapping of snapshot.uploadedFileMappings || []) {
        const entry = loaded[mapping.requestIndex];
        if (entry) {
          state.localByPhotoId.set(mapping.fileId, entry);
        }
      }
      state.busy = false;
      setActionBusy(false);

      if (!state.session || state.session.status === "complete") {
        startBatch();
      } else {
        appendUnseenPhotosToSession(snapshot);
        repairCurrentIndex();
        render();
      }
      const failedCount = snapshot.failedUploadNames?.length || 0;
      if (failedCount) {
        showToast(
          I18N.format(
            "已加入 {count} 張照片，但其中 {failed} 張上傳失敗。",
            {
              count: loaded.length,
              failed: failedCount
            }
          ),
          "error"
        );
      } else if (snapshot.pendingUploadCount) {
        showToast(
          I18N.format(
            "已加入 {count} 張照片；iNaturalist 仍在背景上傳 {pending} 張，可以先開始整理。",
            {
              count: loaded.length,
              pending: snapshot.pendingUploadCount
            }
          )
        );
      } else {
        showToast(
          skipped.length + selection.unsupported.length
            ? I18N.format(
                "已從插件上傳 {count} 張照片，略過 {skipped} 個非圖片或無法讀取的檔案。",
                {
                  count: loaded.length,
                  skipped:
                    skipped.length + selection.unsupported.length
                }
              )
            : I18N.format("已從插件上傳 {count} 張照片。", {
                count: loaded.length
              })
        );
      }
    } catch (error) {
      state.busy = false;
      setActionBusy(false);
      const message = error instanceof Error ? error.message : String(error);
      if (state.snapshot?.photos?.length) {
        render();
        showToast(message, "error");
      } else {
        showUploadEmptyState(message);
      }
    }
  }

  async function prepareLocalEntries(
    fileList,
    { allowUndecodable = false } = {}
  ) {
    const received = Array.from(fileList || []);
    const files = received.filter(isImageFile);
    const unsupported = received.filter(file => !isImageFile(file));
    const loaded = [];
    const skipped = [];
    for (const file of files) {
      const url = URL.createObjectURL(file);
      try {
        const size = await getImageSize(url);
        loaded.push({
          file,
          url,
          width: size.width,
          height: size.height,
          decodable: true
        });
      } catch {
        if (allowUndecodable) {
          URL.revokeObjectURL(url);
          loaded.push({
            file,
            url: "",
            width: 0,
            height: 0,
            decodable: false
          });
        } else {
          URL.revokeObjectURL(url);
          skipped.push(file);
        }
      }
    }
    return { loaded, skipped, unsupported, received };
  }

  function isImageFile(file) {
    return (
      String(file?.type || "").startsWith("image/") ||
      IMAGE_FILE_PATTERN.test(String(file?.name || ""))
    );
  }

  function buildFileSelectionError({
    loaded = [],
    skipped = [],
    unsupported = [],
    received = []
  }) {
    if (!received.length) {
      return I18N.t("沒有收到任何檔案，請重新按「上傳本機照片」。");
    }
    const failed = [...unsupported, ...skipped].slice(0, 3);
    if (!failed.length && loaded.length === 0) {
      return I18N.t("沒有可用的圖片檔案。");
    }
    const detail = failed
      .map(
        file =>
          `${file.name} (${file.type || I18N.t("未知類型")})`
      )
      .join("、");
    return detail
      ? I18N.format("沒有可用的圖片檔案：{detail}", { detail })
      : I18N.t("沒有可用的圖片檔案。");
  }

  function appendLocalEntries(entries) {
    const incomingNames = new Set(
      entries.map(entry => normalizeFileName(entry.file.name))
    );
    for (const existing of state.localEntries) {
      if (incomingNames.has(normalizeFileName(existing.file.name))) {
        if (existing.url) {
          URL.revokeObjectURL(existing.url);
        }
      }
    }
    state.localEntries = state.localEntries
      .filter(
        entry => !incomingNames.has(normalizeFileName(entry.file.name))
      )
      .concat(entries);
  }

  function getImageSize(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        resolve({
          width: image.naturalWidth,
          height: image.naturalHeight
        });
      };
      image.onerror = () => reject(new Error("無法讀取圖片。"));
      image.src = url;
    });
  }

  function normalizeFileName(name) {
    return String(name || "").normalize("NFC").toLocaleLowerCase();
  }

  function matchLocalFilesToPhotos() {
    state.localByPhotoId = new Map();
    if (!state.snapshot?.photos?.length) {
      return;
    }

    const byName = new Map();
    for (const entry of state.localEntries) {
      const key = normalizeFileName(entry.file.name);
      if (!byName.has(key)) {
        byName.set(key, []);
      }
      byName.get(key).push(entry);
    }

    for (const photo of state.snapshot.photos) {
      const candidates = byName.get(normalizeFileName(photo.name));
      if (candidates?.length) {
        state.localByPhotoId.set(photo.fileId, candidates.shift());
      }
    }

    const unmatchedPhotos = state.snapshot.photos.filter(
      photo => !state.localByPhotoId.has(photo.fileId)
    );
    const matchedEntries = new Set(state.localByPhotoId.values());
    const unmatchedEntries = state.localEntries.filter(
      entry => !matchedEntries.has(entry)
    );
    if (
      unmatchedEntries.length &&
      unmatchedEntries.length === unmatchedPhotos.length
    ) {
      unmatchedPhotos.forEach((photo, index) => {
        state.localByPhotoId.set(photo.fileId, unmatchedEntries[index]);
      });
    }
  }

  async function createHost() {
    host = document.createElement("div");
    host.id = "inat-photo-triage-host";
    host.style.cssText = [
      "all: initial",
      "position: fixed",
      "inset: 0",
      "z-index: 2147483647",
      "display: none"
    ].join(";");
    shadow = host.attachShadow({ mode: "open" });

    shadow.innerHTML = `
      <div class="triage-shell" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="triageTitle">
        <div class="ambient ambient-a"></div>
        <div class="ambient ambient-b"></div>

        <header class="triage-header">
          <div class="triage-brand">
            <span class="brand-orbit" aria-hidden="true">
              <span class="brand-leaf"></span>
            </span>
            <div>
              <p class="eyebrow">iNaturalist · Photo Triage</p>
              <h1 id="triageTitle">逐張整理</h1>
            </div>
          </div>

          <div class="header-tools">
            <button class="source-button source-button-primary" type="button" data-command="upload-local">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 16V4M8 8l4-4 4 4M5 14v5h14v-5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>上傳本機照片</span>
            </button>
            <button class="source-button source-button-secondary" type="button" data-command="load-local" title="只載入本機原圖，不新增上傳">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 7h6l2 2h8v10H4V7Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span id="sourceButtonLabel">載入原圖</span>
            </button>
            <div class="batch-chip">
              <span id="phaseLabel">準備中</span>
              <span class="batch-divider" aria-hidden="true"></span>
              <span id="batchLimitLabel">本批 20 張</span>
            </div>
            <button class="close-button" type="button" data-command="close" aria-label="關閉整理介面">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </header>

        <div class="progress-rail" aria-hidden="true">
          <span id="progressFill"></span>
        </div>

        <main class="triage-main" id="triageMain">
          <section class="photo-stage">
            <div class="stage-toolbar">
              <span class="counter-pill" id="counterPill">照片 1 / 1</span>
              <span class="group-pill" id="groupPill">第 1 組</span>
            </div>

            <div class="photo-frame">
              <div class="photo-loading" id="photoLoading">
                <span class="loading-ring"></span>
                <span>讀取照片…</span>
              </div>
              <img class="photo-image" id="photoImage" alt="">
              <div class="photo-error" id="photoError" hidden>
                <span>無法載入這張照片的預覽</span>
              </div>
              <div class="zoom-toolbar" role="group" aria-label="照片縮放">
                <button type="button" data-command="zoom-out" aria-label="縮小">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 12h12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                  </svg>
                </button>
                <button class="zoom-readout" type="button" data-command="zoom-reset" aria-label="重設縮放">
                  <span id="zoomLabel">100%</span>
                </button>
                <button type="button" data-command="zoom-in" aria-label="放大">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 6v12M6 12h12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                  </svg>
                </button>
                <span class="zoom-divider" aria-hidden="true"></span>
                <button id="editButton" type="button" data-command="edit" aria-label="編輯照片" disabled>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7 3v14a2 2 0 0 0 2 2h12M3 7h14a2 2 0 0 1 2 2v12M12 8v8M8 12h8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
              <div class="zoom-instruction" id="zoomInstruction">滾輪縮放 · 放大後可拖曳</div>
            </div>

            <div class="stage-footer">
              <div class="photo-caption">
                <p class="filename" id="fileName">—</p>
                <p class="capture-time" id="captureTime">拍攝時間：—</p>
                <p class="photo-subline" id="photoSubline">正在讀取群組資訊</p>
              </div>
              <div class="stage-navigation">
                <button class="nav-button" type="button" data-command="previous" aria-label="上一張照片">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <button class="nav-button" type="button" data-command="next" aria-label="下一張照片">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </section>

          <aside class="control-panel">
            <div class="panel-heading">
              <p class="eyebrow">NOW REVIEWING</p>
              <h2 id="panelPhotoLabel">第 1 張</h2>
              <p id="groupDetail">目前是獨立照片</p>
            </div>

            <div class="action-stack">
              <button class="action-button action-first-group" id="firstGroupButton" type="button" data-command="set-first-group" hidden>
                <span class="action-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 4v16M5 5h11l-1.6 3.5L16 12H5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                <span class="action-copy">
                  <strong>設為第一組</strong>
                  <small>以這張照片開始第一組</small>
                </span>
                <kbd>1</kbd>
              </button>

              <button class="action-button action-merge" type="button" data-command="merge">
                <span class="action-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7 7h7a4 4 0 0 1 0 8H9M9 12l-3-3 3-3M9 12l-3 3 3 3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                <span class="action-copy">
                  <strong>合併</strong>
                  <small id="mergeHint">併入前一組</small>
                </span>
                <kbd>1</kbd>
              </button>

              <button class="action-button action-separate" type="button" data-command="separate">
                <span class="action-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 3v18M7.5 7 5 9.5M16.5 7 19 9.5M7.5 17 5 14.5M16.5 17 19 14.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                <span class="action-copy">
                  <strong>開新組</strong>
                  <small id="separateHint">分開成獨立群組</small>
                </span>
                <kbd>2</kbd>
              </button>

              <button class="action-button action-delete" type="button" data-command="delete">
                <span class="action-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 7h14M9 7V4.8h6V7M8 10v7M12 10v7M16 10v7M7 7l1 13h8l1-13" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                <span class="action-copy">
                  <strong>刪除</strong>
                  <small>只從本次草稿移除</small>
                </span>
                <kbd>3</kbd>
              </button>

              <button class="action-button action-groups" type="button" data-command="groups">
                <span class="action-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="4" y="5" width="7" height="6" rx="1.4" fill="none" stroke="currentColor" stroke-width="1.6"/>
                    <rect x="13" y="5" width="7" height="6" rx="1.4" fill="none" stroke="currentColor" stroke-width="1.6"/>
                    <rect x="8.5" y="14" width="7" height="6" rx="1.4" fill="none" stroke="currentColor" stroke-width="1.6"/>
                    <path d="M11.5 11v3M16.5 11v1.4a1.6 1.6 0 0 1-1.6 1.6h-1.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                  </svg>
                </span>
                <span class="action-copy">
                  <strong>以前的群組</strong>
                  <small id="groupsHint">選擇較早的群組</small>
                </span>
                <kbd>4</kbd>
              </button>
            </div>

            <div class="queue-section">
              <div class="queue-heading">
                <span>BATCH QUEUE</span>
                <span id="queueProgress">0 / 0</span>
              </div>
              <div class="queue-strip" id="queueStrip"></div>
            </div>

            <div class="keyboard-note">
              <span>快捷鍵</span>
              <p><kbd>←</kbd><kbd>→</kbd> 瀏覽 · <kbd>Esc</kbd> 關閉</p>
            </div>
          </aside>
        </main>

        <div class="state-layer" id="loadingLayer">
          <div class="state-card loading-card">
            <span class="loading-ring"></span>
            <h2>讀取上傳草稿</h2>
            <p>正在取得照片順序和目前分組…</p>
          </div>
        </div>

        <div class="state-layer" id="summaryLayer" hidden>
          <button class="state-close-button" type="button" data-command="close" aria-label="關閉整理介面">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </button>
          <div class="state-card summary-card">
            <p class="eyebrow">BATCH COMPLETE</p>
            <h2 id="summaryTitle">這一批完成了</h2>
            <p id="summaryCopy">照片已依照你的操作整理。</p>
            <div class="summary-metrics">
              <div><strong id="mergedCount">0</strong><span>合併</span></div>
              <div><strong id="separatedCount">0</strong><span>新組</span></div>
              <div><strong id="deletedCount">0</strong><span>刪除</span></div>
            </div>
            <div class="summary-actions">
              <button class="ghost-button" type="button" data-command="close">結束</button>
              <button class="solid-button" id="nextBatchButton" type="button" data-command="next-batch">處理下一批</button>
            </div>
          </div>
        </div>

        <div class="modal-layer" id="modalLayer" hidden>
          <div class="modal-card" id="modalCard"></div>
        </div>

        <div class="toast" id="toast" role="status" aria-live="polite"></div>
        <input class="hidden-file-input" id="localFileInput" type="file" accept="image/*" multiple>
      </div>
    `;

    document.documentElement.appendChild(host);

    elements = {};
    for (const id of [
      "shell",
      "phaseLabel",
      "batchLimitLabel",
      "progressFill",
      "sourceButtonLabel",
      "triageMain",
      "counterPill",
      "groupPill",
      "photoLoading",
      "photoFrame",
      "photoImage",
      "photoError",
      "zoomLabel",
      "zoomInstruction",
      "editButton",
      "localFileInput",
      "fileName",
      "captureTime",
      "photoSubline",
      "panelPhotoLabel",
      "groupDetail",
      "mergeHint",
      "separateHint",
      "groupsHint",
      "queueProgress",
      "queueStrip",
      "loadingLayer",
      "summaryLayer",
      "summaryTitle",
      "summaryCopy",
      "mergedCount",
      "separatedCount",
      "deletedCount",
      "nextBatchButton",
      "modalLayer",
      "modalCard",
      "toast"
    ]) {
      elements[id] = shadow.querySelector(`#${id}`);
    }
    elements.shell = shadow.querySelector(".triage-shell");
    elements.photoFrame = shadow.querySelector(".photo-frame");
    elements.mergeButton = shadow.querySelector('[data-command="merge"]');
    elements.firstGroupButton = shadow.querySelector(
      '[data-command="set-first-group"]'
    );
    elements.separateButton = shadow.querySelector('[data-command="separate"]');
    elements.deleteButton = shadow.querySelector('[data-command="delete"]');
    elements.groupsButton = shadow.querySelector('[data-command="groups"]');
    elements.uploadSourceButton = shadow.querySelector(
      '[data-command="upload-local"]'
    );
    elements.loadSourceButton = shadow.querySelector(
      '[data-command="load-local"]'
    );
    elements.previousButton = shadow.querySelector('[data-command="previous"]');
    elements.nextButton = shadow.querySelector('[data-command="next"]');

    await attachStyles();
  }

  async function attachStyles() {
    const cssUrl = chrome.runtime.getURL("src/content/overlay.css");
    const css = await fetch(cssUrl).then(response => {
      if (!response.ok) {
        throw new Error("無法載入整理介面樣式。");
      }
      return response.text();
    });

    if ("adoptedStyleSheets" in shadow && typeof CSSStyleSheet === "function") {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(css);
      shadow.adoptedStyleSheets = [sheet];
      return;
    }

    const style = document.createElement("style");
    style.textContent = css;
    shadow.prepend(style);
  }

  function attachUiEvents() {
    host.addEventListener("click", event => {
      event.stopPropagation();
    });
    host.addEventListener("pointerdown", event => {
      event.stopPropagation();
    });
    elements.localFileInput.addEventListener("change", async event => {
      const purpose = state.fileInputPurpose;
      state.fileInputPurpose = null;
      if (purpose === "upload") {
        await uploadLocalFiles(event.target.files);
      } else {
        await loadLocalFiles(event.target.files);
      }
      event.target.value = "";
    });

    shadow.addEventListener("click", event => {
      const commandElement = event.target.closest("[data-command]");
      if (!commandElement) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      handleCommand(commandElement.dataset.command, commandElement);
    });

    document.addEventListener("keydown", handleKeydown, true);
    attachZoomEvents();
  }

  async function refreshAndOpenSession() {
    showLoading();
    try {
      await loadSettings();
      const snapshot = await bridgeRequest("snapshot");
      state.snapshot = snapshot;
      matchLocalFilesToPhotos();
      appendUnseenPhotosToSession(snapshot);

      if (!snapshot?.photos?.length) {
        showUploadEmptyState();
        return;
      }

      if (
        state.session?.status === "active" &&
        state.session.queue.some(fileId =>
          snapshot.photos.some(photo => photo.fileId === fileId)
        )
      ) {
        repairCurrentIndex();
        hideStateLayers();
        render();
        return;
      }

      startBatch();
    } catch (error) {
      showError(error instanceof Error ? error.message : String(error));
    }
  }

  function startBatch() {
    if (!state.snapshot) {
      return;
    }

    const unprocessed = state.snapshot.photos.filter(
      photo => !state.processedFileIds.has(photo.fileId)
    );
    if (!unprocessed.length) {
      showSummary();
      return;
    }

    const queue = unprocessed
      .slice(0, state.settings.batchLimit)
      .map(photo => photo.fileId);

    state.session = {
      queue,
      status: "active",
      startedAt: Date.now()
    };
    state.currentIndex = 0;
    state.counts = { merged: 0, separated: 0, deleted: 0 };
    hideStateLayers();
    render();
  }

  function appendUnseenPhotosToSession(snapshot) {
    if (
      !state.session ||
      state.session.status !== "active" ||
      !snapshot?.photos?.length
    ) {
      return;
    }
    const existingIds = new Set(state.session.queue);
    const slots = Math.max(
      0,
      state.settings.batchLimit - state.session.queue.length
    );
    if (!slots) {
      return;
    }
    const unseen = snapshot.photos
      .filter(
        photo =>
          !existingIds.has(photo.fileId) &&
          !state.processedFileIds.has(photo.fileId)
      )
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .slice(0, slots);
    if (unseen.length) {
      state.session.queue.push(...unseen.map(photo => photo.fileId));
    }
  }

  function currentPhoto() {
    if (!state.session || !state.snapshot) {
      return null;
    }
    const fileId = state.session.queue[state.currentIndex];
    return state.snapshot.photos.find(photo => photo.fileId === fileId) || null;
  }

  function currentGroup() {
    const photo = currentPhoto();
    if (!photo) {
      return null;
    }
    return state.snapshot.groups.find(group => group.id === photo.groupId) || null;
  }

  function earlierGroups() {
    const photo = currentPhoto();
    if (!photo) {
      return [];
    }
    return state.snapshot.groups
      .filter(group => group.index < photo.groupIndex)
      .sort((a, b) => b.index - a.index);
  }

  function previousGroup() {
    const photo = currentPhoto();
    if (!photo) {
      return null;
    }
    return (
      state.snapshot.groups.find(group => group.index === photo.groupIndex - 1) ||
      null
    );
  }

  function render() {
    const photo = currentPhoto();
    if (!photo) {
      repairCurrentIndex();
      if (!currentPhoto()) {
        showSummary();
        return;
      }
    }

    const activePhoto = currentPhoto();
    const activeGroup = currentGroup();
    const localEntry = state.localByPhotoId.get(activePhoto.fileId) || null;
    const total = state.session.queue.length;
    const position = state.currentIndex + 1;
    const progress = total ? (position / total) * 100 : 0;
    const earlier = earlierGroups();
    const previous = previousGroup();

    elements.loadingLayer.hidden = true;
    elements.summaryLayer.hidden = true;
    elements.triageMain.hidden = false;

    elements.phaseLabel.textContent = `${position} / ${total}`;
    elements.batchLimitLabel.textContent = I18N.format("本批 {count} 張", {
      count: total
    });
    elements.progressFill.style.width = `${progress}%`;
    elements.counterPill.textContent = I18N.format(
      "照片 {current} / {total}",
      { current: position, total }
    );
    elements.groupPill.textContent = I18N.format(
      "第 {group} 組 · {count} 張",
      {
        group: activePhoto.groupIndex + 1,
        count: activePhoto.groupPhotoCount
      }
    );

    elements.sourceButtonLabel.textContent = state.localEntries.length
      ? I18N.format("本機原圖 {matched}/{total}", {
          matched: state.localByPhotoId.size,
          total: state.snapshot.photoCount
        })
      : I18N.t("載入本機原圖");
    elements.fileName.textContent = state.settings.showFilename
      ? activePhoto.name
      : I18N.t("照片");
    elements.captureTime.textContent = activePhoto.observedAt
      ? I18N.format("拍攝時間：{time}", {
          time: activePhoto.observedAt
        })
      : I18N.t("拍攝時間：未提供");
    const sourceLabel = localEntry
      ? localEntry.decodable
        ? I18N.format("本機原檔 {width}×{height}", {
            width: localEntry.width,
            height: localEntry.height
          })
        : I18N.t("本機原檔 · 瀏覽器無法預覽")
      : I18N.t("網頁版本");
    elements.photoSubline.textContent = `${
      sourceLabel
    } · ${I18N.format("第 {index} 張 · 目前位於第 {group} 組", {
      index: position,
      group: activePhoto.groupIndex + 1
    })}`;
    elements.panelPhotoLabel.textContent = I18N.format(
      "第 {index} 張",
      { index: position }
    );
    elements.groupDetail.textContent =
      activePhoto.groupPhotoCount > 1
        ? I18N.format("這張目前與另外 {count} 張照片同組", {
            count: activePhoto.groupPhotoCount - 1
          })
        : I18N.t("這張目前是獨立照片");

    elements.mergeHint.textContent = previous
      ? previous.photoCount >= MAX_GROUP_PHOTOS
        ? I18N.format("第 {group} 組已有 20 張", {
            group: previous.index + 1
          })
        : I18N.format("併入第 {group} 組", {
            group: previous.index + 1
          })
      : I18N.t("前面沒有可合併的群組");
    elements.separateHint.textContent =
      activePhoto.orderIndex === 0
        ? I18N.t("第一張照片不使用")
        : activePhoto.groupPhotoCount > 1
          ? I18N.t("從目前群組切出")
          : I18N.t("確認為獨立群組");
    const availableEarlierGroups = earlier.filter(
      group => group.photoCount < MAX_GROUP_PHOTOS
    );
    elements.groupsHint.textContent = earlier.length
      ? availableEarlierGroups.length
        ? I18N.format("可選擇 {count} 個前一組", {
            count: availableEarlierGroups.length
          })
        : I18N.t("前一組都已有 20 張")
      : I18N.t("前面沒有較早的群組");

    elements.mergeButton.disabled =
      state.busy || !previous || previous.photoCount >= MAX_GROUP_PHOTOS;
    elements.firstGroupButton.hidden = activePhoto.orderIndex !== 0;
    elements.firstGroupButton.disabled = state.busy;
    elements.mergeButton.hidden = activePhoto.orderIndex === 0;
    elements.separateButton.hidden = activePhoto.orderIndex === 0;
    elements.separateButton.disabled = state.busy || activePhoto.orderIndex === 0;
    elements.deleteButton.disabled = state.busy;
    elements.uploadSourceButton.disabled = state.busy;
    elements.loadSourceButton.disabled = state.busy;
    elements.groupsButton.disabled =
      state.busy || availableEarlierGroups.length === 0;
    elements.previousButton.disabled = state.busy || state.currentIndex <= 0;
    elements.nextButton.disabled = state.busy;
    elements.editButton.disabled =
      state.busy || !localEntry?.decodable;
    renderQueueStrip();

    elements.photoImage.classList.remove("is-ready");
    elements.photoLoading.hidden = false;
    elements.photoError.hidden = true;
    elements.photoImage.onload = () => {
      elements.photoLoading.hidden = true;
      elements.photoError.hidden = true;
      elements.photoImage.classList.add("is-ready");
    };
    elements.photoImage.onerror = () => {
      elements.photoLoading.hidden = true;
      elements.photoError.hidden = false;
      elements.photoImage.classList.remove("is-ready");
    };
    elements.photoImage.src =
      localEntry?.url || activePhoto.url || activePhoto.thumbUrl;
    elements.photoImage.alt = activePhoto.name;
    if (state.zoom.photoId !== activePhoto.fileId) {
      state.zoom.photoId = activePhoto.fileId;
      resetZoom();
    }
    I18N.translateDom(shadow);
  }

  function repairCurrentIndex() {
    if (!state.session || !state.snapshot) {
      return;
    }

    while (
      state.currentIndex < state.session.queue.length &&
      !state.snapshot.photos.some(
        photo => photo.fileId === state.session.queue[state.currentIndex]
      )
    ) {
      state.currentIndex += 1;
    }

    if (state.currentIndex >= state.session.queue.length) {
      state.session.status = "complete";
    }
  }

  async function handleCommand(command, element) {
    switch (command) {
      case "close":
        close();
        return;
      case "previous":
        await navigate(-1);
        return;
      case "next":
        await navigate(1);
        return;
      case "merge":
        await mergeIntoPrevious();
        return;
      case "set-first-group":
        await setCurrentAsFirstGroup();
        return;
      case "separate":
        await separateCurrent();
        return;
      case "delete":
        requestDelete();
        return;
      case "groups":
        openGroupPicker();
        return;
      case "load-local":
        state.fileInputPurpose = "load";
        elements.localFileInput.click();
        return;
      case "upload-local":
        state.fileInputPurpose = "upload";
        elements.localFileInput.click();
        return;
      case "crop":
        openCombinedEditor("crop");
        return;
      case "color":
        openCombinedEditor("color");
        return;
      case "edit":
        openCombinedEditor("crop");
        return;
      case "edit-tool":
        switchEditTool(element.dataset.editTool);
        return;
      case "color-tab":
        switchColorTab(element.dataset.colorTab);
        return;
      case "curve-channel":
        switchCurveChannel(element.dataset.channel);
        return;
      case "reset-color":
        resetColorAdjustments();
        return;
      case "confirm-color":
        await applyColorAdjustments();
        return;
      case "reset-crop":
        resetCropSelection();
        return;
      case "confirm-crop":
        await applyCropAndUpload();
        return;
      case "zoom-in":
        zoomAtCenter(1.35);
        return;
      case "zoom-out":
        zoomAtCenter(1 / 1.35);
        return;
      case "zoom-reset":
        resetZoom();
        return;
      case "close-modal":
        state.modal = null;
        state.crop = null;
        state.color = null;
        renderModal();
        return;
      case "confirm-delete":
        await confirmDeleteFromModal();
        return;
      case "select-group":
        await mergeIntoGroup(element.dataset.groupId);
        return;
      case "queue-photo":
        await navigateToQueueIndex(Number(element.dataset.queueIndex));
        return;
      case "next-batch":
        startBatch();
        return;
      case "rescan":
        await refreshAndOpenSession();
        return;
      default:
        return;
    }
  }

  function handleKeydown(event) {
    if (!state.visible) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      if (state.busy && state.modal?.type === "crop") {
        return;
      }
      if (state.modal) {
        state.modal = null;
        state.crop = null;
        state.color = null;
        renderModal();
      } else {
        close();
      }
      return;
    }

    if (state.modal) {
      if (state.modal.type === "delete" && event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        confirmDeleteFromModal();
      }
      return;
    }

    const keyActions = {
      "1": "merge",
      "2": "separate",
      "3": "delete",
      "4": "groups"
    };

    const keyAction =
      event.key === "1" && currentPhoto()?.orderIndex === 0
        ? "set-first-group"
        : keyActions[event.key];

    if (keyAction) {
      event.preventDefault();
      event.stopPropagation();
      handleCommand(keyAction);
      return;
    }

    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      event.stopPropagation();
      zoomAtCenter(1.35);
      return;
    }
    if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      event.stopPropagation();
      zoomAtCenter(1 / 1.35);
      return;
    }
    if (event.key === "0") {
      event.preventDefault();
      event.stopPropagation();
      resetZoom();
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      event.stopPropagation();
      navigate(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      event.stopPropagation();
      navigate(1);
    }
  }

  async function navigate(direction) {
    if (state.busy || !state.session) {
      return;
    }

    await refreshSnapshotForNavigation();

    const nextIndex = state.currentIndex + direction;
    if (direction > 0) {
      markFirstPhotoReviewed();
    }
    if (nextIndex < 0 || nextIndex >= state.session.queue.length) {
      if (direction > 0 && nextIndex >= state.session.queue.length) {
        showSummary();
      }
      return;
    }

    state.currentIndex = nextIndex;
    render();
  }

  async function navigateToQueueIndex(index) {
    if (
      state.busy ||
      !Number.isInteger(index) ||
      index < 0 ||
      !state.session ||
      index >= state.session.queue.length
    ) {
      return;
    }

    await refreshSnapshotForNavigation();

    if (!state.snapshot.photos.some(
      photo => photo.fileId === state.session.queue[index]
    )) {
      return;
    }
    if (index > state.currentIndex) {
      markFirstPhotoReviewed();
    }
    state.currentIndex = index;
    render();
  }

  function markFirstPhotoReviewed() {
    const photo = currentPhoto();
    if (photo?.orderIndex === 0) {
      state.processedFileIds.add(photo.fileId);
    }
  }

  async function refreshSnapshotForNavigation() {
    try {
      state.snapshot = await bridgeRequest("snapshot");
      matchLocalFilesToPhotos();
      appendUnseenPhotosToSession(state.snapshot);
      repairCurrentIndex();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : String(error),
        "error"
      );
    }
  }

  function renderQueueStrip() {
    if (!state.session || !state.snapshot) {
      elements.queueStrip.replaceChildren();
      elements.queueProgress.textContent = "0 / 0";
      return;
    }

    elements.queueStrip.replaceChildren();
    const queuePhotos = state.session.queue
      .map((fileId, queueIndex) => ({
        queueIndex,
        photo: state.snapshot.photos.find(photo => photo.fileId === fileId)
      }))
      .filter(entry => entry.photo);
    const processedInBatch = queuePhotos.filter(({ photo }) =>
      state.processedFileIds.has(photo.fileId)
    ).length;
    elements.queueProgress.textContent = `${processedInBatch} / ${queuePhotos.length}`;

    queuePhotos.forEach(({ photo, queueIndex }) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "queue-item";
      button.dataset.command = "queue-photo";
      button.dataset.queueIndex = String(queueIndex);
      button.title = photo.name;
      button.setAttribute(
        "aria-label",
        I18N.format("查看第 {index} 張：{name}", {
          index: queueIndex + 1,
          name: photo.name
        })
      );
      if (queueIndex === state.currentIndex) {
        button.classList.add("is-current");
      }
      if (state.processedFileIds.has(photo.fileId)) {
        button.classList.add("is-processed");
      }

      const image = document.createElement("img");
      image.src = photo.thumbUrl;
      image.alt = "";
      button.appendChild(image);
      elements.queueStrip.appendChild(button);
    });
  }

  function attachZoomEvents() {
    elements.photoFrame.addEventListener(
      "wheel",
      event => {
        if (!state.visible || state.modal) {
          return;
        }
        event.preventDefault();
        const factor = Math.exp(-event.deltaY * 0.0016);
        zoomAtPoint(event.clientX, event.clientY, factor);
      },
      { passive: false }
    );

    elements.photoImage.addEventListener("pointerdown", event => {
      if (
        !state.visible ||
        state.modal ||
        state.zoom.scale <= 1 ||
        event.button !== 0
      ) {
        return;
      }
      event.preventDefault();
      state.zoom.dragging = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        translateX: state.zoom.translateX,
        translateY: state.zoom.translateY
      };
      elements.photoFrame.classList.add("is-dragging");
      elements.photoImage.setPointerCapture(event.pointerId);
    });

    elements.photoImage.addEventListener("pointermove", event => {
      const dragging = state.zoom.dragging;
      if (!dragging || dragging.pointerId !== event.pointerId) {
        return;
      }
      event.preventDefault();
      state.zoom.translateX =
        dragging.translateX + event.clientX - dragging.startX;
      state.zoom.translateY =
        dragging.translateY + event.clientY - dragging.startY;
      applyZoom();
    });

    const endDrag = event => {
      if (state.zoom.dragging?.pointerId !== event.pointerId) {
        return;
      }
      state.zoom.dragging = null;
      elements.photoFrame.classList.remove("is-dragging");
      if (elements.photoImage.hasPointerCapture(event.pointerId)) {
        elements.photoImage.releasePointerCapture(event.pointerId);
      }
    };
    elements.photoImage.addEventListener("pointerup", endDrag);
    elements.photoImage.addEventListener("pointercancel", endDrag);

    elements.photoImage.addEventListener("dblclick", event => {
      if (!state.visible || state.modal) {
        return;
      }
      event.preventDefault();
      if (state.zoom.scale > 1.001) {
        resetZoom();
      } else {
        zoomAtPoint(event.clientX, event.clientY, 2);
      }
    });
  }

  function zoomAtCenter(factor) {
    if (!elements.photoFrame) {
      return;
    }
    const rect = elements.photoFrame.getBoundingClientRect();
    zoomAtPoint(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
      factor
    );
  }

  function zoomAtPoint(clientX, clientY, factor) {
    const rect = elements.photoFrame.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const cursorX = clientX - centerX;
    const cursorY = clientY - centerY;
    const oldScale = state.zoom.scale;
    const newScale = Math.max(1, oldScale * factor);

    if (!Number.isFinite(newScale)) {
      return;
    }
    if (newScale <= 1.001) {
      resetZoom();
      return;
    }

    const localX =
      (cursorX - state.zoom.translateX) / Math.max(oldScale, 0.000001);
    const localY =
      (cursorY - state.zoom.translateY) / Math.max(oldScale, 0.000001);
    state.zoom.scale = newScale;
    state.zoom.translateX = cursorX - localX * newScale;
    state.zoom.translateY = cursorY - localY * newScale;
    applyZoom();
  }

  function resetZoom() {
    state.zoom.scale = 1;
    state.zoom.translateX = 0;
    state.zoom.translateY = 0;
    state.zoom.dragging = null;
    applyZoom();
  }

  function applyZoom() {
    if (!elements?.photoImage) {
      return;
    }
    const { scale, translateX, translateY } = state.zoom;
    elements.photoImage.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    elements.zoomLabel.textContent = `${Math.round(scale * 100)}%`;
    elements.photoFrame.classList.toggle("is-zoomed", scale > 1.001);
    elements.zoomInstruction.classList.toggle("is-hidden", scale > 1.001);
  }

  async function mergeIntoPrevious() {
    const target = previousGroup();
    if (!target) {
      showToast("前面沒有可以合併的群組。");
      return;
    }
    if (target.photoCount >= MAX_GROUP_PHOTOS) {
      showToast(
        I18N.format("第 {group} 組已有 20 張照片。", {
          group: target.index + 1
        })
      );
      return;
    }
    await mergeIntoGroup(target.id);
  }

  async function setCurrentAsFirstGroup() {
    const photo = currentPhoto();
    if (!photo || state.busy) {
      return;
    }
    state.processedFileIds.add(photo.fileId);
    showToast("已設為第一組。");
    if (state.settings.autoAdvance) {
      await navigate(1);
    } else {
      render();
    }
  }

  async function mergeIntoGroup(targetGroupId) {
    const photo = currentPhoto();
    if (!photo || state.busy) {
      return;
    }

    const targetGroup = state.snapshot.groups.find(
      group => group.id === targetGroupId
    );
    if (!targetGroup) {
      showToast("目標群組已不存在，請重新掃描。", "error");
      return;
    }
    if (targetGroup.photoCount >= MAX_GROUP_PHOTOS) {
      showToast(
        I18N.format("第 {group} 組已有 20 張照片。", {
          group: targetGroup.index + 1
        }),
        "error"
      );
      return;
    }

    state.modal = null;
    renderModal();
    await runPhotoAction(
      "movePhoto",
      { fileId: photo.fileId, targetCardId: targetGroupId },
      "merged",
      "已合併到前面的群組。"
    );
  }

  async function separateCurrent() {
    const photo = currentPhoto();
    if (!photo || state.busy) {
      return;
    }
    if (photo.orderIndex === 0) {
      showToast("第一張照片不使用 Separate。");
      return;
    }

    await runPhotoAction(
      "separatePhoto",
      { fileId: photo.fileId },
      "separated",
      "已開新組。"
    );
  }

  function requestDelete() {
    const photo = currentPhoto();
    if (!photo || state.busy) {
      return;
    }

    if (!state.settings.confirmDelete) {
      deleteCurrent();
      return;
    }

    state.modal = { type: "delete", photo, enterArmed: false };
    renderModal();
  }

  async function confirmDeleteFromModal() {
    if (state.modal?.type !== "delete") {
      return;
    }

    const now = Date.now();
    if (
      !state.modal.enterArmed ||
      now > Number(state.modal.enterDeadline || 0)
    ) {
      state.modal.enterArmed = true;
      state.modal.enterDeadline = now + DELETE_CONFIRM_WINDOW_MS;
      window.clearTimeout(state.deleteArmTimer);
      state.deleteArmTimer = window.setTimeout(() => {
        if (state.modal?.type === "delete" && state.modal.enterArmed) {
          state.modal.enterArmed = false;
          state.modal.enterDeadline = 0;
          renderModal();
        }
      }, DELETE_CONFIRM_WINDOW_MS);
      renderModal();
      return;
    }

    window.clearTimeout(state.deleteArmTimer);
    state.deleteArmTimer = null;
    state.modal = null;
    renderModal();
    await deleteCurrent();
  }

  async function deleteCurrent() {
    const photo = currentPhoto();
    if (!photo || state.busy) {
      return;
    }
    await runPhotoAction(
      "deletePhoto",
      { fileId: photo.fileId },
      "deleted",
      "已從本次上傳草稿移除。"
    );
  }

  async function runPhotoAction(action, payload, countKey, successMessage) {
    state.busy = true;
    setActionBusy(true);

    try {
      const snapshot = await bridgeRequest(action, payload);
      state.snapshot = snapshot;
      state.processedFileIds.add(payload.fileId);
      state.counts[countKey] += 1;
      state.session.status = "active";
      showToast(successMessage);

      if (state.settings.autoAdvance) {
        state.currentIndex += 1;
        repairCurrentIndex();
        if (state.currentIndex >= state.session.queue.length) {
          state.session.status = "complete";
          showSummary();
        } else {
          render();
        }
      } else {
        repairCurrentIndex();
        if (currentPhoto()) {
          render();
        } else {
          showSummary();
        }
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : String(error), "error");
    } finally {
      state.busy = false;
      elements.shell.classList.remove("is-busy");
      if (
        state.session?.status === "active" &&
        currentPhoto() &&
        !elements.triageMain.hidden
      ) {
        render();
      }
    }
  }

  function setActionBusy(busy) {
    for (const button of [
      elements.mergeButton,
      elements.firstGroupButton,
      elements.separateButton,
      elements.deleteButton,
      elements.groupsButton,
      elements.editButton,
      elements.uploadSourceButton,
      elements.loadSourceButton,
      elements.previousButton,
      elements.nextButton
    ]) {
      if (button) {
        button.disabled = busy;
      }
    }
    elements.shell.classList.toggle("is-busy", busy);
  }

  function openGroupPicker() {
    const photo = currentPhoto();
    const groups = earlierGroups();
    if (!photo || !groups.length) {
      showToast("前面沒有較早的群組。");
      return;
    }

    state.modal = { type: "groups", groups, photo };
    renderModal();
  }

  function renderModal() {
    if (!state.modal) {
      elements.modalLayer.hidden = true;
      elements.modalCard.replaceChildren();
      elements.modalCard.className = "modal-card";
      return;
    }

    elements.modalLayer.hidden = false;
    elements.modalCard.replaceChildren();
    elements.modalCard.className = "modal-card";

    if (state.modal.type === "delete") {
      renderDeleteModal(state.modal.photo);
    } else if (state.modal.type === "groups") {
      renderGroupModal(state.modal.groups, state.modal.photo);
    } else if (state.modal.type === "crop") {
      elements.modalCard.classList.add("crop-modal-card");
      renderCropModal(state.modal.photo, state.modal.entry);
    } else if (state.modal.type === "color") {
      elements.modalCard.classList.add("color-modal-card");
      renderColorModal(state.modal.photo, state.modal.entry);
    } else if (state.modal.type === "edit") {
      elements.modalCard.classList.add("combined-editor-card");
      renderCombinedEditor(state.modal);
    }
    I18N.translateDom(elements.modalCard);
  }

  function openCropEditor() {
    openCombinedEditor("crop");
  }

  function openCombinedEditor(activeTool = "crop") {
    const photo = currentPhoto();
    const entry = photo
      ? state.localByPhotoId.get(photo.fileId)
      : null;
    if (!photo || !entry) {
      showToast("請先載入這張照片的本機原圖。", "error");
      return;
    }
    if (!entry.decodable) {
      showToast(
        "這個格式無法在瀏覽器中預覽或裁切，但仍可由插件直接上傳。",
        "error"
      );
      return;
    }
    state.crop = null;
    state.color = null;
    state.modal = { type: "edit", photo, entry, activeTool };
    renderModal();
  }

  function renderCombinedEditor(modal) {
    const title = document.createElement("h2");
    title.textContent = "編輯照片";

    const tabs = document.createElement("div");
    tabs.className = "combined-editor-tabs";
    for (const [tool, label] of [
      ["crop", "裁切"],
      ["color", "調色"]
    ]) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "combined-editor-tab";
      button.dataset.command = "edit-tool";
      button.dataset.editTool = tool;
      button.classList.toggle("is-active", modal.activeTool === tool);
      button.textContent = I18N.t(label);
      tabs.appendChild(button);
    }

    const cropPanel = document.createElement("div");
    cropPanel.className = "combined-tool-panel combined-tool-crop";
    cropPanel.hidden = modal.activeTool !== "crop";

    const colorPanel = document.createElement("div");
    colorPanel.className = "combined-tool-panel combined-tool-color";
    colorPanel.hidden = modal.activeTool !== "color";

    elements.modalCard.append(title, tabs, cropPanel, colorPanel);
    renderCropModal(modal.photo, modal.entry, {
      container: cropPanel,
      embedded: true
    });
    renderColorModal(modal.photo, modal.entry, {
      container: colorPanel,
      embedded: true
    });
  }

  function switchEditTool(tool) {
    if (!state.modal || !["crop", "color"].includes(tool)) {
      return;
    }
    state.modal.activeTool = tool;
    for (const button of elements.modalCard.querySelectorAll(
      "[data-command='edit-tool']"
    )) {
      button.classList.toggle("is-active", button.dataset.editTool === tool);
    }
    const cropPanel = elements.modalCard.querySelector(".combined-tool-crop");
    const colorPanel = elements.modalCard.querySelector(".combined-tool-color");
    if (cropPanel) {
      cropPanel.hidden = tool !== "crop";
    }
    if (colorPanel) {
      colorPanel.hidden = tool !== "color";
    }
    if (tool === "color") {
      drawColorCurve();
    }
  }

  function setupEditorZoom(viewport, stage) {
    const zoom = {
      scale: 1,
      translateX: 0,
      translateY: 0,
      drag: null
    };
    stage.style.transformOrigin = "center center";
    viewport.style.touchAction = "none";

    const toolbar = document.createElement("div");
    toolbar.className = "editor-zoom-toolbar";
    const out = document.createElement("button");
    out.type = "button";
    out.textContent = "−";
    out.title = I18N.t("縮小");
    out.setAttribute("aria-label", I18N.t("縮小"));
    const readout = document.createElement("button");
    readout.type = "button";
    readout.className = "editor-zoom-readout";
    readout.textContent = "100%";
    readout.title = I18N.t("重設縮放");
    readout.setAttribute("aria-label", I18N.t("重設縮放"));
    const inside = document.createElement("button");
    inside.type = "button";
    inside.textContent = "+";
    inside.title = I18N.t("放大");
    inside.setAttribute("aria-label", I18N.t("放大"));
    toolbar.append(out, readout, inside);
    viewport.appendChild(toolbar);

    const apply = () => {
      stage.style.transform = `translate(${zoom.translateX}px, ${zoom.translateY}px) scale(${zoom.scale})`;
      readout.textContent = `${Math.round(zoom.scale * 100)}%`;
      viewport.classList.toggle("is-zoomed", zoom.scale > 1.001);
    };

    const zoomAtPoint = (clientX, clientY, factor) => {
      const rect = viewport.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const cursorX = clientX - centerX;
      const cursorY = clientY - centerY;
      const oldScale = zoom.scale;
      const nextScale = Math.max(1, oldScale * factor);
      if (!Number.isFinite(nextScale)) {
        return;
      }
      if (nextScale <= 1.001) {
        reset();
        return;
      }
      const localX =
        (cursorX - zoom.translateX) / Math.max(oldScale, 0.000001);
      const localY =
        (cursorY - zoom.translateY) / Math.max(oldScale, 0.000001);
      zoom.scale = nextScale;
      zoom.translateX = cursorX - localX * nextScale;
      zoom.translateY = cursorY - localY * nextScale;
      apply();
    };

    const zoomCenter = factor => {
      const rect = viewport.getBoundingClientRect();
      zoomAtPoint(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        factor
      );
    };

    const reset = () => {
      zoom.scale = 1;
      zoom.translateX = 0;
      zoom.translateY = 0;
      zoom.drag = null;
      apply();
    };

    out.addEventListener("click", event => {
      event.stopPropagation();
      zoomCenter(1 / 1.35);
    });
    inside.addEventListener("click", event => {
      event.stopPropagation();
      zoomCenter(1.35);
    });
    readout.addEventListener("click", event => {
      event.stopPropagation();
      reset();
    });

    viewport.addEventListener(
      "wheel",
      event => {
        event.preventDefault();
        zoomAtPoint(
          event.clientX,
          event.clientY,
          Math.exp(-event.deltaY * 0.0016)
        );
      },
      { passive: false }
    );

    viewport.addEventListener("pointerdown", event => {
      if (
        event.button !== 0 ||
        zoom.scale <= 1 ||
        event.target.closest(".crop-selection, .editor-zoom-toolbar")
      ) {
        return;
      }
      zoom.drag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        baseX: zoom.translateX,
        baseY: zoom.translateY
      };
      viewport.classList.add("is-panning");
      viewport.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    viewport.addEventListener("pointermove", event => {
      if (!zoom.drag || zoom.drag.pointerId !== event.pointerId) {
        return;
      }
      zoom.translateX =
        zoom.drag.baseX + event.clientX - zoom.drag.startX;
      zoom.translateY =
        zoom.drag.baseY + event.clientY - zoom.drag.startY;
      apply();
      event.preventDefault();
    });
    const endPan = event => {
      if (!zoom.drag || zoom.drag.pointerId !== event.pointerId) {
        return;
      }
      zoom.drag = null;
      viewport.classList.remove("is-panning");
      if (viewport.hasPointerCapture(event.pointerId)) {
        viewport.releasePointerCapture(event.pointerId);
      }
    };
    viewport.addEventListener("pointerup", endPan);
    viewport.addEventListener("pointercancel", endPan);

    apply();
    return {
      toolbar,
      reset,
      getScale: () => zoom.scale
    };
  }

  function renderCropModal(
    photo,
    entry,
    { container = elements.modalCard, embedded = false } = {}
  ) {
    const title = document.createElement("h2");
    title.textContent = "裁切本機原圖";

    const copy = document.createElement("p");
    copy.className = "modal-copy";
    copy.textContent = I18N.format(
      "來源：{name} · {width}×{height}。套用後會直接把目前照片改成裁切版；本機原檔不會被刪除。",
      {
        name: entry.file.name,
        width: entry.width,
        height: entry.height
      }
    );

    const workspace = document.createElement("div");
    workspace.className = "crop-workspace";

    const image = document.createElement("img");
    image.className = "crop-source-image";
    image.src = entry.url;
    image.alt = entry.file.name;
    image.draggable = false;

    const selection = document.createElement("div");
    selection.className = "crop-selection";
    for (const handle of ["nw", "ne", "sw", "se"]) {
      const grip = document.createElement("span");
      grip.className = `crop-handle crop-handle-${handle}`;
      grip.dataset.cropHandle = handle;
      selection.appendChild(grip);
    }

    const zoomStage = document.createElement("div");
    zoomStage.className = "crop-zoom-stage";
    zoomStage.append(image, selection);
    workspace.append(zoomStage);
    const zoomController = setupEditorZoom(workspace, zoomStage);

    const controls = document.createElement("div");
    controls.className = "crop-controls";
    const sizeLabel = document.createElement("span");
    sizeLabel.className = "crop-size-label";
    sizeLabel.textContent = "拖曳選取裁切範圍";
    const qualityLabel = document.createElement("span");
    qualityLabel.textContent =
      entry.file.type === "image/png"
        ? "輸出：PNG 無損"
        : "輸出：JPEG 98%";
    controls.append(sizeLabel, qualityLabel);

    const actions = document.createElement("div");
    actions.className = "modal-actions crop-actions";

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "ghost-button";
    cancel.dataset.command = "close-modal";
    cancel.textContent = "取消";

    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "ghost-button";
    reset.dataset.command = "reset-crop";
    reset.textContent = "重設範圍";

    const confirm = document.createElement("button");
    confirm.type = "button";
    confirm.className = "solid-button crop-confirm-button";
    confirm.dataset.command = "confirm-crop";
    confirm.textContent = "套用裁切";

    actions.append(cancel, reset, confirm);
    if (!embedded) {
      container.append(title);
    }
    container.append(copy, workspace, controls, actions);

    state.crop = {
      photo,
      entry,
      image,
      workspace,
      selection,
      display: null,
      rect: null,
      drag: null,
      zoomController
    };

    const initialize = () => initializeCropSelection();
    image.addEventListener("load", initialize, { once: true });
    image.addEventListener(
      "error",
      () => showToast("無法載入本機原圖。", "error"),
      { once: true }
    );
    if (image.complete && image.naturalWidth) {
      requestAnimationFrame(initialize);
    }
  }

  function initializeCropSelection() {
    const crop = state.crop;
    if (crop?.display) {
      return;
    }
    if (!crop?.image?.clientWidth || !crop?.image?.clientHeight) {
      return;
    }
    crop.display = {
      width: crop.image.clientWidth,
      height: crop.image.clientHeight,
      left: crop.image.offsetLeft,
      top: crop.image.offsetTop
    };
    crop.rect = {
      x: crop.display.width * 0.1,
      y: crop.display.height * 0.1,
      width: crop.display.width * 0.8,
      height: crop.display.height * 0.8
    };
    crop.selection.addEventListener("pointerdown", startCropDrag);
    crop.selection.addEventListener("pointermove", moveCropDrag);
    crop.selection.addEventListener("pointerup", endCropDrag);
    crop.selection.addEventListener("pointercancel", endCropDrag);
    positionCropSelection();
  }

  function startCropDrag(event) {
    const crop = state.crop;
    if (!crop?.rect || event.button !== 0) {
      return;
    }
    const target =
      event.target instanceof Element
        ? event.target.closest("[data-crop-handle]")
        : null;
    crop.drag = {
      pointerId: event.pointerId,
      mode: target?.dataset.cropHandle || "move",
      startX: event.clientX,
      startY: event.clientY,
      rect: { ...crop.rect }
    };
    crop.selection.setPointerCapture(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  }

  function moveCropDrag(event) {
    const crop = state.crop;
    const drag = crop?.drag;
    if (!drag || drag.pointerId !== event.pointerId || !crop.rect) {
      return;
    }
    const zoomScale = crop.zoomController?.getScale() || 1;
    const dx = (event.clientX - drag.startX) / zoomScale;
    const dy = (event.clientY - drag.startY) / zoomScale;
    crop.rect = resizeCropRect(
      drag.rect,
      drag.mode,
      dx,
      dy,
      crop.display
    );
    positionCropSelection();
    event.preventDefault();
  }

  function endCropDrag(event) {
    const crop = state.crop;
    if (crop?.drag?.pointerId !== event.pointerId) {
      return;
    }
    crop.drag = null;
    if (crop.selection.hasPointerCapture(event.pointerId)) {
      crop.selection.releasePointerCapture(event.pointerId);
    }
  }

  function resizeCropRect(start, mode, dx, dy, bounds) {
    const minSize = 24;
    let { x, y, width, height } = start;

    if (mode === "move") {
      x = clamp(x + dx, 0, bounds.width - width);
      y = clamp(y + dy, 0, bounds.height - height);
      return { x, y, width, height };
    }

    if (mode.includes("w")) {
      const right = x + width;
      x = clamp(x + dx, 0, right - minSize);
      width = right - x;
    }
    if (mode.includes("e")) {
      width = clamp(width + dx, minSize, bounds.width - x);
    }
    if (mode.includes("n")) {
      const bottom = y + height;
      y = clamp(y + dy, 0, bottom - minSize);
      height = bottom - y;
    }
    if (mode.includes("s")) {
      height = clamp(height + dy, minSize, bounds.height - y);
    }
    return { x, y, width, height };
  }

  function positionCropSelection() {
    const crop = state.crop;
    if (!crop?.rect || !crop.display) {
      return;
    }
    crop.selection.style.left = `${crop.display.left + crop.rect.x}px`;
    crop.selection.style.top = `${crop.display.top + crop.rect.y}px`;
    crop.selection.style.width = `${crop.rect.width}px`;
    crop.selection.style.height = `${crop.rect.height}px`;

    const label = elements.modalCard.querySelector(".crop-size-label");
    if (label) {
      const width = Math.max(
        1,
        Math.round(
          (crop.rect.width / crop.display.width) *
            crop.image.naturalWidth
        )
      );
      const height = Math.max(
        1,
        Math.round(
          (crop.rect.height / crop.display.height) *
            crop.image.naturalHeight
        )
      );
      label.textContent = I18N.format(
        "輸出尺寸：{width}×{height} px",
        { width, height }
      );
    }
  }

  function resetCropSelection() {
    const crop = state.crop;
    if (!crop?.display) {
      return;
    }
    crop.rect = {
      x: crop.display.width * 0.1,
      y: crop.display.height * 0.1,
      width: crop.display.width * 0.8,
      height: crop.display.height * 0.8
    };
    positionCropSelection();
  }

  async function applyCropAndUpload() {
    const crop = state.crop;
    if (!crop?.rect || !crop.display || state.busy) {
      return;
    }

    const sourceWidth = crop.image.naturalWidth;
    const sourceHeight = crop.image.naturalHeight;
    const sourceX = (crop.rect.x / crop.display.width) * sourceWidth;
    const sourceY = (crop.rect.y / crop.display.height) * sourceHeight;
    const croppedWidth =
      (crop.rect.width / crop.display.width) * sourceWidth;
    const croppedHeight =
      (crop.rect.height / crop.display.height) * sourceHeight;

    let outputWidth = Math.max(1, Math.round(croppedWidth));
    let outputHeight = Math.max(1, Math.round(croppedHeight));
    const maxDimension = 16384;
    const scale = Math.min(
      1,
      maxDimension / Math.max(outputWidth, outputHeight)
    );
    outputWidth = Math.max(1, Math.round(outputWidth * scale));
    outputHeight = Math.max(1, Math.round(outputHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const context = canvas.getContext("2d");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(
      crop.image,
      sourceX,
      sourceY,
      croppedWidth,
      croppedHeight,
      0,
      0,
      outputWidth,
      outputHeight
    );

    const outputType =
      crop.entry.file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob = await new Promise(resolve =>
      canvas.toBlob(
        resolve,
        outputType,
        outputType === "image/jpeg" ? CROP_JPEG_QUALITY : undefined
      )
    );
    if (!blob) {
      showToast("無法產生裁切照片。", "error");
      return;
    }

    const extension = outputType === "image/png" ? "png" : "jpg";
    const baseName = crop.entry.file.name.replace(/\.[^.]+$/, "");
    const timestamp = Date.now();
    const fileName = `${baseName}-crop-${timestamp}.${extension}`;
    await replaceCurrentPhotoWithBlob({
      photo: crop.photo,
      blob,
      fileName,
      type: outputType,
      width: outputWidth,
      height: outputHeight,
      progressMessage: "正在套用裁切…",
      successMessage: "已套用裁切，可以繼續整理。"
    });
  }

  async function replaceCurrentPhotoWithBlob({
    photo,
    blob,
    fileName,
    type,
    width,
    height,
    progressMessage,
    successMessage
  }) {
    if (!photo || state.busy) {
      return false;
    }

    const originalEntry = state.localByPhotoId.get(photo.fileId) || null;
    const originalFileId = photo.fileId;
    const file = new File([blob], fileName, {
      type,
      lastModified: Date.now()
    });
    const previewUrl = URL.createObjectURL(blob);
    const newEntry = {
      file,
      url: previewUrl,
      width,
      height,
      decodable: true
    };

    state.localByPhotoId.set(originalFileId, newEntry);
    state.modal = null;
    state.crop = null;
    state.color = null;
    renderModal();
    state.zoom.photoId = null;
    resetZoom();
    render();

    state.busy = true;
    setActionBusy(true);
    showToast(progressMessage);

    try {
      const arrayBuffer = await blob.arrayBuffer();
      const snapshot = await bridgeRequest(
        "addCroppedPhoto",
        {
          fileId: originalFileId,
          arrayBuffer,
          name: fileName,
          type
        },
        125000
      );
      const uploadedFileId = snapshot.uploadedFileId;
      if (!uploadedFileId) {
        throw new Error("照片已處理，但找不到新的照片項目。");
      }

      if (state.session) {
        state.session.queue = state.session.queue.map(fileId =>
          fileId === originalFileId ? uploadedFileId : fileId
        );
        if (state.processedFileIds.delete(originalFileId)) {
          state.processedFileIds.add(uploadedFileId);
        }
      }
      appendLocalEntries([newEntry]);
      state.snapshot = snapshot;
      matchLocalFilesToPhotos();
      render();
      showToast(successMessage);
      return true;
    } catch (error) {
      URL.revokeObjectURL(previewUrl);
      state.localEntries = state.localEntries.filter(
        entry => entry !== newEntry
      );
      if (originalEntry) {
        state.localByPhotoId.set(originalFileId, originalEntry);
      } else {
        state.localByPhotoId.delete(originalFileId);
      }
      render();
      showToast(
        error instanceof Error ? error.message : String(error),
        "error"
      );
      return false;
    } finally {
      state.busy = false;
      elements.shell.classList.remove("is-busy");
      if (currentPhoto() && !elements.triageMain.hidden) {
        render();
      }
    }
  }

  function openColorEditor() {
    openCombinedEditor("color");
  }

  function renderColorModal(
    photo,
    entry,
    { container = elements.modalCard, embedded = false } = {}
  ) {
    const adjustments = {};
    for (const adjustment of COLOR_ADJUSTMENTS) {
      adjustments[adjustment.key] = 0;
    }

    const title = document.createElement("h2");
    title.textContent = "調整顏色";
    const copy = document.createElement("p");
    copy.className = "modal-copy";
    copy.textContent = I18N.format(
      "使用本機原檔即時調整；套用後會替換目前照片，本機原檔不變。",
      {}
    );

    const layout = document.createElement("div");
    layout.className = "color-editor-layout";

    const previewPane = document.createElement("section");
    previewPane.className = "color-preview-pane";
    const previewCanvas = document.createElement("canvas");
    previewCanvas.className = "color-preview-canvas";
    const previewViewport = document.createElement("div");
    previewViewport.className = "color-preview-viewport";
    previewViewport.appendChild(previewCanvas);
    const previewZoom = setupEditorZoom(
      previewViewport,
      previewCanvas
    );
    const histogram = document.createElement("canvas");
    histogram.className = "color-mini-histogram";
    histogram.width = 512;
    histogram.height = 180;
    const compareButton = document.createElement("button");
    compareButton.type = "button";
    compareButton.className = "color-compare-button";
    compareButton.textContent = I18N.t("按住查看原圖");
    const histogramCard = document.createElement("div");
    histogramCard.className = "color-histogram-card";
    const histogramLabel = document.createElement("span");
    histogramLabel.textContent = I18N.t("直方圖");
    histogramCard.append(histogramLabel, histogram);
    previewPane.append(
      previewViewport,
      compareButton,
      histogramCard
    );

    const controls = document.createElement("aside");
    controls.className = "color-controls";

    const tabs = document.createElement("div");
    tabs.className = "color-tabs";
    for (const [tab, label] of [
      ["basic", "基本"],
      ["curves", "曲線"]
    ]) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.command = "color-tab";
      button.dataset.colorTab = tab;
      button.className = `color-tab${tab === "basic" ? " is-active" : ""}`;
      button.textContent = I18N.t(label);
      tabs.appendChild(button);
    }
    controls.appendChild(tabs);

    const basicPanel = document.createElement("div");
    basicPanel.className = "color-panel color-panel-basic";
    addColorGroup(basicPanel, "光線", COLOR_ADJUSTMENTS.slice(0, 6), adjustments);
    addColorGroup(basicPanel, "顏色", COLOR_ADJUSTMENTS.slice(6), adjustments);
    controls.appendChild(basicPanel);

    const curvePanel = document.createElement("div");
    curvePanel.className = "color-panel color-panel-curves";
    curvePanel.hidden = true;

    const channelButtons = document.createElement("div");
    channelButtons.className = "curve-channel-buttons";
    for (const channel of [
      ["rgb", "RGB"],
      ["r", "R"],
      ["g", "G"],
      ["b", "B"]
    ]) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.command = "curve-channel";
      button.dataset.channel = channel[0];
      button.className = `curve-channel${
        channel[0] === "rgb" ? " is-active" : ""
      }`;
      button.textContent = channel[1];
      channelButtons.appendChild(button);
    }
    curvePanel.appendChild(channelButtons);

    const curveCanvas = document.createElement("canvas");
    curveCanvas.className = "color-curve-canvas";
    curveCanvas.width = 840;
    curveCanvas.height = 520;
    curvePanel.appendChild(curveCanvas);

    const curveHint = document.createElement("p");
    curveHint.className = "curve-hint";
    curveHint.textContent =
      "點擊新增控制點，拖曳調整曲線，右鍵刪除控制點。";
    curvePanel.appendChild(curveHint);
    controls.appendChild(curvePanel);

    layout.append(previewPane, controls);

    const actions = document.createElement("div");
    actions.className = "modal-actions color-actions";
    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "ghost-button";
    reset.dataset.command = "reset-color";
    reset.textContent = "重設全部";
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "ghost-button";
    cancel.dataset.command = "close-modal";
    cancel.textContent = "取消";
    const apply = document.createElement("button");
    apply.type = "button";
    apply.className = "solid-button";
    apply.dataset.command = "confirm-color";
    apply.textContent = "套用調色";

    const actionRight = document.createElement("div");
    actionRight.className = "color-action-right";
    actionRight.append(cancel, apply);
    actions.append(reset, actionRight);

    if (!embedded) {
      container.append(title);
    }
    container.append(copy, layout, actions);

    const linear = () => [
      [0, 0],
      [1, 1]
    ];
    state.color = {
      photo,
      entry,
      image: null,
      previewCanvas,
      previewViewport,
      previewZoom,
      previewContext: null,
      histogramCanvas: histogram,
      curveCanvas,
      adjustments,
      curves: {
        rgb: linear(),
        r: linear(),
        g: linear(),
        b: linear()
      },
      activeChannel: "rgb",
      activeTab: "basic",
      dragPoint: null,
      basePixels: null,
      previewWidth: 0,
      previewHeight: 0,
      histograms: null,
      renderedImageData: null,
      renderTimer: null,
      applying: false
    };

    const image = new Image();
    image.decoding = "async";
    image.onload = () => initializeColorEditor(image);
    image.onerror = () =>
      showToast("無法載入本機原圖。", "error");
    image.src = entry.url;

    attachCurveEvents(curveCanvas);
    compareButton.addEventListener("pointerdown", event => {
      const activeColor = state.color;
      if (
        !activeColor?.basePixels ||
        !activeColor.previewContext
      ) {
        return;
      }
      event.preventDefault();
      activeColor.previewContext.putImageData(
        new ImageData(
          new Uint8ClampedArray(activeColor.basePixels),
          activeColor.previewWidth,
          activeColor.previewHeight
        ),
        0,
        0
      );
      compareButton.classList.add("is-pressed");
    });
    const restoreAdjustedPreview = () => {
      const activeColor = state.color;
      if (
        activeColor?.renderedImageData &&
        activeColor.previewContext
      ) {
        activeColor.previewContext.putImageData(
          activeColor.renderedImageData,
          0,
          0
        );
      }
      compareButton.classList.remove("is-pressed");
    };
    compareButton.addEventListener("pointerup", restoreAdjustedPreview);
    compareButton.addEventListener("pointercancel", restoreAdjustedPreview);
    compareButton.addEventListener("pointerleave", restoreAdjustedPreview);
    I18N.translateDom(elements.modalCard);
  }

  function addColorGroup(panel, headingText, adjustments, values) {
    const group = document.createElement("div");
    group.className = "color-adjustment-group";
    const heading = document.createElement("h3");
    heading.textContent = I18N.t(headingText);
    group.appendChild(heading);

    for (const adjustment of adjustments) {
      const row = document.createElement("label");
      row.className = "color-slider-row";
      const top = document.createElement("span");
      top.className = "color-slider-top";
      const name = document.createElement("strong");
      name.textContent = I18N.t(adjustment.label);
      const value = document.createElement("span");
      value.className = "color-slider-value";
      value.textContent = formatColorValue(
        adjustment,
        values[adjustment.key]
      );
      top.append(name, value);

      const range = document.createElement("input");
      range.type = "range";
      range.min = String(adjustment.min);
      range.max = String(adjustment.max);
      range.step = String(adjustment.step);
      range.value = String(values[adjustment.key]);
      range.dataset.adjustment = adjustment.key;
      range.title = I18N.t("雙擊重設");
      range.addEventListener("input", () => {
        if (!state.color) {
          return;
        }
        values[adjustment.key] = Number(range.value);
        value.textContent = formatColorValue(
          adjustment,
          values[adjustment.key]
        );
        scheduleColorPreview();
      });
      range.addEventListener("dblclick", () => {
        if (!state.color) {
          return;
        }
        values[adjustment.key] = 0;
        range.value = "0";
        value.textContent = formatColorValue(adjustment, 0);
        scheduleColorPreview();
      });

      row.append(top, range);
      group.appendChild(row);
    }
    panel.appendChild(group);
  }

  function formatColorValue(adjustment, value) {
    if (adjustment.key === "exposure") {
      return `${value >= 0 ? "+" : ""}${Number(value).toFixed(2)} EV`;
    }
    return `${value > 0 ? "+" : ""}${Math.round(value)}`;
  }

  function initializeColorEditor(image) {
    const color = state.color;
    if (!color || color.image !== null) {
      return;
    }

    const maxWidth = 860;
    const maxHeight = 580;
    const scale = Math.min(
      1,
      maxWidth / image.naturalWidth,
      maxHeight / image.naturalHeight
    );
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    color.previewCanvas.width = width;
    color.previewCanvas.height = height;
    const context = color.previewCanvas.getContext("2d", {
      willReadFrequently: true
    });
    context.drawImage(image, 0, 0, width, height);
    const imageData = context.getImageData(0, 0, width, height);

    color.image = image;
    color.previewContext = context;
    color.previewWidth = width;
    color.previewHeight = height;
    color.basePixels = new Uint8ClampedArray(imageData.data);
    scheduleColorPreview();
  }

  function switchColorTab(tab) {
    const color = state.color;
    if (!color || !["basic", "curves"].includes(tab)) {
      return;
    }
    color.activeTab = tab;
    for (const button of elements.modalCard.querySelectorAll(
      "[data-command='color-tab']"
    )) {
      button.classList.toggle("is-active", button.dataset.colorTab === tab);
    }
    const basic = elements.modalCard.querySelector(".color-panel-basic");
    const curves = elements.modalCard.querySelector(".color-panel-curves");
    if (basic) {
      basic.hidden = tab !== "basic";
    }
    if (curves) {
      curves.hidden = tab !== "curves";
    }
    if (tab === "curves") {
      drawColorCurve();
    }
  }

  function switchCurveChannel(channel) {
    const color = state.color;
    if (!color || !["rgb", "r", "g", "b"].includes(channel)) {
      return;
    }
    color.activeChannel = channel;
    for (const button of elements.modalCard.querySelectorAll(
      "[data-command='curve-channel']"
    )) {
      button.classList.toggle(
        "is-active",
        button.dataset.channel === channel
      );
    }
    drawColorCurve();
  }

  function resetColorAdjustments() {
    const color = state.color;
    if (!color) {
      return;
    }
    for (const adjustment of COLOR_ADJUSTMENTS) {
      color.adjustments[adjustment.key] = 0;
    }
    for (const channel of ["rgb", "r", "g", "b"]) {
      color.curves[channel] = [
        [0, 0],
        [1, 1]
      ];
    }
    for (const input of elements.modalCard.querySelectorAll(
      "[data-adjustment]"
    )) {
      input.value = "0";
      const adjustment = COLOR_ADJUSTMENTS.find(
        item => item.key === input.dataset.adjustment
      );
      const label = input
        .closest(".color-slider-row")
        ?.querySelector(".color-slider-value");
      if (adjustment && label) {
        label.textContent = formatColorValue(adjustment, 0);
      }
    }
    drawColorCurve();
    scheduleColorPreview();
  }

  function attachCurveEvents(canvas) {
    canvas.addEventListener("pointerdown", event => {
      const color = state.color;
      if (!color?.image || event.button !== 0) {
        return;
      }
      const point = eventCurvePoint(event, canvas);
      const points = color.curves[color.activeChannel];
      const nearest = nearestCurvePoint(points, point);
      if (nearest) {
        color.dragPoint = nearest.index;
      } else {
        const index = points.findIndex(item => item[0] > point.x);
        const insertAt = index === -1 ? points.length - 1 : index;
        points.splice(insertAt, 0, [point.x, point.y]);
        color.dragPoint = insertAt;
      }
      canvas.setPointerCapture(event.pointerId);
      color.dragPointerId = event.pointerId;
      updateDraggedCurvePoint(point, points, color.dragPoint);
      event.preventDefault();
    });

    canvas.addEventListener("pointermove", event => {
      const color = state.color;
      if (
        !color ||
        color.dragPoint === null ||
        color.dragPointerId !== event.pointerId
      ) {
        return;
      }
      const point = eventCurvePoint(event, canvas);
      updateDraggedCurvePoint(
        point,
        color.curves[color.activeChannel],
        color.dragPoint
      );
      event.preventDefault();
    });

    const end = event => {
      const color = state.color;
      if (!color || color.dragPointerId !== event.pointerId) {
        return;
      }
      color.dragPoint = null;
      color.dragPointerId = null;
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    };
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);

    canvas.addEventListener("contextmenu", event => {
      const color = state.color;
      if (!color?.image) {
        return;
      }
      event.preventDefault();
      const point = eventCurvePoint(event, canvas);
      const points = color.curves[color.activeChannel];
      const nearest = nearestCurvePoint(points, point);
      if (
        nearest &&
        nearest.index !== 0 &&
        nearest.index !== points.length - 1
      ) {
        points.splice(nearest.index, 1);
        drawColorCurve();
        scheduleColorPreview();
      }
    });
  }

  function eventCurvePoint(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: clamp((event.clientX - rect.left) / rect.width, 0, 1),
      y: clamp(1 - (event.clientY - rect.top) / rect.height, 0, 1)
    };
  }

  function nearestCurvePoint(points, point) {
    let best = null;
    let bestDistance = Infinity;
    points.forEach((item, index) => {
      const distance = Math.hypot(item[0] - point.x, item[1] - point.y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = { index, distance };
      }
    });
    return bestDistance <= 0.045 ? best : null;
  }

  function updateDraggedCurvePoint(point, points, index) {
    if (!points[index]) {
      return;
    }
    const isFirst = index === 0;
    const isLast = index === points.length - 1;
    let x = point.x;
    if (isFirst) {
      x = 0;
    } else if (isLast) {
      x = 1;
    } else {
      x = clamp(
        x,
        points[index - 1][0] + 0.005,
        points[index + 1][0] - 0.005
      );
    }
    points[index] = [x, clamp(point.y, 0, 1)];
    drawColorCurve();
    scheduleColorPreview();
  }

  function scheduleColorPreview() {
    const color = state.color;
    if (!color?.basePixels) {
      return;
    }
    window.clearTimeout(color.renderTimer);
    color.renderTimer = window.setTimeout(renderColorPreview, 35);
  }

  function renderColorPreview() {
    const color = state.color;
    if (!color?.basePixels || !color.previewContext) {
      return;
    }
    const imageData = new ImageData(
      new Uint8ClampedArray(color.basePixels),
      color.previewWidth,
      color.previewHeight
    );
    const histograms = applyColorPixels(
      imageData,
      color.adjustments,
      color.curves,
      true
    );
    color.previewContext.putImageData(imageData, 0, 0);
    color.renderedImageData = imageData;
    color.histograms = histograms;
    drawMiniHistogram();
    if (color.activeTab === "curves") {
      drawColorCurve();
    }
  }

  function buildCurveLut(points) {
    const sorted = points
      .map(point => [point[0], point[1]])
      .sort((a, b) => a[0] - b[0]);
    if (sorted.length < 2) {
      return new Uint8Array(
        Array.from({ length: 256 }, (_, index) => index)
      );
    }
    if (sorted[0][0] > 0) {
      sorted.unshift([0, sorted[0][1]]);
    }
    if (sorted[sorted.length - 1][0] < 1) {
      sorted.push([1, sorted[sorted.length - 1][1]]);
    }

    const n = sorted.length;
    const h = new Array(n - 1);
    const delta = new Array(n - 1);
    for (let i = 0; i < n - 1; i += 1) {
      h[i] = Math.max(0.000001, sorted[i + 1][0] - sorted[i][0]);
      delta[i] = (sorted[i + 1][1] - sorted[i][1]) / h[i];
    }
    const slopes = new Array(n).fill(0);
    slopes[0] = delta[0] || 0;
    slopes[n - 1] = delta[n - 2] || 0;
    for (let i = 1; i < n - 1; i += 1) {
      if (delta[i - 1] * delta[i] <= 0) {
        slopes[i] = 0;
      } else {
        const w1 = 2 * h[i] + h[i - 1];
        const w2 = h[i] + 2 * h[i - 1];
        slopes[i] =
          (w1 + w2) /
          (w1 / delta[i - 1] + w2 / delta[i]);
      }
    }

    const lut = new Uint8Array(256);
    let segment = 0;
    for (let x = 0; x < 256; x += 1) {
      const nx = x / 255;
      while (
        segment < n - 2 &&
        nx > sorted[segment + 1][0]
      ) {
        segment += 1;
      }
      const x0 = sorted[segment][0];
      const x1 = sorted[segment + 1][0];
      const t = (nx - x0) / Math.max(0.000001, x1 - x0);
      const t2 = t * t;
      const t3 = t2 * t;
      const y =
        (2 * t3 - 3 * t2 + 1) * sorted[segment][1] +
        (t3 - 2 * t2 + t) * h[segment] * slopes[segment] +
        (-2 * t3 + 3 * t2) * sorted[segment + 1][1] +
        (t3 - t2) * h[segment] * slopes[segment + 1];
      lut[x] = Math.round(clamp(y, 0, 1) * 255);
    }
    return lut;
  }

  function applyColorPixels(imageData, adjustments, curves, wantHistogram) {
    const data = imageData.data;
    const rgbLut = buildCurveLut(curves.rgb);
    const rLut = buildCurveLut(curves.r);
    const gLut = buildCurveLut(curves.g);
    const bLut = buildCurveLut(curves.b);
    const exposure = 2 ** Number(adjustments.exposure || 0);
    const contrast = 1 + Number(adjustments.contrast || 0) / 100;
    const highlights = Number(adjustments.highlights || 0) / 100;
    const shadows = Number(adjustments.shadows || 0) / 100;
    const whites = Number(adjustments.whites || 0) / 100;
    const blacks = Number(adjustments.blacks || 0) / 100;
    const temperature = Number(adjustments.temperature || 0) / 100;
    const tint = Number(adjustments.tint || 0) / 100;
    const saturation = 1 + Number(adjustments.saturation || 0) / 100;
    const vibrance = Number(adjustments.vibrance || 0) / 100;
    const hueAngle =
      (Number(adjustments.hue || 0) * Math.PI) / 180;
    const cos = Math.cos(hueAngle);
    const sin = Math.sin(hueAngle);
    const hueMatrix = [
      0.213 + cos * 0.787 - sin * 0.213,
      0.715 - cos * 0.715 - sin * 0.715,
      0.072 - cos * 0.072 + sin * 0.928,
      0.213 - cos * 0.213 + sin * 0.143,
      0.715 + cos * 0.285 + sin * 0.14,
      0.072 - cos * 0.072 - sin * 0.283,
      0.213 - cos * 0.213 - sin * 0.787,
      0.715 - cos * 0.715 + sin * 0.715,
      0.072 + cos * 0.928 + sin * 0.072
    ];
    const histogram = wantHistogram
      ? {
          rgb: new Uint32Array(256),
          r: new Uint32Array(256),
          g: new Uint32Array(256),
          b: new Uint32Array(256)
        }
      : null;

    for (let index = 0; index < data.length; index += 4) {
      let r = data[index] / 255;
      let g = data[index + 1] / 255;
      let b = data[index + 2] / 255;

      r *= exposure;
      g *= exposure;
      b *= exposure;

      r *= 1 + temperature * 0.18;
      b *= 1 - temperature * 0.18;
      g *= 1 - tint * 0.12;
      r *= 1 + tint * 0.06;
      b *= 1 + tint * 0.06;

      r = (r - 0.5) * contrast + 0.5;
      g = (g - 0.5) * contrast + 0.5;
      b = (b - 0.5) * contrast + 0.5;

      let luminance = colorLuminance(r, g, b);
      if (shadows || highlights) {
        const shadowWeight = (1 - clamp(luminance, 0, 1)) ** 2;
        const highlightWeight = clamp(luminance, 0, 1) ** 2;
        const shift =
          shadows * shadowWeight * 0.3 +
          highlights * highlightWeight * 0.3;
        r += shift;
        g += shift;
        b += shift;
      }
      if (whites || blacks) {
        luminance = colorLuminance(r, g, b);
        const whiteWeight = smoothstep(0.5, 1, luminance);
        const blackWeight = 1 - smoothstep(0, 0.5, luminance);
        const shift =
          whites * whiteWeight * 0.25 +
          blacks * blackWeight * 0.25;
        r += shift;
        g += shift;
        b += shift;
      }

      luminance = colorLuminance(r, g, b);
      r = luminance + (r - luminance) * saturation;
      g = luminance + (g - luminance) * saturation;
      b = luminance + (b - luminance) * saturation;

      if (vibrance) {
        const maxChannel = Math.max(r, g, b);
        const minChannel = Math.min(r, g, b);
        const amount = maxChannel - minChannel;
        const factor = 1 + vibrance * (1 - clamp(amount, 0, 1));
        r = luminance + (r - luminance) * factor;
        g = luminance + (g - luminance) * factor;
        b = luminance + (b - luminance) * factor;
      }

      if (hueAngle) {
        const hr =
          hueMatrix[0] * r +
          hueMatrix[1] * g +
          hueMatrix[2] * b;
        const hg =
          hueMatrix[3] * r +
          hueMatrix[4] * g +
          hueMatrix[5] * b;
        const hb =
          hueMatrix[6] * r +
          hueMatrix[7] * g +
          hueMatrix[8] * b;
        r = hr;
        g = hg;
        b = hb;
      }

      let red = Math.round(clamp(r * 255, 0, 255));
      let green = Math.round(clamp(g * 255, 0, 255));
      let blue = Math.round(clamp(b * 255, 0, 255));
      red = rgbLut[rLut[red]];
      green = rgbLut[gLut[green]];
      blue = rgbLut[bLut[blue]];

      data[index] = red;
      data[index + 1] = green;
      data[index + 2] = blue;

      if (histogram) {
        histogram.r[red] += 1;
        histogram.g[green] += 1;
        histogram.b[blue] += 1;
        histogram.rgb[
          Math.round(
            colorLuminance(red / 255, green / 255, blue / 255) * 255
          )
        ] += 1;
      }
    }
    return histogram;
  }

  function colorLuminance(r, g, b) {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function smoothstep(edge0, edge1, value) {
    const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function drawMiniHistogram() {
    const color = state.color;
    if (!color?.histograms) {
      return;
    }
    const canvas = color.histogramCanvas;
    const context = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    context.clearRect(0, 0, width, height);
    context.fillStyle = "rgba(18, 26, 21, 0.9)";
    context.fillRect(0, 0, width, height);
    drawHistogramSeries(
      context,
      color.histograms.r,
      width,
      height,
      "rgba(225, 95, 83, 0.55)"
    );
    drawHistogramSeries(
      context,
      color.histograms.g,
      width,
      height,
      "rgba(105, 185, 115, 0.5)"
    );
    drawHistogramSeries(
      context,
      color.histograms.b,
      width,
      height,
      "rgba(93, 140, 220, 0.55)"
    );
  }

  function drawHistogramSeries(
    context,
    histogram,
    width,
    height,
    fillStyle
  ) {
    const max = Math.max(1, ...histogram);
    context.beginPath();
    context.moveTo(0, height);
    for (let index = 0; index < histogram.length; index += 1) {
      const x = (index / 255) * width;
      const normalized = Math.sqrt(histogram[index] / max);
      context.lineTo(x, height - normalized * (height - 4));
    }
    context.lineTo(width, height);
    context.closePath();
    context.fillStyle = fillStyle;
    context.fill();
  }

  function drawColorCurve() {
    const color = state.color;
    if (!color?.curveCanvas) {
      return;
    }
    const canvas = color.curveCanvas;
    const context = canvas.getContext("2d");
    const width = 420;
    const height = 260;
    context.setTransform(2, 0, 0, 2, 0, 0);
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#121a15";
    context.fillRect(0, 0, width, height);

    if (color.histograms) {
      const histogram =
        color.histograms[color.activeChannel] ||
        color.histograms.rgb;
      const max = Math.max(1, ...histogram);
      context.beginPath();
      context.moveTo(0, height);
      for (let index = 0; index < histogram.length; index += 1) {
        const x = (index / 255) * width;
        const normalized = Math.sqrt(histogram[index] / max);
        context.lineTo(x, height - normalized * (height - 8));
      }
      context.lineTo(width, height);
      context.closePath();
      context.fillStyle = "rgba(255, 253, 247, 0.12)";
      context.fill();
    }

    context.strokeStyle = "rgba(255, 255, 255, 0.12)";
    context.lineWidth = 1;
    for (let i = 1; i < 4; i += 1) {
      const x = (width / 4) * i;
      const y = (height / 4) * i;
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }
    context.strokeStyle = "rgba(255, 255, 255, 0.22)";
    context.beginPath();
    context.moveTo(0, height);
    context.lineTo(width, 0);
    context.stroke();

    const channelColors = {
      rgb: "#fffdf7",
      r: "#ff7468",
      g: "#72d27f",
      b: "#6d9fff"
    };
    const points = color.curves[color.activeChannel];
    const lut = buildCurveLut(points);
    context.strokeStyle = channelColors[color.activeChannel];
    context.lineWidth = 2;
    context.beginPath();
    for (let index = 0; index < lut.length; index += 1) {
      const x = (index / 255) * width;
      const y = height - (lut[index] / 255) * height;
      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }
    context.stroke();

    context.fillStyle = channelColors[color.activeChannel];
    for (const point of points) {
      context.beginPath();
      context.arc(
        point[0] * width,
        height - point[1] * height,
        5,
        0,
        Math.PI * 2
      );
      context.fill();
      context.strokeStyle = "rgba(0, 0, 0, 0.68)";
      context.lineWidth = 2;
      context.stroke();
    }
  }

  async function applyColorAdjustments() {
    const color = state.color;
    if (!color?.image || color.applying) {
      return;
    }
    const applyButton = elements.modalCard.querySelector(
      '[data-command="confirm-color"]'
    );
    if (applyButton) {
      applyButton.disabled = true;
      applyButton.textContent = I18N.t("正在輸出調色…");
    }
    color.applying = true;

    try {
      const image = color.image;
      let width = image.naturalWidth;
      let height = image.naturalHeight;
      const maxDimension = 16384;
      const scale = Math.min(
        1,
        maxDimension / Math.max(width, height)
      );
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", {
        willReadFrequently: true
      });
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(image, 0, 0, width, height);
      const imageData = context.getImageData(0, 0, width, height);
      applyColorPixels(
        imageData,
        color.adjustments,
        color.curves,
        false
      );
      context.putImageData(imageData, 0, 0);

      const type =
        color.entry.file.type === "image/png"
          ? "image/png"
          : "image/jpeg";
      const blob = await new Promise(resolve =>
        canvas.toBlob(
          resolve,
          type,
          type === "image/jpeg" ? CROP_JPEG_QUALITY : undefined
        )
      );
      if (!blob) {
        throw new Error("無法產生調色照片。");
      }
      const extension = type === "image/png" ? "png" : "jpg";
      const baseName = color.entry.file.name.replace(/\.[^.]+$/, "");
      const fileName = `${baseName}-color-${Date.now()}.${extension}`;
      await replaceCurrentPhotoWithBlob({
        photo: color.photo,
        blob,
        fileName,
        type,
        width,
        height,
        progressMessage: "正在套用調色…",
        successMessage: "已套用調色，可以繼續整理。"
      });
    } catch (error) {
      if (applyButton) {
        applyButton.disabled = false;
        applyButton.textContent = I18N.t("套用調色");
      }
      color.applying = false;
      showToast(
        error instanceof Error ? error.message : String(error),
        "error"
      );
    }
  }

  function renderDeleteModal(photo) {
    const title = document.createElement("h2");
    title.textContent = "移除這張照片？";

    const copy = document.createElement("p");
    copy.className = "modal-copy";
    copy.textContent =
      "照片會從本次上傳草稿移除，不會刪除你電腦上的原始檔案，也不會提交觀察。";

    const filename = document.createElement("div");
    filename.className = "modal-filename";
    filename.textContent = photo.name;

    const keyHint = document.createElement("p");
    keyHint.className = "modal-key-hint";
    keyHint.textContent = state.modal.enterArmed
      ? "再按一次 Enter 確認刪除"
      : "為避免誤刪，請連按 Enter 兩次";

    const actions = document.createElement("div");
    actions.className = "modal-actions";

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "ghost-button";
    cancel.dataset.command = "close-modal";
    cancel.textContent = "保留照片";

    const confirm = document.createElement("button");
    confirm.type = "button";
    confirm.className = `danger-button${
      state.modal.enterArmed ? " is-armed" : ""
    }`;
    confirm.dataset.command = "confirm-delete";
    confirm.textContent = state.modal.enterArmed
      ? "再按一次確認刪除"
      : "從草稿移除";

    actions.append(cancel, confirm);
    elements.modalCard.append(title, copy, filename, keyHint, actions);
  }

  function renderGroupModal(groups, photo) {
    const title = document.createElement("h2");
    title.textContent = "併入以前的群組";

    const copy = document.createElement("p");
    copy.className = "modal-copy";
    copy.textContent = I18N.format(
      "為「{name}」選擇一個較早的群組。",
      { name: photo.name }
    );

    const list = document.createElement("div");
    list.className = "group-list";

    groups.forEach(group => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "group-option";
      button.dataset.command = "select-group";
      button.dataset.groupId = group.id;
      const atLimit = group.photoCount >= MAX_GROUP_PHOTOS;
      if (atLimit) {
        button.classList.add("is-full");
        button.disabled = true;
      }

      const imageWrap = document.createElement("span");
      imageWrap.className = "group-thumb";
      const image = document.createElement("img");
      image.src = group.thumbUrl;
      image.alt = "";
      imageWrap.appendChild(image);

      const copyWrap = document.createElement("span");
      copyWrap.className = "group-option-copy";
      const name = document.createElement("strong");
      name.textContent = I18N.format("第 {group} 組", {
        group: group.index + 1
      });
      const detail = document.createElement("small");
      detail.textContent = atLimit
        ? I18N.format("{count} 張 · 已達 {max} 張上限", {
            count: group.photoCount,
            max: MAX_GROUP_PHOTOS
          })
        : I18N.format("{count} 張照片", {
            count: group.photoCount
          });
      copyWrap.append(name, detail);

      const arrow = document.createElement("span");
      arrow.className = "group-option-arrow";
      arrow.textContent = "→";

      button.append(imageWrap, copyWrap, arrow);
      list.appendChild(button);
    });

    const actions = document.createElement("div");
    actions.className = "modal-actions";
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "ghost-button";
    cancel.dataset.command = "close-modal";
    cancel.textContent = "取消";
    actions.appendChild(cancel);

    elements.modalCard.append(title, copy, list, actions);
  }

  function showSummary() {
    if (state.session) {
      state.session.status = "complete";
    }

    const remaining = state.snapshot
      ? state.snapshot.photos.filter(
          photo => !state.processedFileIds.has(photo.fileId)
        ).length
      : 0;

    elements.loadingLayer.hidden = true;
    elements.triageMain.hidden = true;
    elements.summaryLayer.hidden = false;
    elements.progressFill.style.width = "100%";
    elements.phaseLabel.textContent = I18N.t("本批完成");
    elements.mergedCount.textContent = String(state.counts.merged);
    elements.separatedCount.textContent = String(state.counts.separated);
    elements.deletedCount.textContent = String(state.counts.deleted);

    if (remaining > 0) {
      elements.summaryTitle.textContent = I18N.t("這一批完成了");
      elements.summaryCopy.textContent = I18N.format(
        "上傳頁還有 {count} 張尚未操作，可以繼續下一批。",
        { count: remaining }
      );
      elements.nextBatchButton.hidden = false;
      elements.nextBatchButton.textContent = I18N.format(
        "處理下一批 · {count} 張",
        {
          count: Math.min(remaining, state.settings.batchLimit)
        }
      );
    } else {
      elements.summaryTitle.textContent = I18N.t("全部照片都整理過了");
      elements.summaryCopy.textContent =
        I18N.t(
          "你可以關閉介面，繼續補上觀察資料，或回到上傳頁檢查分組。"
        );
      elements.nextBatchButton.hidden = true;
    }
    I18N.translateDom(elements.summaryLayer);
  }

  function showLoading() {
    elements.loadingLayer.hidden = false;
    elements.summaryLayer.hidden = true;
    elements.triageMain.hidden = true;
    elements.loadingLayer.replaceChildren();

    const card = document.createElement("div");
    card.className = "state-card loading-card";
    const ring = document.createElement("span");
    ring.className = "loading-ring";
    const title = document.createElement("h2");
    title.textContent = "讀取上傳草稿";
    const copy = document.createElement("p");
    copy.textContent = "正在取得照片順序和目前分組…";
    card.append(ring, title, copy);
    elements.loadingLayer.appendChild(card);
    I18N.translateDom(elements.loadingLayer);
  }

  function showUploadEmptyState(message = "") {
    elements.summaryLayer.hidden = true;
    elements.triageMain.hidden = true;
    elements.loadingLayer.hidden = false;
    elements.loadingLayer.replaceChildren();

    const closeButton = createStateCloseButton();
    const card = document.createElement("div");
    card.className = "state-card upload-empty-card";
    const eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = "UPLOAD FROM EXTENSION";
    const title = document.createElement("h2");
    title.textContent = "從插件上傳本機照片";
    const copy = document.createElement("p");
    copy.textContent =
      message ||
      "不需要使用 iNaturalist 的上傳按鈕。選擇本機原檔後，插件會把照片送進目前的上傳草稿。";
    const actions = document.createElement("div");
    actions.className = "summary-actions";
    const upload = document.createElement("button");
    upload.type = "button";
    upload.className = "solid-button";
    upload.dataset.command = "upload-local";
    upload.textContent = "選擇本機照片並上傳";
    actions.appendChild(upload);
    card.append(eyebrow, title, copy, actions);
    elements.loadingLayer.append(closeButton, card);
    I18N.translateDom(elements.loadingLayer);
  }

  function showUploadProgress(count) {
    elements.summaryLayer.hidden = true;
    elements.triageMain.hidden = true;
    elements.loadingLayer.hidden = false;
    elements.loadingLayer.replaceChildren();

    const card = document.createElement("div");
    card.className = "state-card loading-card";
    const ring = document.createElement("span");
    ring.className = "loading-ring";
    const title = document.createElement("h2");
    title.textContent = I18N.format("正在上傳 {count} 張照片", {
      count
    });
    const copy = document.createElement("p");
    copy.textContent =
      "正在把本機照片加入 iNaturalist 上傳器。照片出現在草稿後即可開始整理，網站會繼續在背景上傳。";
    card.append(ring, title, copy);
    elements.loadingLayer.appendChild(card);
    I18N.translateDom(elements.loadingLayer);
  }

  function updateUploadProgress(done, total) {
    const title = elements.loadingLayer.querySelector(".loading-card h2");
    if (!title) {
      return;
    }
    title.textContent = I18N.format("已加入 {done} / {total} 張照片", {
      done,
      total
    });
  }

  function createStateCloseButton() {
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "state-close-button";
    closeButton.dataset.command = "close";
    closeButton.setAttribute("aria-label", "關閉整理介面");
    closeButton.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
    return closeButton;
  }

  function showError(message) {
    elements.summaryLayer.hidden = true;
    elements.triageMain.hidden = true;
    elements.loadingLayer.hidden = false;
    elements.loadingLayer.replaceChildren();

    const card = document.createElement("div");
    card.className = "state-card error-card";
    const closeIcon = createStateCloseButton();
    const eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = "CAN'T START";
    const title = document.createElement("h2");
    title.textContent = "暫時無法整理";
    const copy = document.createElement("p");
    copy.textContent = I18N.translate(message);
    const actions = document.createElement("div");
    actions.className = "summary-actions";

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "ghost-button";
    closeButton.dataset.command = "close";
    closeButton.textContent = "關閉";

    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "solid-button";
    retry.dataset.command = "rescan";
    retry.textContent = "重新掃描";

    actions.append(closeButton, retry);
    elements.loadingLayer.appendChild(closeIcon);
    card.append(eyebrow, title, copy, actions);
    elements.loadingLayer.appendChild(card);
    I18N.translateDom(elements.loadingLayer);
  }

  function hideStateLayers() {
    elements.loadingLayer.hidden = true;
    elements.summaryLayer.hidden = true;
    elements.triageMain.hidden = false;
  }

  function showToast(message, tone = "success") {
    window.clearTimeout(state.toastTimer);
    elements.toast.textContent = I18N.translate(String(message));
    elements.toast.dataset.tone = tone;
    elements.toast.classList.add("is-visible");
    state.toastTimer = window.setTimeout(() => {
      elements.toast.classList.remove("is-visible");
    }, 2200);
  }

  function getUiStatus() {
    return {
      hasSession: Boolean(state.session),
      status: state.session?.status || null,
      currentIndex: state.currentIndex,
      total: state.session?.queue?.length || 0,
      processedCount: state.processedFileIds.size,
      visible: state.visible
    };
  }

  function bridgeRequest(
    action,
    payload = {},
    timeoutMs = 10000,
    transfer = []
  ) {
    return new Promise((resolve, reject) => {
      const requestId = `inat-${Date.now()}-${nextRequestId++}`;
      const timer = window.setTimeout(() => {
        pending.delete(requestId);
        reject(
          new Error(
            I18N.t("iNaturalist 上傳器沒有回應，請重新掃描。")
          )
        );
      }, timeoutMs);

      pending.set(requestId, { resolve, reject, timer });
      window.postMessage(
        {
          channel: CHANNEL,
          direction: "to-bridge",
          requestId,
          action,
          payload
        },
        "*",
        transfer
      );
    });
  }
})();
