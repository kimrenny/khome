const {
  createCustomBackgroundId,
  validateCustomImageFile,
  normalizeCustomRecord,
} = require("./backgroundCatalog");

function defaultCopyBlob(file, mimeType) {
  if (!file || typeof file.slice !== "function") {
    throw new Error("source-unavailable");
  }

  return file.slice(0, file.size, mimeType);
}

async function importCustomImage(file, store, options = {}) {
  if (!file) {
    return { ok: false, reason: "cancelled" };
  }

  const validate = options.validate || validateCustomImageFile;
  const validation = validate(file);
  if (!validation.ok) {
    return { ok: false, reason: validation.reason };
  }

  const copyBlob = options.copyBlob || defaultCopyBlob;
  let blob;

  try {
    blob = await copyBlob(file, validation.mimeType);
  } catch (error) {
    return { ok: false, reason: "copy-failed" };
  }

  if (!blob || !blob.size) {
    return { ok: false, reason: "source-unavailable" };
  }

  if (typeof options.decodeImage === "function") {
    try {
      const decoded = await options.decodeImage(blob);
      if (!decoded) {
        return { ok: false, reason: "invalid" };
      }
    } catch (error) {
      return { ok: false, reason: "invalid" };
    }
  }

  const record = {
    id: (options.createId || createCustomBackgroundId)(),
    blob,
    mimeType: validation.mimeType,
    originalName: typeof file.name === "string" ? file.name : "",
    createdAt: typeof options.now === "function" ? options.now() : Date.now(),
  };

  try {
    await store.save(record);
  } catch (error) {
    return { ok: false, reason: "storage-error" };
  }

  return { ok: true, record: normalizeCustomRecord(record) };
}

async function importCustomImages(fileList, store, options = {}) {
  const files = fileList ? Array.from(fileList) : [];
  if (!files.length) {
    return { cancelled: true, imported: [], errors: [] };
  }

  const imported = [];
  const errors = [];

  for (const file of files) {
    const result = await importCustomImage(file, store, options);
    if (result.ok) {
      imported.push(result.record);
    } else if (result.reason !== "cancelled") {
      errors.push(result);
    }
  }

  return { cancelled: false, imported, errors };
}

function createMemoryCustomBackgroundStore(initialRecords) {
  const records = new Map();

  (initialRecords || []).forEach((record) => {
    const normalized = normalizeCustomRecord(record);
    if (normalized) {
      records.set(normalized.id, normalized);
    }
  });

  return {
    list() {
      return Promise.resolve(
        Array.from(records.values()).map((record) => ({ ...record })),
      );
    },
    save(record) {
      const normalized = normalizeCustomRecord(record);
      if (!normalized) {
        return Promise.reject(new Error("invalid"));
      }
      records.set(normalized.id, normalized);
      return Promise.resolve(normalized);
    },
    delete(id) {
      records.delete(id);
      return Promise.resolve();
    },
    get(id) {
      const record = records.get(id);
      return Promise.resolve(record ? { ...record } : null);
    },
  };
}

module.exports = {
  defaultCopyBlob,
  importCustomImage,
  importCustomImages,
  createMemoryCustomBackgroundStore,
};
