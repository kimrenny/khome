const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
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
  CUSTOM_BACKGROUND_PREFIX,
} = require("../js/backgroundCatalog");

const {
  importCustomImage,
  importCustomImages,
  createMemoryCustomBackgroundStore,
} = require("../js/customBackgroundService");
const {
  DEFAULT_SLIDESHOW_INTERVAL,
  MIN_SLIDESHOW_INTERVAL,
  MAX_SLIDESHOW_INTERVAL,
  normalizeSlideshowInterval,
  normalizeSlideshowSettings,
  shouldRunSlideshow,
} = require("../js/slideshowSettings");
const {
  formatWeatherFailure,
  parseWeatherResponse,
} = require("../js/weatherResponse");
const {
  MISSING_WEATHER_API_KEY_MESSAGE,
  getRequiredWeatherApiKey,
} = require("../js/weatherApiConfig");

const localeFiles = ["en", "fr", "ja", "ko", "ru", "uk", "zh"];

function fakeFile(name, type, size = 12) {
  return {
    name,
    type,
    size,
    slice(start, end, mimeType) {
      return { size: end - start, type: mimeType || type };
    },
  };
}

test("built-in IDs are stable paths, not indexes", () => {
  const ids = getBuiltinBackgroundIds();
  assert.equal(ids[0], "bg-webp/photo_1.webp");
  assert.equal(ids[84], "bg-webp/photo_85.webp");
  assert.equal(getBuiltinThumbPath(ids[0]), "thumbs/photo_1.webp");
  assert.equal(isBuiltinBackgroundId("bg-webp/photo_2.webp"), true);
  assert.equal(isBuiltinBackgroundId("custom:abc"), false);
});

test("custom IDs are persistent and prefixed", () => {
  const first = createCustomBackgroundId(() => "stable-id");
  const second = createCustomBackgroundId(() => "stable-id");
  assert.equal(first, `${CUSTOM_BACKGROUND_PREFIX}stable-id`);
  assert.equal(first, second);
  assert.equal(isCustomBackgroundId(first), true);
  assert.equal(isCustomBackgroundId("bg-webp/photo_1.webp"), false);
  assert.equal(isCustomBackgroundId("custom:"), false);
});

test("import copies the file into persistent store with a stable id", async () => {
  const store = createMemoryCustomBackgroundStore();
  const file = fakeFile("wall.jpg", "image/jpeg", 2048);
  const result = await importCustomImage(file, store, {
    createId: () => "custom:fixed-1",
    now: () => 123,
  });

  assert.equal(result.ok, true);
  assert.equal(result.record.id, "custom:fixed-1");
  assert.equal(result.record.mimeType, "image/jpeg");
  assert.equal(result.record.originalName, "wall.jpg");
  assert.equal(result.record.createdAt, 123);
  assert.equal(result.record.blob.type, "image/jpeg");
  assert.notEqual(result.record.blob, file);

  const listed = await store.list();
  assert.equal(listed.length, 1);
  assert.equal(listed[0].id, "custom:fixed-1");
});

test("custom images are still listed after a simulated restart", async () => {
  const store = createMemoryCustomBackgroundStore();
  await importCustomImage(fakeFile("a.png", "image/png"), store, {
    createId: () => "custom:restart-a",
  });
  await importCustomImage(fakeFile("b.webp", "image/webp"), store, {
    createId: () => "custom:restart-b",
  });

  const restarted = createMemoryCustomBackgroundStore(await store.list());
  const listed = await restarted.list();
  assert.deepEqual(
    listed.map((record) => record.id),
    ["custom:restart-a", "custom:restart-b"],
  );
});

test("built-in and custom catalogs merge without changing built-in IDs", () => {
  const builtins = ["bg-webp/photo_1.webp", "bg-webp/photo_2.webp"];
  const merged = mergeBackgroundCatalog(builtins, [
    "custom:x",
    "not-custom",
    "custom:y",
  ]);
  assert.deepEqual(merged, [
    "bg-webp/photo_1.webp",
    "bg-webp/photo_2.webp",
    "custom:x",
    "custom:y",
  ]);
});

test("bulk selection recognizes empty and partial selections", () => {
  const available = ["bg-webp/photo_1.webp", "custom:x"];

  assert.equal(areAllBackgroundsSelected([], available), false);
  assert.equal(
    areAllBackgroundsSelected(["bg-webp/photo_1.webp"], available),
    false,
  );
});

