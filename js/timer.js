if(typeof document !== 'undefined'){
    document.addEventListener("DOMContentLoaded", function(){
        const timerBtn = document.getElementById("timer-btn");
        const timerModal = document.getElementById("timer-modal");
        const viewTimersBtn = document.getElementById("view-timers-btn");
        const timersModal = document.getElementById("timers-modal");
        const timerToggle = document.getElementById("timer-toggle-alarm");
        const alarmToggle = document.getElementById("alarm-toggle-alarm");
        const timerSelectedModal = document.getElementById("timer-selected-modal");
        const alarmSelectedModal = document.getElementById("alarm-selected-modal");
        const timersCreateBtn = document.getElementById("timers-create-btn");
        const alarmsCreateBtn = document.getElementById("alarms-create-btn");
        const timersCreateBtnA = document.getElementById("timers-create-btn-arrow");
        const alarmsCreateBtnA = document.getElementById("alarms-create-btn-arrow");
        const timersCreateModal = document.getElementById("timer-create-modal");
        const alarmsCreateModal = document.getElementById("alarm-create-modal");
        const saveTimerBtn = document.getElementById("save-timer-btn");
        const saveAlarmBtn = document.getElementById("save-alarm-btn");
        const cancelTimerBtn = document.getElementById("cancel-timer-btn");
        const cancelAlarmBtn = document.getElementById("cancel-alarm-btn");
        const newTimerName = document.getElementById("timer-name");
        const newTimerTime = document.getElementById("timer-time");
        const newAlarmName = document.getElementById("alarm-name");
        const newAlarmTime = document.getElementById("alarm-time");
        
        let loadSavedTimer;
        let loadSavedAlarm;

        let alarmInterval;
        let timerInterval;

        let duration;
        let timer;

        function saveTimerOrAlarm(name, time, type){
            if(!name || !time){
                console.log("Name or time is missing");
                return;
            }
            const itemKey = type === 'timer' ? 'timers' : 'alarms';
            chrome.storage.local.get(itemKey, function(result){
                const existingItems = result[itemKey] || [];

                const isDuplicate = existingItems.some(item => item.name === name && item.time === time);
                if(!isDuplicate){
                    const updatedItems = [...existingItems, { name, time }];
                    chrome.storage.local.set({ [itemKey]: updatedItems });
                }
            });   
        }
        
        function removeTimerOrAlarm(name, time, type){
            const itemKey = type === 'timer' ? 'timers' : 'alarms';

            chrome.storage.local.get(itemKey, function(result){
                const existingItems = result[itemKey] || [];
                const updatedItems = existingItems.filter(item => !(item.name === name && item.time === time));
                chrome.storage.local.set({ [itemKey]: updatedItems });
            });
        }

        let timersExist = false;
        let alarmsExist = false;
        
        function loadTimersAndAlarms(){
            loadSavedTimer = true;
            loadSavedAlarm = true;

            chrome.storage.local.get(['timers', 'alarms'], function(result){
                const timers = result['timers'] || [];
                const alarms = result['alarms'] || [];
            
                const timersModalList = document.getElementById("timers-modal-list");
                timersModalList.innerHTML = "";

                const alarmsModalList = document.getElementById("alarms-modal-list");
                alarmsModalList.innerHTML = "";
        
                timers.forEach(timer => createTimerSwitch(timer.name, timer.time));
                alarms.forEach(alarm => createAlarmSwitch(alarm.name, alarm.time));

                if(timers.length > 0){
                    timersExist = true;
                }
                if(alarms.length > 0){
                    alarmsExist = true;
                }

                if(!timersExist){
                    createTimerSwitch("My Timer", "00:01:00");
                }

                if(!alarmsExist){
                    createAlarmSwitch("My Alarm", "09:00:00");
                }

            });

            loadSavedTimer = false;
            loadSavedAlarm = false;
        }

    /*

        function clearTimersAndAlarms(){
            chrome.storage.local.remove(['timers', 'alarms']);
        }

        clearTimersAndAlarms();

    */

        loadTimersAndAlarms();

        let isTimerOn = false;
        let isAlarmOn = false;

        if(timerToggle.classList.contains("on")){
            timerToggle.classList.remove("on");
            timerToggle.classList.add("off");
        }
        if(alarmToggle.classList.contains("on")){
            alarmToggle.classList.remove("on");
            alarmToggle.classList.add("off");
        }

        timerBtn.addEventListener("click", function(){
            if(timerModal.classList.contains("display-none")){
                timerModal.classList.remove("display-none");
            }
            timerModal.classList.toggle("hidden");
            timerBtn.classList.toggle("active");

            if(!timerBtn.classList.contains("active")){
                if(timerBtn.classList.contains("rotate-right-btn")){
                    timerBtn.classList.remove("rotate-right-btn");
                }

                hideTimePickerModal();

                if(!timersModal.classList.contains("hidden")){
                    timersModal.classList.add("hidden");
                }

                viewTimersBtn.classList.remove("active");
                if(!viewTimersBtn.classList.contains("active")){
                    hideSelectedModal("timer");
                    isTimerOn = false;
                    hideSelectedModal("alarm");
                    isAlarmOn = false;
                }

                if(timerToggle.classList.contains("on")){
                    timerToggle.classList.remove("on");
                    timerToggle.classList.add("off");
                }
                if(alarmToggle.classList.contains("on")){
                    alarmToggle.classList.remove("on");
                    alarmToggle.classList.add("off");
                }

                if(!timersCreateModal.classList.contains("display-none")){
                    timersCreateModal.classList.add("hidden");
                }

                if(!timerSelectedModal.classList.contains("hidden")){
                    timerSelectedModal.classList.add("hidden");
                }
            } else{
                timerBtn.classList.add("rotate-right-btn");
            }
        });

        viewTimersBtn.addEventListener("click", function(){
            hideTimePickerModal();
            if(timersModal.classList.contains("display-none")){
                timersModal.classList.remove("display-none");
            }
            timersModal.classList.toggle("hidden");
            viewTimersBtn.classList.toggle("active");
            if(!viewTimersBtn.classList.contains("active")){
                hideSelectedModal("timer");
                isTimerOn = false;
                hideSelectedModal("alarm");
                isAlarmOn = false;
            }

            if(timerToggle.classList.contains("on")){
                timerToggle.classList.remove("on");
                timerToggle.classList.add("off");
            }
            if(alarmToggle.classList.contains("on")){
                alarmToggle.classList.remove("on");
                alarmToggle.classList.add("off");
            }

            if(!timersCreateModal.classList.contains("display-none")){
                if(!timersCreateModal.classList.contains("hidden")){
                timersCreateModal.classList.add("hidden");
                }
            }
        });

        timerToggle.addEventListener("click", function(){
            if (!isTimerOn) {
                isTimerOn = true;
                isAlarmOn = false;
                timerToggle.classList.remove("off");
                timerToggle.classList.add("on");
                alarmToggle.classList.remove("on");
                alarmToggle.classList.add("off");
                hideSelectedModal("alarm");
                showSelectedModal("timer");
                hideTimePickerModal();
            } else {
                isTimerOn = false;
                timerToggle.classList.remove("on");
                timerToggle.classList.add("off");
                hideSelectedModal("timer");
                hideTimePickerModal();
            }
        });

        alarmToggle.addEventListener("click", function(){
            if (!isAlarmOn) {
                isAlarmOn = true;
                isTimerOn = false;
                alarmToggle.classList.remove("off");
                alarmToggle.classList.add("on");
                timerToggle.classList.remove("on");
                timerToggle.classList.add("off");
                hideSelectedModal("timer");
                showSelectedModal("alarm");
                hideTimePickerModal();
            } else {
                isAlarmOn = false;
                alarmToggle.classList.remove("on");
                alarmToggle.classList.add("off");
                hideSelectedModal("alarm");
                hideTimePickerModal();
            }
        });

        function showSelectedModal(type){
            if(type === "timer"){
                if(timerSelectedModal.classList.contains("display-none")){
                timerSelectedModal.classList.remove("display-none");
                }else{
                    timerSelectedModal.classList.remove("hidden");
                }
            } else if(type === "alarm"){
                if(alarmSelectedModal.classList.contains("display-none")){
                alarmSelectedModal.classList.remove("display-none");
                }else{
                    alarmSelectedModal.classList.remove("hidden");
                }
            }
        }

        function hideSelectedModal(type){
            if (type === "timer"){
                if(!timerSelectedModal.classList.contains("display-none")){
                    timerSelectedModal.classList.add("hidden");
                }
                if(!timersCreateModal.classList.contains("display-none")){
                    timersCreateModal.classList.add("hidden");
                }
            }else if(type === "alarm"){
                if(!alarmSelectedModal.classList.contains("display-none")){
                    alarmSelectedModal.classList.add("hidden");
                }
                if(!alarmsCreateModal.classList.contains("display-none")){
                    alarmsCreateModal.classList.add("hidden");
                }
            }
        }

        function createTimerSwitch(timerName, seconds){
            
            const timerContainer = document.createElement("div");
            timerContainer.classList.add("timer-container");
        
            const toggleSwitch = document.createElement("div");
            toggleSwitch.classList.add("toggle-switch-timer", "off");

            const toggleHandle = document.createElement("div");
            toggleHandle.classList.add("toggle-handle");

            toggleSwitch.appendChild(toggleHandle);

            const timerText = document.createElement("span");
            timerText.textContent = timerName;

            timerContainer.appendChild(timerText);
            timerContainer.appendChild(toggleSwitch);

            const timerDeleteButton = document.createElement("div");
            timerDeleteButton.id = "delete-timer-btn";
            timerDeleteButton.classList.add("delete-timer-button");
            timerDeleteButton.addEventListener("click", function(){
                removeTimerOrAlarm(timerName, seconds, 'timer');
                timerContainer.remove();
            });

            timerContainer.appendChild(timerDeleteButton);

            const timersModalList = document.getElementById("timers-modal-list");
            timersModalList.appendChild(timerContainer);
            
            toggleSwitch.addEventListener("click", function(){
                const toggleSwitches = document.querySelectorAll(".toggle-switch-timer");
                toggleSwitches.forEach(element => {
                    if(element !== toggleSwitch && element.classList.contains("on")){
                    element.classList.remove("on");
                    element.classList.add("off");
                    }
                });

                toggleSwitch.classList.toggle("off");
                toggleSwitch.classList.toggle("on");

                if(toggleSwitch.classList.contains("on")){
                    const timeString = toggleSwitch.getAttribute("data-time");
                    startTimer(timeString);
                }
            });
            
            toggleSwitch.setAttribute("data-time", seconds);

            if(!loadSavedTimer){
                saveTimerOrAlarm(timerName, seconds, 'timer');
            }

            return{
                timerText: timerText,
                timeText: seconds,
                toggleSwitch: toggleSwitch
            };
        }

        timersCreateBtn.addEventListener("click", function(){
            if(timersCreateModal.classList.contains("display-none")){
                timersCreateModal.classList.remove("display-none");
            }else{
                timersCreateModal.classList.toggle("hidden");
            }
        });

        timersCreateBtnA.addEventListener("click", function(){
            if(timersCreateModal.classList.contains("display-none")){
                timersCreateModal.classList.remove("display-none");
            }else{
                timersCreateModal.classList.toggle("hidden");
            }
        });

        saveTimerBtn.addEventListener("click", function(){
            const inputText = newTimerName.value;
            const inputTime = newTimerTime.value;
            if(inputText && inputTime){
                createTimerSwitch(inputText, inputTime);
                newTimerName.value = "";
                newTimerTime.value = "";
            } else{
                return;
            }
        });

        cancelTimerBtn.addEventListener("click", function(){
            timersCreateModal.classList.add("hidden");
            hideTimePickerModal();
        });

        cancelAlarmBtn.addEventListener("click", function(){
            alarmsCreateModal.classList.add("hidden");
            hideTimePickerModal();
        })

        function createTimePickerModal(){
            const timePickerModal = document.createElement("div");
            timePickerModal.id = "time-picker-modal";
            timePickerModal.classList.add("time-select-modal");

            const modalContent = document.createElement("div");
            modalContent.classList.add("time-select-modal-content");

            const hoursSelect = document.createElement("select");
            hoursSelect.id = "hours-select";
            populateSelect(hoursSelect, 0, 23);

            const minutesSelect = document.createElement("select");
            minutesSelect.id = "minutes-select";
            populateSelect(minutesSelect, 0, 59);

            const secondsSelect = document.createElement("select");
            secondsSelect.id = "seconds-select";
            populateSelect(secondsSelect, 0, 59);

            const okButton = document.createElement("button");
            okButton.textContent = "OK";
            okButton.id = "ok-button";

            modalContent.appendChild(hoursSelect);
            modalContent.appendChild(minutesSelect);
            modalContent.appendChild(secondsSelect);
            modalContent.appendChild(okButton);
            timePickerModal.appendChild(modalContent);

            document.body.appendChild(timePickerModal);

            newTimerTime.addEventListener("click", function(){
                timePickerModal.style.display = "block";
            });

            okButton.addEventListener("click", function(){
                const hours = hoursSelect.value < 10 ? "0" + hoursSelect.value : hoursSelect.value;
                const minutes = minutesSelect.value < 10 ? "0" + minutesSelect.value : minutesSelect.value;
                const seconds = secondsSelect.value < 10 ? "0" + secondsSelect.value : secondsSelect.value;

                const formattedTime = `${hours}:${minutes}:${seconds}`;

                newTimerTime.value = formattedTime;

                timePickerModal.style.display = "none";
            });

            window.onclick = function(event){
                if(event.target == timePickerModal){
                    timePickerModal.style.display = "none";
                }
            };
        }

        function hideTimePickerModal(){
            const timePickerModal = document.getElementById("time-picker-modal");
            if(timePickerModal.style.display === "block"){
                timePickerModal.style.display = "none";
                viewTimersBtn.classList.remove("active");
            }
        }
        
        function populateSelect(select, start, end){
            for(let i = start; i <= end; i++){
                const option = document.createElement("option");
                option.text = i < 10 ? "0" + i : i;
                option.value = i;
                select.appendChild(option);
            }
        }

        function startTimer(timeString){
            let alarmSound;

            chrome.storage.local.get("savedAlarmSound", function(result){
                const savedAlarmSound = result["savedAlarmSound"];
                if(savedAlarmSound){
                    alarmSound = document.getElementById(`${savedAlarmSound}`);
                }else{
                    alarmSound = document.getElementById("alarmSound1");
                }
            });

            if(timerInterval){
                clearInterval(timerInterval);
            }
            if(alarmInterval){
                clearInterval(alarmInterval);
            }
            const pauseTimerBtn = document.getElementById("pause-timer-btn");
            const stopTimerBtn = document.getElementById("stop-alarm-btn");
            if(stopTimerBtn){
                stopTimerBtn.remove();
            }

            let isPaused = false;
            let isPauseBtnVisible = true;

            if(!isPauseBtnVisible){
                pauseTimerBtn.classList.add("hidden");
            }else{
                pauseTimerBtn.classList.remove("hidden");
            }

            const timeParts = timeString.split(":");
            let hours = parseInt(timeParts[0], 10);
            let minutes = parseInt(timeParts[1], 10);
            let seconds = parseInt(timeParts[2], 10);

            duration = hours * 3600 + minutes * 60 + seconds;
            timer = duration;

            const timerProgress = document.querySelector(".timer-progress");
            const timerText = document.querySelector(".timer-text");

            const circumference = parseFloat(timerProgress.getAttribute("stroke-dasharray"));
            const intervalDuration = 1000;

            pauseTimerBtn.addEventListener("click", function(){
                isPaused = !isPaused;
                if(!isPaused){
                    clearInterval(timerInterval);
                    timerInterval = setInterval(updateTimer, 1000);
                    if(pauseTimerBtn.classList.contains("active")){
                        pauseTimerBtn.classList.remove("active");
                    }
                } else{
                    clearInterval(timerInterval);
                    pauseTimerBtn.classList.add("active");
                }
            });

            const stopAlarmButton = document.createElement("div");
            stopAlarmButton.id = "stop-alarm-btn";
            stopAlarmButton.onclick = () => {
                timerText.textContent = "00:00:00";
                timerProgress.style.strokeDashoffset = 0;
                clearInterval(timerInterval);
                alarmSound.pause();
                stopAlarmButton.remove();
                pauseTimerBtn.classList.add("hidden");
                isPaused = false;
            };
            timerText.parentNode.appendChild(stopAlarmButton);

            function updateTimer(){
                const progressPercentage = ((duration - timer) / duration) * 100;
                const offset = circumference * (progressPercentage / 100);
                timerProgress.style.strokeDashoffset = circumference - offset;

                const remainingTime = new Date(timer * 1000).toISOString().substr(11, 8);
                timerText.textContent = remainingTime;

                if(--timer < 0){
                    clearInterval(timerInterval);
                    timerText.textContent = "00:00:00";

                    alarmSound.loop = true;
                    alarmSound.play();

                    pauseTimerBtn.classList.add("hidden");
                    isPaused = false;
                }
            }

            timerInterval = setInterval(updateTimer, intervalDuration);
        }

        alarmsCreateBtn.addEventListener("click", function(){
            if(alarmsCreateModal.classList.contains("display-none")){
                alarmsCreateModal.classList.remove("display-none");
            }else{
                alarmsCreateModal.classList.toggle("hidden");
            }
        });

        alarmsCreateBtnA.addEventListener("click", function(){
            if(alarmsCreateModal.classList.contains("display-none")){
                alarmsCreateModal.classList.remove("display-none");
            }else{
                alarmsCreateModal.classList.toggle("hidden");
            }
        });

        saveAlarmBtn.addEventListener("click", function(){
            const inputText = newAlarmName.value;
            const inputTime = newAlarmTime.value;

            if(inputText && isValidTime(inputTime)){
                createAlarmSwitch(inputText, inputTime);
                newAlarmName.value = "";
                newAlarmTime.value = "";
            }else{
                return;
            }
        });

        function isValidTime(timeString){
            const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
            return regex.test(timeString);
        };

        function createAlarmSwitch(alarmName, alarmTime){
            const alarmContainer = document.createElement("div");
            alarmContainer.classList.add("alarm-container");

            const toggleSwitch = document.createElement("div");
            toggleSwitch.classList.add("toggle-switch-timer", "off");

            const toggleHandle = document.createElement("div");
            toggleHandle.classList.add("toggle-handle");

            toggleSwitch.appendChild(toggleHandle);

            const alarmText = document.createElement("span");
            alarmText.textContent = alarmName;

            alarmContainer.appendChild(alarmText);
            alarmContainer.appendChild(toggleSwitch);

            const alarmDeleteButton = document.createElement("div");
            alarmDeleteButton.id = "delete-alarm-btn";
            alarmDeleteButton.classList.add("delete-alarm-button");
            alarmDeleteButton.addEventListener("click", function(){
                removeTimerOrAlarm(alarmName, alarmTime, 'alarm');
                alarmContainer.remove();
            });

            alarmContainer.appendChild(alarmDeleteButton);

            const alarmsModalList = document.getElementById("alarms-modal-list");
            alarmsModalList.appendChild(alarmContainer);

            toggleSwitch.addEventListener("click", function(){
                const stopAlarmButton = document.getElementById("stop-alarm-btn");
                if(stopAlarmButton){
                    stopAlarmButton.remove();
                }
                const allToggleSwitches = document.querySelectorAll(".toggle-switch-timer");
                allToggleSwitches.forEach(function(switchElement){
                    switchElement.classList.remove("on");
                    switchElement.classList.add("off");
                });

                toggleSwitch.classList.toggle("off");
                toggleSwitch.classList.toggle("on");

                if(toggleSwitch.classList.contains("on")){
                    startAlarm(alarmTime);
                }
            });

            if(!loadSavedAlarm){
                saveTimerOrAlarm(alarmName, alarmTime, 'alarm');
            }

            return {
                alarmText: alarmText,
                toggleSwitch: toggleSwitch
            };
        }

        function startAlarm(alarmTime){
            chrome.storage.local.get("savedAlarmSound", function(result){
                const savedAlarmSound = result["savedAlarmSound"];
                let alarmSound;

                if(savedAlarmSound){
                    alarmSound = document.getElementById(`${savedAlarmSound}`);
                }else{
                    alarmSound = document.getElementById("alarmSound1");
                }

                const stopTimerBtn = document.getElementById("stop-alarm-btn");
                if(stopTimerBtn){
                    stopTimerBtn.remove();
                }

                const pauseTimerBtn = document.getElementById("pause-timer-btn");
                if(!pauseTimerBtn.classList.contains("hidden")){
                    pauseTimerBtn.classList.add("hidden");
                }
            
                const timeParts = alarmTime.split(":");
                const hours = parseInt(timeParts[0]);
                const minutes = parseInt(timeParts[1]);
                const seconds = parseInt(timeParts[2]);

                const now = new Date();
                now.setHours(hours, minutes, seconds, 0);

                const alarmDateTime = now.getTime();
                console.log('alarmDateTime', alarmDateTime);

                const currentTime = new Date().getTime();
                console.log("currentTime", currentTime);

                let timeDifference = alarmDateTime - currentTime;
                console.log('timeDifference', timeDifference);

                if(timeDifference <= 0){
                    timeDifference += (24 * 60 * 60 * 1000);
                }

                if(alarmInterval){
                    clearInterval(alarmInterval);
                }

                if(timerInterval){
                    clearInterval(timerInterval);
                }

                const alarmProgress = document.querySelector(".timer-progress");
                const timerText = document.getElementById("timer-text");
                const circumference = parseFloat(alarmProgress.getAttribute("stroke-dasharray"));

                duration = timeDifference / 1000;
                timer = duration;

                const stopAlarmButton = document.createElement("div");
                stopAlarmButton.id = "stop-alarm-btn";
                stopAlarmButton.onclick = () => {
                    timerText.textContent = "00:00:00";
                    alarmProgress.style.strokeDashoffset = 0;
                    clearInterval(alarmInterval);
                    alarmSound.pause();
                    stopAlarmButton.remove();
                    isPaused = false;
                };
                timerText.parentNode.appendChild(stopAlarmButton);
                
                alarmInterval = setInterval(function(){
                    updateAlarm(alarmProgress, circumference, timerText);
                }, 1000);


                function updateAlarm(){
                    const progressPercentage = ((duration - timer) / duration) * 100;
                    const offset = circumference * (progressPercentage / 100);
                    alarmProgress.style.strokeDashoffset = circumference - offset;

                    const remainingTime = new Date(timer * 1000).toISOString().substr(11, 8);
                    timerText.textContent = remainingTime;

                    if(--timer <= 0){
                        alarmProgress.style.strokeDashoffset = 0;
                        clearInterval(alarmInterval);
                        timerText.textContent = "00:00:00";
                        alarmSound.loop = true;
                        alarmSound.play();
                    }
                }
            });   
        }

        createTimePickerModal();

        document.addEventListener("click", function(event){
            const target = event.target;
            if(!target.closest("#timer-modal") && !target.closest("#timers-modal") && !target.closest("#timer-btn") && !target.closest("#view-timers-btn") && !target.closest("#pause-timer-btn") && !target.closest("#stop-alarm-btn") && !target.closest("#time-picker-modal") && !target.closest("#delete-timer-btn") && !target.closest("#delete-alarm-btn")){
                timerModal.classList.add("hidden");
                timersModal.classList.add("hidden");
                timerBtn.classList.remove("active");
                if(timerBtn.classList.contains("rotate-right-btn")){
                    timerBtn.classList.remove("rotate-right-btn");
                }
                viewTimersBtn.classList.remove("active");
                if(timerToggle.classList.contains("on")){
                    timerToggle.classList.remove("on");
                    timerToggle.classList.add("off");
                }
                if(alarmToggle.classList.contains("on")){
                    alarmToggle.classList.remove("on");
                    alarmToggle.classList.add("off");
                }
                isTimerOn = false;
                isAlarmOn = false;
                hideSelectedModal("timer");
                hideSelectedModal("alarm");
                hideTimePickerModal();
            }
        });
    });
}