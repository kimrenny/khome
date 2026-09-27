const SUPPORTED_LOCALES = ["en", "fr", "ja", "ko", "ru", "uk", "zh_CN"];
const supportedLocaleSet = new Set(SUPPORTED_LOCALES);

function normalizeAppLocale(locale) {
  if (typeof locale !== "string") {
    return null;
  }

  const normalized = locale.trim().replace(/_/g, "-").toLowerCase();
  if (!normalized) {
    return null;
  }

  if (normalized.startsWith("zh")) {
    return "zh_CN";
  }

  const language = normalized.split("-")[0];
  return supportedLocaleSet.has(language) ? language : null;
}

function resolveInitialLocale(savedLocale, chromeLocale) {
  return (
    normalizeAppLocale(savedLocale) || normalizeAppLocale(chromeLocale) || "en"
  );
}

function formatMessage(definition, substitutions) {
  if (!definition || typeof definition.message !== "string") {
    return null;
  }

  const values = Array.isArray(substitutions)
    ? substitutions
    : substitutions === undefined || substitutions === null
      ? []
      : [substitutions];
  const placeholders = definition.placeholders || {};
  let message = definition.message;

  for (const [name, placeholder] of Object.entries(placeholders)) {
    const content = placeholder && placeholder.content;
    const match = typeof content === "string" && content.match(/^\$(\d+)$/);
    if (!match || !message.includes(`$${name}$`)) {
      return null;
    }

    const index = Number(match[1]) - 1;
    const value = values[index];
    message = message.replaceAll(
      `$${name}$`,
      value === undefined || value === null ? "" : String(value),
    );
  }

  if (/\$[A-Za-z0-9_]+\$/.test(message)) {
    return null;
  }

  return message;
}

function createAppI18n({
  loadCatalog,
  readPreference = async () => null,
  writePreference = async () => {},
  getChromeLocale = () => "en",
}) {
  if (typeof loadCatalog !== "function") {
    throw new TypeError("loadCatalog must be a function");
  }

  const catalogPromises = new Map();
  const listeners = new Set();
  let currentLocale = "en";
  let currentCatalog = {};
  let englishCatalog = {};
  let initializationPromise;

  function load(locale) {
    if (!catalogPromises.has(locale)) {
      const catalogPromise = Promise.resolve()
        .then(() => loadCatalog(locale))
        .then((catalog) => {
          if (
            !catalog ||
            typeof catalog !== "object" ||
            Array.isArray(catalog)
          ) {
            throw new Error(`Invalid locale catalog: ${locale}`);
          }
          return catalog;
        })
        .catch((error) => {
          catalogPromises.delete(locale);
          throw error;
        });
      catalogPromises.set(locale, catalogPromise);
    }

    return catalogPromises.get(locale);
  }

  function notifyLanguageChanged() {
    listeners.forEach((listener) => listener(currentLocale));
  }

  async function activate(locale, persist) {
    let selectedLocale = normalizeAppLocale(locale) || "en";
    let selectedCatalog;

    try {
      selectedCatalog = await load(selectedLocale);
    } catch (error) {
      selectedLocale = "en";
      try {
        selectedCatalog = await load("en");
      } catch (fallbackError) {
        selectedCatalog = {};
      }
    }

    if (selectedLocale === "en") {
      englishCatalog = selectedCatalog;
    } else {
      try {
        englishCatalog = await load("en");
      } catch (error) {
        englishCatalog = {};
      }
    }

    currentLocale = selectedLocale;
    currentCatalog = selectedCatalog;

    if (persist) {
      try {
        await writePreference(selectedLocale);
      } catch (error) {
        // The selected locale still applies to this page if sync storage is unavailable.
      }
    }

    notifyLanguageChanged();
    return currentLocale;
  }

  function initialize() {
    if (!initializationPromise) {
      initializationPromise = (async () => {
        let savedLocale = null;
        try {
          savedLocale = await readPreference();
        } catch (error) {
          savedLocale = null;
        }

        return activate(
          resolveInitialLocale(savedLocale, getChromeLocale()),
          false,
        );
      })();
    }

    return initializationPromise;
  }

  function getMessage(key, substitutions) {
    if (typeof key !== "string") {
      return "";
    }

    const localizedMessage = formatMessage(currentCatalog[key], substitutions);
    if (localizedMessage !== null) {
      return localizedMessage;
    }

    const englishMessage = formatMessage(englishCatalog[key], substitutions);
    return englishMessage === null ? "" : englishMessage;
  }

  return {
    initialize,
    ready: null,
    getMessage,
    getLocale: () => currentLocale,
    setLanguage: (locale) => activate(normalizeAppLocale(locale) || "en", true),
    onLanguageChanged(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

function createChromeAppI18n() {
  return createAppI18n({
    async loadCatalog(locale) {
      const url = chrome.runtime.getURL(`_locales/${locale}/messages.json`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Could not load locale catalog: ${locale}`);
      }
      return response.json();
    },
    readPreference() {
      return new Promise((resolve, reject) => {
        chrome.storage.sync.get("language", (result) => {
          const error = chrome.runtime.lastError;
          if (error) {
            reject(error);
          } else {
            resolve(result.language);
          }
        });
      });
    },
    writePreference(locale) {
      return new Promise((resolve, reject) => {
        chrome.storage.sync.set({ language: locale }, () => {
          const error = chrome.runtime.lastError;
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    },
    getChromeLocale: () => chrome.i18n.getUILanguage(),
  });
}

const appI18n = typeof chrome !== "undefined" ? createChromeAppI18n() : null;
if (appI18n) {
  appI18n.ready = appI18n.initialize();
}

module.exports = {
  SUPPORTED_LOCALES,
  normalizeAppLocale,
  resolveInitialLocale,
  formatMessage,
  createAppI18n,
  appI18n,
};