test("stale and duplicate IDs do not falsely mark all backgrounds selected", () => {
  const available = [
    "bg-webp/photo_1.webp",
    "bg-webp/photo_2.webp",
    "custom:x",
  ];

  assert.equal(
    areAllBackgroundsSelected(
      ["bg-webp/photo_1.webp", "custom:stale", "custom:x"],
      available,
    ),
    false,
  );
  assert.equal(
    areAllBackgroundsSelected(
      ["bg-webp/photo_1.webp", "bg-webp/photo_1.webp", "custom:x"],
      available,
    ),
    false,
  );
});

test("bulk selection includes custom stable IDs and deselects everything", () => {
  const available = [
    "bg-webp/photo_1.webp",
    "bg-webp/photo_2.webp",
    "custom:x",
    "custom:y",
  ];

  assert.deepEqual(
    toggleAllBackgroundSelections(
      ["bg-webp/photo_1.webp", "bg-webp/photo_2.webp", "custom:x"],
      available,
    ),
    available,
  );
  assert.deepEqual(toggleAllBackgroundSelections(available, available), []);
  assert.equal(areAllBackgroundsSelected(available, available), true);
  assert.equal(areAllBackgroundsSelected([], available), false);
});

test("removing a selected custom image recalculates against remaining IDs", () => {
  const selectedBeforeRemoval = ["bg-webp/photo_1.webp", "custom:x"];
  const availableAfterRemoval = ["bg-webp/photo_1.webp"];
  const selectedAfterRemoval = sanitizeSelectedImages(
    selectedBeforeRemoval,
    availableAfterRemoval,
  );

  assert.deepEqual(selectedAfterRemoval, availableAfterRemoval);
  assert.equal(
    areAllBackgroundsSelected(selectedAfterRemoval, availableAfterRemoval),
    true,
  );
});

test("selected IDs persist independently of catalog growth", () => {
  const selected = ["bg-webp/photo_1.webp", "custom:keep"];
  const before = mergeBackgroundCatalog(
    ["bg-webp/photo_1.webp", "bg-webp/photo_2.webp"],
    ["custom:keep"],
  );
  const after = mergeBackgroundCatalog(
    ["bg-webp/photo_1.webp", "bg-webp/photo_2.webp", "bg-webp/photo_3.webp"],
    ["custom:keep"],
  );

  assert.deepEqual(sanitizeSelectedImages(selected, before), selected);
  assert.deepEqual(sanitizeSelectedImages(selected, after), selected);
});

test("selected IDs persist when built-in order changes", () => {
  const selected = ["bg-webp/photo_2.webp", "custom:keep"];
  const reordered = mergeBackgroundCatalog(
    ["bg-webp/photo_3.webp", "bg-webp/photo_2.webp", "bg-webp/photo_1.webp"],
    ["custom:keep"],
  );

  assert.deepEqual(sanitizeSelectedImages(selected, reordered), selected);
});

test("custom selections survive a restart when the stored image still exists", async () => {
  const store = createMemoryCustomBackgroundStore();
  await importCustomImage(fakeFile("night.png", "image/png"), store, {
    createId: () => "custom:night",
  });

  const availableAfterRestart = mergeBackgroundCatalog(
    getBuiltinBackgroundIds().slice(0, 2),
    (await store.list()).map((record) => record.id),
  );
  const persistedSelection = ["bg-webp/photo_1.webp", "custom:night"];

  assert.deepEqual(
    sanitizeSelectedImages(persistedSelection, availableAfterRestart),
    persistedSelection,
  );
});

test("stale selected IDs are ignored without dropping valid selections", () => {
  const available = mergeBackgroundCatalog(
    ["bg-webp/photo_1.webp", "bg-webp/photo_2.webp"],
    ["custom:still-here"],
  );
  const persisted = [
    "bg-webp/photo_1.webp",
    "bg-webp/photo_999.webp",
    "custom:missing",
    "custom:still-here",
  ];

  assert.deepEqual(sanitizeSelectedImages(persisted, available), [
    "bg-webp/photo_1.webp",
    "custom:still-here",
  ]);
});

test("unknown custom IDs can be kept until the custom catalog has loaded", () => {
  const persisted = ["bg-webp/photo_1.webp", "custom:pending"];
  const builtinsOnly = mergeBackgroundCatalog(["bg-webp/photo_1.webp"], []);

  assert.deepEqual(
    sanitizeSelectedImages(persisted, builtinsOnly, {
      keepUnknownCustomIds: true,
    }),
    persisted,
  );
});

test("cancelled file selection does not create records", async () => {
  const store = createMemoryCustomBackgroundStore();
  const none = await importCustomImages([], store);
  const missing = await importCustomImage(null, store);

  assert.equal(none.cancelled, true);
  assert.deepEqual(none.imported, []);
  assert.equal(missing.ok, false);
  assert.equal(missing.reason, "cancelled");
  assert.equal((await store.list()).length, 0);
});

