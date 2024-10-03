if(typeof document !== 'undefined'){
  document.addEventListener("DOMContentLoaded", function () {
    const userLinks = document.getElementById("user-links");
    const bookmarkButton = document.getElementById("bookmark");
    const linksList = document.getElementById("links-list");
    const addLinkButton = document.getElementById("add-link-btn");
    const linkForm = document.getElementById("link-form");
    const userLinksButton = document.getElementById("user-links-btn");
    const siteNameInput = document.getElementById("site-name");
    const siteUrlInput = document.getElementById("site-url");
    const saveLinkButton = document.getElementById("save-link-btn");
    const cancelLinkButton = document.getElementById("cancel-link-btn");
    const errorMessage = document.getElementById("error-message");

    let numberOfLinks = 0;

    function saveUserLinks(userLinks, callback) {
      const linkElements = Array.from(userLinks.children).map((linkContainer) => {
        const link = linkContainer.querySelector("a");
        const editButton = linkContainer.querySelector(".edit-link-btn");
        const deleteButton = linkContainer.querySelector(".delete-link-btn");
    
        return {
          href: link.href,
          textContent: link.textContent,
          editButton: editButton ? true : false,
          deleteButton: deleteButton ? true : false,
        };
      });
    
      chrome.storage.local.set(
        {
        userLinks: linkElements,
        numberOfLinks: linkElements.length,
      },
      () => {
        if(callback && typeof callback === "function"){
          callback();
        }
      }
    )};
    
    function updateNumberOfLinks(callback){
      chrome.storage.local.get(["numberOfLinks"], function(result){
        const newNumberOfLinks = result.numberOfLinks || 0;

        numberOfLinks = newNumberOfLinks;

        if(callback && typeof callback === "function"){
          callback();
        }else{
          updateVisibilityUserLinksButton();
        }
      });
    }
    
    function loadUserLinks(userLinks) {
      userLinks.innerHTML = "";
    
      chrome.storage.local.get(["userLinks"], function(result){
        const storedLinks = result.userLinks;
        numberOfLinks = storedLinks ? storedLinks.length : 0;
    
        if(numberOfLinks > 0){
          userLinksButton.classList.remove("hidden");
        }else{
          userLinksButton.classList.add("hidden");
          if(!userLinks.classList.contains("display-none")){
            userLinks.classList.add("hidden");
          }
        }
    
        if (storedLinks) {
          storedLinks.forEach((link) => {
            const linkContainer = document.createElement("div");
            const newLink = document.createElement("a");
            newLink.href = link.href;
            newLink.textContent = link.textContent;
            newLink.target = "_blank";
            newLink.classList.add("user-link-text");
      
            linkContainer.appendChild(newLink);
      
            if(link.editButton && !linkContainer.querySelector('.edit-link-btn')){
              const editButton = document.createElement("button");
              editButton.innerHTML = '<i class="fas fa-edit"></i>';
              editButton.classList.add("edit-link-btn");
    
              editButton.addEventListener("click", function () {
              let editContainer = linkContainer.querySelector(".edit-container");
              
              if(!editContainer){
                editContainer = document.createElement("div");
                editContainer.classList.add("edit-container");
      
                const siteNameInput = document.createElement("input");
                siteNameInput.type = "text";
                siteNameInput.value = newLink.textContent;
      
                const siteUrlInput = document.createElement("input");
                siteUrlInput.type = "text";
                siteUrlInput.value = newLink.href;
      
                const buttonContainer = document.createElement("div");
                buttonContainer.classList.add("button-container");
      
                const saveButton = document.createElement("button");
                saveButton.textContent = "Save";
                saveButton.addEventListener("click", function () {
                  newLink.textContent = siteNameInput.value;
                  newLink.href = siteUrlInput.value;
      
                  editContainer.remove();

                  saveUserLinks(userLinks, updateNumberOfLinks);
                });
      
                const cancelButton = document.createElement("button");
                cancelButton.textContent = "Cancel";
                cancelButton.addEventListener("click", function () {
                  editContainer.remove();
                });
      
                buttonContainer.appendChild(saveButton);
                buttonContainer.appendChild(cancelButton);
      
                editContainer.appendChild(siteNameInput);
                editContainer.appendChild(siteUrlInput);
                editContainer.appendChild(buttonContainer);
      
                linkContainer.appendChild(editContainer);
              } else{
                  editContainer.remove();
              }
            });
      
            linkContainer.appendChild(editButton);
          }
      
          if (link.deleteButton) {
            const deleteButton = document.createElement("button");
            deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteButton.classList.add("delete-link-btn");
    
            deleteButton.addEventListener("click", function () {
              linkContainer.remove();
              saveUserLinks(userLinks, updateNumberOfLinks);
            });
            linkContainer.appendChild(deleteButton);
          }
      
            linkContainer.classList.add("user-link-container");
            userLinks.appendChild(linkContainer);
        });
        } else {
          numberOfLinks = 0;
          userLinksButton.classList.add("hidden");
          if(!userLinks.classList.contains("display-none")){
            userLinks.classList.add("hidden");
          }
        }
      });
    }

    function updateVisibilityUserLinksButton(){
      if (numberOfLinks > 0){
        userLinksButton.classList.remove("hidden");
      }else{
        userLinksButton.classList.add("hidden");
        if(!userLinks.classList.contains("display-none")){
          userLinks.classList.add("hidden");
        }
      }
    }

    loadUserLinks(userLinks);
    
    let errorActive = false;
    
    function showErrorMessage(){
      if(!errorActive){
      errorMessage.classList.add("visible");
      errorActive = true;
    
        setTimeout(() => {
            errorMessage.classList.remove("visible");
            setTimeout(() => {
                errorActive = false;
            }, 500);
        }, 2000);
      }
    }

    let activeBookmarkBtn = false;

    bookmarkButton.addEventListener("click", function () {
      activeBookmarkBtn = !activeBookmarkBtn;
      if(activeBookmarkBtn){
        if(linksList.classList.contains("display-none")){
          linksList.classList.remove("display-none");
        }else{
          linksList.classList.remove("hidden");
        }
      }else{
        linksList.classList.toggle("hidden");
        userLinks.classList.add("hidden");
        linkForm.classList.add("hidden");
      }
    });

    addLinkButton.addEventListener("click", function () {
      updateNumberOfLinks(() => {
        if(numberOfLinks < 10){
          if(linkForm.classList.contains("display-none")){
            linkForm.classList.remove("display-none");
          }else{
            linkForm.classList.toggle("hidden");
            errorMessage.classList.add("hidden");
          }
        }else{
          errorMessage.classList.remove("hidden");
          showErrorMessage();
        }
      });
    });

    saveLinkButton.addEventListener("click", function () {
      const siteName = siteNameInput.value;
      let siteUrl = siteUrlInput.value.trim();
      if (!siteName || !siteUrl) {
        return;
      }
  
      if (!siteUrl.includes("http://") && !siteUrl.includes("https://")) {
        if(!siteUrl.includes(".com") && !siteUrl.includes(".net") && !siteUrl.includes(".ua") && !siteUrl.includes(".dev") && !siteUrl.includes(".uk") && !siteUrl.includes(".us") && !siteUrl.includes(".gov")){
          siteUrl = "https://www.google.com/search?q=" + encodeURIComponent(siteUrl);
        }else{
          siteUrl = `https://${siteUrl}`;
        }
      }
  
      if (siteName && siteUrl) {
        createNewLink(siteName, siteUrl);
      }
      errorMessage.classList.add("hidden");
    });

    siteNameInput.addEventListener("keypress", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();

        updateNumberOfLinks(() => {
          if(numberOfLinks < 10){
            const siteName = siteNameInput.value;
            let siteUrl = siteUrlInput.value.trim();
          if (!siteName || !siteUrl) {
            return;
          }

          if (!siteUrl.includes("http://") && !siteUrl.includes("https://")) {
            if(!siteUrl.includes(".com") && !siteUrl.includes(".net") && !siteUrl.includes(".ua") && !siteUrl.includes(".dev") && !siteUrl.includes(".uk") && !siteUrl.includes(".us") && !siteUrl.includes(".gov")){
              siteUrl = "https://www.google.com/search?q=" + encodeURIComponent(siteUrl);
            }else{
              siteUrl = `https://${siteUrl}`;
            }
          }

          createNewLink(siteName, siteUrl);
          errorMessage.classList.add("hidden");
          }else{
            errorMessage.classList.remove("hidden");
            showErrorMessage();
          }
        });
      }
    });

    siteUrlInput.addEventListener("keypress", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();

        updateNumberOfLinks(() => {
          if(numberOfLinks < 10){
            const siteName = siteNameInput.value;
            let siteUrl = siteUrlInput.value.trim();
          if (!siteName || !siteUrl) {
            return;
          }

          if (!siteUrl.includes("http://") && !siteUrl.includes("https://")) {
            if(!siteUrl.includes(".com") && !siteUrl.includes(".net") && !siteUrl.includes(".ua") && !siteUrl.includes(".dev") && !siteUrl.includes(".uk") && !siteUrl.includes(".us") && !siteUrl.includes(".gov")){
              siteUrl = "https://www.google.com/search?q=" + encodeURIComponent(siteUrl);
            }else{
              siteUrl = `https://${siteUrl}`;
            }
          }

          createNewLink(siteName, siteUrl);
          errorMessage.classList.add("hidden");
          }else{
            errorMessage.classList.remove("hidden");
            showErrorMessage();
          }
        });
      }
    });

    cancelLinkButton.addEventListener("click", function () {
      siteNameInput.value = "";
      siteUrlInput.value = "";
      linkForm.classList.add("hidden");
    });

    userLinksButton.addEventListener("click", function () {
      if(userLinks.classList.contains("display-none")){
        userLinks.classList.remove("display-none")
      }else{
      userLinks.classList.toggle("hidden");
      }
    });

    window.addEventListener("beforeunload", function () {
      saveUserLinks(userLinks, updateNumberOfLinks);
    });

    function createNewLink(siteName, siteUrl) {
      if(numberOfLinks >= 10){
        errorMessage.classList.remove("hidden");
        showErrorMessage();
        return;
      }
      numberOfLinks++;

      if (numberOfLinks > 0){
        userLinksButton.classList.remove("hidden");
      }else{
        userLinksButton.classList.add("hidden");
        if(!userLinks.classList.contains("display-none")){
          userLinks.classList.add("hidden");
        }
      }

      const linkContainer = document.createElement("div");
      const newLink = document.createElement("a");
      newLink.href = siteUrl;
      newLink.textContent = siteName;
      newLink.target = "_blank";
      newLink.classList.add("user-link-text");

      const editButton = document.createElement("button");
      editButton.innerHTML = '<i class="fas fa-edit"></i>';
      editButton.classList.add("edit-link-btn");
      
      let isEditing = false;

      editButton.addEventListener("click", function (event) {
          if(!isEditing){
        const editContainer = document.createElement("div");
        editContainer.classList.add("edit-container");

        const siteNameInput = document.createElement("input");
        siteNameInput.type = "text";
        siteNameInput.value = newLink.textContent;

        const siteUrlInput = document.createElement("input");
        siteUrlInput.type = "text";
        siteUrlInput.value = newLink.href;

        const buttonContainer = document.createElement("div");
        buttonContainer.classList.add("button-container");

        const saveButton = document.createElement("button");
        saveButton.id = "save-user-link-btn";
        saveButton.textContent = "Save";
        saveButton.addEventListener("click", function () {
          newLink.textContent = siteNameInput.value;
          newLink.href = siteUrlInput.value;
          editContainer.remove();
          saveUserLinks(userLinks, updateNumberOfLinks);
        });

        const cancelButton = document.createElement("button");
        cancelButton.textContent = "Cancel";
        cancelButton.id = "cancel-user-link-btn";
        cancelButton.addEventListener("click", function () {
          editContainer.remove();
        });

        buttonContainer.appendChild(saveButton);
        buttonContainer.appendChild(cancelButton);

        editContainer.appendChild(siteNameInput);
        editContainer.appendChild(siteUrlInput);
        editContainer.appendChild(buttonContainer);

        linkContainer.appendChild(editContainer);
        isEditing = true;

        event.stopPropagation();
      } else{
          const editContainer = linkContainer.querySelector(".edit-container");
          if(editContainer){
              editContainer.remove();
              isEditing = false;
          }
      }
      });

      const deleteButton = document.createElement("button");
      deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
      deleteButton.classList.add("delete-link-btn");
      deleteButton.addEventListener("click", function () {
        linkContainer.remove();
        saveUserLinks(userLinks, updateNumberOfLinks);
      });

      linkContainer.appendChild(newLink);
      linkContainer.appendChild(editButton);
      linkContainer.appendChild(deleteButton);
      linkContainer.classList.add("user-link-container");

      userLinks.appendChild(linkContainer);
      siteNameInput.value = "";
      siteUrlInput.value = "";
      linkForm.classList.add("hidden");

      saveUserLinks(userLinks, updateNumberOfLinks);
    }

    const editContainers = document.querySelectorAll(".edit-container");
    editContainers.forEach(container => {
      container.addEventListener("click", function(event){
        event.preventDefault();
        event.stopPropagation();
      });
    });

    document.addEventListener("click", function(event){
      const clickedElement = event.target;
      const isInsideBookmark = clickedElement.closest("#bookmark");
      const isInsideLinksList = clickedElement.closest("#links-list");
      const isInsideSocialLinks = clickedElement.closest("#social-links");
      const isInsideAddLink = clickedElement.closest("#add-link");
      const isInsideLinkForm = clickedElement.closest("#link-form");
      const isInsideUserLinks = clickedElement.closest("#user-links");
      const isInsideSaveBtn = clickedElement.closest("#save-user-link-btn");
      const isInsideCancelBtn = clickedElement.closest("#cancel-user-link-btn");
      const isInsideEditContainer = clickedElement.closest(".edit-container");
      const isInsideDeleteLinkBtn = clickedElement.closest(".delete-link-btn");

      if(!isInsideBookmark && !isInsideLinksList && !isInsideSocialLinks && !isInsideAddLink && !isInsideLinkForm && !isInsideUserLinks && !isInsideSaveBtn && !isInsideCancelBtn && !isInsideEditContainer && !isInsideDeleteLinkBtn){
        if(activeBookmarkBtn){
          activeBookmarkBtn = !activeBookmarkBtn;
        }
        
        if(!linksList.classList.contains("display-none")){
          linksList.classList.add("hidden");
        }

        if(!userLinks.classList.contains("display-none")){
          userLinks.classList.add("hidden");
        }

        if(linkForm.classList.contains("display-none")){
          linkForm.classList.add("hidden");
        }
      } else{
        if (isInsideAddLink || isInsideUserLinks){
          return;
        }
      }
    });
  });
}