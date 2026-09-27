const {
  getBuiltinBackgroundIds,
  getBuiltinThumbPath,
  isCustomBackgroundId,
  mergeBackgroundCatalog,
  sanitizeSelectedImages,
  normalizePersistedSelectedImages,
  areAllBackgroundsSelected,
  toggleAllBackgroundSelections,
} = require("./backgroundCatalog");
const customBackgroundStore = require("./customBackgroundStore");
const { importCustomImages } = require("./customBackgroundService");
const {
  DEFAULT_SLIDESHOW_INTERVAL,
  normalizeSlideshowInterval,
  normalizeSlideshowSettings,
  shouldRunSlideshow,
} = require("./slideshowSettings");

const bgContainer = document.getElementById("bg");
const imageGrid = document.getElementById("imageGrid");

const images = getBuiltinBackgroundIds();

let isTransitioning = false;

let currentSpeed = DEFAULT_SLIDESHOW_INTERVAL;
let savedOpacity = 0.7;
let slideshowIntervalId;
let activeTransition;
let slideshowToggleIsActive = true;
let slideshowSettingsReady = false;

let selectedImages = [];
let customRecords = [];
let availableBackgroundIds = [...images];
let customCatalogReady = false;

const customObjectUrls = new Map();

function getCustomIds() {
  return customRecords.map((record) => record.id);
}

function rebuildAvailableBackgroundIds() {
  availableBackgroundIds = mergeBackgroundCatalog(images, getCustomIds());
  return availableBackgroundIds;
}

function getCustomObjectUrl(record) {
  if (!record || !record.id || !record.blob) {
    return "";
  }

  if (customObjectUrls.has(record.id)) {
    return customObjectUrls.get(record.id);
  }

  const url = URL.createObjectURL(record.blob);
  customObjectUrls.set(record.id, url);
  return url;
}

function revokeCustomObjectUrl(id) {
  const url = customObjectUrls.get(id);
  if (url) {
    URL.revokeObjectURL(url);
    customObjectUrls.delete(id);
  }
}

function getBackgroundSrc(id) {
  if (!isCustomBackgroundId(id)) {
    return id;
  }

  const record = customRecords.find((item) => item.id === id);
  return record ? getCustomObjectUrl(record) : "";
}

function persistSelectedImages() {
  chrome.storage.local.set({
    selectedImages,
    allImages: availableBackgroundIds,
  });
  updateSlideshowLifecycle();
}

function updateSelectAllButton() {
  const button = document.getElementById("selectAllBtn");
  if (!button) {
    return;
  }

  const allSelected = areAllBackgroundsSelected(
    selectedImages,
    availableBackgroundIds,
  );
  const selectAllLabel = button.querySelector('[data-i18n="select-all"]');
  const deselectAllLabel = button.querySelector('[data-i18n="deselect-all"]');

  if (selectAllLabel && deselectAllLabel) {
    selectAllLabel.hidden = allSelected;
    deselectAllLabel.hidden = !allSelected;
  }
}

function syncSelectedImages(callback) {
  chrome.storage.local.get(["selectedImages"], function (result) {
    const persisted = normalizePersistedSelectedImages(result.selectedImages);
    const sanitized = sanitizeSelectedImages(
      persisted,
      availableBackgroundIds,
      {
        keepUnknownCustomIds: !customCatalogReady,
      },
    );
    selectedImages = sanitized;
    updateSelectAllButton();

    if (customCatalogReady && sanitized.length !== persisted.length) {
      persistSelectedImages();
    } else if (customCatalogReady) {
      chrome.storage.local.set({ allImages: availableBackgroundIds });
    }

    updateSlideshowLifecycle();
    if (callback) callback(selectedImages, availableBackgroundIds);
  });
}

function syncOpacity(callback) {
  chrome.storage.local.get("carouselOpacity", function (result) {
    savedOpacity =
      result.carouselOpacity !== undefined ? result.carouselOpacity : 0.7;

    if (result.carouselOpacity === undefined) {
      chrome.storage.local.set({ carouselOpacity: 0.7 });
    }

    if (callback) callback(savedOpacity);
  });
}

let currentIndex = 0;

function isValidImage(img) {
  return availableBackgroundIds.includes(img);
}

function getSafeRandomImage(list) {
  const valid = (Array.isArray(list) ? list : []).filter(isValidImage);
  if (!valid.length) return images[Math.floor(Math.random() * images.length)];
  return valid[Math.floor(Math.random() * valid.length)];
}