test("unsupported image files are rejected", async () => {
  const store = createMemoryCustomBackgroundStore();
  const result = await importCustomImage(
    fakeFile("notes.txt", "text/plain"),
    store,
  );

  assert.equal(result.ok, false);
  assert.equal(result.reason, "unsupported");
  assert.equal(
    validateCustomImageFile(fakeFile("notes.txt", "text/plain")).ok,
    false,
  );
  assert.equal((await store.list()).length, 0);
});

test("filesystem and decode errors are returned as friendly reasons", async () => {
  const store = createMemoryCustomBackgroundStore();

  const copyFailed = await importCustomImage(
    fakeFile("a.jpg", "image/jpeg"),
    store,
    {
      copyBlob: () => {
        throw new Error("EACCES");
      },
    },
  );
  assert.equal(copyFailed.reason, "copy-failed");

  const missingSource = await importCustomImage(
    fakeFile("a.jpg", "image/jpeg"),
    store,
    {
      copyBlob: () => ({ size: 0, type: "image/jpeg" }),
    },
  );
  assert.equal(missingSource.reason, "source-unavailable");

  const invalid = await importCustomImage(
    fakeFile("a.jpg", "image/jpeg"),
    store,
    {
      decodeImage: async () => false,
    },
  );
  assert.equal(invalid.reason, "invalid");

  const storageError = await importCustomImage(
    fakeFile("a.jpg", "image/jpeg"),
    {
      save: () => Promise.reject(new Error("quota")),
    },
  );
  assert.equal(storageError.reason, "storage-error");
});

test("malformed persisted custom metadata is ignored", () => {
  assert.equal(normalizeCustomRecord(null), null);
  assert.equal(
    normalizeCustomRecord({ id: "bg-webp/photo_1.webp", blob: {} }),
    null,
  );
  assert.equal(normalizeCustomRecord({ id: "custom:ok" }), null);
  assert.equal(
    normalizeCustomRecord({ id: "custom:ok", blob: { size: 1 } }).id,
    "custom:ok",
  );
});

test("legacy selectedImages values that are not arrays become an empty selection", () => {
  assert.deepEqual(normalizePersistedSelectedImages(undefined), []);
  assert.deepEqual(normalizePersistedSelectedImages(41), []);
  assert.deepEqual(
    normalizePersistedSelectedImages(["bg-webp/photo_1.webp", 2, ""]),
    ["bg-webp/photo_1.webp"],
  );
});

test("startup does not duplicate custom images already in storage", async () => {
  const store = createMemoryCustomBackgroundStore([
    {
      id: "custom:existing",
      blob: { size: 10 },
      mimeType: "image/png",
      originalName: "a.png",
      createdAt: 1,
    },
  ]);

  const listedOnce = await store.list();
  const listedTwice = await store.list();
  assert.equal(listedOnce.length, 1);
  assert.equal(listedTwice.length, 1);
  assert.equal(listedTwice[0].id, "custom:existing");
});

test("all locales include the new release and selection strings", () => {
  for (const locale of localeFiles) {
    const translations = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "..", "assets", `${locale}.json`),
        "utf8",
      ),
    );

    assert.ok(translations["deselect-all"], `${locale} lacks deselect-all`);
    assert.ok(translations["whats-new-110-1"], `${locale} lacks release text`);
    assert.ok(translations["whats-new-110-2"], `${locale} lacks release text`);
    assert.ok(translations["whats-new-110-3"], `${locale} lacks release text`);
    assert.match(
      translations["current-version"],
      /1\.1\.0/,
      `${locale} has stale version`,
    );
  }
});

test("manifest and About release representations use version 1.1.0", () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "manifest.json"), "utf8"),
  );
  const html = fs.readFileSync(
    path.join(__dirname, "..", "index.html"),
    "utf8",
  );

  assert.equal(manifest.version, "1.1.0");
  assert.match(html, /class="setting-header">1\.1\.0<\/div>/);
  assert.match(
    html,
    /data-i18n="current-version">Current Version 1\.1\.0<\/span>/,
  );
});

