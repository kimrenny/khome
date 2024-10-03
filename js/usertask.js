if(typeof document !== 'undefined'){
    document.addEventListener("DOMContentLoaded", function(){
        const taskForm = document.getElementById("task-form");
        const taskInput = document.getElementById("task-input");
        const taskContainer = document.getElementById("tasks");
        const clearTaskButton = document.getElementById("clear-task-btn");
        const closeButton = document.getElementById("clear-task-close-button");
        const cancelClearButton = document.getElementById("cancel-clear-button");
        const confirmClearButton = document.getElementById("confirm-clear-button");

        loadTasksFromLocalStorage();
        updateScrollbar();
        toggleClearTaskButtonVisibility();

        function toggleClearTaskButtonVisibility(){
            const taskItems = document.querySelectorAll(".task-item:not(.completed-task)");
            if(taskItems.length > 0){
                clearTaskButton.style.display = "inline-block";
            }else{
                clearTaskButton.style.display = "none";
            }
        }

        function showModal(){
            const modal = document.getElementById("modal");
            modal.style.display = "block";
            modal.classList.add("display-show");
        }

        function hideModal(){
            const modal = document.getElementById("modal");
            modal.classList.remove("display-show");
            modal.classList.add("display-hidden");

            modal.addEventListener("animationend", function(){
                modal.style.display = "none";
                modal.classList.remove("display-hidden");
            }, {once: true});
        }

        clearTaskButton.addEventListener("click", function(){
            if(!modal.classList.contains("display-show")){
                showModal();
            } else{
                hideModal();
            }
        });

        closeButton.addEventListener("click", function(){
            hideModal();
        });

        cancelClearButton.addEventListener("click", function(){
            hideModal();
        });

        confirmClearButton.addEventListener("click", function(){
            hideModal();
            clearTaskList();
        });


        taskForm.addEventListener("keypress", function(event){
            if(event.key === "Enter"){     
                event.preventDefault();

                const taskText = taskInput.value.trim();

                if(taskText !== ""){
                    createTask(taskText);
                    taskInput.value = "";

                    updateScrollbar();
                    toggleClearTaskButtonVisibility();
                    saveTasksToLocalStorage();
                }
            }
        });

        function createTask(taskText, completed){
            const taskItem = document.createElement("div");
            taskItem.classList.add("task-item");
            taskItem.classList.add("user-select-none");

            const completedTaskButton = document.createElement("div");
            completedTaskButton.classList.add("completed-task-button");
            if(completed){
                taskItem.classList.add("completed-task");
            }

            const taskContent = document.createElement("span");
            taskContent.textContent = taskText;

            completedTaskButton.addEventListener("click", function(){
                taskItem.classList.add("completed-task");
                taskContainer.appendChild(taskItem);
                updateScrollbar();
                toggleClearTaskButtonVisibility();
                saveTasksToLocalStorage();
            });

            taskItem.appendChild(completedTaskButton);
            taskItem.appendChild(taskContent);

            taskContainer.appendChild(taskItem);
        }

        function updateScrollbar(){
            const taskItems = document.querySelectorAll(".task-item:not(.completed-task)");
            const taskContainer = document.getElementById("tasks");
            const maxTasksToShow = 3;

            if(taskItems.length > maxTasksToShow){
                taskContainer.style.overflowY = "auto";
            } else{
                taskContainer.scrollTop = 0;
                taskContainer.style.overflowY = "hidden";
            }
        }

        function saveTasksToLocalStorage(){
            const taskItems = document.querySelectorAll(".task-item");
            const tasks = Array.from(taskItems).map(taskItem => {
                return {
                    text: taskItem.querySelector("span").textContent,
                    completed: taskItem.classList.contains("completed-task")
                };
            });
            localStorage.setItem("tasks", JSON.stringify(tasks));
            updateScrollbar();
        }

        function loadTasksFromLocalStorage(){
            const tasks = JSON.parse(localStorage.getItem("tasks"));
            if(tasks){
                tasks.forEach(task => createTask(task.text, task.completed));
            }
            updateScrollbar();
        }

        function clearTaskList(){
            const taskItems = document.querySelectorAll(".task-item");
            taskItems.forEach(taskItem => {
                if(!taskItem.classList.contains("completed-task")){
                    taskItem.remove();
                }
            });
            saveTasksToLocalStorage();
            updateScrollbar();
            toggleClearTaskButtonVisibility();
        }
    });
}