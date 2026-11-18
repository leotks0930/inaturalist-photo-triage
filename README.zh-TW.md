# iNaturalist Photo Triage

一個 Manifest V3 Chrome 插件，用逐張預覽的方式整理 iNaturalist 上傳頁中的照片草稿。

繁體中文 | [English](README.md)

[下載最新版本](https://github.com/leotks0930/inaturalist-photo-triage/releases/latest)

完整安裝與首次使用步驟請見 [`INSTALL.md`](INSTALL.md)。

## 功能

- 使用者先開啟 `https://www.inaturalist.org/observations/upload`，不需要使用網站自己的上傳按鈕。
- 可直接在插件中選擇本機照片並上傳到 iNaturalist 上傳器。
- HEIC、RAW 等 Chrome 無法直接解碼的格式仍可由插件上傳；這類檔案不會提供本機預覽與裁切。
- 未額外上傳的本機原圖可按檔名匹配頁面上的草稿照片。
- 點擊 Chrome 工具列圖示，再由 Popup 開始整理。
- 每次只顯示一張照片，提供四個操作：
  - 合併到前一個群組
  - Separate：分開成獨立群組；第一張照片之外全部可用
  - 從本次上傳草稿刪除
  - 選擇任何較早的群組來合併
- 設定每批最多處理 1–100 張照片。
- 每個觀察群組最多合併 20 張照片，與 iNaturalist 限制一致。
- 操作後自動前進；可在設定頁關閉。
- 逐張預覽會顯示照片的 EXIF／iNaturalist 拍攝時間。
- 可從本機原檔套用裁切；目前照片會立即改成裁切版，背景同步完成後只保留裁切照片，本機原檔不受影響。
- 內建類 Photoshop 調色工作區：曝光、對比、亮部、陰影、白色、黑色、色溫、色調、飽和度、鮮豔度、色相、即時直方圖，以及 RGB／R／G／B 曲線。
- 裁切和調色都會直接更新目前照片，並保留它在整理批次中的位置。
- 第一張照片往前瀏覽後會自動視為已檢視，不會再出現在最後的未整理清單。
- 照片可無上限放大，支援以游標位置滾輪縮放、拖曳平移和雙擊 2×。
- 刪除確認需連按兩次 Enter；3 秒內沒有第二次操作會取消待確認狀態。
- 支援 `1`、`2`、`3`、`4`、左右方向鍵和 `Esc`。
- Popup 會顯示進行中的批次，可繼續上次整理或處理下一批。
- 介面支援繁體中文、英文、簡體中文、日文和西班牙文，可在設定頁切換。

## 安全邊界

- 插件不會按下「提交觀察」。
- 插件不會自行掃描本機檔案；只有按下「載入本機原圖」才會讀取使用者選取的檔案。
- 只有按下「上傳本機照片」或「上傳裁切照片」時，插件才會把檔案交給 iNaturalist 上傳器。
- 刪除只移除目前 iNaturalist 上傳草稿中的照片項目，不會刪除電腦上的原始檔案。
- 所有狀態與設定都存在 Chrome 本機，沒有後端服務。

注意：iNaturalist 本身在使用者加入照片時，會先把照片上傳到它的草稿圖床。這是網站原本的行為，不是本插件額外執行的上傳。

## 安裝

1. 開啟 `chrome://extensions`。
2. 打開右上角的「開發人員模式」。
3. 按「載入未封裝項目」。
4. 選擇這個資料夾：

   `/Users/leotks/Documents/Codex/2026-11-16/chrome-inaturist-sperate`

5. 把插件圖示固定到工具列。

## 使用

1. 在 iNaturalist 上傳頁加入照片。
2. 點擊工具列上的 Photo Triage 圖示。
3. 按「開始逐張整理」。
4. 使用四個操作整理目前照片。
5. 完成一批後可繼續下一批，最後自行回到上傳頁補資料並決定是否提交。

## 技術架構

```text
Popup
  -> Background service worker
     -> page-bridge.js（MAIN world）
        -> 讀取 iNaturalist React 上傳器的 store / actions
     -> overlay.js（ISOLATED world）
        -> Shadow DOM 逐張預覽介面

Options page
  -> chrome.storage.local
```

`page-bridge.js` 會尋找 iNaturalist 上傳器內部的 `obsCards`、`obsPositions` 與 `movePhoto`、`newCardFromMedia` 操作。這比模擬 HTML5 拖曳更穩定，也能保留照片的 `fileId` 和群組狀態。

主要檔案：

- `manifest.json`：Manifest V3 設定。
- `src/background.js`：Popup 狀態檢查與按需注入。
- `src/page-bridge.js`：iNaturalist 上傳器資料與操作橋接。
- `src/content/overlay.js`：逐張整理流程與介面邏輯。
- `src/content/overlay.css`：Shadow DOM 介面樣式。
- `src/popup/`：工具列 Popup。
- `src/options/`：設定頁。

## 已知限制

- iNaturalist 若大幅改動上傳器內部結構，`page-bridge.js` 需要更新對應的 React prop 名稱。
- 插件以 Facebook 風格的 HTML5 React 上傳器為目標；若 iNaturalist 改成另一個上傳器，需另做 adapter。
- 重新整理上傳頁後，iNaturalist 可能不會恢復本次草稿，插件也無法恢復已遺失的頁面狀態。
