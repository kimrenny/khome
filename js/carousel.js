const bgContainer = document.getElementById("bg");

const IMAGE_COUNT = 85;

let isTransitioning = false;

let currentSpeed;
let savedOpacity = 0.7;
let slideshowIntervalId;

let selectedImages = [];

const images = Array.from(
  { length: IMAGE_COUNT },
  (_, i) => `bg-webp/photo_${i + 1}.webp`,
);

const thumbs = Array.from(
  { length: IMAGE_COUNT },
  (_, i) => `thumbs/photo_${i + 1}.webp`,
);

function syncSelectedImages(callback) {
  chrome.storage.local.get(["selectedImages", "allImages"], function (result) {
    const allImages = Array.isArray(result.allImages)
      ? result.allImages
      : images;

    if (!result.allImages) {
      chrome.storage.local.set({ allImages: images });
    }

    selectedImages = Array.isArray(result.selectedImages)
      ? result.selectedImages
      : [];

    if (callback) callback(selectedImages, allImages);
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

chrome.storage.local.get("currentSpeed", function (result) {
  if (!result.currentSpeed) {
    currentSpeed = 10;
    chrome.storage.local.set({ currentSpeed });
  } else {
    currentSpeed = result.currentSpeed;
  }
});

let currentIndex = 0;

function isValidImage(img) {
  return images.includes(img);
}

function getSafeRandomImage(list) {
  const valid = list.filter(isValidImage);
  if (!valid.length) return images[Math.floor(Math.random() * images.length)];
  return valid[Math.floor(Math.random() * valid.length)];
}

const imageGrid = document.getElementById("imageGrid");

syncSelectedImages(function () {
  thumbs.forEach((image, index) => {
    const imgElement = document.createElement("img");
    imgElement.src = image;
    imgElement.classList.add("grid-image");

    const realImage = images[index];

    if (selectedImages.includes(realImage)) {
      imgElement.classList.add("selected");
    }

    imgElement.addEventListener("click", function () {
      const isSelected = imgElement.classList.contains("selected");

      if (isSelected) {
        if (selectedImages.length > 3) {
          imgElement.classList.remove("selected");
          selectedImages = selectedImages.filter((img) => img !== realImage);
        }
      } else {
        imgElement.classList.add("selected");
        selectedImages.push(realImage);
      }

      chrome.storage.local.set({ selectedImages });
    });

    imageGrid.appendChild(imgElement);
  });
});

let firstLoadDone = false;

function loadFirstImage(ids, opacity) {
  const safeIds = ids.filter(isValidImage);

  const source = safeIds.length ? safeIds : images;
  const first = source[0];

  const img = new Image();
  img.src = first;

  img.onload = () => {
    img.classList.add("carousel-item", "reveal");
    img.style.opacity = opacity;
    bgContainer.appendChild(img);
    firstLoadDone = true;
  };

  img.onerror = () => {
    const fallback = getSafeRandomImage(source);
    const retry = new Image();
    retry.src = fallback;

    retry.onload = () => {
      retry.classList.add("carousel-item", "reveal");
      retry.style.opacity = opacity;
      bgContainer.appendChild(retry);
      firstLoadDone = true;
    };
  };
}

syncSelectedImages(function (imgs) {
  syncOpacity(function (opacity) {
    loadFirstImage(imgs, opacity);
  });
});

function preloadImages(selectedImages, opacity) {
  if (!Array.isArray(selectedImages)) return;

  const firstImage = getSafeRandomImage(selectedImages);

  const img = new Image();
  img.src = firstImage;

  img.onload = () => {
    img.classList.add("carousel-item", "reveal");
    img.style.opacity = opacity;
    bgContainer.appendChild(img);
  };
}

function getRandomIndex(max) {
  return Math.floor(Math.random() * max);
}

function revealNextImage() {
  if (isTransitioning) return;

  isTransitioning = true;

  const currentImage = bgContainer.querySelector(".carousel-item");
  if (!currentImage) {
    isTransitioning = false;
    return;
  }

  currentImage.classList.remove("reveal");

  syncSelectedImages(function (ids) {
    if (!ids.length) {
      isTransitioning = false;
      return;
    }

    const safeIds = ids.filter(isValidImage);
    if (!safeIds.length) {
      isTransitioning = false;
      return;
    }

    let nextIndex;
    do {
      nextIndex = getRandomIndex(safeIds.length);
    } while (nextIndex === currentIndex && safeIds.length > 1);

    currentIndex = nextIndex;

    const nextImage = new Image();
    nextImage.src = safeIds[currentIndex];

    nextImage.classList.add("carousel-item", "reveal");
    nextImage.style.opacity = "0";

    bgContainer.appendChild(nextImage);

    nextImage.onload = () => {
      setTimeout(() => {
        nextImage.style.transition = "opacity 2s ease-in-out";

        syncOpacity(function (opacity) {
          nextImage.style.opacity = opacity;
          currentImage.style.opacity = "0";
        });
      }, 100);
    };

    nextImage.onerror = () => {
      const fallback = getSafeRandomImage(safeIds);
      nextImage.src = fallback;
    };

    setTimeout(() => {
      if (bgContainer.contains(currentImage)) {
        bgContainer.removeChild(currentImage);
      }
    }, 2000);

    setTimeout(() => {
      isTransitioning = false;

      clearInterval(slideshowIntervalId);
      slideshowIntervalId = setInterval(revealNextImage, currentSpeed * 1000);
    }, 2000);
  });
}

let slideshowToggleIsActive;

chrome.storage.local.get("slideshow-toggle", function (result) {
  if (result["slideshow-toggle"] === undefined) {
    slideshowToggleIsActive = true;
    chrome.storage.local.set({ "slideshow-toggle": true });
  } else {
    slideshowToggleIsActive = result["slideshow-toggle"];
  }

  if (slideshowToggleIsActive) {
    slideshowIntervalId = setInterval(revealNextImage, currentSpeed * 1000);
  }
});

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", function () {
    const slider = document.querySelector(".setting-slider");
    const sliderValue = document.querySelector(".slider-value");
    const slideshowToggle = document.getElementById("slideshow-toggle");
    const sliderSpeedInput = document.querySelector(".slideshow-speed");
    const sliderSpeedValue = document.getElementById("slideshow-speed-text");

    sliderSpeedValue.value = currentSpeed;
    sliderSpeedValue.readOnly = true;

    function applyUIOpacity(value) {
      slider.value = value;
      sliderValue.textContent = value;
    }

    syncOpacity(function (opacity) {
      applyUIOpacity(opacity);
    });

    if (slideshowToggleIsActive) {
      slideshowToggle.classList.add("on");
      slideshowToggle.classList.remove("off");
    } else {
      slideshowToggle.classList.add("off");
      slideshowToggle.classList.remove("on");
    }

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
      editImagesModal.style.display = "flex";
    });

    closeBtn?.addEventListener("click", () => {
      editImagesModal.style.display = "none";
    });

    selectAllBtn.addEventListener("click", function () {
      const allSelected = selectedImages.length === images.length;

      if (allSelected) {
        selectedImages = [];

        imageGrid.querySelectorAll("img").forEach((img) => {
          img.classList.remove("selected");
        });
      } else {
        selectedImages = [...images];

        imageGrid.querySelectorAll("img").forEach((img) => {
          img.classList.add("selected");
        });
      }

      chrome.storage.local.set({ selectedImages });
    });

    sliderSpeedInput.addEventListener("input", () => {
      currentSpeed = sliderSpeedInput.value;
      sliderSpeedValue.value = currentSpeed;
      chrome.storage.local.set({ currentSpeed });
    });

    slideshowToggle.addEventListener("click", () => {
      slideshowToggleIsActive = !slideshowToggleIsActive;

      chrome.storage.local.set({
        "slideshow-toggle": slideshowToggleIsActive,
      });

      if (slideshowToggleIsActive) {
        slideshowIntervalId = setInterval(revealNextImage, currentSpeed * 1000);
        slideshowToggle.classList.add("on");
        slideshowToggle.classList.remove("off");
      } else {
        clearInterval(slideshowIntervalId);
        slideshowToggle.classList.add("off");
        slideshowToggle.classList.remove("on");
      }
    });
  });
}
