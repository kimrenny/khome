if (typeof document !== "undefined") {
  const translations = {};
  let currentLang = "en";

  function loadTranslations(lang) {
    fetch(`/assets/${lang}.json`)
      .then((response) => response.json())
      .then((data) => {
        translations[lang] = data;
        updateTranslations();
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
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.sync.get("language", (result) => {
      if (result.language) {
        currentLang = result.language;
      } else {
        currentLang = "en";
      }
      loadTranslations(currentLang);

      document.getElementById("languageSelector").value = currentLang;
    });

    document
      .getElementById("languageSelector")
      .addEventListener("change", (event) => {
        changeLanguage(event.target.value);
      });
  });
}
