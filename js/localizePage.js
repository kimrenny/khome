const { appI18n } = require("./appI18n");

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", async function () {
    await appI18n.ready;

    const bindings = [
      ["save-link-btn", "save", "textContent"],
      ["cancel-link-btn", "cancel", "textContent"],
      ["error-message", "limitCustomLinks", "textContent"],
      ["search-input", "searchPlaceholder", "placeholder"],
      ["task-input", "addNewTask", "placeholder"],
      ["localized-clearTaskList-1", "clearTaskList", "textContent"],
      ["confirm-clear-button", "yes", "textContent"],
      ["cancel-clear-button", "cancel", "textContent"],
      ["changes-modal-success", "saved", "textContent"],
      ["localized-generalSection-1", "generalSection", "textContent"],
      ["localized-dDaySection-1", "dDaySection", "textContent"],
      ["localized-backgroundSection-1", "backgroundSection", "textContent"],
      ["localized-alarmSection-1", "alarmSection", "textContent"],
      ["localized-helpSection-1", "helpSection", "textContent"],
      ["localized-whatsNewSection-1", "whatsNewSection", "textContent"],
      ["localized-aboutSection-1", "aboutSection", "textContent"],
      ["language-selector-label", "language", "textContent"],
      ["localized-bookmark-1", "bookmark", "textContent"],
      ["localized-searchPlaceholder-1", "searchPlaceholder", "textContent"],
      ["localized-weather-1", "weather", "textContent"],
      ["localized-greetings-1", "greetings", "textContent"],
      ["localized-taskList-1", "taskList", "textContent"],
      ["localized-clock24Hour-1", "clock24Hour", "textContent"],
      ["localized-clockFormat-1", "clockFormat", "textContent"],
      ["localized-changeName-1", "changeName", "textContent"],
      ["name-input", "enterNamePlaceholder", "placeholder"],
      ["submit-btn", "submit", "textContent"],
      ["localized-dDayDisplay-1", "dDayDisplay", "textContent"],
      ["submitDate", "submit", "textContent"],
      ["resetDate", "reset", "textContent"],
      ["localized-backgroundOpacity-1", "backgroundOpacity", "textContent"],
      ["localized-settingBackground-1", "settingBackground", "textContent"],
      ["localized-slideshow-1", "slideshow", "textContent"],
      ["localized-slideshow-2", "slideshow", "textContent"],
      ["localized-slideshowBackground-1", "slideshowBackground", "textContent"],
      ["localized-slideshowSpeed-1", "slideshowSpeed", "textContent"],
      ["localized-editImagesList-1", "editImagesList", "textContent"],
      ["edit-images-modal-btn", "edit", "textContent"],
      ["localized-timerBtn-1", "timerBtn", "textContent"],
      ["localized-alarmSound-1", "alarmSound", "textContent"],
      ["localized-contactDev-1", "contactDev", "textContent"],
      ["localized-contactMessage-1", "contactMessage", "innerHTML"],
      [
        "localized-localizeContactMessage-1",
        "localizeContactMessage",
        "textContent",
      ],
      ["localized-whatsNew1101-1", "whatsNew1101", "textContent"],
      ["localized-whatsNew1102-1", "whatsNew1102", "textContent"],
      ["localized-whatsNew1103-1", "whatsNew1103", "textContent"],
      ["localized-whatsNew1021-1", "whatsNew1021", "textContent"],
      ["localized-whatsNew1022-1", "whatsNew1022", "textContent"],
      ["localized-whatsNew10121-1", "whatsNew10121", "textContent"],
      ["localized-whatsNew10041-1", "whatsNew10041", "textContent"],
      ["localized-whatsNew10051-1", "whatsNew10051", "textContent"],
      ["localized-whatsNew10052-1", "whatsNew10052", "textContent"],
      ["localized-whatsNew10041-2", "whatsNew10041", "textContent"],
      ["localized-whatsNew10042-1", "whatsNew10042", "textContent"],
      ["localized-whatsNew10031-1", "whatsNew10031", "textContent"],
      ["localized-whatsNew10032-1", "whatsNew10032", "textContent"],
      ["localized-whatsNew10021-1", "whatsNew10021", "textContent"],
      ["localized-whatsNew10011-1", "whatsNew10011", "textContent"],
      ["localized-whatsNew10001-1", "whatsNew10001", "textContent"],
      ["localized-whatsNew10002-1", "whatsNew10002", "textContent"],
      ["localized-whatsNew10003-1", "whatsNew10003", "textContent"],
      ["localized-whatsNew10004-1", "whatsNew10004", "textContent"],
      ["localized-whatsNew10005-1", "whatsNew10005", "textContent"],
      ["localized-currentVersion-1", "currentVersion", "textContent"],
      ["localized-timerType-1", "timerType", "textContent"],
      ["localized-timer-1", "timer", "textContent"],
      ["localized-alarm-1", "alarm", "textContent"],
      ["timers-create-btn", "addNewTimer", "textContent"],
      ["timer-name", "newTimerName", "placeholder"],
      ["timer-time", "newTimerTime", "placeholder"],
      ["save-timer-btn", "save", "textContent"],
      ["cancel-timer-btn", "cancel", "textContent"],
      ["alarms-create-btn", "addNewAlarm", "textContent"],
      ["alarm-name", "newAlarmName", "placeholder"],
      ["save-alarm-btn", "save", "textContent"],
      ["cancel-alarm-btn", "cancel", "textContent"],
      ["localized-selectImages-1", "selectImages", "textContent"],
      ["addCustomImageBtn", "addCustomImage", "textContent"],
      ["localized-selectAll-1", "selectAll", "textContent"],
      ["localized-deselectAll-1", "deselectAll", "textContent"],
      ["bookmark", "bookmark", "aria-label"],
      ["settings-btn", "settings", "aria-label"],
      ["clear-task-btn", "clearTaskList", "aria-label"],
      ["clear-task-close-button", "close", "aria-label"],
      ["timer-btn", "timer", "aria-label"],
      ["view-timers-btn", "viewTimers", "aria-label"],
      ["timers-create-btn-arrow", "addNewTimer", "aria-label"],
      ["pause-timer-btn", "pauseTimer", "aria-label"],
      ["playSoundButton", "playSound", "aria-label"],
      ["saveSoundButton", "saveSound", "aria-label"],
      ["edit-images-close", "close", "aria-label"],
    ];

    const languageSelector = document.getElementById("languageSelector");

    function applyPageMessages() {
      document.documentElement.lang = appI18n.getLocale().replace("_", "-");
      document.title = appI18n.getMessage("newTabTitle");

      bindings.forEach(([id, key, property]) => {
        const element = document.getElementById(id);
        if (element) {
          const message = appI18n.getMessage(key);
          if (property === "aria-label") {
            element.setAttribute(property, message);
          } else {
            element[property] = message;
          }
        }
      });

      languageSelector.value = appI18n.getLocale();
    }

    applyPageMessages();
    appI18n.onLanguageChanged(applyPageMessages);
    languageSelector.addEventListener("change", function () {
      appI18n.setLanguage(languageSelector.value);
    });
  });
}
