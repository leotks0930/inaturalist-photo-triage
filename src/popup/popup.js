const statusCard = document.querySelector("#statusCard");
const startButton = document.querySelector("#startButton");
const startButtonLabel = document.querySelector("#startButtonLabel");
const settingsButton = document.querySelector("#settingsButton");
const rescanButton = document.querySelector("#rescanButton");
const limitLabel = document.querySelector("#limitLabel");
const I18N = window.INATI18N;

let popupState = null;

I18N.setLanguage("auto");

startButton.addEventListener("click", async () => {
  if (!popupState?.tabId || !popupState?.isUploadPage) {
    return;
  }

  startButton.disabled = true;
  startButtonLabel.textContent = I18N.t("正在開啟整理介面…");

  try {
    const response = await chrome.runtime.sendMessage({
      type: "INAT_START_REVIEW",
      tabId: popupState.tabId
    });
    if (!response?.ok) {
      throw new Error(response?.error || I18N.t("無法開啟整理介面。"));
    }
    window.close();
  } catch (error) {
    renderError(error instanceof Error ? error.message : String(error));
    startButton.disabled = false;
    startButtonLabel.textContent = I18N.t("重新嘗試");
  }
});

settingsButton.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

rescanButton.addEventListener("click", () => {
  refresh();
});

refresh();

async function refresh() {
  renderLoading();
  try {
    popupState = await chrome.runtime.sendMessage({
      type: "INAT_GET_POPUP_STATE"
    });
    if (!popupState?.ok) {
      throw new Error(popupState?.error || I18N.t("無法讀取目前頁面。"));
    }
    I18N.setLanguage(popupState.settings?.language || "auto");
    I18N.translateDom(document);
    render(popupState);
  } catch (error) {
    renderError(error instanceof Error ? error.message : String(error));
  }
}

function render(state) {
  const settings = state.settings || {};
  limitLabel.textContent = settings.batchLimit || 20;

  if (!state.isUploadPage) {
    statusCard.innerHTML = `
      <div class="status-head">
        <div>
          <p class="status-label is-warning">${I18N.t("尚未在上傳頁")}</p>
          <p class="status-title">${I18N.t("先開啟 iNaturalist 上傳頁")}</p>
          <p class="status-copy">${I18N.t("加入照片後，再點一次工具列圖示開始整理。")}</p>
        </div>
      </div>
    `;
    startButton.disabled = true;
    startButtonLabel.textContent = I18N.t("等待上傳頁");
    return;
  }

  const photoCount = Number(state.photoCount || 0);
  const groupCount = Number(state.groupCount || 0);

  if (!photoCount) {
    statusCard.innerHTML = `
      <div class="status-head">
        <div>
          <p class="status-label">${I18N.t("上傳頁已就緒")}</p>
          <p class="status-title">${I18N.t("從插件選擇本機照片")}</p>
          <p class="status-copy">${I18N.t("不需要使用 iNaturalist 的上傳按鈕；照片會由插件送進上傳器。")}</p>
        </div>
        <div class="count-block"><strong>0</strong><span>${I18N.t("張照片")}</span></div>
      </div>
    `;
    startButton.disabled = false;
    startButtonLabel.textContent = I18N.t("開啟並上傳本機照片");
    return;
  }

  const uiStatus = state.uiStatus;
  const inProgress =
    uiStatus?.hasSession &&
    uiStatus?.status === "active" &&
    uiStatus.total > 0;
  const hasProgress = inProgress || Number(uiStatus?.processedCount || 0) > 0;
  const limit = Math.max(1, Number(settings.batchLimit || 20));
  const thisBatch = Math.min(photoCount, limit);

  statusCard.innerHTML = `
    <div class="status-head">
      <div>
        <p class="status-label">${I18N.t("上傳頁已就緒")}</p>
        <p class="status-title">${inProgress ? I18N.t("上次整理還沒完成") : I18N.t("可以開始逐張整理")}</p>
        <p class="status-copy">${
          inProgress
            ? I18N.format("目前進度 {current} / {total}。", {
                current: Math.min(uiStatus.currentIndex + 1, uiStatus.total),
                total: uiStatus.total
              })
            : I18N.format("本批先處理 {count} 張，完成後可繼續下一批。", {
                count: thisBatch
              })
        }</p>
      </div>
      <div class="count-block">
        <strong>${photoCount}</strong>
        <span>${I18N.t("張照片")}</span>
      </div>
    </div>
    <div class="metric-row">
      <div class="metric"><strong>${groupCount}</strong>${I18N.t("目前群組")}</div>
      <div class="metric"><strong>${limit}</strong>${I18N.t("本批上限")}</div>
    </div>
  `;

  startButton.disabled = false;
  startButtonLabel.textContent = inProgress
    ? I18N.t("繼續逐張整理")
    : hasProgress
      ? I18N.t("處理下一批")
      : I18N.t("開始逐張整理");
}

function renderLoading() {
  statusCard.innerHTML = `
    <div class="status-loading">
      <span class="spinner" aria-hidden="true"></span>
      <span>${I18N.t("正在檢查上傳頁…")}</span>
    </div>
  `;
  startButton.disabled = true;
  startButtonLabel.textContent = I18N.t("檢查頁面中");
}

function renderError(message) {
  statusCard.innerHTML = `
    <div class="status-error">
      <strong>${I18N.t("暫時無法開始")}</strong>
      <span>${escapeHtml(I18N.translate(message))}</span>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
