document.addEventListener("DOMContentLoaded", function(){
    const gptBtn = document.getElementById("gpt-btn");
    const gptModal = document.getElementById("gpt-modal");
    const userInput = document.getElementById("user-input");
    const sendBtn = document.getElementById("send-button");
    const chatHistoryDiv = document.getElementById("chatHistory");
    const timeoutError = document.getElementById("timeout-error");

    let requestInProgress = false;
    let displayErrorMsg = false;

    gptBtn.addEventListener("click", function(){
        if(gptModal.classList.contains("display-none")){
            gptModal.classList.remove("display-none");
        }
        gptModal.classList.toggle("hidden");
        gptBtn.classList.toggle("rotate-right-btn");
        gptBtn.classList.toggle("active");
    })

    function updateButtonClass(){
        if(userInput.value.trim() !== ""){
            sendBtn.classList.add("filled");
        } else{
            if(sendBtn.classList.contains("filled")){
                sendBtn.classList.remove("filled");
            }
        }
    }

    userInput.addEventListener("input", updateButtonClass);

    /*
    function generateSessionId(length){
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let sessionId = '';
        for(let i = 0; i < length; i++){
            sessionId += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return sessionId;
    }
    */

    function addMessage(container, content, role){
        const messageContainer = document.createElement('div');
        messageContainer.classList.add('message-container');

        const messageElement = document.createElement('div');
        messageElement.classList.add('message', role);
        messageElement.textContent = content;

        messageContainer.appendChild(messageElement);
        container.prepend(messageContainer);
        container.scrollTop = container.scrollHeight;
    }

    function displayTimeoutError(){
        displayErrorMsg = true;
        timeoutError.classList.add("active");
        setTimeout(() => {
            timeoutError.classList.add("hidden");
            timeoutError.classList.remove("active");
            displayErrorMsg = false;
        }, 2000);
    }

    sendBtn.addEventListener("click", async function sendRequest(){
        let gptModel = localStorage.getItem("savedGPTModel");
        if(gptModel === null){
            gptModal = "gpt-3.5-turbo";
        }
        const message = userInput.value.trim();

        if(!message){
            return;
        }

        if(requestInProgress){
            if(timeoutError.classList.contains("display-none")){
                timeoutError.classList.remove("display-none");
                if(!displayErrorMsg){
                    displayTimeoutError();
                }
            }else{
                timeoutError.classList.remove("hidden");
                if(!displayErrorMsg){
                    displayTimeoutError();
                }
            }
            return;
        }

        requestInProgress = true;

        userInput.value = "";
        updateButtonClass();

        addMessage(chatHistoryDiv, message, 'user');

        const url = 'http://[ip]:5000/process_request'; // [ip] your server ip
        const data = { 
            model: gptModel,
            messages: [{ role: 'user', content: message}]
        };
    
        try{
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
    
            if(!response.ok){
                addMessage(chatHistoryDiv, response.status, 'error');
                throw new Error("HTTP Error: " + response.status);
            }
            
            const responseData = await response.json();

            addMessage(chatHistoryDiv, responseData.message, 'server');

            requestInProgress = false;
        } catch(error){
            console.error("Error send request: ", error);

            addMessage(chatHistoryDiv, error.message, 'error');
            requestInProgress = false;
        }

    });

    userInput.addEventListener("keydown", async function sendRequest(event){
        
        if(event.key !== "Enter"){
            return;
        }

        let gptModel = localStorage.getItem("savedGPTModel");
        if(gptModel === null){
            gptModal = "gpt-3.5-turbo";
        }

        const message = userInput.value.trim();

        if(!message){
            return;
        }

        if(requestInProgress){
            if(timeoutError.classList.contains("display-none")){
                timeoutError.classList.remove("display-none");
                displayTimeoutError();
            }else{
                timeoutError.classList.remove("hidden");
                displayTimeoutError();
            }
            return;
        }

        requestInProgress = true;

        userInput.value = "";
        updateButtonClass();

        addMessage(chatHistoryDiv, message, 'user');

        const url = 'http://[ip]:5000/process_request'; // [ip] your server ip
        const data = { 
            model: gptModel,
            messages: [{ role: 'user', content: message}]
        };
    
        try{
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
    
            if(!response.ok){
                const errorMessage = `HTTP Error: ${response.status}`;
                addMessage(chatHistoryDiv, errorMessage, 'error');
                throw new Error(errorMessage);
            }
            
            const responseData = await response.json();

            addMessage(chatHistoryDiv, responseData.message, 'server');
            requestInProgress = false;
        } catch(error){
            console.error("Error send request: ", error);
            
            if(error.message.includes("net::ERR_CONNECTION_TIMED_OUT")){
                const errorMessage = "Connection timed out. Try again.";
                addMessage(chatHistoryDiv, errorMessage, 'error');
            }else{
                const errorMessage = "An error occured. Try again.";
                addMessage(chatHistoryDiv, errorMessage, 'error');
            }
            requestInProgress = false;
        }

    });

    document.addEventListener("click", function(event){
        const isClickInsideModal = gptModal.contains(event.target) || gptBtn.contains(event.target);

        if(!isClickInsideModal){
            gptModal.classList.add("hidden");

            if(gptBtn.classList.contains("rotate-right-btn")){
                gptBtn.classList.remove("active");
                gptBtn.classList.remove("rotate-right-btn");
            }
        }
    })
});