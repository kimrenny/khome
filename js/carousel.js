const bgContainer = document.getElementById("bg");

let isTransitioning = false;

let currentSpeed;

let slideshowIntervalId;

chrome.storage.local.get("currentSpeed", function (result) {
  if (!result.currentSpeed) {
    currentSpeed = 10;
    chrome.storage.local.set({ currentSpeed: currentSpeed });
  } else {
    currentSpeed = result.currentSpeed;
  }
});

let currentIndex = 0;
const images = [
  "bg-jpg/photo_1.jpg",
  "bg-jpg/photo_2.jpg",
  "bg-jpg/photo_3.jpg",
  "bg-jpg/photo_4.jpg",
  "bg-jpg/photo_5.jpg",
  "bg-jpg/photo_6.jpg",
  "bg-jpg/photo_7.jpg",
  "bg-jpg/photo_8.jpg",
  "bg-jpg/photo_9.jpg",
  "bg-jpg/photo_10.jpg",
  "bg-jpg/photo_11.jpg",
  "bg-jpg/photo_12.jpg",
  "bg-jpg/photo_13.jpg",
  "bg-jpg/photo_14.jpg",
  "bg-jpg/photo_15.jpg",
  "bg-jpg/photo_16.jpg",
  "bg-jpg/photo_17.jpg",
  "bg-jpg/photo_18.jpg",
  "bg-jpg/photo_19.jpg",
  "bg-jpg/photo_20.jpg",
  "bg-jpg/photo_21.jpg",
  "bg-jpg/photo_22.jpg",
  "bg-jpg/photo_23.jpg",
  "bg-jpg/photo_24.jpg",
  "bg-jpg/photo_25.jpg",
  "bg-jpg/photo_26.jpg",
  "bg-jpg/photo_27.jpg",
  "bg-jpg/photo_28.jpg",
  "bg-jpg/photo_29.jpg",
  "bg-jpg/photo_30.jpg",
  "bg-jpg/photo_31.jpg",
  "bg-jpg/photo_32.jpg",
  "bg-jpg/photo_33.jpg",
  "bg-jpg/photo_34.jpg",
  "bg-jpg/photo_35.jpg",
  "bg-jpg/photo_36.jpg",
  "bg-jpg/photo_37.jpg",
  "bg-jpg/photo_38.jpg",
  "bg-jpg/photo_39.jpg",
  "bg-jpg/photo_40.jpg",
  "bg-jpg/photo_41.jpg",
  "bg-jpg/photo_42.jpg",
  "bg-jpg/photo_43.jpg",
  "bg-jpg/photo_44.jpg",
  "bg-jpg/photo_45.jpg",
  "bg-jpg/photo_46.jpg",
  "bg-jpg/photo_47.jpg",
  "bg-jpg/photo_48.jpg",
  "bg-jpg/photo_49.jpg",
  "bg-jpg/photo_50.jpg",
  "bg-jpg/photo_51.jpg",
  "bg-jpg/photo_52.jpg",
  "bg-jpg/photo_53.jpg",
  "bg-jpg/photo_54.jpg",
  "bg-jpg/photo_55.jpg",
  "bg-jpg/photo_56.jpg",
  "bg-jpg/photo_57.jpg",
  "bg-jpg/photo_58.jpg",
  "bg-jpg/photo_59.jpg",
  "bg-jpg/photo_60.jpg",
  "bg-jpg/photo_61.jpg",
  "bg-jpg/photo_62.jpg",
];

const imageGrid = document.getElementById("imageGrid");

chrome.storage.local.get("selectedImages", function (result) {
  let selectedImages = result.selectedImages || images;

  images.forEach((image, index) => {
    const imgElement = document.createElement("img");
    imgElement.src = image;
    imgElement.classList.add("grid-image");

    if (selectedImages.includes(image)) {
      imgElement.classList.add("selected");
    }

    imgElement.addEventListener("click", function () {
      const currentSelectedImages = selectedImages.length;

      if (imgElement.classList.contains("selected")) {
        if (currentSelectedImages > 3) {
          imgElement.classList.remove("selected");
          selectedImages = selectedImages.filter((img) => img !== image);
          chrome.storage.local.set({ selectedImages: selectedImages });
        }
      } else {
        imgElement.classList.add("selected");
        selectedImages.push(image);
        chrome.storage.local.set({ selectedImages: selectedImages });
      }
    });

    imageGrid.appendChild(imgElement);
  });
});

chrome.storage.local.get("selectedImages", function (result) {
  let selectedImages = Array.isArray(result.selectedImages)
    ? result.selectedImages
    : [];

  if (selectedImages.length < 3) {
    selectedImages = images.slice();
    chrome.storage.local.set({ selectedImages: selectedImages });
  }

  preloadImages(selectedImages);
});