function appendGridItem(id, thumbSrc, isCustom) {
  const wrap = document.createElement("div");
  wrap.className = isCustom ? "grid-image-wrap custom" : "grid-image-wrap";
  wrap.dataset.backgroundId = id;

  const imgElement = document.createElement("img");
  imgElement.src = thumbSrc;
  imgElement.classList.add("grid-image");
  imgElement.alt = "";

  if (selectedImages.includes(id)) {
    imgElement.classList.add("selected");
  }

  imgElement.addEventListener("click", function () {
    const isSelected = imgElement.classList.contains("selected");

    if (isSelected) {
      if (selectedImages.length > 3) {
        imgElement.classList.remove("selected");
        selectedImages = selectedImages.filter((img) => img !== id);
      }
    } else {
      imgElement.classList.add("selected");
      selectedImages.push(id);
    }

    persistSelectedImages();
    updateSelectAllButton();
  });

  wrap.appendChild(imgElement);

  if (isCustom) {
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "remove-custom-bg";
    removeBtn.setAttribute("data-i18n-aria-label", "remove-custom-image");
    removeBtn.setAttribute("aria-label", "Remove");
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      removeCustomBackground(id);
    });
    wrap.appendChild(removeBtn);
  }

  imageGrid.appendChild(wrap);
}

function renderBackgroundGrid() {
  if (!imageGrid) {
    return;
  }

  imageGrid.innerHTML = "";

  images.forEach((id) => {
    appendGridItem(id, getBuiltinThumbPath(id), false);
  });

  customRecords.forEach((record) => {
    appendGridItem(record.id, getCustomObjectUrl(record), true);
  });

  updateSelectAllButton();
}

function showCustomBackgroundError(reason) {
  const errorEl = document.getElementById("custom-background-error");
  if (!errorEl) {
    return;
  }

  const keys = {
    unsupported: "custom-background-unsupported",
    invalid: "custom-background-invalid",
    "copy-failed": "custom-background-copy-failed",
    "source-unavailable": "custom-background-source-unavailable",
    "storage-error": "custom-background-storage-error",
  };

  const fallbacks = {
    "custom-background-unsupported": "This file type is not supported.",
    "custom-background-invalid": "This image could not be read.",
    "custom-background-copy-failed": "The image could not be saved.",
    "custom-background-source-unavailable":
      "The selected file is no longer available.",
    "custom-background-storage-error": "Custom images could not be loaded.",
  };

  const key = keys[reason] || "custom-background-storage-error";
  errorEl.setAttribute("data-i18n", key);
  errorEl.textContent = fallbacks[key];
  errorEl.classList.remove("display-none");
}

function clearCustomBackgroundError() {
  const errorEl = document.getElementById("custom-background-error");
  if (!errorEl) {
    return;
  }
  errorEl.textContent = "";
  errorEl.classList.add("display-none");
}

async function decodeCustomImage(blob) {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(blob);
    if (bitmap && typeof bitmap.close === "function") {
      bitmap.close();
    }
    return true;
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = function () {
      URL.revokeObjectURL(url);
      resolve(true);
    };
    image.onerror = function () {
      URL.revokeObjectURL(url);
      reject(new Error("invalid"));
    };
    image.src = url;
  });
}

async function loadCustomBackgrounds() {
  let loaded = false;

  try {
    customRecords = await customBackgroundStore.listCustomBackgrounds();
    loaded = true;
  } catch (error) {
    customRecords = [];
    showCustomBackgroundError("storage-error");
  }

  customRecords.forEach((record) => getCustomObjectUrl(record));
  rebuildAvailableBackgroundIds();
  customCatalogReady = loaded;
}

async function removeCustomBackground(id) {
  try {
    await customBackgroundStore.deleteCustomBackground(id);
  } catch (error) {
    showCustomBackgroundError("storage-error");
    return;
  }

  customRecords = customRecords.filter((record) => record.id !== id);
  revokeCustomObjectUrl(id);
  rebuildAvailableBackgroundIds();
  selectedImages = sanitizeSelectedImages(
    selectedImages,
    availableBackgroundIds,
  );
  persistSelectedImages();
  renderBackgroundGrid();
}

let firstLoadDone = false;

function loadFirstImage(ids, opacity) {
  const safeIds = ids.filter(isValidImage);

  const source = safeIds.length ? safeIds : images;
  const first = source[0];
  const src = getBackgroundSrc(first);
  if (!src) {
    firstLoadDone = true;
    return;
  }

  const img = new Image();
  img.src = src;

  img.onload = () => {
    img.classList.add("carousel-item", "reveal");
    img.style.opacity = opacity;
    bgContainer.appendChild(img);
    firstLoadDone = true;
  };

  img.onerror = () => {
    const fallback = getSafeRandomImage(source);
    const fallbackSrc = getBackgroundSrc(fallback);
    if (!fallbackSrc) {
      firstLoadDone = true;
      return;
    }
    const retry = new Image();
    retry.src = fallbackSrc;

    retry.onload = () => {
      retry.classList.add("carousel-item", "reveal");
      retry.style.opacity = opacity;
      bgContainer.appendChild(retry);
      firstLoadDone = true;
    };
  };
}

