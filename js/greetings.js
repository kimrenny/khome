const { appI18n } = require("./appI18n");
const { resolveGreetingName } = require("./greetingName");

window.onerror = function () {
  return true;
};

window.onunhandledrejection = function () {
  return true;
};

if (typeof document !== "undefined") {
  function getRandomItemFromArray(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  async function updateGreetings() {
    await appI18n.ready;
    const greetingBox = document.getElementById("greetings");
    const currentDate = new Date();
    const currentHour = currentDate.getHours();

    let greetingKey = "";
    if (currentHour >= 5 && currentHour < 12) {
      greetingKey = getRandomItemFromArray([
        "greetingMorning1",
        "greetingMorning2",
        "greetingMorning3",
      ]);
    } else if (currentHour >= 12 && currentHour < 17) {
      greetingKey = getRandomItemFromArray([
        "greetingAfternoon1",
        "greetingAfternoon2",
        "greetingAfternoon3",
      ]);
    } else if (currentHour >= 17 && currentHour < 22) {
      greetingKey = getRandomItemFromArray([
        "greetingEvening1",
        "greetingEvening2",
        "greetingEvening3",
      ]);
    } else {
      greetingKey = getRandomItemFromArray([
        "greetingNight1",
        "greetingNight2",
        "greetingNight3",
      ]);
    }

    chrome.storage.sync.get("userName", function (result) {
      const userName = resolveGreetingName(result.userName, appI18n.getMessage);
      greetingBox.textContent = appI18n.getMessage(greetingKey, [userName]);
    });
  }

  appI18n.onLanguageChanged(updateGreetings);

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", function () {
      updateGreetings();

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
    });
  }
}