test("slideshow interval normalization uses the existing default and range", () => {
  assert.equal(DEFAULT_SLIDESHOW_INTERVAL, 10);
  assert.equal(MIN_SLIDESHOW_INTERVAL, 3);
  assert.equal(MAX_SLIDESHOW_INTERVAL, 900);
  assert.equal(normalizeSlideshowInterval(undefined), 10);
  assert.equal(normalizeSlideshowInterval(null), 10);
  assert.equal(normalizeSlideshowInterval("invalid"), 10);
  assert.equal(normalizeSlideshowInterval(Infinity), 10);
  assert.equal(normalizeSlideshowInterval("15"), 15);
  assert.equal(normalizeSlideshowInterval(2), 3);
  assert.equal(normalizeSlideshowInterval(901), 900);
  assert.equal(normalizeSlideshowInterval(4.6), 5);
});

test("slideshow settings restore missing, partial, valid, and disabled state", () => {
  assert.deepEqual(normalizeSlideshowSettings(), {
    currentSpeed: 10,
    enabled: true,
  });
  assert.deepEqual(normalizeSlideshowSettings({ currentSpeed: "20" }), {
    currentSpeed: 20,
    enabled: true,
  });
  assert.deepEqual(
    normalizeSlideshowSettings({ currentSpeed: 30, "slideshow-toggle": false }),
    { currentSpeed: 30, enabled: false },
  );
  assert.deepEqual(
    normalizeSlideshowSettings({
      currentSpeed: NaN,
      "slideshow-toggle": "false",
    }),
    { currentSpeed: 10, enabled: true },
  );
});

test("slideshow only runs when enabled and at least two images are selected", () => {
  assert.equal(shouldRunSlideshow(false, 5), false);
  assert.equal(shouldRunSlideshow(true, 0), false);
  assert.equal(shouldRunSlideshow(true, 1), false);
  assert.equal(shouldRunSlideshow(true, 2), true);
});

function fakeWeatherResponse({ ok = true, status = 200, contentType, json }) {
  return {
    ok,
    status,
    statusText: ok ? "OK" : "Unauthorized",
    headers: { get: () => contentType },
    json,
  };
}

test("weather response parser accepts valid WeatherAPI JSON", async () => {
  const payload = {
    location: { name: "Seoul" },
    current: {
      temp_c: 18,
      condition: { text: "Partly cloudy", icon: "//cdn.example/icon.png" },
    },
  };

  assert.deepEqual(
    await parseWeatherResponse(
      fakeWeatherResponse({
        contentType: "application/json; charset=utf-8",
        json: async () => payload,
      }),
    ),
    payload,
  );
});

test("weather response parser rejects HTML without parsing its body", async () => {
  let parsed = false;
  await assert.rejects(
    parseWeatherResponse(
      fakeWeatherResponse({
        contentType: "text/html",
        json: async () => {
          parsed = true;
        },
      }),
    ),
    { kind: "content-type" },
  );
  assert.equal(parsed, false);
});

test("weather response parser reports HTTP errors before parsing", async () => {
  let parsed = false;
  await assert.rejects(
    parseWeatherResponse(
      fakeWeatherResponse({
        ok: false,
        status: 401,
        contentType: "application/json",
        json: async () => {
          parsed = true;
        },
      }),
    ),
    { kind: "http" },
  );
  assert.equal(parsed, false);
});

test("weather response parser distinguishes malformed JSON and invalid payload", async () => {
  await assert.rejects(
    parseWeatherResponse(
      fakeWeatherResponse({
        contentType: "application/json",
        json: async () => {
          throw new SyntaxError("Unexpected token <");
        },
      }),
    ),
    { kind: "json", message: "Weather API response contained invalid JSON." },
  );
  await assert.rejects(
    parseWeatherResponse(
      fakeWeatherResponse({
        contentType: "application/json",
        json: async () => ({ location: { name: "Seoul" } }),
      }),
    ),
    { kind: "payload" },
  );
});

test("weather failures are categorized without including response bodies", () => {
  assert.match(formatWeatherFailure(new Error("offline")), /network failure/);
  assert.match(
    formatWeatherFailure(
      Object.assign(new Error("text/html"), { kind: "content-type" }),
    ),
    /content-type failure/,
  );
});

test("WeatherAPI build configuration requires a non-empty key", () => {
  for (const missingValue of [undefined, null, "", "  "]) {
    assert.throws(
      () => getRequiredWeatherApiKey(missingValue),
      { message: MISSING_WEATHER_API_KEY_MESSAGE },
    );
  }
  assert.equal(getRequiredWeatherApiKey(" test-key "), "test-key");
});

test("weather source uses the injected key instead of a hardcoded value", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "js", "weatherUpdate.js"),
    "utf8",
  );

  assert.match(source, /\bWEATHER_API_KEY\b/);
  assert.doesNotMatch(source, /const\s+apiKey\s*=\s*["'][^"']*["']/);
});
