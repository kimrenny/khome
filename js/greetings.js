function getRandomItemFromArray(array){
    return array[Math.floor(Math.random() * array.length)];
}

if(typeof document !== 'undefined'){
    document.addEventListener("DOMContentLoaded", function(){
        const greetingBox = document.getElementById('greetings');

        function updateGreetings(name){
            const greetings = {
                morning: [
                    `Good Morning, ${name}!`,
                    `Rise and shine, ${name}!`,
                    `Morning, ${name}!`
                ],
                afternoon: [
                    `Hello, ${name}!`,
                    `Hey there, ${name}!`,
                    `Good afternoon, ${name}!`
                ],
                evening: [
                    `Good Evening, ${name}!`,
                    `Evening, ${name}!`,
                    `Hi, ${name}!`
                ],
                night: [
                    `Good Night, ${name}!`,
                    `Nighty night, ${name}!`,
                    `Sweet dreams, ${name}!`
                ]
            };

            const currentDate = new Date();
            const currentHour = currentDate.getHours();

            let greeting = "";
            if (currentHour >= 5 && currentHour < 12){
                greeting = getRandomItemFromArray(greetings.morning);
            }else if(currentHour >= 12 && currentHour < 17){
                greeting = getRandomItemFromArray(greetings.afternoon);
            }else if(currentHour >= 17 && currentHour < 22){
                greeting = getRandomItemFromArray(greetings.evening);
            }else{
                greeting = getRandomItemFromArray(greetings.night);
            }

            greetingBox.textContent = greeting;
        }

        chrome.storage.local.get("userName", function(result){
            const savedName = result.userName;
            const defaultName = "Dear Friend";
            const userName = savedName || defaultName;
            updateGreetings(userName);
        })

        const nameInput = document.getElementById("name-input");
        const submitButton = document.getElementById("submit-btn");

        submitButton.addEventListener("click", function(){
            const newName = nameInput.value.trim();
            if(newName.length > 0){
                let name = newName.substring(0, 15);
                chrome.storage.local.set({"userName": name}, function(){
                    updateGreetings(name);
                });
            }
        });

        nameInput.addEventListener("keypress", function(event){
            if(event.key === "Enter"){
                const newName = nameInput.value.trim();
                if(newName.length > 0){
                    let name = newName.substring(0, 15);
                    chrome.storage.local.set({"userName": name}, function(){
                        updateGreetings(name);
                    });
                    nameInput.value = "";
                }
            }
        })

    });
}