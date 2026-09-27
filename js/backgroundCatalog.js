const CUSTOM_BACKGROUND_PREFIX = "custom:";
const BUILTIN_IMAGE_COUNT = 89;

const SUPPORTED_MIME_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
};

function getBuiltinBackgroundIds() {
  return Array.from(
    { length: BUILTIN_IMAGE_COUNT },
    (_, i) => `bg-webp/photo_${i + 1}.webp`,
  );
}

function getBuiltinThumbPath(id) {
  const fileName = String(id).split("/").pop();
  return `thumbs/${fileName}`;
}

function isCustomBackgroundId(id) {
  return (
    typeof id === "string" &&
    id.startsWith(CUSTOM_BACKGROUND_PREFIX) &&
    id.length > CUSTOM_BACKGROUND_PREFIX.length
  );
}

function isBuiltinBackgroundId(id, builtinIds = getBuiltinBackgroundIds()) {
  return builtinIds.includes(id);
}

function createCustomBackgroundId(generateId) {
  const generate =
    typeof generateId === "function"
      ? generateId
      : () =>
          typeof crypto !== "undefined" &&
          typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${CUSTOM_BACKGROUND_PREFIX}${generate()}`;
}

function mergeBackgroundCatalog(builtinIds, customIds) {
  const builtins = Array.isArray(builtinIds) ? builtinIds.filter(Boolean) : [];
  const customs = Array.isArray(customIds)
    ? customIds.filter((id) => isCustomBackgroundId(id))
    : [];

  return [...builtins, ...customs];
}

function normalizePersistedSelectedImages(raw) {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter((id) => typeof id === "string" && id.length > 0);
}

function sanitizeSelectedImages(selectedIds, availableIds, options = {}) {
  const selected = normalizePersistedSelectedImages(selectedIds);
  const available = new Set(Array.isArray(availableIds) ? availableIds : []);
  const keepUnknownCustomIds = options.keepUnknownCustomIds === true;

  return selected.filter((id) => {
    if (available.has(id)) {
      return true;
    }

    return keepUnknownCustomIds && isCustomBackgroundId(id);
  });
}

function areAllBackgroundsSelected(selectedIds, availableIds) {
  const selected = new Set(normalizePersistedSelectedImages(selectedIds));
  const available = Array.isArray(availableIds) ? availableIds : [];

  return available.every((id) => selected.has(id));
}

function toggleAllBackgroundSelections(selectedIds, availableIds) {
  const available = Array.isArray(availableIds) ? availableIds : [];

  if (areAllBackgroundsSelected(selectedIds, available)) {
    return [];
  }

  return [...new Set(available)];
}

function getExtension(fileName) {
  if (typeof fileName !== "string") {
    return "";
  }

  const index = fileName.lastIndexOf(".");
  if (index === -1) {
    return "";
  }

  return fileName.slice(index).toLowerCase();
}

function mimeFromExtension(extension) {
  return Object.keys(SUPPORTED_MIME_TYPES).find((mime) =>
    SUPPORTED_MIME_TYPES[mime].includes(extension),
  );
}

function validateCustomImageFile(file) {
  if (!file) {
    return { ok: false, reason: "cancelled" };
  }

  const type = typeof file.type === "string" ? file.type.toLowerCase() : "";
  const extension = getExtension(file.name);
  const mimeFromName = mimeFromExtension(extension);

  if (SUPPORTED_MIME_TYPES[type]) {
    return {
      ok: true,
      mimeType: type,
      extension: SUPPORTED_MIME_TYPES[type][0],
    };
  }

  if ((type === "" || type === "application/octet-stream") && mimeFromName) {
    return { ok: true, mimeType: mimeFromName, extension };
  }

  return { ok: false, reason: "unsupported" };
}

function normalizeCustomRecord(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  if (!isCustomBackgroundId(raw.id) || !raw.blob) {
    return null;
  }

  return {
    id: raw.id,
    blob: raw.blob,
    mimeType: typeof raw.mimeType === "string" ? raw.mimeType : "image/jpeg",
    originalName: typeof raw.originalName === "string" ? raw.originalName : "",
    createdAt: typeof raw.createdAt === "number" ? raw.createdAt : 0,
  };
}

module.exports = {
  CUSTOM_BACKGROUND_PREFIX,
  BUILTIN_IMAGE_COUNT,
  SUPPORTED_MIME_TYPES,
  getBuiltinBackgroundIds,
  getBuiltinThumbPath,
  isCustomBackgroundId,
  isBuiltinBackgroundId,
  createCustomBackgroundId,
  mergeBackgroundCatalog,
  normalizePersistedSelectedImages,
  sanitizeSelectedImages,
  areAllBackgroundsSelected,
  toggleAllBackgroundSelections,
  validateCustomImageFile,
  normalizeCustomRecord,
};
