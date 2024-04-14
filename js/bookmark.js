let userLinksButton;

function saveUserLinks(userLinks, numberOfLinks) {
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
  localStorage.setItem("userLinks", JSON.stringify(linkElements));
  localStorage.setItem("numberOfLinks", numberOfLinks);
}

function updateNumberOfLinks(userLinks){
  numberOfLinks = userLinks.children.length;
  saveUserLinks(userLinks, numberOfLinks);
  return numberOfLinks;
}

function loadUserLinks(userLinks) {
  userLinks.innerHTML = "";
  const storedLinks = JSON.parse(localStorage.getItem("userLinks"));
  let numberOfLinks = storedLinks ? storedLinks.length : 0;

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

            saveUserLinks(userLinks, numberOfLinks);

            editContainer.remove();
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
          numberOfLinks = userLinks.children.length;
          updateNumberOfLinks(userLinks);
          if (numberOfLinks === 0) {
            userLinksButton.classList.add("hidden");
            userLinks.classList.add("hidden");
          }
        });
        linkContainer.appendChild(deleteButton);
      }

      linkContainer.classList.add("user-link-container");
      userLinks.appendChild(linkContainer);
    });
  } else {
    numberOfLinks = 0;
    userLinksButton.classList.add("hidden");
    userLinks.classList.add("hidden");
  }
  return numberOfLinks;
}

let errorMessage = document.getElementById("error-message");
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

