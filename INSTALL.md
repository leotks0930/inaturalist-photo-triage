# iNaturalist Photo Triage 安裝教學

這個插件是 Chrome Manifest V3 擴充功能，不需要執行安裝程式，也不需要伺服器。

## 支援環境

- Google Chrome
- Microsoft Edge 也可使用相同步驟
- 需要一個可登入的 iNaturalist 帳號

## 一、解壓縮

1. 找到收到的 `inaturalist-photo-triage-v0.6.1.zip`。
2. macOS：雙擊 ZIP，系統會解壓成一個資料夾。
3. Windows：右鍵點擊 ZIP，選擇「解壓縮全部」。
4. 打開解壓後的資料夾，確認裡面可以直接看到：

```text
manifest.json
README.md
INSTALL.md
src/
icons/
```

如果沒有看到 `manifest.json`，代表選錯資料夾了。請再往內找一層。

## 二、載入 Chrome

1. 在 Chrome 網址列輸入：

```text
chrome://extensions
```

2. 打開右上角的「開發人員模式」。
3. 按左上角的「載入未封裝項目」。
4. 選擇包含 `manifest.json` 的整個資料夾。
5. 安裝成功後，清單中會出現「iNaturalist Photo Triage」。

Chrome 會詢問是否保留開發人員模式的擴充功能；看到提示時選擇保留即可。

## 三、固定插件圖示

1. 點 Chrome 工具列右側的拼圖圖示。
2. 找到「iNaturalist Photo Triage」。
3. 按旁邊的釘選圖示，讓插件固定顯示在工具列。

## 四、第一次使用

1. 登入 iNaturalist。
2. 開啟：

```text
https://www.inaturalist.org/observations/upload
```

3. 點擊工具列上的插件圖示。
4. 如果上傳頁還是空的，按「開啟並上傳本機照片」。
5. 在插件介面按「上傳本機照片」。
6. 選擇要整理的本機原始照片。照片會由插件送進 iNaturalist 上傳草稿。
7. 上傳完成後，會自動進入逐張整理介面。

可在插件設定頁的「語言」選擇自動、英文、繁體中文、簡體中文、日文或西班牙文。

## 五、逐張整理

- 「合併」：合併到前一個群組。
- 「開新組」：建立新的獨立群組；第一張照片使用「設為第一組」。
- 「刪除」：從本次上傳草稿移除。
- 「以前的群組」：選擇任何較早的群組。
- 滾輪可無上限放大照片，放大後可拖曳。
- 「載入原圖」只載入本機原檔作裁切，不會新增上傳。
- 裁切會直接替換目前這張草稿照片；本機原檔不會被刪除。

插件不會按下「提交觀察」。整理完成後，請自行回到 iNaturalist 頁面補資料並決定是否提交。

## 六、更新插件

收到新版本 ZIP 時：

1. 解壓縮新版本。
2. 打開 `chrome://extensions`。
3. 移除舊版，或把舊版資料夾內容替換成新版本內容。
4. 按插件上的「重新載入」。
5. 重新整理 iNaturalist 上傳頁。

如果舊版是直接從某個固定資料夾載入，也可以直接把新檔案覆蓋到同一個資料夾，再按「重新載入」。

## 常見問題

### 載入時顯示「資訊清單檔案遺失」

選錯資料夾了。請選擇直接包含 `manifest.json` 的那一層。

### 工具列找不到插件

點 Chrome 的拼圖圖示，再按插件旁邊的釘選按鈕。

### Popup 顯示不在上傳頁

確認目前分頁是：

```text
https://www.inaturalist.org/observations/upload
```

### 選擇照片後仍顯示沒有圖片

請更新到 `0.6.1` 或更新版本。舊版可能無法處理 HEIC 等格式。

### 上傳卡住

1. 到 `chrome://extensions` 按插件「重新載入」。
2. 重新整理 iNaturalist 上傳頁。
3. 重新從插件選擇照片。

### 插件圖示不見了

在 `chrome://extensions` 確認插件已啟用，再從拼圖選單重新釘選。
