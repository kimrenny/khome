const bgContainer = document.getElementById('bg');

let isTransitioning = false;

let currentSpeed = localStorage.getItem("currentSpeed");
    if(currentSpeed === null){
        currentSpeed = 10;
        localStorage.setItem("currentSpeed", currentSpeed);
    }

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
];

function preloadImages(){
    const savedOpacity = localStorage.getItem("carouselOpacity");
    images.forEach((image, index) => {
        const img = new Image();
        img.src = image;
        if(index === 0){
            img.onload = () => {
                img.classList.add('carousel-item', 'reveal');
                if(savedOpacity !== null){
                    img.style.opacity = savedOpacity;
                }else{
                    img.style.opacity = 0.7;
                    localStorage.setItem("carouselOpacity", 0.7);
                }
                bgContainer.appendChild(img);
            };
        }
    });
}

let maxImages = localStorage.getItem("maxImages");
if(maxImages === null){
    maxImages = images.length;
    localStorage.setItem("maxImages", maxImages);
}

function getRandomIndex(max){
    return Math.floor(Math.random() * max);
}

preloadImages();

function revealNextImage(){
    if(isTransitioning){
        return;
    }
    
    isTransitioning = true;

    const currentImage = bgContainer.querySelector('.carousel-item');
    currentImage.classList.remove('reveal');

    let nextIndex;
    do{
        nextIndex = getRandomIndex(maxImages);
    }while (nextIndex === currentIndex);

    currentIndex = nextIndex;
    
    const nextImage = new Image();
    nextImage.src = images[currentIndex];
    nextImage.classList.add('carousel-item', 'reveal');
    nextImage.style.opacity = '0';
    bgContainer.appendChild(nextImage);

    setTimeout(() => {
       nextImage.style.transition = 'opacity 2s ease-in-out';
       nextImage.style.opacity = localStorage.getItem("carouselOpacity");
       currentImage.style.opacity = '0'; 
    }, 100);

    setTimeout(() => {
        if(bgContainer.contains(currentImage)){
        bgContainer.removeChild(currentImage);
        }
    }, 2000);

    setTimeout(() => {
        isTransitioning = false;
        clearInterval(slideshowIntervalId);
        slideshowIntervalId = setInterval(revealNextImage, currentSpeed * 1000);
    }, 2000);
}

let slideshowToggleIsActive = localStorage.getItem("slideshow-toggle");
if(slideshowToggleIsActive === null){
    slideshowToggleIsActive = true;
    localStorage.setItem("slideshow-toggle", slideshowToggleIsActive);
}else{
    slideshowToggleIsActive = JSON.parse(slideshowToggleIsActive);
}

let slideshowIntervalId;

if(slideshowToggleIsActive){
    slideshowIntervalId = setInterval(revealNextImage, currentSpeed * 1000);
}

document.addEventListener("DOMContentLoaded", function(){
    const slider = document.querySelector(".setting-slider");
    const sliderValue = document.querySelector(".slider-value");
    const slideshowToggle = document.getElementById("slideshow-toggle");
    const maxImagesSlider = document.querySelector(".images-slider");
    const maxImagesValue = document.querySelector(".images-value");
    const sliderSpeedInput = document.querySelector(".slideshow-speed");
    const sliderSpeedValue = document.getElementById("slideshow-speed-text");

    if(slideshowToggleIsActive){
        if(!slideshowToggle.classList.contains("on")){
            if(slideshowToggle.classList.contains("off")){
                slideshowToggle.classList.remove("off");
            }
            slideshowToggle.classList.add("on");
        }
    }else{
        if(!slideshowToggle.classList.contains("off")){
            if(slideshowToggle.classList.contains("on")){
                slideshowToggle.classList.remove("on");
            }
            slideshowToggle.classList.add("off");
        }
    }

    function setOpacityAndSave(value){
        localStorage.setItem("carouselOpacity", value);
    }

    const savedOpacity = localStorage.getItem("carouselOpacity");
    if(savedOpacity !== null){
        slider.value = savedOpacity;
        sliderValue.textContent = savedOpacity;
        setOpacityAndSave(savedOpacity);
    } else{
        slider.value = 0.7;
        sliderValue.textContent = "0.7";
        setOpacityAndSave(0.7);
    }

    const savedMaxImages = localStorage.getItem("maxImages");
    if(savedMaxImages !== null){
        maxImagesSlider.value = savedMaxImages;
        maxImagesValue.textContent = savedMaxImages;
    } else{
        maxImagesSlider.value = images.length;
        maxImagesValue.textContent = images.length;
        localStorage.setItem("maxImages", images.length);
    }
    
    if(currentSpeed !== null){
        sliderSpeedInput.value = currentSpeed;
        sliderSpeedValue.value = currentSpeed;
    }else{
        currentSpeed = 10;
        sliderSpeedInput.value = 10;
        sliderSpeedValue.value = 10;
    }

    slider.addEventListener("input", function(){
        const value = this.value;
        sliderValue.textContent = value;

        const activeImage = bgContainer.querySelector(".carousel-item.reveal");
        activeImage.style.opacity = value;

        setOpacityAndSave(value);
    });

    maxImagesSlider.addEventListener("input", function(){
        const value = this.value;
        maxImagesValue.textContent = value;
        
        maxImages = value;
        localStorage.setItem("maxImages", maxImages);
    });

    sliderSpeedInput.addEventListener("input", function(){
        const value = parseInt(this.value);
        sliderSpeedValue.value = value;

        currentSpeed = value;
        localStorage.setItem("currentSpeed", currentSpeed);

        if(slideshowToggleIsActive){
            clearInterval(slideshowIntervalId);
            slideshowIntervalId = setInterval(revealNextImage, value * 1000);
        }
    });

    sliderSpeedValue.addEventListener("input", function(){
        let value = this.value.trim();

        if(value === ''){
            return;
        }

        let parsedValue = parseInt(value);

        if(isNaN(parsedValue) || parsedValue < 3){
            return;
        }else if(parsedValue > 900){
            parsedValue = 900;
        }
        
        this.value = parsedValue;

        currentSpeed = parsedValue;
        sliderSpeedInput.value = parsedValue;
        localStorage.setItem("currentSpeed", currentSpeed);
        if(slideshowToggleIsActive){
            clearInterval(slideshowIntervalId);
            slideshowIntervalId = setInterval(revealNextImage, parsedValue * 1000);
        }
    });

    slideshowToggle.addEventListener("click", function(){
        if(slideshowToggle.classList.contains("on")){
            slideshowToggle.classList.remove("on");
            slideshowToggle.classList.add("off");
            slideshowToggleIsActive = false;
            localStorage.setItem("slideshow-toggle", slideshowToggleIsActive);
            clearInterval(revealNextImage);
        }else if(slideshowToggle.classList.contains("off")){
            slideshowToggle.classList.remove("off");
            slideshowToggle.classList.add("on");
            slideshowToggleIsActive = true;
            localStorage.setItem("slideshow-toggle", slideshowToggleIsActive);
            setInterval(revealNextImage, currentSpeed);
        }
    })
})