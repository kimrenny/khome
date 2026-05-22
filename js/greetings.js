if (typeof document !== "undefined") {
  const translations = {};
  let currentLang = "en";

  function loadTranslations(lang) {
    fetch(`/assets/${lang}.json`)
      .then((response) => response.json())
      .then((data) => {
        translations[lang] = data;
        updateTranslations();
        updateGreetings();
      });
  }

  function updateTranslations() {
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.getAttribute("data-i18n");

      if (element.tagName === "INPUT" && element.hasAttribute("placeholder")) {
        element.placeholder = translations[currentLang][key];
      } else {
        element.innerHTML = translations[currentLang][key];
      }
    });
  }

  function changeLanguage(lang) {
    currentLang = lang;
    chrome.storage.sync.set({ language: lang }, () => {});

    if (!translations[lang]) {
      loadTranslations(lang);
    } else {
      updateTranslations();
      updateGreetings();
    }
  }

  function getRandomItemFromArray(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  function updateGreetings() {
    const greetingBox = document.getElementById("greetings");
    const currentDate = new Date();
    const currentHour = currentDate.getHours();

    let greetingKey = "";
    if (currentHour >= 5 && currentHour < 12) {
      greetingKey = getRandomItemFromArray([
        "greeting_morning_1",
        "greeting_morning_2",
        "greeting_morning_3",
      ]);
    } else if (currentHour >= 12 && currentHour < 17) {
      greetingKey = getRandomItemFromArray([
        "greeting_afternoon_1",
        "greeting_afternoon_2",
        "greeting_afternoon_3",
      ]);
    } else if (currentHour >= 17 && currentHour < 22) {
      greetingKey = getRandomItemFromArray([
        "greeting_evening_1",
        "greeting_evening_2",
        "greeting_evening_3",
      ]);
    } else {
      greetingKey = getRandomItemFromArray([
        "greeting_night_1",
        "greeting_night_2",
        "greeting_night_3",
      ]);
    }

    chrome.storage.sync.get("userName", function (result) {
      const userName =
        result.userName || translations[currentLang]["default_user_name"];

      if (translations[currentLang] && translations[currentLang][greetingKey]) {
        const greeting = translations[currentLang][greetingKey].replace(
          "{name}",
          userName
        );
        greetingBox.textContent = greeting;
      }
    });
  }

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", function () {
      chrome.storage.sync.get("userName", function (result) {
        const savedName = result.userName;
        const userName =
          savedName || translations[currentLang]["default_user_name"];

        chrome.storage.sync.set({ userName: userName }, function () {
          updateGreetings();
        });
      });

      const nameInput = document.getElementById("name-input");
      const submitButton = document.getElementById("submit-btn");

      submitButton.addEventListener("click", function () {
        const newName = nameInput.value.trim();
        if (newName.length > 0) {
          let name = newName.substring(0, 15);
          chrome.storage.sync.set({ userName: name }, function () {
            updateGreetings();
          });
        }
      });

      nameInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
          const newName = nameInput.value.trim();
          if (newName.length > 0) {
            let name = newName.substring(0, 15);
            chrome.storage.sync.set({ userName: name }, function () {
              updateGreetings();
            });
            nameInput.value = "";
          }
        }
      });

      chrome.storage.sync.get("language", (result) => {
        if (result.language) {
          currentLang = result.language;
        } else {
          currentLang = "en";
        }
        loadTranslations(currentLang);
      });

      document
        .getElementById("languageSelector")
        .addEventListener("change", (event) => {
          changeLanguage(event.target.value);
        });
    });
  }
}