document.addEventListener("DOMContentLoaded", function () {
  
  const userLinks = document.getElementById("user-links");
  let numberOfLinks;

  numberOfLinks = loadUserLinks(userLinks);
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

  bookmarkButton.addEventListener("click", function () {
    if(linksList.classList.contains("display-none")){
      linksList.classList.remove("display-none");
    }else{
    linksList.classList.toggle("hidden");
    userLinksButton.classList.toggle("hidden");
    userLinks.classList.add("hidden");
    linkForm.classList.add("hidden");
    }

    if (!linksList.classList.contains("hidden")) {
      if (numberOfLinks > 0) {
        if(userLinksButton.classList.contains("display-none")){
          userLinksButton.classList.remove("display-none");
        }
        userLinksButton.classList.remove("hidden");
      } else {
        userLinksButton.classList.add("hidden");
      }
    } else {
      userLinksButton.classList.add("hidden");
    }

    saveUserLinks(userLinks, numberOfLinks);
  });

  addLinkButton.addEventListener("click", function () {
    numberOfLinks = updateNumberOfLinks(userLinks);
    if(numberOfLinks < 10){
      if(linkForm.classList.contains("display-none")){
      linkForm.classList.remove("display-none");
      }else{
      linkForm.classList.toggle("hidden");
      errorMessage.classList.add("hidden");
      }
    } else{
        errorMessage.classList.remove("hidden");
        showErrorMessage();
    }
  });

  saveLinkButton.addEventListener("click", function () {
    if(numberOfLinks < 10){
    const siteName = siteNameInput.value;
    let siteUrl = siteUrlInput.value.trim();
    if (!siteName || !siteUrl) {
      return;
    }

    if (!siteUrl.includes("http://") && !siteUrl.includes("https://")) {
      siteUrl =
        "https://www.google.com/search?q=" + encodeURIComponent(siteUrl);
    }

    if (siteName && siteUrl) {
      createNewLink(siteName, siteUrl);
    }
    errorMessage.classList.add("hidden");
    }else{
        errorMessage.classList.remove("hidden");
        showErrorMessage();
    }
  });

  siteNameInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
        if(numberOfLinks < 10){
      const siteName = siteNameInput.value;
      let siteUrl = siteUrlInput.value.trim();
      if (!siteName || !siteUrl) {
        return;
      }

      if (!siteUrl.includes("http://") && !siteUrl.includes("https://")) {
        siteUrl =
          "https://www.google.com/search?q=" + encodeURIComponent(siteUrl);
      }

      createNewLink(siteName, siteUrl);
      errorMessage.classList.add("hidden");
    }else{
        errorMessage.classList.remove("hidden");
        showErrorMessage();
    }
    }
  });

  siteUrlInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();

      if(numberOfLinks < 10){
      const siteName = siteNameInput.value;
      let siteUrl = siteUrlInput.value.trim();
      if (!siteName || !siteUrl) {
        return;
      }

      if (!siteUrl.includes("http://") && !siteUrl.includes("https://")) {
        siteUrl =
          "https://www.google.com/search?q=" + encodeURIComponent(siteUrl);
      }

      createNewLink(siteName, siteUrl);
      errorMessage.classList.add("hidden");
    }else{
        errorMessage.classList.remove("hidden");
        showErrorMessage();
    }
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
    saveUserLinks(userLinks, numberOfLinks);
  });

  function createNewLink(siteName, siteUrl) {
    const linkContainer = document.createElement("div");
    const newLink = document.createElement("a");
    newLink.href = siteUrl;
    newLink.textContent = siteName;
    newLink.target = "_blank";
    newLink.classList.add("user-link-text");

    numberOfLinks++;
    updateNumberOfLinks(userLinks);

    const editButton = document.createElement("button");
    editButton.innerHTML = '<i class="fas fa-edit"></i>';
    editButton.classList.add("edit-link-btn");
    
    let isEditing = false;

    editButton.addEventListener("click", function () {
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
      saveButton.textContent = "Save";
      saveButton.addEventListener("click", function () {
        newLink.textContent = siteNameInput.value;
        newLink.href = siteUrlInput.value;

        saveUserLinks(userLinks, numberOfLinks);

        editContainer.remove();
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
      isEditing = true;
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
      numberOfLinks = userLinks.children.length;
      updateNumberOfLinks(userLinks);
      if (numberOfLinks === 0) {
        userLinksButton.classList.add("hidden");
        userLinks.classList.add("hidden");
      }
    });

    linkContainer.appendChild(newLink);
    linkContainer.appendChild(editButton);
    linkContainer.appendChild(deleteButton);
    linkContainer.classList.add("user-link-container");

    userLinks.appendChild(linkContainer);
    siteNameInput.value = "";
    siteUrlInput.value = "";
    linkForm.classList.add("hidden");

    if (numberOfLinks > 0) {
      if(userLinksButton.classList.contains("display-none")){
      userLinksButton.classList.remove("display-none")
      }else{
      userLinksButton.classList.remove("hidden");
      }
    }
  }

  document.addEventListener("click", function(event){
    const clickedElement = event.target;
    const isInsideBookmark = clickedElement.closest("#bookmark");
    const isInsideLinksList = clickedElement.closest("#links-list");
    const isInsideSocialLinks = clickedElement.closest("#social-links");
    const isInsideAddLink = clickedElement.closest("#add-link");
    const isInsideLinkForm = clickedElement.closest("#link-form");
    const isInsideUserLinks = clickedElement.closest("#user-links");

    if(!isInsideBookmark && !isInsideLinksList && !isInsideSocialLinks && !isInsideAddLink && !isInsideLinkForm && !isInsideUserLinks){
      if(!linksList.classList.contains("display-none")){
        linksList.classList.add("hidden");
        linksList.classList.remove("display-none");
      }

      if(!userLinksButton.classList.contains("display-none")){
        userLinksButton.classList.add("hidden");
        userLinksButton.classList.remove("display-none");
      }

      if(!userLinks.classList.contains("display-none")){
        userLinks.classList.add("hidden");
        userLinks.classList.remove("display-none");
      }

      if(!linkForm.classList.contains("display-none")){
        linkForm.classList.add("hidden");
        linkForm.classList.remove("display-none");
      }
    } else{
      if (isInsideAddLink || isInsideUserLinks){
        return;
      }
    }
  });
});
