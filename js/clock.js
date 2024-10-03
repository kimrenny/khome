if(typeof document !== 'undefined'){
    document.addEventListener("DOMContentLoaded", function(){
        const periodElement = document.getElementById("period");
        const clockToggle = document.getElementById("clock-toggle");
        let animationFrameId;
        let is24HourFormat = true;

        function saveHourFormat(is24HourFormat){
            chrome.storage.local.set({"is24HourFormat": is24HourFormat});
        }

        function loadHourFormat(){
            chrome.storage.local.get("is24HourFormat", function(result){
                const savedHourFormat = result["is24HourFormat"];
                if(savedHourFormat !== undefined){
                    is24HourFormat = savedHourFormat === "true";
                }
            });
        }

        function updateClock(){
            let currentTime = new Date();

            let hours = currentTime.getHours();
            let minutes = currentTime.getMinutes();
            let seconds = currentTime.getSeconds();

            const hoursTensElement = document.getElementById("hours-tens");
            const hoursOnesElement = document.getElementById("hours-ones");
            const minutesTensElement = document.getElementById("minutes-tens");
            const minutesOnesElement = document.getElementById("minutes-ones");
            const secondsTensElement = document.getElementById("seconds-tens");
            const secondsOnesElement = document.getElementById("seconds-ones");

            let period = 'AM';

            if (hours >= 12){
                period = 'PM';
            }
            
            if (!is24HourFormat){
            hours = (hours > 12) ? hours - 12 : hours;
            }

            hours = (hours < 10 && hours !== 0) ? "0" + hours : hours;
            minutes = (minutes < 10) ? "0" + minutes : minutes;
            seconds = (seconds < 10) ? "0" + seconds : seconds;

            hoursTensElement.textContent = Math.floor(hours / 10);
            hoursOnesElement.textContent = Math.floor(hours % 10);
            minutesTensElement.textContent = Math.floor(minutes / 10);
            minutesOnesElement.textContent = Math.floor(minutes % 10);
            secondsTensElement.textContent = Math.floor(seconds / 10);
            secondsOnesElement.textContent = Math.floor(seconds % 10);

            if(is24HourFormat){
                periodElement.style.opacity = 0;
            } else{
                periodElement.style.opacity = 1;
                periodElement.textContent = period.toLowerCase();
            }
            animationFrameId = requestAnimationFrame(() => updateClock(is24HourFormat));

            if(is24HourFormat){
                clockToggle.classList.remove("off");
                clockToggle.classList.add("on");
            }else{
                clockToggle.classList.remove("on");
                clockToggle.classList.add("off");
            }
        }

        function toggleClockFormat(){
            is24HourFormat = !is24HourFormat;
            saveHourFormat(is24HourFormat);
            updateClock();
        }

        clockToggle.addEventListener("click", function(){
            toggleClockFormat();
        });

        loadHourFormat();

        updateClock();
    });
}