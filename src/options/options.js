import {
  DEFAULT_SETTINGS,
  MAX_BATCH_LIMIT,
  MIN_BATCH_LIMIT,
  loadSettings,
  saveSettings
} from "../shared/settings.js";

const form = document.querySelector("#settingsForm");
const batchLimit = document.querySelector("#batchLimit");
const autoAdvance = document.querySelector("#autoAdvance");
const confirmDelete = document.querySelector("#confirmDelete");
const showFilename = document.querySelector("#showFilename");
const language = document.querySelector("#language");
const resetButton = document.querySelector("#resetButton");
const saveStatus = document.querySelector("#saveStatus");
const I18N = window.INATI18N;

let statusTimer = null;

form.addEventListener("submit", async event => {
  event.preventDefault();
  const value = clampBatchLimit(batchLimit.value);
  batchLimit.value = String(value);
  const saved = await saveSettings({
    batchLimit: value,
    autoAdvance: autoAdvance.checked,
    confirmDelete: confirmDelete.checked,
    showFilename: showFilename.checked,
    language: language.value
  });
  showStatus(
    I18N.format("已儲存 · 每批 {count} 張", {
      count: saved.batchLimit
    })
  );
});

resetButton.addEventListener("click", async () => {
  applySettings(DEFAULT_SETTINGS);
  await saveSettings(DEFAULT_SETTINGS);
  showStatus("已恢復預設值");
  window.setTimeout(() => window.location.reload(), 250);
});

language.addEventListener("change", async () => {
  await saveSettings({
    batchLimit: clampBatchLimit(batchLimit.value),
    autoAdvance: autoAdvance.checked,
    confirmDelete: confirmDelete.checked,
    showFilename: showFilename.checked,
    language: language.value
  });
  window.location.reload();
});

for (const input of [
  batchLimit,
  autoAdvance,
  confirmDelete,
  showFilename
]) {
  input.addEventListener("input", () => {
    saveStatus.textContent = "";
  });
}

batchLimit.addEventListener("blur", () => {
  batchLimit.value = String(clampBatchLimit(batchLimit.value));
});

loadSettings().then(settings => {
  I18N.setLanguage(settings.language);
  populateLanguages();
  I18N.translateDom(document);
  applySettings(settings);
});

function applySettings(settings) {
  batchLimit.value = String(settings.batchLimit);
  autoAdvance.checked = settings.autoAdvance;
  confirmDelete.checked = settings.confirmDelete;
  showFilename.checked = settings.showFilename;
  language.value = settings.language || DEFAULT_SETTINGS.language;
}

function populateLanguages() {
  language.replaceChildren();
  for (const item of I18N.SUPPORTED) {
    const option = document.createElement("option");
    option.value = item.code;
    option.textContent =
      item.code === "auto"
        ? I18N.t("自動（跟隨瀏覽器）")
        : item.label;
    language.appendChild(option);
  }
}

function clampBatchLimit(value) {
  return Math.min(
    MAX_BATCH_LIMIT,
    Math.max(MIN_BATCH_LIMIT, Number(value) || DEFAULT_SETTINGS.batchLimit)
  );
}

function showStatus(message) {
  window.clearTimeout(statusTimer);
  saveStatus.textContent = I18N.translate(message);
  statusTimer = window.setTimeout(() => {
    saveStatus.textContent = "";
  }, 2400);
}
