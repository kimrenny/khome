if(typeof document !== 'undefined'){
    document.addEventListener("DOMContentLoaded", function(){
        const timerSoundSelect = document.getElementById("timerSoundSelect");
        const playSoundButton = document.getElementById("playSoundButton");
        const saveSoundButton = document.getElementById("saveSoundButton");
        let currentAudio = null;

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

        const timerSounds = [
            { id: "alarmSound1", src: "audio/alert_1.mp3", label: "Sound 1" },
            { id: "alarmSound2", src: "audio/alert_2.mp3", label: "Sound 2" },
            { id: "alarmSound3", src: "audio/alert_3.mp3", label: "Sound 3" },
            { id: "alarmSound4", src: "audio/alert_4.mp3", label: "Sound 4" },
            { id: "alarmSound5", src: "audio/alert_5.mp3", label: "Sound 5" },
            { id: "alarmSound6", src: "audio/alert_6.mp3", label: "Sound 6" },
            { id: "alarmSound7", src: "audio/alert_7.mp3", label: "Sound 7" },
            { id: "alarmSound8", src: "audio/alert_8.mp3", label: "Sound 8" },
            { id: "alarmSound9", src: "audio/alert_9.mp3", label: "Sound 9" },
            { id: "alarmSound10", src: "audio/alert_10.mp3", label: "Sound 10" },
            { id: "alarmSound11", src: "audio/alert_11.mp3", label: "Sound 11" }
        ];

        timerSounds.forEach(sound => {
            const option = document.createElement("option");
            option.value = sound.id;
            option.textContent = sound.label;
            timerSoundSelect.appendChild(option);
        });

        timerSoundSelect.addEventListener("change", function(){
            playSoundButton.style.display = "inline-block";
            saveSoundButton.style.display = "inline-block";
        });

        playSoundButton.addEventListener("click", function(){
            const selectedSoundId = timerSoundSelect.value;
            const selectedAudio = document.getElementById(selectedSoundId);

            if(currentAudio && currentAudio !== selectedAudio){
                currentAudio.pause();
                currentAudio.currentTime = 0;
                if(playSoundButton.classList.contains("active")){
                    playSoundButton.classList.remove("active");
                }
            }

            if(selectedAudio.paused){
                selectedAudio.play();
                playSoundButton.classList.add("active");
            }else{
                selectedAudio.pause();
                selectedAudio.currentTime = 0;
                playSoundButton.classList.remove("active");
            }
            
            currentAudio = selectedAudio;
        });

        saveSoundButton.addEventListener("click", function(){
            const selectedSoundId = timerSoundSelect.value;
            chrome.storage.local.set({"savedAlarmSound": selectedSoundId});
            showSuccessModal();
        }); 
    });
}