function preloadImages(selectedList, opacity) {
  if (!Array.isArray(selectedList)) return;

  const firstImage = getSafeRandomImage(selectedList);
  const src = getBackgroundSrc(firstImage);
  if (!src) return;

  const img = new Image();
  img.src = src;

  img.onload = () => {
    img.classList.add("carousel-item", "reveal");
    img.style.opacity = opacity;
    bgContainer.appendChild(img);
  };
}

function getRandomIndex(max) {
  return Math.floor(Math.random() * max);
}

function startSlideshow() {
  if (
    !slideshowSettingsReady ||
    !shouldRunSlideshow(
      slideshowToggleIsActive,
      new Set(selectedImages).size,
    ) ||
    slideshowIntervalId !== undefined
  ) {
    return;
  }

  slideshowIntervalId = setInterval(revealNextImage, currentSpeed * 1000);
}

function stopSlideshow() {
  if (slideshowIntervalId !== undefined) {
    clearInterval(slideshowIntervalId);
    slideshowIntervalId = undefined;
  }

  if (activeTransition) {
    activeTransition.timeouts.forEach(clearTimeout);
    activeTransition.nextImage.remove();
    activeTransition.currentImage.classList.add("reveal");
    activeTransition.currentImage.style.opacity = String(savedOpacity);
    activeTransition = undefined;
    isTransitioning = false;
  }
}

function restartSlideshow() {
  stopSlideshow();
  startSlideshow();
}

function updateSlideshowLifecycle() {
  if (
    !slideshowSettingsReady ||
    !shouldRunSlideshow(slideshowToggleIsActive, new Set(selectedImages).size)
  ) {
    stopSlideshow();
    return;
  }

  startSlideshow();
}

function updateSlideshowControls() {
  const sliderSpeedInput = document.querySelector(".slideshow-speed");
  const sliderSpeedValue = document.getElementById("slideshow-speed-text");
  const slideshowToggle = document.getElementById("slideshow-toggle");

  if (sliderSpeedInput) {
    sliderSpeedInput.value = String(currentSpeed);
  }
  if (sliderSpeedValue) {
    sliderSpeedValue.value = String(currentSpeed);
    sliderSpeedValue.readOnly = true;
  }
  if (slideshowToggle) {
    slideshowToggle.classList.toggle("on", slideshowToggleIsActive);
    slideshowToggle.classList.toggle("off", !slideshowToggleIsActive);
  }
}

function revealNextImage() {
  if (isTransitioning) return;

  isTransitioning = true;

  const currentImage = bgContainer.querySelector(".carousel-item");
  if (!currentImage) {
    isTransitioning = false;
    return;
  }

  syncSelectedImages(function (ids) {
    if (!slideshowSettingsReady || !slideshowToggleIsActive || !ids.length) {
      isTransitioning = false;
      return;
    }

    const safeIds = ids.filter(isValidImage);
    if (!safeIds.length) {
      isTransitioning = false;
      return;
    }

    currentImage.classList.remove("reveal");

    let nextIndex;
    do {
      nextIndex = getRandomIndex(safeIds.length);
    } while (nextIndex === currentIndex && safeIds.length > 1);

    currentIndex = nextIndex;

    const nextSrc = getBackgroundSrc(safeIds[currentIndex]);
    if (!nextSrc) {
      isTransitioning = false;
      return;
    }

    const nextImage = new Image();
    nextImage.src = nextSrc;

    nextImage.classList.add("carousel-item", "reveal");
    nextImage.style.opacity = "0";

    bgContainer.appendChild(nextImage);

    const transition = {
      currentImage,
      nextImage,
      timeouts: [],
    };
    activeTransition = transition;

    nextImage.onload = () => {
      if (activeTransition !== transition || !slideshowToggleIsActive) {
        return;
      }

      transition.timeouts.push(
        setTimeout(() => {
          if (activeTransition !== transition || !slideshowToggleIsActive) {
            return;
          }
          nextImage.style.transition = "opacity 2s ease-in-out";

          syncOpacity(function (opacity) {
            if (activeTransition !== transition || !slideshowToggleIsActive) {
              return;
            }
            nextImage.style.opacity = opacity;
            currentImage.style.opacity = "0";
          });
        }, 100),
      );
    };

    nextImage.onerror = () => {
      if (activeTransition !== transition || !slideshowToggleIsActive) {
        return;
      }
      const fallback = getSafeRandomImage(safeIds);
      const fallbackSrc = getBackgroundSrc(fallback);
      if (fallbackSrc) {
        nextImage.src = fallbackSrc;
      }
    };

    transition.timeouts.push(
      setTimeout(() => {
        if (activeTransition !== transition) {
          return;
        }
        if (bgContainer.contains(currentImage)) {
          bgContainer.removeChild(currentImage);
        }
        activeTransition = undefined;
        isTransitioning = false;
      }, 2000),
    );
  });
}

