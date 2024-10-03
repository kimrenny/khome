if(typeof document !== 'undefined'){
    document.addEventListener("DOMContentLoaded", function () {
        const settingsBtn = document.getElementById("settings-btn");
        const settingsModal = document.getElementById("settings-modal");
        const settingsSections = document.querySelectorAll(".settings-section");
        const toggles = document.querySelectorAll(".toggle-switch");
        const timerButtonToggle = document.getElementById("timer-button-toggle");
        const timerButton = document.getElementById("timer-btn");
        // const gptButtonToggle = document.getElementById("chatgpt-button-toggle");
        // const gptButton = document.getElementById("gpt-btn");
        // const radioButtons = document.querySelectorAll(".gpt-radio");

        let isRotated = false;
        // settings consts
        const elements = {
            "bookmark-toggle": ["bookmark"],
            "search-toggle": ["search-bar"],
            "weather-toggle": ["weather"],
            "greetings-toggle": ["greetings"],
            "task-list-toggle": ["task-container"],
            "timer-button-toggle": ["timer-btn"],
            // "chatgpt-button-toggle": ["gpt-btn"],
        };

        function saveToggleState(toggleId, state) {
            const data = {};
            data[toggleId] = state;
            chrome.storage.local.set(data);
        }

        function loadToggleState(toggleId) {
            if(!(toggleId in elements)){
                return;
            }

            const elementIds = elements[toggleId];
            elementIds.forEach(elementId => {
                const element = document.getElementById(elementId);
                if(element){
                    element.style.opacity = 1;
                    element.style.pointerEvents = "auto";
                }
            });

            chrome.storage.local.get(toggleId, function(result){
                const state = result[toggleId];
                const toggle = document.getElementById(toggleId);

                if (state !== undefined) {
                    toggle.classList.toggle("on", state === "on");
                    toggle.classList.toggle("off", state === "off");
                    applyToggleState(toggleId, state);
                }else{
                    toggle.classList.add("on");
                    applyToggleState(toggleId, "on");
                }
            });
        }

        function applyToggleState(toggleId, state) {
            const relatedElementIds = elements[toggleId];
            if (relatedElementIds) {
                relatedElementIds.forEach(elementId => {
                    const element = document.getElementById(elementId);
                    if (element) {
                        element.style.opacity = state === "on" ? 1 : 0;
                        element.style.pointerEvents = state === "on" ? "auto" : "none";
                    }
                });
            }
        }

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

        // chrome.storage.local.get("savedGPTModel", function(result){
        //     const savedGPTModel = result["savedGPTModel"] || "gpt-3.5-turbo";
        //     //console.log(savedGPTModel);
        //     const radioButtonGPT3_5 = document.querySelector('input[value="GPT-3.5"]');
        //     const radioButtonGPT4 = document.querySelector('input[value="GPT-4"]');

        //     if(savedGPTModel === "gpt-3.5-turbo" && radioButtonGPT3_5){
        //         radioButtonGPT3_5.checked = true;
        //     }else if(savedGPTModel === "gpt-4" && radioButtonGPT4){
        //         radioButtonGPT4.checked = true;
        //     }
        // });

        toggles.forEach(toggle => {
            const toggleId = toggle.getAttribute("id");
            loadToggleState(toggleId);

            toggle.addEventListener("click", function () {
                toggle.classList.toggle("on");
                toggle.classList.toggle("off");
                const state = toggle.classList.contains("on") ? "on" : "off";
                saveToggleState(toggleId, state);
                applyToggleState(toggleId, state);
                showSuccessModal();
            });
        });

        timerButtonToggle.addEventListener("click", function(){
            if(timerButtonToggle.classList.contains("on")){
                if(timerButton.classList.contains("hidden")){
                    timerButton.classList.remove("hidden");
                }
            }else{
                if(!timerButton.classList.contains("hidden")){
                    timerButton.classList.add("hidden");
                }
            }
            showSuccessModal();
        });

        if(timerButtonToggle.classList.contains("on")){
            if(timerButton.classList.contains("hidden")){
                timerButton.classList.remove("hidden");
            }
        }else{
            if(!timerButton.classList.contains("hidden")){
                timerButton.classList.add("hidden");
            }
        }

        // gptButtonToggle.addEventListener("click", function(){
        //     if(gptButtonToggle.classList.contains("on")){
        //         if(gptButton.classList.contains("hidden")){
        //             gptButton.classList.remove("hidden");
        //         }
        //     }else{
        //         if(!gptButton.classList.contains("hidden")){
        //             gptButton.classList.add("hidden");
        //         }
        //     }
        //     showSuccessModal();
        // });

        // if(gptButtonToggle.classList.contains("on")){
        //     if(gptButton.classList.contains("hidden")){
        //         gptButton.classList.remove("hidden");
        //     }
        // }else{
        //     if(!gptButton.classList.contains("hidden")){
        //         gptButton.classList.add("hidden");
        //     }
        // };

        // radioButtons.forEach(function(button){
        //     button.addEventListener('change', function(){
        //         if(this.value == "GPT-3.5"){
        //             chrome.storage.local.set({ "savedGPTModel": "gpt-3.5-turbo" });
        //         }else if(this.value == "GPT-4"){
        //             chrome.storage.local.set({ "savedGPTModel": "gpt-4" });
        //         }
        //         showSuccessModal();
        //     });
        // });

        document.addEventListener("click", function (event) {
            const settingsBtn = document.getElementById("settings-btn");
            const settingsModal = document.getElementById("settings-modal");
            const dateInput = document.getElementById("dateInput");
            const flatpickrCalendar = document.querySelector(".flatpickr-calendar");

            const isSettingsBtn = event.target === settingsBtn;
            const isInsideModal = settingsModal.contains(event.target);
            const isInsideDateInput = event.target === dateInput;
            const isInsideCalendar = flatpickrCalendar.contains(event.target);

            if (!isInsideCalendar && !isInsideDateInput) {
                if(!isInsideModal && !isSettingsBtn){
                    settingsModal.classList.add("hidden");

                    isRotated = false;
                    settingsBtn.classList.toggle("rotate-clockwise", isRotated);
                    settingsBtn.classList.toggle("active", isRotated);
                };
            }
        });

        settingsSections.forEach(section => {
            section.addEventListener("click", function () {
                settingsSections.forEach(otherSection => {
                    otherSection.classList.remove("selected");
                });

                section.classList.add("selected");

                const targetId = section.getAttribute("data-target");
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    const settingsContents = document.querySelectorAll(".settings-content");
                    settingsContents.forEach(content => {
                        content.classList.remove("active");
                    });
                    targetSection.classList.add("active");
                }
            });
        });

        settingsBtn.addEventListener("click", function (event) {
            isRotated = !isRotated;
            settingsBtn.classList.toggle("rotate-clockwise", isRotated);
            settingsBtn.classList.toggle("active", isRotated);
            if (settingsModal.classList.contains("display-none")) {
                settingsModal.classList.remove("display-none");
                settingsModal.classList.remove("hidden");
            } else {
                settingsModal.classList.toggle("hidden");
            }
        });

        settingsModal.addEventListener("click", function (event) {
            event.stopPropagation();
        });
    });
}