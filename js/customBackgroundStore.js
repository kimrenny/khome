const { isCustomBackgroundId, normalizeCustomRecord } = require("./backgroundCatalog");

const DB_NAME = "khome-custom-backgrounds";
const DB_VERSION = 1;
const STORE_NAME = "images";

function openCustomBackgroundDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("storage-unavailable"));
      return;
    }

    let request;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (error) {
      reject(error);
      return;
    }

    request.onupgradeneeded = function () {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = function () {
      resolve(request.result);
    };

    request.onerror = function () {
      reject(request.error || new Error("storage-unavailable"));
    };
  });
}

function withStore(mode, executor) {
  return openCustomBackgroundDb().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, mode);
      const store = transaction.objectStore(STORE_NAME);
      let result;
      let settled = false;

      const closeAnd = (error, value) => {
        if (settled) {
          return;
        }
        settled = true;
        try {
          db.close();
        } catch (closeError) {
          // ignore close errors
        }
        if (error) {
          reject(error);
        } else {
          resolve(value);
        }
      };

      transaction.oncomplete = function () {
        closeAnd(null, result);
      };

      transaction.onerror = function () {
        closeAnd(transaction.error || new Error("storage-error"));
      };

      transaction.onabort = function () {
        closeAnd(transaction.error || new Error("storage-error"));
      };

      try {
        const request = executor(store);
        if (request && typeof request === "object") {
          request.onsuccess = function () {
            result = request.result;
          };
        }
      } catch (error) {
        closeAnd(error);
      }
    });
  });
}

function listCustomBackgrounds() {
  return withStore("readonly", (store) => store.getAll()).then((records) => {
    if (!Array.isArray(records)) {
      return [];
    }

    return records
      .map(normalizeCustomRecord)
      .filter(Boolean)
      .filter((record) => isCustomBackgroundId(record.id));
  });
}

function saveCustomBackground(record) {
  const normalized = normalizeCustomRecord(record);
  if (!normalized) {
    return Promise.reject(new Error("invalid"));
  }

  return withStore("readwrite", (store) => store.put(normalized)).then(() => normalized);
}

function deleteCustomBackground(id) {
  if (!isCustomBackgroundId(id)) {
    return Promise.resolve();
  }

  return withStore("readwrite", (store) => store.delete(id));
}

module.exports = {
  DB_NAME,
  STORE_NAME,
  listCustomBackgrounds,
  saveCustomBackground,
  deleteCustomBackground,
};
