(() => {
  const CHANNEL = "inat-photo-triage-v11";
  const BRIDGE_VERSION = 11;
  const MAX_GROUP_PHOTOS = 20;

  if (window.__INAT_REVIEW_BRIDGE__?.version === BRIDGE_VERSION) {
    return;
  }

  if (typeof window.__INAT_REVIEW_BRIDGE_CLEANUP__ === "function") {
    try {
      window.__INAT_REVIEW_BRIDGE_CLEANUP__();
    } catch {
      // Ignore cleanup failures from an older bridge instance.
    }
  }

  const listenerController = new AbortController();
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  async function waitForSnapshot(predicate, timeoutMs = 1800, intervalMs = 45) {
    const startedAt = Date.now();
    let latest = null;
    while (Date.now() - startedAt < timeoutMs) {
      latest = snapshot();
      if (predicate(latest)) {
        return latest;
      }
      await wait(intervalMs);
    }
    return latest || snapshot();
  }

  function getRootFiber() {
    const candidates = [
      document.querySelector("#app > div"),
      document.querySelector("#app"),
      document.querySelector(".uploader"),
      document.querySelector("#imageGridObs")
    ].filter(Boolean);

    for (const element of candidates) {
      const key = Object.getOwnPropertyNames(element).find(
        name =>
          name.startsWith("__reactInternalInstance$") ||
          name.startsWith("__reactFiber$")
      );
      if (!key) {
        continue;
      }
      let fiber = element[key];
      while (fiber?.return) {
        fiber = fiber.return;
      }
      if (fiber) {
        return fiber;
      }
    }

    throw new Error("找不到 iNaturalist 上傳器的 React 根節點。");
  }

  function getContext() {
    const stack = [getRootFiber()];
    const seen = new Set();
    let store = null;
    let uploaderProps = null;

    while (stack.length) {
      const node = stack.pop();
      if (!node || seen.has(node)) {
        continue;
      }
      seen.add(node);

      const props = node.memoizedProps;
      if (
        !store &&
        props?.store &&
        typeof props.store.getState === "function" &&
        typeof props.store.dispatch === "function"
      ) {
        store = props.store;
      }
      if (
        !uploaderProps &&
        props?.obsCards &&
        props?.obsPositions &&
        typeof props.movePhoto === "function" &&
        typeof props.newCardFromMedia === "function"
      ) {
        uploaderProps = props;
      }

      if (store && uploaderProps) {
        break;
      }
      if (node.sibling) {
        stack.push(node.sibling);
      }
      if (node.child) {
        stack.push(node.child);
      }
    }

    if (!store || !uploaderProps) {
      throw new Error(
        "讀不到 iNaturalist 上傳器狀態。請確認照片已載入，或重新整理頁面後再試。"
      );
    }

    return { store, uploaderProps };
  }

  function getState() {
    const context = getContext();
    const state = context.store.getState()?.dragDropZone;
    if (!state?.obsCards || !Array.isArray(state.obsPositions)) {
      throw new Error("iNaturalist 上傳器尚未準備完成。");
    }
    return { ...context, state };
  }

  function isPhotoFile(file) {
    const type = String(file?.type || "");
    return !type.match(/^(audio|video)\//i);
  }

  function fileUrl(file) {
    return file?.photo?.large_url || file?.photo?.medium_url || file?.preview || "";
  }

  function fileThumbUrl(file) {
    return file?.photo?.thumb_url || file?.photo?.small_url || fileUrl(file);
  }

  function formatObservedAt(value) {
    const text = String(value || "").trim();
    if (!text) {
      return "";
    }
    const iso = text.match(
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/
    );
    if (iso) {
      return `${iso[1]}/${iso[2]}/${iso[3]} ${iso[4]}:${iso[5]}`;
    }
    return text;
  }

  function observedAt(file, card) {
    return formatObservedAt(
      file?.metadata?.date ||
        file?.metadata?.selected_date ||
        file?.serverMetadata?.date ||
        file?.serverMetadata?.selected_date ||
        card?.selected_date ||
        card?.date ||
        file?.photo?.to_observation?.time_observed_at ||
        file?.photo?.to_observation?.observed_on_string
    );
  }

  function snapshot() {
    const { state } = getState();
    const groups = [];
    const photos = [];

    state.obsPositions.forEach(rawCardId => {
      const card = state.obsCards[rawCardId];
      if (!card) {
        return;
      }

      const files = Object.values(card.files || {})
        .filter(isPhotoFile)
        .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));

      if (!files.length) {
        return;
      }

      const cardId = String(card.id);
      const groupIndex = groups.length;
      const group = {
        id: cardId,
        index: groupIndex,
        photoCount: files.length,
        thumbUrl: fileThumbUrl(files[0]),
        selected: Boolean(card.selected),
        label: `第 ${groupIndex + 1} 組`
      };
      groups.push(group);

      files.forEach((file, photoIndex) => {
        const orderIndex = photos.length;
        photos.push({
          key: `${cardId}:${file.id}`,
          fileId: String(file.id),
          cardId,
          orderIndex,
          groupId: cardId,
          groupIndex,
          groupPhotoCount: files.length,
          groupPhotoIndex: photoIndex,
          name: file.name || `照片 ${photoIndex + 1}`,
          observedAt: observedAt(file, card),
          url: fileUrl(file),
          thumbUrl: fileThumbUrl(file),
          uploadState: file.uploadState || "unknown"
        });
      });
    });

    return {
      version: BRIDGE_VERSION,
      capturedAt: Date.now(),
      photoCount: photos.length,
      groupCount: groups.length,
      groups,
      photos
    };
  }

  function findPhoto(fileId) {
    const context = getState();
    const targetId = String(fileId);

    for (const rawCardId of context.state.obsPositions) {
      const card = context.state.obsCards[rawCardId];
      if (!card) {
        continue;
      }
      const file = Object.values(card.files || {}).find(
        candidate => String(candidate.id) === targetId
      );
      if (file) {
        return { ...context, card, file };
      }
    }

    throw new Error("這張照片已不在上傳清單中。");
  }

  async function movePhoto(payload) {
    const { uploaderProps, state, card, file } = findPhoto(payload.fileId);
    const targetCard = state.obsCards[payload.targetCardId];

    if (!targetCard) {
      throw new Error("目標群組已不存在。");
    }
    if (String(targetCard.id) === String(card.id)) {
      throw new Error("這張照片已經在該群組中。");
    }

    const targetPhotoCount = Object.values(targetCard.files || {}).filter(
      isPhotoFile
    ).length;
    if (targetPhotoCount >= MAX_GROUP_PHOTOS) {
      throw new Error(
        `這個群組已有 ${MAX_GROUP_PHOTOS} 張照片，iNaturalist 不允許再加入更多。`
      );
    }

    const targetCardId = String(targetCard.id);
    uploaderProps.movePhoto({ file, obsCard: card }, targetCard);
    const latest = await waitForSnapshot(snapshot =>
      snapshot.photos.some(
        photo =>
          photo.fileId === String(file.id) &&
          photo.cardId === targetCardId
      )
    );
    const movedPhoto = latest.photos.find(
      photo => photo.fileId === String(file.id)
    );
    if (!movedPhoto || movedPhoto.cardId !== targetCardId) {
      throw new Error("無法合併這張照片，可能已達 iNaturalist 的群組照片上限。");
    }
    return latest;
  }

  async function separatePhoto(payload) {
    const { uploaderProps, state, card, file } = findPhoto(payload.fileId);
    const fileCount = Object.values(card.files || {}).filter(isPhotoFile).length;
    if (fileCount <= 1) {
      return { ...snapshot(), unchanged: true };
    }

    const currentIndex = state.obsPositions.findIndex(
      cardId => String(cardId) === String(card.id)
    );
    const nextCardId = state.obsPositions[currentIndex + 1];
    const options =
      nextCardId === undefined ? {} : { beforeCardId: nextCardId };

    const previousCardId = String(card.id);
    uploaderProps.newCardFromMedia({ file, obsCard: card }, options);
    const latest = await waitForSnapshot(snapshot => {
      const separatedPhoto = snapshot.photos.find(
        photo => photo.fileId === String(file.id)
      );
      return separatedPhoto && separatedPhoto.cardId !== previousCardId;
    });
    const separatedPhoto = latest.photos.find(
      photo => photo.fileId === String(file.id)
    );
    if (!separatedPhoto || separatedPhoto.cardId === previousCardId) {
      throw new Error("無法把這張照片分開成新群組。");
    }
    return latest;
  }

  async function deletePhoto(payload) {
    const { store, state, card, file } = findPhoto(payload.fileId);
    const cardId = card.id;
    const wasOnlyFile =
      Object.values(card.files || {}).filter(isPhotoFile).length <= 1;

    store.dispatch({ type: "REMOVE_FILE", file });
    let latestState = await waitForSnapshot(
      snapshot => !snapshot.photos.some(photo => photo.fileId === String(file.id))
    ).then(() => store.getState()?.dragDropZone);
    const latestCard = latestState?.obsCards?.[cardId];
    if (
      wasOnlyFile &&
      latestCard &&
      Object.values(latestCard.files || {}).filter(isPhotoFile).length === 0
    ) {
      store.dispatch({ type: "REMOVE_OBS_CARD", obsCard: latestCard });
      latestState = await waitForSnapshot(
        snapshot => !snapshot.groups.some(group => group.id === String(cardId))
      ).then(() => store.getState()?.dragDropZone);
    }

    const latest = snapshot();
    if (latest.photos.some(photo => photo.fileId === String(file.id))) {
      throw new Error("無法從上傳草稿移除這張照片。");
    }
    return latest;
  }

  async function addCroppedPhoto(payload) {
    const { store, uploaderProps, state, card, file } = findPhoto(
      payload.fileId
    );
    if (typeof uploaderProps.onCardDrop !== "function") {
      throw new Error("目前 iNaturalist 上傳器不支援加入裁切照片。");
    }

    const targetPhotoCount = Object.values(card.files || {}).filter(
      isPhotoFile
    ).length;
    if (targetPhotoCount >= MAX_GROUP_PHOTOS) {
      throw new Error(
        `這個群組已有 ${MAX_GROUP_PHOTOS} 張照片，無法再加入裁切照片。`
      );
    }

    if (!payload.arrayBuffer || !payload.name || !payload.type) {
      throw new Error("裁切照片資料不完整。");
    }

    const croppedFile = new File([payload.arrayBuffer], payload.name, {
      type: payload.type,
      lastModified: Date.now()
    });
    croppedFile.preview = URL.createObjectURL(croppedFile);
    const targetCardId = String(card.id);
    const targetName = payload.name;

    uploaderProps.onCardDrop([croppedFile], card);
    const latest = await waitForSnapshot(snapshot => {
      const replacementPhoto = snapshot.photos.find(
        photo =>
          photo.cardId === targetCardId &&
          photo.name === targetName
      );
      return Boolean(replacementPhoto);
    }, 15000, 150);

    const replacementPhoto = latest.photos.find(
      photo =>
        photo.cardId === targetCardId &&
        photo.name === targetName
    );
    if (!replacementPhoto) {
      throw new Error("替換照片沒有加入 iNaturalist 草稿，請再試一次。");
    }
    if (replacementPhoto.uploadState === "failed") {
      throw new Error("iNaturalist 無法上傳這張替換照片。");
    }

    const originalFileId = String(file.id);
    store.dispatch({ type: "REMOVE_FILE", file });
    const finalSnapshot = await waitForSnapshot(
      snapshot =>
        !snapshot.photos.some(
          photo => photo.fileId === originalFileId
        )
    );
    if (
      finalSnapshot.photos.some(
        photo => photo.fileId === originalFileId
      )
    ) {
      throw new Error("裁切照片已上傳，但無法移除草稿中的原照片。");
    }

    return {
      ...finalSnapshot,
      uploadedFileId: replacementPhoto.fileId,
      replacementUploadState: replacementPhoto.uploadState
    };
  }

  async function uploadPhotoFiles(payload) {
    const { uploaderProps } = getContext();
    if (typeof uploaderProps.onDrop !== "function") {
      throw new Error("目前 iNaturalist 上傳器不支援從插件上傳檔案。");
    }
    if (!Array.isArray(payload.files) || payload.files.length === 0) {
      throw new Error("沒有選擇要上傳的照片。");
    }

    const files = payload.files.map(item => {
      if (!item?.arrayBuffer || !item.name || !item.type) {
        throw new Error("照片檔案資料不完整。");
      }
      const file = new File([item.arrayBuffer], item.name, {
        type: item.type,
        lastModified: item.lastModified || Date.now()
      });
      // iNaturalist treats File objects without an enumerable property as empty.
      file.preview = URL.createObjectURL(file);
      return file;
    });

    const before = snapshot();
    const beforeIds = new Set(before.photos.map(photo => photo.fileId));
    uploaderProps.onDrop(files, []);
    // onDrop creates draft entries before the background uploads finish.
    // Waiting for every file to become "uploaded" made large batches time out
    // even though iNaturalist had already accepted all the photos.
    const latest = await waitForSnapshot(
      snapshot =>
        snapshot.photos.filter(photo => !beforeIds.has(photo.fileId)).length >=
        files.length,
      60000,
      200
    );

    const remainingNewPhotos = latest.photos
      .filter(photo => !beforeIds.has(photo.fileId))
      .sort((a, b) => a.orderIndex - b.orderIndex);
    const uploadedFileMappings = files
      .map((file, requestIndex) => {
        let photoIndex = remainingNewPhotos.findIndex(
          photo => photo.name === file.name
        );
        if (photoIndex < 0 && remainingNewPhotos.length) {
          photoIndex = 0;
        }
        if (photoIndex < 0) {
          return null;
        }
        const [photo] = remainingNewPhotos.splice(photoIndex, 1);
        return {
          requestIndex,
          fileId: photo.fileId,
          cardId: photo.cardId,
          name: photo.name
        };
      })
      .filter(Boolean);

    const newPhotos = latest.photos.filter(
      photo => !beforeIds.has(photo.fileId)
    );
    if (!newPhotos.length) {
      throw new Error("照片沒有加入 iNaturalist 上傳草稿，請重新掃描後再試。");
    }
    const missingPhotoCount = Math.max(0, files.length - newPhotos.length);
    const failedUploadNames = newPhotos
      .filter(photo => photo.uploadState === "failed")
      .map(photo => photo.name);
    const pendingUploadCount =
      newPhotos.filter(
        photo =>
          photo.uploadState !== "uploaded" &&
          photo.uploadState !== "failed"
      ).length + missingPhotoCount;

    return {
      ...latest,
      uploadedFileMappings,
      missingPhotoCount,
      failedUploadNames,
      pendingUploadCount
    };
  }

  async function runAction(action, payload = {}) {
    switch (action) {
      case "snapshot":
        return snapshot();
      case "movePhoto":
        return movePhoto(payload);
      case "separatePhoto":
        return separatePhoto(payload);
      case "deletePhoto":
        return deletePhoto(payload);
      case "addCroppedPhoto":
        return addCroppedPhoto(payload);
      case "uploadPhotoFiles":
        return uploadPhotoFiles(payload);
      default:
        throw new Error(`不支援的操作：${action}`);
    }
  }

  window.addEventListener(
    "message",
    event => {
      if (event.source !== window) {
        return;
      }

      const message = event.data;
      if (
        !message ||
        message.channel !== CHANNEL ||
        message.direction !== "to-bridge" ||
        !message.requestId
      ) {
        return;
      }

      Promise.resolve()
        .then(() => runAction(message.action, message.payload))
        .then(data => {
          window.postMessage(
            {
              channel: CHANNEL,
              direction: "from-bridge",
              requestId: message.requestId,
              ok: true,
              data
            },
            "*"
          );
        })
        .catch(error => {
          window.postMessage(
            {
              channel: CHANNEL,
              direction: "from-bridge",
              requestId: message.requestId,
              ok: false,
              error: error instanceof Error ? error.message : String(error)
            },
            "*"
          );
        });
    },
    { signal: listenerController.signal }
  );

  window.__INAT_REVIEW_BRIDGE_CLEANUP__ = () => {
    listenerController.abort();
  };

  window.__INAT_REVIEW_BRIDGE__ = {
    version: BRIDGE_VERSION,
    snapshot,
    action: runAction
  };
})();
