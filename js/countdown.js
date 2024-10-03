import flatpickr from "flatpickr";

if(typeof document !== 'undefined'){
    document.addEventListener("DOMContentLoaded", function(){
        const countdownElement = document.querySelector(".d-day");
        const dateInput = document.getElementById("dateInput");
        const submitBtn = document.getElementById("submitDate");
        const resetBtn = document.getElementById("resetDate");
        const dayToggle = document.getElementById("d-day-toggle");

        let savedDayEnable;

        function loadDayEnable(){
            chrome.storage.local.get("dayEnable", function(result){
                savedDayEnable = result["dayEnable"];

                if(savedDayEnable === undefined){
                    savedDayEnable = true;
                    chrome.storage.local.set({"dayEnable": savedDayEnable}, function(){
                        updateUI(savedDayEnable);
                    });
                }else{
                    updateUI(savedDayEnable);
                }

                dayToggle.addEventListener("click", function(){
                    savedDayEnable = !savedDayEnable;
                    chrome.storage.local.set({"dayEnable": savedDayEnable}, function(){
                        updateUI(savedDayEnable);
                    });
                });

                updateUI(savedDayEnable);
            });
        };


        function updateUI(enabled){  
            if(enabled){
                countdownElement.style.visibility = "visible";
                dayToggle.classList.remove("off");
                dayToggle.classList.add("on");
            }else{
                countdownElement.style.visibility = "hidden";
                dayToggle.classList.remove("on");
                dayToggle.classList.add("off");
            }
        }

        loadDayEnable();

        let isSuccessModalIsDisplay = false;

        function showSuccessModal(){
            const successModal = document.getElementById("changes-modal-success");
            if(isSuccessModalIsDisplay){
                return;
            }

            isSuccessModalIsDisplay = true;
            successModal.classList.remove("display-none");
            successModal.classList.add("active");
            setTimeout(() => {
                successModal.classList.remove("active");
                successModal.classList.add("disable");
                setTimeout(() => {
                    successModal.classList.add("display-none");
                    successModal.classList.remove("disable");
                }, 500);
            }, 3000);

            isSuccessModalIsDisplay = false;
        }

        flatpickr("#dateInput", {
            dateFormat: "d.m.Y",
            altInput: false,
            appendTo: document.getElementById("d-day-section")
        });

        function saveDate(date){
            chrome.storage.local.set({"savedDate": date.toISOString()});
        }

        let savedDate;

        function loadDate(callback){
            chrome.storage.local.get("savedDate", function(result){
                const savedDateStr = result["savedDate"];
                if(savedDateStr){
                    savedDate = new Date(savedDateStr);
                    callback(savedDate);
                }else{
                    callback(null);
                }
            })
        }

        function updateCountdown(targetDate){
            if (!(targetDate instanceof Date) || isNaN(targetDate.getTime())){
                countdownElement.textContent = "D - Day";
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

        loadDate(function(){
            if(savedDate){
                updateCountdown(savedDate);
            }else{
                countdownElement.textContent = "D - Day";
            }
        });

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
            showSuccessModal();

            dateInput.value = "";
        });

        resetBtn.addEventListener("click", function(){
            chrome.storage.local.remove("savedDate", function(){
                loadDate(function(newSavedDate){
                    savedDate = newSavedDate;
                    updateCountdown(savedDate);
                    showSuccessModal();
                });
            });
        });

        setTimeout(() => {
            updateCountdown(savedDate);
        }, 60*60*1000);
    });
}