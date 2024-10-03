const bgContainer = document.getElementById("bg");

let isTransitioning = false;

let currentSpeed;

let slideshowIntervalId;

chrome.storage.local.get("currentSpeed", function (result) {
  if (result.currentSpeed === undefined) {
    currentSpeed = 10;
    chrome.storage.local.set({ currentSpeed: currentSpeed });
  } else {
    currentSpeed = result.currentSpeed;
  }

  preloadImages();
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
];

function preloadImages() {
  chrome.storage.local.get("carouselOpacity", function (result) {
    const savedOpacity = result.carouselOpacity;
    images.forEach((image, index) => {
      const img = new Image();
      img.src = image;
      if (index === 0) {
        img.onload = () => {
          img.classList.add("carousel-item", "reveal");
          if (savedOpacity !== undefined) {
            img.style.opacity = savedOpacity;
          } else {
            img.style.opacity = 0.7;
            chrome.storage.local.set({ carouselOpacity: 0.7 });
          }
          bgContainer.appendChild(img);
        };
      }
    });
  });
}

let maxImages;

chrome.storage.local.get("maxImages", function (result) {
  if (result.maxImages === undefined) {
    maxImages = images.length;
    chrome.storage.local.set({ maxImages: maxImages });
  } else maxImages = result.maxImages;
});

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

  let nextIndex;
  do {
    nextIndex = getRandomIndex(maxImages);
  } while (nextIndex === currentIndex);

  currentIndex = nextIndex;

  const nextImage = new Image();
  nextImage.src = images[currentIndex];
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
    const maxImagesSlider = document.querySelector(".images-slider");
    const maxImagesValue = document.querySelector(".images-value");
    const sliderSpeedInput = document.querySelector(".slideshow-speed");
    const sliderSpeedValue = document.getElementById("slideshow-speed-text");

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

    function setOpacityAndSave(value) {
      chrome.storage.local.set({ carouselOpacity: value });
    }

    chrome.storage.local.get("carouselOpacity", function (result) {
      const savedOpacity = result.carouselOpacity || 0.7;
      slider.value = savedOpacity;
      sliderValue.textContent = savedOpacity;
      setOpacityAndSave(savedOpacity);
    });

    let maxImagesSet;

    chrome.storage.local.get("maxImagesSet", function (result) {
      maxImagesSet = result.maxImagesSet == true;
    });

    chrome.storage.local.get("maxImages", function (result) {
      const savedMaxImages = result.maxImages || images.length;
      if (
        (savedMaxImages == 24 ||
          (savedMaxImages > 40 && savedMaxImages < images.length)) &&
        !maxImagesSet
      ) {
        maxImagesSlider.value = images.length;
        maxImagesValue.textContent = images.length;
        maxImagesSet = true;
        chrome.storage.local.set({ maxImagesSet: true });
      } else {
        maxImagesSlider.value = savedMaxImages;
        maxImagesValue.textContent = savedMaxImages;
      }
    });

    slider.addEventListener("input", function () {
      const value = this.value;
      sliderValue.textContent = value;

      const activeImage = bgContainer.querySelector(".carousel-item.reveal");
      activeImage.style.opacity = value;

      setOpacityAndSave(value);
    });

    maxImagesSlider.addEventListener("input", function () {
      const value = this.value;
      maxImagesValue.textContent = value;

      chrome.storage.local.set({ maxImages: value });
    });

    sliderSpeedInput.addEventListener("input", function () {
      const value = parseInt(this.value);
      sliderSpeedValue.value = value;

      chrome.storage.local.set({ currentSpeed: value });

      if (slideshowToggleIsActive) {
        clearInterval(slideshowIntervalId);
        slideshowIntervalId = setInterval(revealNextImage, value * 1000);
      }
    });

    sliderSpeedValue.addEventListener("input", function () {
      let value = this.value.trim();

      if (value === "") {
        return;
      }

      let parsedValue = parseInt(value);

      if (isNaN(parsedValue) || parsedValue < 3) {
        return;
      } else if (parsedValue > 900) {
        parsedValue = 900;
      }

      this.value = parsedValue;

      chrome.storage.local.set({ currentSpeed: parsedValue });

      if (slideshowToggleIsActive) {
        clearInterval(slideshowIntervalId);
        slideshowIntervalId = setInterval(revealNextImage, parsedValue * 1000);
      }
    });

    slideshowToggle.addEventListener("click", function () {
      if (slideshowToggle.classList.contains("on")) {
        slideshowToggle.classList.remove("on");
        slideshowToggle.classList.add("off");
        slideshowToggleIsActive = false;
        chrome.storage.local.set({
          "slideshow-toggle": slideshowToggleIsActive,
        });
        clearInterval(revealNextImage);
      } else if (slideshowToggle.classList.contains("off")) {
        slideshowToggle.classList.remove("off");
        slideshowToggle.classList.add("on");
        slideshowToggleIsActive = true;
        chrome.storage.local.set({
          "slideshow-toggle": slideshowToggleIsActive,
        });
        setInterval(revealNextImage, currentSpeed);
      }
    });
  });
}
