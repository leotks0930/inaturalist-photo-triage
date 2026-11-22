(() => {
  const SUPPORTED = [
    { code: "auto", label: "Auto" },
    { code: "en", label: "English" },
    { code: "zh-TW", label: "繁體中文" },
    { code: "zh-CN", label: "简体中文" },
    { code: "ja", label: "日本語" },
    { code: "es", label: "Español" }
  ];

  const en = {
    "設定": "Settings",
    "開啟設定": "Open settings",
    "一張一張，整理乾淨。": "One by one. Keep it clean.",
    "把照片合併到前一組、獨立分開，或直接套用本機原圖裁切。":
      "Merge into the previous group, split into a new group, or crop using the local original.",
    "只整理上傳草稿，不會按下「提交觀察」。":
      "Works on upload drafts only. It never submits observations.",
    "重新掃描": "Rescan",
    "本批上限：": "Batch limit:",
    "張": "photos",
    "正在開啟整理介面…": "Opening review workspace…",
    "無法開啟整理介面。": "Could not open the review workspace.",
    "重新嘗試": "Try again",
    "無法讀取目前頁面。": "Could not read the current page.",
    "等待上傳頁": "Waiting for upload page",
    "尚未在上傳頁": "Not on the upload page",
    "先開啟 iNaturalist 上傳頁": "Open the iNaturalist upload page first",
    "加入照片後，再點一次工具列圖示開始整理。":
      "Add photos, then click the extension icon again.",
    "上傳頁已就緒": "Upload page ready",
    "從插件選擇本機照片": "Choose local photos from the extension",
    "不需要使用 iNaturalist 的上傳按鈕；照片會由插件送進上傳器。":
      "You do not need iNaturalist's upload button. The extension sends files to the uploader.",
    "張照片": "photos",
    "開啟並上傳本機照片": "Open and upload local photos",
    "上次整理還沒完成": "Previous review is still in progress",
    "可以開始逐張整理": "Ready for one-by-one review",
    "目前進度 {current} / {total}。": "Progress: {current} / {total}.",
    "本批先處理 {count} 張，完成後可繼續下一批。":
      "This batch starts with {count} photos. Continue with another batch when finished.",
    "目前群組": "Current groups",
    "本批上限": "Batch limit",
    "繼續逐張整理": "Continue review",
    "處理下一批": "Next batch",
    "開始逐張整理": "Start review",
    "暫時無法開始": "Cannot start yet",
    "檢查頁面中": "Checking page",
    "正在檢查上傳頁…": "Checking the upload page…",
    "整理偏好": "Review preferences",
    "iNaturalist Photo Triage 設定": "iNaturalist Photo Triage Settings",
    "這些設定只會影響逐張整理介面。所有操作都停留在 iNaturalist 上傳草稿，插件不會提交觀察。":
      "These settings only affect the review workspace. All actions remain in the iNaturalist upload draft, and the extension never submits observations.",
    "每批照片上限": "Photos per batch",
    "1 張": "1 photo",
    "100 張": "100 photos",
    "每次只把最前面的 N 張照片放進整理佇列。完成後可以從 Popup 或完成畫面繼續下一批。":
      "Only the first N photos are added to each review queue. Continue with the next batch from the popup or completion screen.",
    "操作節奏": "Review behavior",
    "操作後自動前進": "Advance automatically",
    "按下合併、分開或刪除後，直接顯示下一張。":
      "Show the next photo immediately after merge, split, or delete.",
    "刪除前再次確認": "Confirm before deleting",
    "避免在快速整理時誤刪照片。":
      "Prevent accidental deletion during fast review.",
    "顯示照片檔名": "Show filenames",
    "在逐張預覽中顯示原始檔名。": "Show original filenames in the review view.",
    "整理時可用快捷鍵": "Keyboard shortcuts",
    "合併到前一組": "Merge into previous group",
    "分開": "Split",
    "刪除": "Delete",
    "選擇舊群組": "Choose earlier group",
    "上一張／下一張": "Previous / next photo",
    "放大／縮小": "Zoom in / out",
    "重設縮放": "Reset zoom",
    "確認刪除": "Confirm deletion",
    "關閉介面": "Close workspace",
    "恢復預設": "Restore defaults",
    "儲存設定": "Save settings",
    "沒有後端 · 沒有帳號資料 · 沒有自動提交":
      "No backend · No account data · No automatic submission",
    "語言": "Language",
    "介面語言": "Interface language",
    "套用至 Popup、設定頁和逐張整理介面。":
      "Applies to the popup, settings page, and review workspace.",
    "自動（跟隨瀏覽器）": "Automatic (follow browser)",
    "已儲存 · 每批 {count} 張": "Saved · {count} photos per batch",
    "已恢復預設值": "Defaults restored",
    "逐張整理": "Photo review",
    "上傳本機照片": "Upload local photos",
    "載入本機原圖": "Load local originals",
    "載入原圖": "Load originals",
    "只載入本機原圖，不新增上傳": "Load local originals only, without uploading",
    "準備中": "Preparing",
    "本批 {count} 張": "Batch: {count}",
    "關閉整理介面": "Close review workspace",
    "照片 {current} / {total}": "Photo {current} / {total}",
    "第 {group} 組": "Group {group}",
    "讀取照片…": "Loading photo…",
    "無法載入這張照片的預覽": "Could not load this photo preview",
    "照片縮放": "Photo zoom",
    "縮小": "Zoom out",
    "重設縮放": "Reset zoom",
    "放大": "Zoom in",
    "裁切本機原圖": "Crop local original",
    "滾輪縮放 · 放大後可拖曳": "Scroll to zoom · Drag when enlarged",
    "拍攝時間：—": "Taken: —",
    "拍攝時間：{time}": "Taken: {time}",
    "拍攝時間：未提供": "Taken: Not available",
    "正在讀取群組資訊": "Reading group information",
    "上一張照片": "Previous photo",
    "下一張照片": "Next photo",
    "第 {index} 張": "Photo {index}",
    "目前是獨立照片": "Currently a standalone photo",
    "這張目前與另外 {count} 張照片同組":
      "This photo is grouped with {count} other photos",
    "這張目前是獨立照片": "This photo is currently standalone",
    "合併": "Merge",
    "併入前一組": "Merge into previous group",
    "第 {group} 組已有 20 張": "Group {group} already has 20 photos",
    "前面沒有可合併的群組": "No earlier group to merge into",
    "分開成獨立群組": "Split into a standalone group",
    "只從本次草稿移除": "Remove from this draft only",
    "以前的群組": "Earlier groups",
    "選擇較早的群組": "Choose an earlier group",
    "可選擇 {count} 個前一組": "{count} earlier groups available",
    "前一組都已有 20 張": "All earlier groups already have 20 photos",
    "前面沒有較早的群組": "No earlier groups",
    "前面沒有較早的群組。": "There are no earlier groups.",
    "查看第 {index} 張：{name}": "View photo {index}: {name}",
    "取消": "Cancel",
    "快捷鍵": "Shortcuts",
    "瀏覽": "Browse",
    "瀏覽 ·": "Browse ·",
    "關閉": "Close",
    "讀取上傳草稿": "Loading upload draft",
    "正在取得照片順序和目前分組…":
      "Reading photo order and current groups…",
    "這一批完成了": "This batch is complete",
    "全部照片都整理過了": "All photos have been reviewed",
    "照片已依照你的操作整理。": "Photos have been organized as requested.",
    "本批 20 張": "Batch: 20",
    "照片 1 / 1": "Photo 1 / 1",
    "第 1 組": "Group 1",
    "第 1 張": "Photo 1",
    "上傳頁還有 {count} 張尚未操作，可以繼續下一批。":
      "{count} photos are still unprocessed. Continue with the next batch.",
    "你可以關閉介面，繼續補上觀察資料，或回到上傳頁檢查分組。":
      "Close the workspace, finish observation details, or return to the upload page to check groups.",
    "處理下一批 · {count} 張": "Next batch · {count}",
    "從插件上傳本機照片": "Upload local photos from the extension",
    "不需要使用 iNaturalist 的上傳按鈕。選擇本機原檔後，插件會把照片送進目前的上傳草稿。":
      "You do not need iNaturalist's upload button. Choose local originals and the extension sends them to the current draft.",
    "選擇本機照片並上傳": "Choose local photos and upload",
    "正在上傳 {count} 張照片": "Uploading {count} photos",
    "正在把本機照片加入 iNaturalist 上傳器。照片出現在草稿後即可開始整理，網站會繼續在背景上傳。":
      "Adding local photos to the iNaturalist uploader. You can start reviewing as soon as the draft entries appear; iNaturalist will continue uploading in the background.",
    "暫時無法整理": "Cannot review right now",
    "已合併到前面的群組。": "Merged into the previous group.",
    "已分開成獨立群組。": "Split into a standalone group.",
    "已從本次上傳草稿移除。": "Removed from this upload draft.",
    "已套用裁切，可以繼續整理。":
      "Crop applied. You can continue reviewing.",
    "正在套用裁切…": "Applying crop…",
    "整理介面已經開啟。": "The review workspace is already open.",
    "已載入 {count} 張本機原圖，匹配 {matched} 張。":
      "Loaded {count} local originals and matched {matched} photos.",
    "已載入 {count} 張本機原圖，匹配 {matched} 張。 {skipped} 張無法讀取。":
      "Loaded {count} local originals and matched {matched} photos. {skipped} could not be read.",
    "已從插件上傳 {count} 張照片。":
      "Uploaded {count} photos from the extension.",
    "已從插件上傳 {count} 張照片，略過 {skipped} 個非圖片或無法讀取的檔案。":
      "Uploaded {count} photos from the extension and skipped {skipped} unsupported or unreadable files.",
    "已加入 {count} 張照片；iNaturalist 仍在背景上傳 {pending} 張，可以先開始整理。":
      "Added {count} photos. iNaturalist is still uploading {pending} in the background; you can start reviewing.",
    "已加入 {count} 張照片，但其中 {failed} 張上傳失敗。":
      "Added {count} photos, but {failed} failed to upload.",
    "沒有收到任何檔案，請重新按「上傳本機照片」。":
      "No files were received. Press “Upload local photos” again.",
    "沒有可用的圖片檔案。": "No usable image files were found.",
    "沒有可用的圖片檔案：{detail}": "No usable image files were found: {detail}",
    "未知類型": "unknown type",
    "無法讀取圖片。": "Could not read the image.",
    "前面沒有可以合併的群組。": "There is no earlier group to merge into.",
    "第 {group} 組已有 20 張照片。":
      "Group {group} already has 20 photos.",
    "目標群組已不存在，請重新掃描。":
      "The target group no longer exists. Rescan the page.",
    "第一張照片不使用": "Not available for the first photo",
    "從目前群組切出": "Split out of the current group",
    "確認為獨立群組": "Keep as a standalone group",
    "第一張照片不使用 Separate。":
      "Separate is not available for the first photo.",
    "請先載入這張照片的本機原圖。":
      "Load the local original for this photo first.",
    "這個格式無法在瀏覽器中預覽或裁切，但仍可由插件直接上傳。":
      "This format cannot be previewed or cropped in the browser, but it can still be uploaded.",
    "移除這張照片？": "Remove this photo?",
    "照片會從本次上傳草稿移除，不會刪除你電腦上的原始檔案，也不會提交觀察。":
      "The photo will be removed from this upload draft. Your local file will not be deleted and no observation will be submitted.",
    "為避免誤刪，請連按 Enter 兩次":
      "To prevent accidental deletion, press Enter twice.",
    "再按一次 Enter 確認刪除": "Press Enter again to confirm deletion",
    "保留照片": "Keep photo",
    "從草稿移除": "Remove from draft",
    "再按一次確認刪除": "Confirm deletion again",
    "併入以前的群組": "Merge into an earlier group",
    "為「{name}」選擇一個較早的群組。":
      "Choose an earlier group for “{name}”.",
    "裁切本機原圖": "Crop local original",
    "來源：{name} · {width}×{height}。套用後會直接把目前照片改成裁切版；本機原檔不會被刪除。":
      "Source: {name} · {width}×{height}. Applying the crop replaces the current photo preview. Your local original is not deleted.",
    "拖曳選取裁切範圍": "Drag to select the crop area",
    "輸出：PNG 無損": "Output: lossless PNG",
    "輸出：JPEG 98%": "Output: JPEG 98%",
    "重設範圍": "Reset area",
    "套用裁切": "Apply crop",
    "輸出尺寸：{width}×{height} px":
      "Output size: {width}×{height} px",
    "無法載入本機原圖。": "Could not load the local original.",
    "無法產生裁切照片。": "Could not create the cropped image.",
    "裁切照片已處理，但找不到新的照片項目。":
      "The cropped photo was processed, but its new item could not be found.",
    "iNaturalist 操作失敗。": "iNaturalist operation failed.",
    "iNaturalist 上傳器沒有回應，請重新掃描。":
      "The iNaturalist uploader did not respond. Rescan the page.",
    "無法載入整理介面樣式。": "Could not load the review workspace styles.",
    "找不到目前分頁。": "Could not find the current tab.",
    "請先開啟 iNaturalist 的上傳頁。":
      "Open the iNaturalist upload page first.",
    "讀不到 iNaturalist 上傳器，請重新整理頁面後再試。":
      "Could not read the iNaturalist uploader. Reload the page and try again.",
    "未知錯誤": "Unknown error",
    "找不到 iNaturalist 上傳器的 React 根節點。":
      "Could not find the iNaturalist uploader React root.",
    "讀不到 iNaturalist 上傳器狀態。請確認照片已載入，或重新整理頁面後再試。":
      "Could not read the iNaturalist uploader state. Make sure photos are loaded or reload the page.",
    "iNaturalist 上傳器尚未準備完成。":
      "The iNaturalist uploader is not ready yet.",
    "這張照片已不在上傳清單中。":
      "This photo is no longer in the upload queue.",
    "目標群組已不存在。": "The target group no longer exists.",
    "這張照片已經在該群組中。": "This photo is already in that group.",
    "這個群組已有 {max} 張照片，iNaturalist 不允許再加入更多。":
      "This group already has {max} photos. iNaturalist does not allow more.",
    "無法合併這張照片，可能已達 iNaturalist 的群組照片上限。":
      "Could not merge this photo. The iNaturalist group limit may have been reached.",
    "無法把這張照片分開成新群組。":
      "Could not split this photo into a new group.",
    "無法從上傳草稿移除這張照片。":
      "Could not remove this photo from the upload draft.",
    "目前 iNaturalist 上傳器不支援加入裁切照片。":
      "The current iNaturalist uploader does not support adding cropped photos.",
    "這個群組已有 {max} 張照片，無法再加入裁切照片。":
      "This group already has {max} photos and cannot accept a crop.",
    "裁切照片資料不完整。": "The cropped photo data is incomplete.",
    "iNaturalist 無法上傳這張裁切照片。":
      "iNaturalist could not upload this cropped photo.",
    "裁切照片上傳失敗，請檢查網路後再試。":
      "Cropped photo upload failed. Check your connection and try again.",
    "裁切照片已上傳，但無法移除草稿中的原照片。":
      "The crop was uploaded, but the original draft photo could not be removed.",
    "目前 iNaturalist 上傳器不支援從插件上傳檔案。":
      "The current iNaturalist uploader does not support uploading from the extension.",
    "沒有選擇要上傳的照片。": "No photos were selected for upload.",
    "照片檔案資料不完整。": "The photo file data is incomplete.",
    "iNaturalist 無法上傳「{name}」。":
      "iNaturalist could not upload “{name}”.",
    "照片上傳尚未完成，請稍後重新掃描。":
      "Photo upload has not completed. Rescan later.",
    "照片沒有加入 iNaturalist 上傳草稿，請重新掃描後再試。":
      "The photos were not added to the iNaturalist upload draft. Rescan and try again.",
    "不支援的操作：{action}": "Unsupported action: {action}",
    "第 {group} 組 · {count} 張": "Group {group} · {count} photos",
    "本機原圖 {matched}/{total}": "Local originals {matched}/{total}",
    "照片": "Photo",
    "本機原檔 {width}×{height}": "Local original {width}×{height}",
    "本機原檔 · 瀏覽器無法預覽": "Local original · Preview unavailable",
    "網頁版本": "Web version",
    "第 {index} 張 · 目前位於第 {group} 組":
      "Photo {index} · Currently in group {group}",
    "併入第 {group} 組": "Merge into group {group}",
    "{count} 張 · 已達 {max} 張上限":
      "{count} photos · Limit of {max} reached",
    "{count} 張照片": "{count} photos",
    "本批完成": "Batch complete"
    ,
    "調整顏色": "Adjust color",
    "使用本機原檔即時調整；套用後會替換目前照片，本機原檔不變。":
      "Adjust from the local original. Applying will replace the current photo; the local file is unchanged.",
    "基本": "Basic",
    "曲線": "Curves",
    "光線": "Light",
    "顏色": "Color",
    "曝光": "Exposure",
    "對比": "Contrast",
    "亮部": "Highlights",
    "陰影": "Shadows",
    "白色": "Whites",
    "黑色": "Blacks",
    "色溫": "Temperature",
    "色調": "Tint",
    "飽和度": "Saturation",
    "鮮豔度": "Vibrance",
    "色相": "Hue",
    "點擊新增控制點，拖曳調整曲線，右鍵刪除控制點。":
      "Click to add a point, drag to adjust the curve, right-click to delete a point.",
    "重設全部": "Reset all",
    "套用調色": "Apply color",
    "正在輸出調色…": "Rendering color adjustments…",
    "無法產生調色照片。": "Could not generate the color-adjusted photo.",
    "正在套用調色…": "Applying color adjustments…",
    "已套用調色，可以繼續整理。":
      "Color adjustments applied. You can continue reviewing.",
    "照片已處理，但找不到新的照片項目。":
      "The photo was processed, but its new item could not be found."
    ,
    "結束": "Finish",
    "按住查看原圖": "Hold to view original",
    "直方圖": "Histogram",
    "雙擊重設": "Double-click to reset"
    ,
    "編輯照片": "Edit photo",
    "裁切": "Crop",
    "調色": "Color",
    "設為第一組": "Set as group 1",
    "以這張照片開始第一組": "Start group 1 with this photo",
    "已設為第一組。": "Set as group 1.",
    "開新組": "New group",
    "新組": "New group",
    "已開新組。": "Created a new group."
  };

  const zhCN = {
    "設定": "设置",
    "開啟設定": "打开设置",
    "一張一張，整理乾淨。": "一张一张，整理干净。",
    "把照片合併到前一組、獨立分開，或直接套用本機原圖裁切。":
      "把照片合并到前一组、独立分开，或直接使用本地原图裁切。",
    "只整理上傳草稿，不會按下「提交觀察」。":
      "只整理上传草稿，不会按下“提交观察”。",
    "重新掃描": "重新扫描",
    "本批上限：": "本批上限：",
    "張": "张",
    "正在開啟整理介面…": "正在打开整理界面…",
    "無法開啟整理介面。": "无法打开整理界面。",
    "重新嘗試": "重新尝试",
    "無法讀取目前頁面。": "无法读取当前页面。",
    "等待上傳頁": "等待上传页",
    "尚未在上傳頁": "尚未在上传页",
    "先開啟 iNaturalist 上傳頁": "请先打开 iNaturalist 上传页",
    "加入照片後，再點一次工具列圖示開始整理。":
      "加入照片后，再点击一次工具栏图标开始整理。",
    "上傳頁已就緒": "上传页已就绪",
    "從插件選擇本機照片": "从插件选择本地照片",
    "不需要使用 iNaturalist 的上傳按鈕；照片會由插件送進上傳器。":
      "不需要使用 iNaturalist 的上传按钮；照片会由插件送进上传器。",
    "張照片": "张照片",
    "開啟並上傳本機照片": "打开并上传本地照片",
    "上次整理還沒完成": "上次整理还没完成",
    "可以開始逐張整理": "可以开始逐张整理",
    "目前進度 {current} / {total}。": "当前进度 {current} / {total}。",
    "本批先處理 {count} 張，完成後可繼續下一批。":
      "本批先处理 {count} 张，完成后可继续下一批。",
    "目前群組": "当前群组",
    "本批上限": "本批上限",
    "繼續逐張整理": "继续逐张整理",
    "處理下一批": "处理下一批",
    "開始逐張整理": "开始逐张整理",
    "暫時無法開始": "暂时无法开始",
    "檢查頁面中": "检查页面中",
    "正在檢查上傳頁…": "正在检查上传页…",
    "整理偏好": "整理偏好",
    "iNaturalist Photo Triage 設定": "iNaturalist Photo Triage 设置",
    "這些設定只會影響逐張整理介面。所有操作都停留在 iNaturalist 上傳草稿，插件不會提交觀察。":
      "这些设置只会影响逐张整理界面。所有操作都停留在 iNaturalist 上传草稿，插件不会提交观察。",
    "每批照片上限": "每批照片上限",
    "1 張": "1 张",
    "100 張": "100 张",
    "每次只把最前面的 N 張照片放進整理佇列。完成後可以從 Popup 或完成畫面繼續下一批。":
      "每次只把最前面的 N 张照片加入整理队列。完成后可从 Popup 或完成页面继续下一批。",
    "操作節奏": "操作节奏",
    "操作後自動前進": "操作后自动前进",
    "按下合併、分開或刪除後，直接顯示下一張。":
      "按下合并、分开或删除后，直接显示下一张。",
    "刪除前再次確認": "删除前再次确认",
    "避免在快速整理時誤刪照片。": "避免在快速整理时误删照片。",
    "顯示照片檔名": "显示照片文件名",
    "在逐張預覽中顯示原始檔名。": "在逐张预览中显示原始文件名。",
    "整理時可用快捷鍵": "整理时可用快捷键",
    "合併到前一組": "合并到前一组",
    "分開": "分开",
    "刪除": "删除",
    "選擇舊群組": "选择旧群组",
    "上一張／下一張": "上一张／下一张",
    "放大／縮小": "放大／缩小",
    "重設縮放": "重置缩放",
    "確認刪除": "确认删除",
    "關閉介面": "关闭界面",
    "恢復預設": "恢复默认",
    "儲存設定": "保存设置",
    "沒有後端 · 沒有帳號資料 · 沒有自動提交":
      "没有后端 · 没有账号数据 · 没有自动提交",
    "語言": "语言",
    "介面語言": "界面语言",
    "套用至 Popup、設定頁和逐張整理介面。":
      "应用于 Popup、设置页和逐张整理界面。",
    "自動（跟隨瀏覽器）": "自动（跟随浏览器）",
    "已儲存 · 每批 {count} 張": "已保存 · 每批 {count} 张",
    "已恢復預設值": "已恢复默认值",
    "逐張整理": "逐张整理",
    "上傳本機照片": "上传本地照片",
    "載入本機原圖": "载入本地原图",
    "載入原圖": "载入原图",
    "只載入本機原圖，不新增上傳": "只载入本地原图，不新增上传",
    "準備中": "准备中",
    "本批 {count} 張": "本批 {count} 张",
    "關閉整理介面": "关闭整理界面",
    "照片 {current} / {total}": "照片 {current} / {total}",
    "第 {group} 組": "第 {group} 组",
    "讀取照片…": "读取照片…",
    "無法載入這張照片的預覽": "无法载入这张照片的预览",
    "照片縮放": "照片缩放",
    "縮小": "缩小",
    "放大": "放大",
    "裁切本機原圖": "裁切本地原图",
    "滾輪縮放 · 放大後可拖曳": "滚轮缩放 · 放大后可拖动",
    "拍攝時間：—": "拍摄时间：—",
    "拍攝時間：{time}": "拍摄时间：{time}",
    "拍攝時間：未提供": "拍摄时间：未提供",
    "正在讀取群組資訊": "正在读取群组信息",
    "上一張照片": "上一张照片",
    "下一張照片": "下一张照片",
    "第 {index} 張": "第 {index} 张",
    "目前是獨立照片": "当前是独立照片",
    "這張目前與另外 {count} 張照片同組":
      "这张目前与另外 {count} 张照片同组",
    "這張目前是獨立照片": "这张目前是独立照片",
    "合併": "合并",
    "併入前一組": "并入前一组",
    "第 {group} 組已有 20 張": "第 {group} 组已有 20 张",
    "前面沒有可合併的群組": "前面没有可合并的群组",
    "分開成獨立群組": "分开成独立群组",
    "只從本次草稿移除": "只从本次草稿移除",
    "以前的群組": "以前的群组",
    "選擇較早的群組": "选择较早的群组",
    "可選擇 {count} 個前一組": "可选择 {count} 个前一组",
    "前一組都已有 20 張": "前一组都已有 20 张",
    "前面沒有較早的群組": "前面没有较早的群组",
    "前面沒有較早的群組。": "前面没有较早的群组。",
    "查看第 {index} 張：{name}": "查看第 {index} 张：{name}",
    "取消": "取消",
    "快捷鍵": "快捷键",
    "瀏覽": "浏览",
    "瀏覽 ·": "浏览 ·",
    "關閉": "关闭",
    "讀取上傳草稿": "读取上传草稿",
    "正在取得照片順序和目前分組…": "正在获取照片顺序和当前分组…",
    "這一批完成了": "这一批完成了",
    "全部照片都整理過了": "全部照片都整理过了",
    "照片已依照你的操作整理。": "照片已按照你的操作整理。",
    "本批 20 張": "本批 20 张",
    "照片 1 / 1": "照片 1 / 1",
    "第 1 組": "第 1 组",
    "第 1 張": "第 1 张",
    "上傳頁還有 {count} 張尚未操作，可以繼續下一批。":
      "上传页还有 {count} 张尚未操作，可以继续下一批。",
    "你可以關閉介面，繼續補上觀察資料，或回到上傳頁檢查分組。":
      "你可以关闭界面，继续补充观察资料，或回到上传页检查分组。",
    "處理下一批 · {count} 張": "处理下一批 · {count} 张",
    "從插件上傳本機照片": "从插件上传本地照片",
    "不需要使用 iNaturalist 的上傳按鈕。選擇本機原檔後，插件會把照片送進目前的上傳草稿。":
      "不需要使用 iNaturalist 的上传按钮。选择本地原文件后，插件会把照片送进当前上传草稿。",
    "選擇本機照片並上傳": "选择本地照片并上传",
    "正在上傳 {count} 張照片": "正在上传 {count} 张照片",
    "正在把本機照片加入 iNaturalist 上傳器。照片出現在草稿後即可開始整理，網站會繼續在背景上傳。":
      "正在把本地照片加入 iNaturalist 上传器。照片出现在草稿后即可开始整理，网站会继续在后台上传。",
    "暫時無法整理": "暂时无法整理",
    "已合併到前面的群組。": "已合并到前面的群组。",
    "已分開成獨立群組。": "已分开成独立群组。",
    "已從本次上傳草稿移除。": "已从本次上传草稿移除。",
    "已套用裁切，可以繼續整理。": "已套用裁切，可以继续整理。",
    "正在套用裁切…": "正在套用裁切…",
    "整理介面已經開啟。": "整理界面已经打开。",
    "已載入 {count} 張本機原圖，匹配 {matched} 張。":
      "已载入 {count} 张本地原图，匹配 {matched} 张。",
    "沒有收到任何檔案，請重新按「上傳本機照片」。":
      "没有收到任何文件，请重新按“上传本地照片”。",
    "已加入 {count} 張照片；iNaturalist 仍在背景上傳 {pending} 張，可以先開始整理。":
      "已加入 {count} 张照片；iNaturalist 仍在后台上传 {pending} 张，可以先开始整理。",
    "已加入 {count} 張照片，但其中 {failed} 張上傳失敗。":
      "已加入 {count} 张照片，但其中 {failed} 张上传失败。",
    "照片沒有加入 iNaturalist 上傳草稿，請重新掃描後再試。":
      "照片没有加入 iNaturalist 上传草稿，请重新扫描后再试。",
    "沒有可用的圖片檔案。": "没有可用的图片文件。",
    "沒有可用的圖片檔案：{detail}": "没有可用的图片文件：{detail}",
    "未知類型": "未知类型",
    "無法讀取圖片。": "无法读取图片。",
    "前面沒有可以合併的群組。": "前面没有可以合并的群组。",
    "第 {group} 組已有 20 張照片。": "第 {group} 组已有 20 张照片。",
    "目標群組已不存在，請重新掃描。": "目标群组已不存在，请重新扫描。",
    "第一張照片不使用": "第一张照片不使用",
    "從目前群組切出": "从当前群组切出",
    "確認為獨立群組": "确认为独立群组",
    "第一張照片不使用 Separate。": "第一张照片不使用 Separate。",
    "請先載入這張照片的本機原圖。": "请先载入这张照片的本地原图。",
    "這個格式無法在瀏覽器中預覽或裁切，但仍可由插件直接上傳。":
      "这个格式无法在浏览器中预览或裁切，但仍可由插件直接上传。",
    "移除這張照片？": "移除这张照片？",
    "照片會從本次上傳草稿移除，不會刪除你電腦上的原始檔案，也不會提交觀察。":
      "照片会从本次上传草稿移除，不会删除你电脑上的原始文件，也不会提交观察。",
    "為避免誤刪，請連按 Enter 兩次": "为避免误删，请连按 Enter 两次",
    "再按一次 Enter 確認刪除": "再按一次 Enter 确认删除",
    "保留照片": "保留照片",
    "從草稿移除": "从草稿移除",
    "再按一次確認刪除": "再按一次确认删除",
    "併入以前的群組": "并入以前的群组",
    "為「{name}」選擇一個較早的群組。":
      "为“{name}”选择一个较早的群组。",
    "來源：{name} · {width}×{height}。套用後會直接把目前照片改成裁切版；本機原檔不會被刪除。":
      "来源：{name} · {width}×{height}。套用后会直接把当前照片改成裁切版；本地原文件不会被删除。",
    "拖曳選取裁切範圍": "拖动选择裁切范围",
    "輸出：PNG 無損": "输出：PNG 无损",
    "輸出：JPEG 98%": "输出：JPEG 98%",
    "重設範圍": "重置范围",
    "套用裁切": "套用裁切",
    "輸出尺寸：{width}×{height} px": "输出尺寸：{width}×{height} px",
    "無法載入本機原圖。": "无法载入本地原图。",
    "無法產生裁切照片。": "无法生成裁切照片。",
    "裁切照片已處理，但找不到新的照片項目。":
      "裁切照片已处理，但找不到新的照片项目。",
    "iNaturalist 操作失敗。": "iNaturalist 操作失败。",
    "iNaturalist 上傳器沒有回應，請重新掃描。":
      "iNaturalist 上传器没有响应，请重新扫描。",
    "無法載入整理介面樣式。": "无法载入整理界面样式。",
    "第 {group} 組 · {count} 張": "第 {group} 组 · {count} 张",
    "本機原圖 {matched}/{total}": "本地原图 {matched}/{total}",
    "照片": "照片",
    "本機原檔 {width}×{height}": "本地原文件 {width}×{height}",
    "本機原檔 · 瀏覽器無法預覽": "本地原文件 · 浏览器无法预览",
    "網頁版本": "网页版本",
    "第 {index} 張 · 目前位於第 {group} 組":
      "第 {index} 张 · 当前位于第 {group} 组",
    "併入第 {group} 組": "并入第 {group} 组",
    "{count} 張 · 已達 {max} 張上限":
      "{count} 张 · 已达 {max} 张上限",
    "{count} 張照片": "{count} 张照片",
    "本批完成": "本批完成"
    ,
    "調整顏色": "调整颜色",
    "使用本機原檔即時調整；套用後會替換目前照片，本機原檔不變。":
      "使用本地原文件实时调整；套用后会替换当前照片，本地原文件不变。",
    "基本": "基本",
    "曲線": "曲线",
    "光線": "光线",
    "顏色": "颜色",
    "曝光": "曝光",
    "對比": "对比",
    "亮部": "高光",
    "陰影": "阴影",
    "白色": "白色",
    "黑色": "黑色",
    "色溫": "色温",
    "色調": "色调",
    "飽和度": "饱和度",
    "鮮豔度": "鲜艳度",
    "色相": "色相",
    "點擊新增控制點，拖曳調整曲線，右鍵刪除控制點。":
      "点击添加控制点，拖动调整曲线，右键删除控制点。",
    "重設全部": "重置全部",
    "套用調色": "套用调色",
    "正在輸出調色…": "正在输出调色…",
    "無法產生調色照片。": "无法生成调色照片。",
    "正在套用調色…": "正在套用调色…",
    "已套用調色，可以繼續整理。": "已套用调色，可以继续整理。",
    "照片已處理，但找不到新的照片項目。":
      "照片已处理，但找不到新的照片项目。"
    ,
    "結束": "结束",
    "按住查看原圖": "按住查看原图",
    "直方圖": "直方图",
    "雙擊重設": "双击重置"
    ,
    "編輯照片": "编辑照片",
    "裁切": "裁切",
    "調色": "调色",
    "設為第一組": "设为第一组",
    "以這張照片開始第一組": "以这张照片开始第一组",
    "已設為第一組。": "已设为第一组。",
    "開新組": "开新组",
    "新組": "新组",
    "已開新組。": "已开新组。"
  };

  const ja = {
    "設定": "設定",
    "開啟設定": "設定を開く",
    "一張一張，整理乾淨。": "1枚ずつ、きれいに整理。",
    "把照片合併到前一組、獨立分開，或直接套用本機原圖裁切。":
      "前のグループに結合、独立したグループに分割、またはローカル原画像でトリミングできます。",
    "只整理上傳草稿，不會按下「提交觀察」。":
      "アップロード下書きのみを整理し、観察は送信しません。",
    "重新掃描": "再スキャン",
    "本批上限：": "バッチ上限：",
    "張": "枚",
    "正在開啟整理介面…": "整理画面を開いています…",
    "無法開啟整理介面。": "整理画面を開けませんでした。",
    "重新嘗試": "再試行",
    "無法讀取目前頁面。": "現在のページを読み取れません。",
    "等待上傳頁": "アップロードページ待ち",
    "尚未在上傳頁": "アップロードページではありません",
    "先開啟 iNaturalist 上傳頁": "先に iNaturalist のアップロードページを開いてください",
    "加入照片後，再點一次工具列圖示開始整理。":
      "写真を追加してから、ツールバーのアイコンをもう一度クリックしてください。",
    "上傳頁已就緒": "アップロードページ準備完了",
    "從插件選擇本機照片": "拡張機能からローカル写真を選択",
    "不需要使用 iNaturalist 的上傳按鈕；照片會由插件送進上傳器。":
      "iNaturalist のアップロードボタンは不要です。写真は拡張機能からアップローダーへ送られます。",
    "張照片": "枚の写真",
    "開啟並上傳本機照片": "開いてローカル写真をアップロード",
    "上次整理還沒完成": "前回の整理が未完了です",
    "可以開始逐張整理": "1枚ずつの整理を開始できます",
    "目前進度 {current} / {total}。": "進捗 {current} / {total}。",
    "本批先處理 {count} 張，完成後可繼續下一批。":
      "このバッチでは {count} 枚を処理します。完了後に次へ進めます。",
    "目前群組": "現在のグループ",
    "本批上限": "バッチ上限",
    "繼續逐張整理": "整理を続ける",
    "處理下一批": "次のバッチ",
    "開始逐張整理": "整理を開始",
    "暫時無法開始": "開始できません",
    "檢查頁面中": "ページを確認中",
    "正在檢查上傳頁…": "アップロードページを確認中…",
    "整理偏好": "整理の設定",
    "iNaturalist Photo Triage 設定": "iNaturalist Photo Triage 設定",
    "這些設定只會影響逐張整理介面。所有操作都停留在 iNaturalist 上傳草稿，插件不會提交觀察。":
      "これらの設定は整理画面にのみ影響します。操作は iNaturalist の下書き内に留まり、観察は送信されません。",
    "每批照片上限": "バッチごとの写真数",
    "1 張": "1 枚",
    "100 張": "100 枚",
    "每次只把最前面的 N 張照片放進整理佇列。完成後可以從 Popup 或完成畫面繼續下一批。":
      "各バッチでは先頭の N 枚だけをキューに入れます。完了後、ポップアップまたは完了画面から次へ進めます。",
    "操作節奏": "操作の動作",
    "操作後自動前進": "操作後に自動で次へ",
    "按下合併、分開或刪除後，直接顯示下一張。":
      "結合・分割・削除の後に次の写真を表示します。",
    "刪除前再次確認": "削除前に再確認",
    "避免在快速整理時誤刪照片。": "素早い整理中の誤削除を防ぎます。",
    "顯示照片檔名": "ファイル名を表示",
    "在逐張預覽中顯示原始檔名。": "整理画面に元のファイル名を表示します。",
    "整理時可用快捷鍵": "キーボードショートカット",
    "合併到前一組": "前のグループに結合",
    "分開": "分割",
    "刪除": "削除",
    "選擇舊群組": "以前のグループを選択",
    "上一張／下一張": "前／次の写真",
    "放大／縮小": "拡大／縮小",
    "重設縮放": "ズームをリセット",
    "確認刪除": "削除を確認",
    "關閉介面": "画面を閉じる",
    "恢復預設": "既定値に戻す",
    "儲存設定": "設定を保存",
    "沒有後端 · 沒有帳號資料 · 沒有自動提交":
      "バックエンドなし · アカウントデータなし · 自動送信なし",
    "語言": "言語",
    "介面語言": "表示言語",
    "套用至 Popup、設定頁和逐張整理介面。":
      "Popup、設定ページ、整理画面に適用されます。",
    "自動（跟隨瀏覽器）": "自動（ブラウザに従う）",
    "已儲存 · 每批 {count} 張": "保存しました · 1バッチ {count} 枚",
    "已恢復預設值": "既定値に戻しました",
    "逐張整理": "写真を1枚ずつ整理",
    "上傳本機照片": "ローカル写真をアップロード",
    "載入本機原圖": "ローカル原画像を読み込む",
    "載入原圖": "原画像を読み込む",
    "只載入本機原圖，不新增上傳": "ローカル原画像のみ読み込み、アップロードしない",
    "準備中": "準備中",
    "本批 {count} 張": "このバッチ {count} 枚",
    "關閉整理介面": "整理画面を閉じる",
    "照片 {current} / {total}": "写真 {current} / {total}",
    "第 {group} 組": "グループ {group}",
    "讀取照片…": "写真を読み込み中…",
    "無法載入這張照片的預覽": "この写真のプレビューを読み込めません",
    "照片縮放": "写真のズーム",
    "縮小": "縮小",
    "放大": "拡大",
    "裁切本機原圖": "ローカル原画像をトリミング",
    "滾輪縮放 · 放大後可拖曳": "スクロールでズーム · 拡大後はドラッグ",
    "拍攝時間：—": "撮影日時：—",
    "拍攝時間：{time}": "撮影日時：{time}",
    "拍攝時間：未提供": "撮影日時：なし",
    "正在讀取群組資訊": "グループ情報を読み込み中",
    "上一張照片": "前の写真",
    "下一張照片": "次の写真",
    "第 {index} 張": "{index} 枚目",
    "目前是獨立照片": "現在は独立した写真です",
    "這張目前與另外 {count} 張照片同組":
      "この写真は他 {count} 枚と同じグループです",
    "這張目前是獨立照片": "この写真は現在独立しています",
    "合併": "結合",
    "併入前一組": "前のグループに結合",
    "第 {group} 組已有 20 張": "グループ {group} は既に 20 枚です",
    "前面沒有可合併的群組": "結合できる前のグループがありません",
    "分開成獨立群組": "独立したグループに分割",
    "只從本次草稿移除": "この下書きからのみ削除",
    "以前的群組": "以前のグループ",
    "選擇較早的群組": "以前のグループを選択",
    "可選擇 {count} 個前一組": "{count} 個の前のグループを選択可能",
    "前一組都已有 20 張": "前のグループはすべて 20 枚です",
    "前面沒有較早的群組": "以前のグループがありません",
    "前面沒有較早的群組。": "以前のグループがありません。",
    "查看第 {index} 張：{name}": "{index} 枚目を表示：{name}",
    "取消": "キャンセル",
    "快捷鍵": "ショートカット",
    "瀏覽": "移動",
    "瀏覽 ·": "移動 ·",
    "關閉": "閉じる",
    "讀取上傳草稿": "アップロード下書きを読み込み中",
    "正在取得照片順序和目前分組…": "写真の順序と現在のグループを取得中…",
    "這一批完成了": "このバッチは完了しました",
    "全部照片都整理過了": "すべての写真を整理しました",
    "照片已依照你的操作整理。": "写真は操作どおりに整理されました。",
    "本批 20 張": "このバッチ 20 枚",
    "照片 1 / 1": "写真 1 / 1",
    "第 1 組": "グループ 1",
    "第 1 張": "1 枚目",
    "上傳頁還有 {count} 張尚未操作，可以繼續下一批。":
      "未処理の写真が {count} 枚あります。次のバッチへ進めます。",
    "你可以關閉介面，繼續補上觀察資料，或回到上傳頁檢查分組。":
      "画面を閉じて観察情報を補完するか、アップロードページでグループを確認してください。",
    "處理下一批 · {count} 張": "次のバッチ · {count} 枚",
    "從插件上傳本機照片": "拡張機能からローカル写真をアップロード",
    "不需要使用 iNaturalist 的上傳按鈕。選擇本機原檔後，插件會把照片送進目前的上傳草稿。":
      "iNaturalist のアップロードボタンは不要です。ローカル原画像を選ぶと、拡張機能が現在の下書きへ送ります。",
    "選擇本機照片並上傳": "ローカル写真を選んでアップロード",
    "正在上傳 {count} 張照片": "{count} 枚の写真をアップロード中",
    "正在把本機照片加入 iNaturalist 上傳器。照片出現在草稿後即可開始整理，網站會繼續在背景上傳。":
      "ローカル写真を iNaturalist アップローダーへ追加中です。下書きに表示されたら整理を開始できます。アップロードはバックグラウンドで続きます。",
    "暫時無法整理": "現在は整理できません",
    "已合併到前面的群組。": "前のグループに結合しました。",
    "已分開成獨立群組。": "独立したグループに分割しました。",
    "已從本次上傳草稿移除。": "このアップロード下書きから削除しました。",
    "已套用裁切，可以繼續整理。": "トリミングを適用しました。整理を続けられます。",
    "正在套用裁切…": "トリミングを適用中…",
    "整理介面已經開啟。": "整理画面は既に開いています。",
    "已載入 {count} 張本機原圖，匹配 {matched} 張。":
      "ローカル原画像を {count} 枚読み込み、{matched} 枚と一致しました。",
    "沒有收到任何檔案，請重新按「上傳本機照片」。":
      "ファイルを受信できませんでした。「ローカル写真をアップロード」を再度押してください。",
    "已加入 {count} 張照片；iNaturalist 仍在背景上傳 {pending} 張，可以先開始整理。":
      "{count} 枚を追加しました。残り {pending} 枚は iNaturalist がバックグラウンドでアップロード中です。整理を開始できます。",
    "已加入 {count} 張照片，但其中 {failed} 張上傳失敗。":
      "{count} 枚を追加しましたが、{failed} 枚のアップロードに失敗しました。",
    "照片沒有加入 iNaturalist 上傳草稿，請重新掃描後再試。":
      "写真が iNaturalist のアップロード下書きに追加されませんでした。再スキャンしてからもう一度お試しください。",
    "沒有可用的圖片檔案。": "使用できる画像ファイルがありません。",
    "沒有可用的圖片檔案：{detail}": "使用できる画像ファイルがありません：{detail}",
    "未知類型": "不明な種類",
    "無法讀取圖片。": "画像を読み込めません。",
    "前面沒有可以合併的群組。": "結合できる前のグループがありません。",
    "第 {group} 組已有 20 張照片。": "グループ {group} は既に 20 枚です。",
    "目標群組已不存在，請重新掃描。": "対象グループがありません。再スキャンしてください。",
    "第一張照片不使用": "最初の写真では使用できません",
    "從目前群組切出": "現在のグループから切り離す",
    "確認為獨立群組": "独立グループとして維持",
    "第一張照片不使用 Separate。": "最初の写真では Separate を使用できません。",
    "請先載入這張照片的本機原圖。": "先にこの写真のローカル原画像を読み込んでください。",
    "這個格式無法在瀏覽器中預覽或裁切，但仍可由插件直接上傳。":
      "この形式はブラウザでプレビュー・トリミングできませんが、拡張機能からアップロードできます。",
    "移除這張照片？": "この写真を削除しますか？",
    "照片會從本次上傳草稿移除，不會刪除你電腦上的原始檔案，也不會提交觀察。":
      "写真はこのアップロード下書きから削除されます。ローカルファイルは削除されず、観察も送信されません。",
    "為避免誤刪，請連按 Enter 兩次": "誤削除を防ぐため、Enter を2回押してください",
    "再按一次 Enter 確認刪除": "もう一度 Enter を押して削除を確定",
    "保留照片": "写真を残す",
    "從草稿移除": "下書きから削除",
    "再按一次確認刪除": "もう一度押して削除を確定",
    "併入以前的群組": "以前のグループに結合",
    "為「{name}」選擇一個較早的群組。": "「{name}」を結合する以前のグループを選択してください。",
    "來源：{name} · {width}×{height}。套用後會直接把目前照片改成裁切版；本機原檔不會被刪除。":
      "元画像：{name} · {width}×{height}。適用すると現在の写真がトリミング版に置き換わります。ローカル原画像は削除されません。",
    "拖曳選取裁切範圍": "ドラッグしてトリミング範囲を選択",
    "輸出：PNG 無損": "出力：PNG 可逆圧縮",
    "輸出：JPEG 98%": "出力：JPEG 98%",
    "重設範圍": "範囲をリセット",
    "套用裁切": "トリミングを適用",
    "輸出尺寸：{width}×{height} px": "出力サイズ：{width}×{height} px",
    "無法載入本機原圖。": "ローカル原画像を読み込めません。",
    "無法產生裁切照片。": "トリミング画像を作成できません。",
    "裁切照片已處理，但找不到新的照片項目。":
      "トリミング画像は処理されましたが、新しい写真項目が見つかりません。",
    "iNaturalist 操作失敗。": "iNaturalist の操作に失敗しました。",
    "iNaturalist 上傳器沒有回應，請重新掃描。":
      "iNaturalist アップローダーが応答しません。再スキャンしてください。",
    "無法載入整理介面樣式。": "整理画面のスタイルを読み込めません。",
    "第 {group} 組 · {count} 張": "グループ {group} · {count} 枚",
    "本機原圖 {matched}/{total}": "ローカル原画像 {matched}/{total}",
    "照片": "写真",
    "本機原檔 {width}×{height}": "ローカル原画像 {width}×{height}",
    "本機原檔 · 瀏覽器無法預覽": "ローカル原画像 · プレビュー不可",
    "網頁版本": "ウェブ版",
    "第 {index} 張 · 目前位於第 {group} 組":
      "{index} 枚目 · 現在グループ {group}",
    "併入第 {group} 組": "グループ {group} に結合",
    "{count} 張 · 已達 {max} 張上限":
      "{count} 枚 · 上限 {max} 枚に到達",
    "{count} 張照片": "{count} 枚の写真",
    "本批完成": "バッチ完了"
    ,
    "調整顏色": "色を調整",
    "使用本機原檔即時調整；套用後會替換目前照片，本機原檔不變。":
      "ローカル原画像からリアルタイム調整します。適用すると現在の写真が置き換わり、ローカルファイルは変更されません。",
    "基本": "基本",
    "曲線": "トーンカーブ",
    "光線": "ライト",
    "顏色": "カラー",
    "曝光": "露出",
    "對比": "コントラスト",
    "亮部": "ハイライト",
    "陰影": "シャドウ",
    "白色": "白レベル",
    "黑色": "黒レベル",
    "色溫": "色温度",
    "色調": "色合い",
    "飽和度": "彩度",
    "鮮豔度": "自然な彩度",
    "色相": "色相",
    "點擊新增控制點，拖曳調整曲線，右鍵刪除控制點。":
      "クリックで点を追加、ドラッグで調整、右クリックで点を削除します。",
    "重設全部": "すべてリセット",
    "套用調色": "色調整を適用",
    "正在輸出調色…": "色調整を出力中…",
    "無法產生調色照片。": "色調整済み画像を作成できません。",
    "正在套用調色…": "色調整を適用中…",
    "已套用調色，可以繼續整理。": "色調整を適用しました。整理を続けられます。",
    "照片已處理，但找不到新的照片項目。":
      "写真は処理されましたが、新しい項目が見つかりません。"
    ,
    "結束": "終了",
    "按住查看原圖": "長押しで元画像を表示",
    "直方圖": "ヒストグラム",
    "雙擊重設": "ダブルクリックでリセット"
    ,
    "編輯照片": "写真を編集",
    "裁切": "トリミング",
    "調色": "色調整",
    "設為第一組": "グループ1に設定",
    "以這張照片開始第一組": "この写真からグループ1を開始",
    "已設為第一組。": "グループ1に設定しました。",
    "開新組": "新しいグループ",
    "新組": "新しいグループ",
    "已開新組。": "新しいグループを作成しました。"
  };

  const es = {
    "設定": "Ajustes",
    "開啟設定": "Abrir ajustes",
    "一張一張，整理乾淨。": "Una por una. Todo en orden.",
    "把照片合併到前一組、獨立分開，或直接套用本機原圖裁切。":
      "Combina con el grupo anterior, separa o recorta desde el original local.",
    "只整理上傳草稿，不會按下「提交觀察」。":
      "Solo trabaja con borradores; nunca envía observaciones.",
    "重新掃描": "Volver a escanear",
    "本批上限：": "Límite del lote:",
    "張": "fotos",
    "正在開啟整理介面…": "Abriendo el espacio de revisión…",
    "無法開啟整理介面。": "No se pudo abrir el espacio de revisión.",
    "重新嘗試": "Reintentar",
    "無法讀取目前頁面。": "No se pudo leer la página actual.",
    "等待上傳頁": "Esperando la página de carga",
    "尚未在上傳頁": "No estás en la página de carga",
    "先開啟 iNaturalist 上傳頁": "Abre primero la página de carga de iNaturalist",
    "加入照片後，再點一次工具列圖示開始整理。":
      "Añade fotos y vuelve a pulsar el icono de la extensión.",
    "上傳頁已就緒": "Página de carga lista",
    "從插件選擇本機照片": "Elige fotos locales desde la extensión",
    "不需要使用 iNaturalist 的上傳按鈕；照片會由插件送進上傳器。":
      "No necesitas el botón de carga de iNaturalist; la extensión envía los archivos al cargador.",
    "張照片": "fotos",
    "開啟並上傳本機照片": "Abrir y subir fotos locales",
    "上次整理還沒完成": "La revisión anterior sigue en curso",
    "可以開始逐張整理": "Listo para revisar una por una",
    "目前進度 {current} / {total}。": "Progreso: {current} / {total}.",
    "本批先處理 {count} 張，完成後可繼續下一批。":
      "Este lote empieza con {count} fotos. Puedes continuar con otro lote al terminar.",
    "目前群組": "Grupos actuales",
    "本批上限": "Límite del lote",
    "繼續逐張整理": "Continuar revisión",
    "處理下一批": "Siguiente lote",
    "開始逐張整理": "Iniciar revisión",
    "暫時無法開始": "Aún no se puede iniciar",
    "檢查頁面中": "Comprobando página",
    "正在檢查上傳頁…": "Comprobando la página de carga…",
    "整理偏好": "Preferencias de revisión",
    "iNaturalist Photo Triage 設定": "Ajustes de iNaturalist Photo Triage",
    "這些設定只會影響逐張整理介面。所有操作都停留在 iNaturalist 上傳草稿，插件不會提交觀察。":
      "Estos ajustes solo afectan al espacio de revisión. Todas las acciones permanecen en el borrador de iNaturalist y la extensión nunca envía observaciones.",
    "每批照片上限": "Fotos por lote",
    "1 張": "1 foto",
    "100 張": "100 fotos",
    "每次只把最前面的 N 張照片放進整理佇列。完成後可以從 Popup 或完成畫面繼續下一批。":
      "Cada cola incluye solo las primeras N fotos. Al terminar, continúa desde el popup o la pantalla final.",
    "操作節奏": "Comportamiento",
    "操作後自動前進": "Avanzar automáticamente",
    "按下合併、分開或刪除後，直接顯示下一張。":
      "Mostrar la siguiente foto después de combinar, separar o eliminar.",
    "刪除前再次確認": "Confirmar antes de eliminar",
    "避免在快速整理時誤刪照片。":
      "Evita eliminar fotos por error durante una revisión rápida.",
    "顯示照片檔名": "Mostrar nombres de archivo",
    "在逐張預覽中顯示原始檔名。": "Mostrar el nombre original en la revisión.",
    "整理時可用快捷鍵": "Atajos de teclado",
    "合併到前一組": "Combinar con el grupo anterior",
    "分開": "Separar",
    "刪除": "Eliminar",
    "選擇舊群組": "Elegir un grupo anterior",
    "上一張／下一張": "Foto anterior / siguiente",
    "放大／縮小": "Ampliar / reducir",
    "重設縮放": "Restablecer zoom",
    "確認刪除": "Confirmar eliminación",
    "關閉介面": "Cerrar espacio",
    "恢復預設": "Restaurar valores",
    "儲存設定": "Guardar ajustes",
    "沒有後端 · 沒有帳號資料 · 沒有自動提交":
      "Sin servidor · Sin datos de cuenta · Sin envío automático",
    "語言": "Idioma",
    "介面語言": "Idioma de la interfaz",
    "套用至 Popup、設定頁和逐張整理介面。":
      "Se aplica al popup, a los ajustes y al espacio de revisión.",
    "自動（跟隨瀏覽器）": "Automático (seguir navegador)",
    "已儲存 · 每批 {count} 張": "Guardado · {count} fotos por lote",
    "已恢復預設值": "Valores restaurados",
    "逐張整理": "Revisión de fotos",
    "上傳本機照片": "Subir fotos locales",
    "載入本機原圖": "Cargar originales locales",
    "載入原圖": "Cargar originales",
    "只載入本機原圖，不新增上傳": "Cargar solo originales, sin subirlos",
    "準備中": "Preparando",
    "本批 {count} 張": "Lote: {count}",
    "關閉整理介面": "Cerrar revisión",
    "照片 {current} / {total}": "Foto {current} / {total}",
    "第 {group} 組": "Grupo {group}",
    "讀取照片…": "Cargando foto…",
    "無法載入這張照片的預覽": "No se pudo cargar la vista previa",
    "照片縮放": "Zoom de foto",
    "縮小": "Reducir",
    "放大": "Ampliar",
    "裁切本機原圖": "Recortar original local",
    "滾輪縮放 · 放大後可拖曳": "Rueda para zoom · Arrastra al ampliar",
    "拍攝時間：—": "Tomada: —",
    "拍攝時間：{time}": "Tomada: {time}",
    "拍攝時間：未提供": "Tomada: No disponible",
    "正在讀取群組資訊": "Leyendo información del grupo",
    "上一張照片": "Foto anterior",
    "下一張照片": "Foto siguiente",
    "第 {index} 張": "Foto {index}",
    "目前是獨立照片": "Actualmente es una foto independiente",
    "這張目前與另外 {count} 張照片同組":
      "Esta foto está agrupada con otras {count}",
    "這張目前是獨立照片": "Esta foto es actualmente independiente",
    "合併": "Combinar",
    "併入前一組": "Combinar con el grupo anterior",
    "第 {group} 組已有 20 張": "El grupo {group} ya tiene 20 fotos",
    "前面沒有可合併的群組": "No hay un grupo anterior para combinar",
    "分開成獨立群組": "Separar en un grupo independiente",
    "只從本次草稿移除": "Quitar solo de este borrador",
    "以前的群組": "Grupos anteriores",
    "選擇較早的群組": "Elegir un grupo anterior",
    "可選擇 {count} 個前一組": "{count} grupos anteriores disponibles",
    "前一組都已有 20 張": "Todos los grupos anteriores tienen 20 fotos",
    "前面沒有較早的群組": "No hay grupos anteriores",
    "前面沒有較早的群組。": "No hay grupos anteriores.",
    "查看第 {index} 張：{name}": "Ver foto {index}: {name}",
    "取消": "Cancelar",
    "快捷鍵": "Atajos",
    "瀏覽": "Navegar",
    "瀏覽 ·": "Navegar ·",
    "關閉": "Cerrar",
    "讀取上傳草稿": "Cargando borrador",
    "正在取得照片順序和目前分組…":
      "Leyendo el orden de fotos y los grupos actuales…",
    "這一批完成了": "Este lote está completo",
    "全部照片都整理過了": "Todas las fotos han sido revisadas",
    "照片已依照你的操作整理。": "Las fotos se han organizado según tus acciones.",
    "本批 20 張": "Lote: 20",
    "照片 1 / 1": "Foto 1 / 1",
    "第 1 組": "Grupo 1",
    "第 1 張": "Foto 1",
    "上傳頁還有 {count} 張尚未操作，可以繼續下一批。":
      "Quedan {count} fotos sin procesar. Puedes continuar con otro lote.",
    "你可以關閉介面，繼續補上觀察資料，或回到上傳頁檢查分組。":
      "Cierra el espacio, completa los datos de observación o vuelve a la página de carga para revisar los grupos.",
    "處理下一批 · {count} 張": "Siguiente lote · {count}",
    "從插件上傳本機照片": "Subir fotos locales desde la extensión",
    "不需要使用 iNaturalist 的上傳按鈕。選擇本機原檔後，插件會把照片送進目前的上傳草稿。":
      "No necesitas el botón de carga de iNaturalist. Elige originales locales y la extensión los enviará al borrador actual.",
    "選擇本機照片並上傳": "Elegir fotos locales y subir",
    "正在上傳 {count} 張照片": "Subiendo {count} fotos",
    "正在把本機照片加入 iNaturalist 上傳器。照片出現在草稿後即可開始整理，網站會繼續在背景上傳。":
      "Añadiendo fotos locales al cargador de iNaturalist. Puedes empezar la revisión cuando aparezcan en el borrador; iNaturalist seguirá subiéndolas en segundo plano.",
    "暫時無法整理": "No se puede revisar ahora",
    "已合併到前面的群組。": "Combinada con el grupo anterior.",
    "已分開成獨立群組。": "Separada en un grupo independiente.",
    "已從本次上傳草稿移除。": "Eliminada de este borrador.",
    "已套用裁切，可以繼續整理。":
      "Recorte aplicado. Puedes continuar.",
    "正在套用裁切…": "Aplicando recorte…",
    "整理介面已經開啟。": "La revisión ya está abierta.",
    "已載入 {count} 張本機原圖，匹配 {matched} 張。":
      "Se cargaron {count} originales y coinciden {matched} fotos.",
    "沒有收到任何檔案，請重新按「上傳本機照片」。":
      "No se recibieron archivos. Pulsa «Subir fotos locales» de nuevo.",
    "已加入 {count} 張照片；iNaturalist 仍在背景上傳 {pending} 張，可以先開始整理。":
      "Se añadieron {count} fotos. iNaturalist sigue subiendo {pending} en segundo plano; puedes empezar a revisar.",
    "已加入 {count} 張照片，但其中 {failed} 張上傳失敗。":
      "Se añadieron {count} fotos, pero {failed} no se pudieron subir.",
    "照片沒有加入 iNaturalist 上傳草稿，請重新掃描後再試。":
      "Las fotos no se añadieron al borrador de iNaturalist. Vuelve a escanear e inténtalo de nuevo.",
    "沒有可用的圖片檔案。": "No se encontraron imágenes utilizables.",
    "沒有可用的圖片檔案：{detail}": "No se encontraron imágenes utilizables: {detail}",
    "未知類型": "tipo desconocido",
    "無法讀取圖片。": "No se pudo leer la imagen.",
    "前面沒有可以合併的群組。": "No hay un grupo anterior para combinar.",
    "第 {group} 組已有 20 張照片。": "El grupo {group} ya tiene 20 fotos.",
    "目標群組已不存在，請重新掃描。":
      "El grupo de destino ya no existe. Vuelve a escanear.",
    "第一張照片不使用": "No disponible para la primera foto",
    "從目前群組切出": "Separar del grupo actual",
    "確認為獨立群組": "Mantener como grupo independiente",
    "第一張照片不使用 Separate。":
      "Separate no está disponible para la primera foto.",
    "請先載入這張照片的本機原圖。":
      "Carga primero el original local de esta foto.",
    "這個格式無法在瀏覽器中預覽或裁切，但仍可由插件直接上傳。":
      "Este formato no se puede previsualizar ni recortar aquí, pero sí subir desde la extensión.",
    "移除這張照片？": "¿Quitar esta foto?",
    "照片會從本次上傳草稿移除，不會刪除你電腦上的原始檔案，也不會提交觀察。":
      "La foto se quitará de este borrador. Tu archivo local no se borrará y no se enviará ninguna observación.",
    "為避免誤刪，請連按 Enter 兩次":
      "Para evitar errores, pulsa Enter dos veces.",
    "再按一次 Enter 確認刪除": "Pulsa Enter otra vez para confirmar",
    "保留照片": "Conservar foto",
    "從草稿移除": "Quitar del borrador",
    "再按一次確認刪除": "Confirmar eliminación",
    "併入以前的群組": "Combinar con un grupo anterior",
    "為「{name}」選擇一個較早的群組。":
      "Elige un grupo anterior para «{name}».",
    "來源：{name} · {width}×{height}。套用後會直接把目前照片改成裁切版；本機原檔不會被刪除。":
      "Origen: {name} · {width}×{height}. Al aplicar, la foto actual se sustituirá por el recorte. El original local no se elimina.",
    "拖曳選取裁切範圍": "Arrastra para seleccionar el recorte",
    "輸出：PNG 無損": "Salida: PNG sin pérdida",
    "輸出：JPEG 98%": "Salida: JPEG 98%",
    "重設範圍": "Restablecer área",
    "套用裁切": "Aplicar recorte",
    "輸出尺寸：{width}×{height} px":
      "Tamaño de salida: {width}×{height} px",
    "無法載入本機原圖。": "No se pudo cargar el original local.",
    "無法產生裁切照片。": "No se pudo generar el recorte.",
    "裁切照片已處理，但找不到新的照片項目。":
      "El recorte se procesó, pero no se encontró el nuevo elemento.",
    "iNaturalist 操作失敗。": "La operación de iNaturalist falló.",
    "iNaturalist 上傳器沒有回應，請重新掃描。":
      "El cargador de iNaturalist no respondió. Vuelve a escanear.",
    "無法載入整理介面樣式。":
      "No se pudieron cargar los estilos de la revisión.",
    "第 {group} 組 · {count} 張": "Grupo {group} · {count} fotos",
    "本機原圖 {matched}/{total}": "Originales locales {matched}/{total}",
    "照片": "Foto",
    "本機原檔 {width}×{height}": "Original local {width}×{height}",
    "本機原檔 · 瀏覽器無法預覽":
      "Original local · Vista previa no disponible",
    "網頁版本": "Versión web",
    "第 {index} 張 · 目前位於第 {group} 組":
      "Foto {index} · Actualmente en el grupo {group}",
    "併入第 {group} 組": "Combinar con el grupo {group}",
    "{count} 張 · 已達 {max} 張上限":
      "{count} fotos · Límite de {max} alcanzado",
    "{count} 張照片": "{count} fotos",
    "本批完成": "Lote completado"
    ,
    "調整顏色": "Ajustar color",
    "使用本機原檔即時調整；套用後會替換目前照片，本機原檔不變。":
      "Ajusta desde el original local. Al aplicar, la foto actual se sustituye; el archivo local no cambia.",
    "基本": "Básico",
    "曲線": "Curvas",
    "光線": "Luz",
    "顏色": "Color",
    "曝光": "Exposición",
    "對比": "Contraste",
    "亮部": "Luces",
    "陰影": "Sombras",
    "白色": "Blancos",
    "黑色": "Negros",
    "色溫": "Temperatura",
    "色調": "Matiz",
    "飽和度": "Saturación",
    "鮮豔度": "Intensidad",
    "色相": "Tono",
    "點擊新增控制點，拖曳調整曲線，右鍵刪除控制點。":
      "Haz clic para añadir un punto, arrastra para ajustar y haz clic derecho para eliminarlo.",
    "重設全部": "Restablecer todo",
    "套用調色": "Aplicar color",
    "正在輸出調色…": "Generando ajustes de color…",
    "無法產生調色照片。": "No se pudo generar la foto ajustada.",
    "正在套用調色…": "Aplicando ajustes de color…",
    "已套用調色，可以繼續整理。":
      "Ajustes aplicados. Puedes continuar.",
    "照片已處理，但找不到新的照片項目。":
      "La foto se procesó, pero no se encontró el nuevo elemento."
    ,
    "結束": "Finalizar",
    "按住查看原圖": "Mantener para ver el original",
    "直方圖": "Histograma",
    "雙擊重設": "Doble clic para restablecer"
    ,
    "編輯照片": "Editar foto",
    "裁切": "Recortar",
    "調色": "Color",
    "設為第一組": "Establecer como grupo 1",
    "以這張照片開始第一組": "Comenzar el grupo 1 con esta foto",
    "已設為第一組。": "Establecido como grupo 1.",
    "開新組": "Nuevo grupo",
    "新組": "Nuevo grupo",
    "已開新組。": "Nuevo grupo creado."
  };

  const dictionaries = {
    en,
    "zh-CN": zhCN,
    ja,
    es
  };

  let setting = "auto";
  let locale = "en";

  function resolveLocale(value) {
    if (value && value !== "auto") {
      if (SUPPORTED.some(item => item.code === value)) {
        return value;
      }
    }

    const browserLocale = String(
      globalThis.navigator?.language || "en"
    ).toLowerCase();
    if (browserLocale.startsWith("zh")) {
      return browserLocale.includes("cn") || browserLocale.includes("sg")
        ? "zh-CN"
        : "zh-TW";
    }
    if (browserLocale.startsWith("ja")) {
      return "ja";
    }
    if (browserLocale.startsWith("es")) {
      return "es";
    }
    return "en";
  }

  function setLanguage(value) {
    setting = value || "auto";
    locale = resolveLocale(setting);
    return locale;
  }

  function translate(source) {
    if (locale === "zh-TW") {
      return source;
    }
    return (
      dictionaries[locale]?.[source] ||
      dictionaries.en[source] ||
      source
    );
  }

  function t(source, variables = {}) {
    return String(translate(source)).replace(
      /\{(\w+)\}/g,
      (match, key) =>
        variables[key] === undefined ? match : String(variables[key])
    );
  }

  function translateDom(root = document) {
    if (!root) {
      return;
    }

    const documentRef = root.ownerDocument || root;
    const walker = documentRef.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT
    );
    const textNodes = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const parent = node.parentElement;
      if (
        !parent ||
        ["SCRIPT", "STYLE", "TEXTAREA"].includes(parent.tagName)
      ) {
        continue;
      }
      textNodes.push(node);
    }

    for (const node of textNodes) {
      const raw = node.nodeValue;
      const trimmed = raw.trim();
      if (!trimmed) {
        continue;
      }
      const translated = translate(trimmed);
      if (translated !== trimmed) {
        const leading = raw.match(/^\s*/)?.[0] || "";
        const trailing = raw.match(/\s*$/)?.[0] || "";
        node.nodeValue = `${leading}${translated}${trailing}`;
      }
    }

    const attributes = ["title", "aria-label", "placeholder", "alt"];
    for (const element of root.querySelectorAll("*")) {
      for (const attribute of attributes) {
        const value = element.getAttribute(attribute);
        if (!value) {
          continue;
        }
        const translated = translate(value);
        if (translated !== value) {
          element.setAttribute(attribute, translated);
        }
      }
    }
  }

  globalThis.INATI18N = {
    SUPPORTED,
    setLanguage,
    t,
    format: t,
    translate,
    translateDom,
    getLanguage: () => locale,
    getSetting: () => setting
  };
})();