function preloadImages(selectedImages) {
  if (!Array.isArray(selectedImages)) {
    return;
  }

  chrome.storage.local.get("carouselOpacity", function (result) {
    const savedOpacity = result.carouselOpacity;

    if (selectedImages.length > 0) {
      selectedImages.forEach((image, index) => {
        const img = new Image();
        img.src = image;

        if (index === 0) {
          img.onload = () => {
            img.classList.add("carousel-item", "reveal");
            img.style.opacity = savedOpacity !== undefined ? savedOpacity : 0.7;
            if (savedOpacity === undefined) {
              chrome.storage.local.set({ carouselOpacity: 0.7 });
            }
            bgContainer.appendChild(img);
          };
          img.onerror = () => {
            console.error(`Error loading image: ${image}`);
          };
        }
      });
    } else {
      console.error("selectedImages is empty: ", selectedImages);
    }
  });
}

function getRandomIndex(max) {
  return Math.floor(Math.random() * max);
}

function revealNextImage() {
  if (isTransitioning) {
    return;
  }

  isTransitioning = true;

  const currentImage = bgContainer.querySelector(".carousel-item");
  currentImage.classList.remove("reveal");

  chrome.storage.local.get("selectedImages", function (result) {
    const selectedImages = result.selectedImages || images;

    let nextIndex;
    do {
      nextIndex = getRandomIndex(selectedImages.length);
    } while (nextIndex === currentIndex);

    currentIndex = nextIndex;

    const nextImage = new Image();
    nextImage.src = selectedImages[currentIndex];
    nextImage.classList.add("carousel-item", "reveal");
    nextImage.style.opacity = "0";
    bgContainer.appendChild(nextImage);

    setTimeout(() => {
      nextImage.style.transition = "opacity 2s ease-in-out";
      chrome.storage.local.get("carouselOpacity", function (result) {
        const opacity = result.carouselOpacity || 0.7;
        nextImage.style.opacity = opacity;
      });
      currentImage.style.opacity = "0";
    }, 100);

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
    chrome.storage.local.set({ "slideshow-toggle": slideshowToggleIsActive });
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

    if (slideshowToggleIsActive) {
      if (!slideshowToggle.classList.contains("on")) {
        slideshowToggle.classList.add("on");
      }
      if (slideshowToggle.classList.contains("off")) {
        slideshowToggle.classList.remove("off");
      }
    } else {
      if (!slideshowToggle.classList.contains("off")) {
        slideshowToggle.classList.add("off");
      }
      if (slideshowToggle.classList.contains("on")) {
        slideshowToggle.classList.remove("on");
      }
    }

    slider.addEventListener("input", function () {
      const newOpacity = this.value;
      sliderValue.textContent = newOpacity;

      const currentImage = bgContainer.querySelector(".carousel-item");
      if (currentImage) {
        currentImage.style.opacity = newOpacity;
      }

      setOpacityAndSave(newOpacity);
    });

    const editImagesModal = document.getElementById("editImagesModal");
    const editImagesModalBtn = document.getElementById("edit-images-modal-btn");
    const closeBtn = document.querySelector(".close");
    const selectAllBtn = document.getElementById("selectAllBtn");

    if (editImagesModalBtn) {
      editImagesModalBtn.addEventListener("click", () => {
        editImagesModal.style.display = "flex";
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        editImagesModal.style.display = "none";
      });
    }

    selectAllBtn.addEventListener("click", function () {
      selectedImages = [...images];
      imageGrid.querySelectorAll("img").forEach((img) => {
        if (!img.classList.contains("selected")) {
          img.classList.add("selected");
        }
      });
      chrome.storage.local.set({ selectedImages: selectedImages });
    });

    function closeEditModal() {
      editImagesModal.style.display = "none";
    }

    editImagesModal.addEventListener("click", function (event) {
      if (event.target === editImagesModal) {
        closeEditModal();
      }
    });

    document.addEventListener("click", function (event) {
      if (
        editImagesModal.style.display === "flex" &&
        !editImagesModal.contains(event.target)
      ) {
        closeEditModal();
      }
    });

    function setOpacityAndSave(value) {
      chrome.storage.local.set({ carouselOpacity: value });
    }

    chrome.storage.local.get("carouselOpacity", function (result) {
      const savedOpacity = result.carouselOpacity || 0.7;
      slider.value = savedOpacity;
      sliderValue.textContent = savedOpacity;
      setOpacityAndSave(savedOpacity);
    });

    sliderSpeedInput.addEventListener("input", () => {
      const speed = sliderSpeedInput.value;
      currentSpeed = speed;
      sliderSpeedValue.value = currentSpeed;
      chrome.storage.local.set({ currentSpeed: currentSpeed });
    });

    sliderSpeedInput.addEventListener("input", function () {
      sliderSpeedValue.value = this.value;
    });

    slideshowToggle.addEventListener("click", () => {
      slideshowToggleIsActive = !slideshowToggleIsActive;
      chrome.storage.local.set({ "slideshow-toggle": slideshowToggleIsActive });

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
