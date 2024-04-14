import flatpickr from "flatpickr";

document.addEventListener("DOMContentLoaded", function(){
    const countdownElement = document.querySelector(".d-day");
    const dateInput = document.getElementById("dateInput");
    const submitBtn = document.getElementById("submitDate");
    const resetBtn = document.getElementById("resetDate");
    const dayToggle = document.getElementById("d-day-toggle");

    let savedDayEnable = localStorage.getItem("dayEnable");
    if(savedDayEnable === null){
        savedDayEnable = true;
        localStorage.setItem("dayEnable", savedDayEnable);
    }else{
        savedDayEnable = JSON.parse(savedDayEnable);
    }

    updateUI(savedDayEnable);

    dayToggle.addEventListener("click", function(){
        savedDayEnable = !savedDayEnable;
        localStorage.setItem("dayEnable", savedDayEnable)
        updateUI(savedDayEnable);
    });

    function updateUI(enabled){  
        if(enabled){
            countdownElement.style.visibility = "visible";
            dayToggle.classList.remove("on");
            dayToggle.classList.add("off");
        }else{
            countdownElement.style.visibility = "hidden";
            dayToggle.classList.remove("off");
            dayToggle.classList.add("on");
        }
    }

    flatpickr("#dateInput", {
        dateFormat: "d.m.Y",
        altInput: false,
        appendTo: document.getElementById("d-day-section")
    });

    function saveDate(date){
        localStorage.setItem("savedDate", date.toISOString());
    }

    function loadDate(){
        const savedDateStr = localStorage.getItem("savedDate");
        return savedDateStr ? new Date(savedDateStr) : null;
    }

    let savedDate = loadDate();
    if(savedDate){
        updateCountdown(savedDate);
    }else{
        countdownElement.textContent = "D - Day";
    }

    function updateCountdown(targetDate){
        if (!(targetDate instanceof Date) || isNaN(targetDate.getTime())){
            countdownElement.textContent = "";
            return;
        }

        const timeDifference = targetDate.getTime() - Date.now();

        const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

        let displayText = `D - ${Math.abs(daysDifference)}`;

        if (daysDifference < 0){
            displayText = `D - +${Math.abs(daysDifference)}`;
        }

        countdownElement.textContent = displayText;

    }

    function checkValidDate(dateString){
        const dateParts = dateString.split('.');
        if(dateParts.length !== 3){
            return false;
        }

        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const year = parseInt(dateParts[2], 10);

        const targetDate = new Date(year, month, day);
        const currentDate = new Date();

        if(isNaN(targetDate)){
            return false;
        }

        if(targetDate <= currentDate){
            return false;
        }

        return targetDate;
    }

    submitBtn.addEventListener("click", function(){
        const inputDate = dateInput.value.trim();

        if(!inputDate) return;

        const targetDate = checkValidDate(inputDate);

        if(!targetDate){
            alert("Please enter a valid date.");
            return;
        }
        
        saveDate(targetDate);
        updateCountdown(targetDate);

        dateInput.value = "";
    });

    resetBtn.addEventListener("click", function(){
        localStorage.removeItem("savedDate");
        savedDate = loadDate();
        updateCountdown(savedDate);
    });

    setTimeout(() => {
        updateCountdown(savedDate);
    }, 60*60*1000);



});