chrome.storage.local.get(
  ["currentSpeed", "slideshow-toggle"],
  function (result) {
    const normalized = normalizeSlideshowSettings(result);
    currentSpeed = normalized.currentSpeed;
    slideshowToggleIsActive = normalized.enabled;
    slideshowSettingsReady = true;

    if (
      result.currentSpeed !== currentSpeed ||
      result["slideshow-toggle"] !== slideshowToggleIsActive
    ) {
      chrome.storage.local.set({
        currentSpeed,
        "slideshow-toggle": slideshowToggleIsActive,
      });
    }

    updateSlideshowControls();
    updateSlideshowLifecycle();
  },
);

loadCustomBackgrounds().then(function () {
  syncSelectedImages(function (imgs) {
    renderBackgroundGrid();
    syncOpacity(function (opacity) {
      loadFirstImage(imgs, opacity);
    });
  });
});

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", function () {
    const slider = document.querySelector(".setting-slider");
    const sliderValue = document.querySelector(".slider-value");
    const slideshowToggle = document.getElementById("slideshow-toggle");
    const sliderSpeedInput = document.querySelector(".slideshow-speed");
    const sliderSpeedValue = document.getElementById("slideshow-speed-text");
    const addCustomImageBtn = document.getElementById("addCustomImageBtn");
    const customBackgroundInput = document.getElementById(
      "custom-background-input",
    );

    updateSlideshowControls();

    function applyUIOpacity(value) {
      slider.value = value;
      sliderValue.textContent = value;
    }

    syncOpacity(function (opacity) {
      applyUIOpacity(opacity);
    });

    slider.addEventListener("input", function () {
      const newOpacity = this.value;

      sliderValue.textContent = newOpacity;

      const currentImage = bgContainer.querySelector(".carousel-item");
      if (currentImage) {
        currentImage.style.opacity = newOpacity;
      }

      chrome.storage.local.set({ carouselOpacity: newOpacity });
    });

    const editImagesModal = document.getElementById("editImagesModal");
    const editImagesModalBtn = document.getElementById("edit-images-modal-btn");
    const closeBtn = document.querySelector(".close");
    const selectAllBtn = document.getElementById("selectAllBtn");

    editImagesModalBtn?.addEventListener("click", () => {
      clearCustomBackgroundError();
      updateSelectAllButton();
      editImagesModal.style.display = "flex";
    });

    closeBtn?.addEventListener("click", () => {
      editImagesModal.style.display = "none";
    });

    editImagesModal?.addEventListener("click", (event) => {
      if (event.target === event.currentTarget) {
        editImagesModal.style.display = "none";
      }
    });

    selectAllBtn.addEventListener("click", function () {
      selectedImages = toggleAllBackgroundSelections(
        selectedImages,
        availableBackgroundIds,
      );

      const selectedIds = new Set(selectedImages);
      imageGrid.querySelectorAll(".grid-image-wrap").forEach((item) => {
        const image = item.querySelector("img");
        image?.classList.toggle(
          "selected",
          selectedIds.has(item.dataset.backgroundId),
        );
      });

      persistSelectedImages();
      updateSelectAllButton();
    });

    addCustomImageBtn?.addEventListener("click", function () {
      clearCustomBackgroundError();
      customBackgroundInput?.click();
    });

    customBackgroundInput?.addEventListener("change", async function () {
      const files = customBackgroundInput.files;
      const result = await importCustomImages(
        files,
        {
          save: (record) => customBackgroundStore.saveCustomBackground(record),
        },
        {
          decodeImage: decodeCustomImage,
        },
      );

      customBackgroundInput.value = "";

      if (result.cancelled) {
        return;
      }

      if (result.imported.length) {
        customRecords = customRecords.concat(result.imported);
        rebuildAvailableBackgroundIds();
        persistSelectedImages();
        renderBackgroundGrid();
      }

      if (result.errors.length) {
        showCustomBackgroundError(result.errors[0].reason);
      }
    });

    sliderSpeedInput.addEventListener("input", () => {
      currentSpeed = normalizeSlideshowInterval(sliderSpeedInput.value);
      sliderSpeedInput.value = String(currentSpeed);
      sliderSpeedValue.value = String(currentSpeed);
      chrome.storage.local.set({ currentSpeed });
      restartSlideshow();
    });

    slideshowToggle.addEventListener("click", () => {
      slideshowToggleIsActive = !slideshowToggleIsActive;

      chrome.storage.local.set({
        "slideshow-toggle": slideshowToggleIsActive,
      });

      updateSlideshowControls();
      updateSlideshowLifecycle();
    });
  });
}
