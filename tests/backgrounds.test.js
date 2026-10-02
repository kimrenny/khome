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
  toggleBackgroundSelection,
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
const {
  SUPPORTED_LOCALES,
  normalizeAppLocale,
  resolveInitialLocale,
  createAppI18n,
} = require("../js/appI18n");
const { resolveGreetingName } = require("../js/greetingName");

const localeDirectories = ["en", "fr", "ja", "ko", "ru", "uk", "zh_CN"];

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

test("selecting a previously unselected built-in background", () => {
  const initial = [];
  const selected = toggleBackgroundSelection(initial, "bg-webp/photo_1.webp");
  assert.deepEqual(selected, ["bg-webp/photo_1.webp"]);
});

test("deselecting a selected built-in background", () => {
  const selected = ["bg-webp/photo_1.webp"];
  const deselected = toggleBackgroundSelection(
    selected,
    "bg-webp/photo_1.webp",
  );
  assert.deepEqual(deselected, []);
});

test("selecting and deselecting a custom background", () => {
  let selected = [];
  selected = toggleBackgroundSelection(selected, "custom:img-1");
  assert.deepEqual(selected, ["custom:img-1"]);

  selected = toggleBackgroundSelection(selected, "custom:img-1");
  assert.deepEqual(selected, []);
});

test("deselecting when exactly 1 background is selected", () => {
  const selected = ["bg-webp/photo_5.webp"];
  const updated = toggleBackgroundSelection(selected, "bg-webp/photo_5.webp");
  assert.deepEqual(updated, []);
});

test("deselecting when exactly 2 backgrounds are selected", () => {
  const selected = ["bg-webp/photo_1.webp", "bg-webp/photo_2.webp"];
  const updated = toggleBackgroundSelection(selected, "bg-webp/photo_1.webp");
  assert.deepEqual(updated, ["bg-webp/photo_2.webp"]);
});

test("deselecting when exactly 3 backgrounds are selected", () => {
  const selected = [
    "bg-webp/photo_1.webp",
    "bg-webp/photo_2.webp",
    "bg-webp/photo_3.webp",
  ];
  const updated = toggleBackgroundSelection(selected, "bg-webp/photo_2.webp");
  assert.deepEqual(updated, ["bg-webp/photo_1.webp", "bg-webp/photo_3.webp"]);
});

test("deselecting one item while other backgrounds remain selected", () => {
  const selected = [
    "bg-webp/photo_1.webp",
    "bg-webp/photo_2.webp",
    "custom:img-1",
  ];
  const updated = toggleBackgroundSelection(selected, "bg-webp/photo_1.webp");
  assert.deepEqual(updated, ["bg-webp/photo_2.webp", "custom:img-1"]);
});

test("mixed built-in and custom background selection", () => {
  let selected = [];
  selected = toggleBackgroundSelection(selected, "bg-webp/photo_1.webp");
  selected = toggleBackgroundSelection(selected, "custom:img-1");
  assert.deepEqual(selected, ["bg-webp/photo_1.webp", "custom:img-1"]);

  // Deselect custom, built-in remains
  selected = toggleBackgroundSelection(selected, "custom:img-1");
  assert.deepEqual(selected, ["bg-webp/photo_1.webp"]);

  // Deselect built-in, now empty
  selected = toggleBackgroundSelection(selected, "bg-webp/photo_1.webp");
  assert.deepEqual(selected, []);
});

test("sequence: select A -> select B -> select C -> deselect B -> deselect A -> select D", () => {
  let selected = [];

  // select A
  selected = toggleBackgroundSelection(selected, "bg-webp/photo_1.webp");
  assert.deepEqual(selected, ["bg-webp/photo_1.webp"]);

  // select B
  selected = toggleBackgroundSelection(selected, "bg-webp/photo_2.webp");
  assert.deepEqual(selected, ["bg-webp/photo_1.webp", "bg-webp/photo_2.webp"]);

  // select C (custom)
  selected = toggleBackgroundSelection(selected, "custom:img-c");
  assert.deepEqual(selected, [
    "bg-webp/photo_1.webp",
    "bg-webp/photo_2.webp",
    "custom:img-c",
  ]);

  // deselect B
  selected = toggleBackgroundSelection(selected, "bg-webp/photo_2.webp");
  assert.deepEqual(selected, ["bg-webp/photo_1.webp", "custom:img-c"]);

  // deselect A
  selected = toggleBackgroundSelection(selected, "bg-webp/photo_1.webp");
  assert.deepEqual(selected, ["custom:img-c"]);

  // select D
  selected = toggleBackgroundSelection(selected, "bg-webp/photo_4.webp");
  assert.deepEqual(selected, ["custom:img-c", "bg-webp/photo_4.webp"]);
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

test("Chrome locale catalogs are complete and consistently formatted", () => {
  const root = path.join(__dirname, "..");
  const catalogs = new Map();
  const expectedKeys = new Set();

  for (const locale of localeDirectories) {
    const catalogPath = path.join(root, "_locales", locale, "messages.json");
    assert.equal(
      fs.existsSync(catalogPath),
      true,
      `${locale} catalog is missing`,
    );
    const raw = fs.readFileSync(catalogPath, "utf8");
    const catalog = JSON.parse(raw);
    const catalogKeys = Object.keys(catalog);
    const declaredKeys = [...raw.matchAll(/^  "([^"\n]+)": \{$/gm)].map(
      (match) => match[1],
    );

    assert.equal(
      new Set(declaredKeys.map((key) => key.toLowerCase())).size,
      declaredKeys.length,
      `${locale} has duplicate message keys`,
    );
    for (const [key, definition] of Object.entries(catalog)) {
      assert.match(
        key,
        /^[A-Za-z_][A-Za-z0-9_]*$/,
        `${locale} has invalid key ${key}`,
      );
      assert.equal(
        typeof definition.message,
        "string",
        `${locale}.${key} lacks a message`,
      );
      assert.equal(
        typeof definition.description,
        "string",
        `${locale}.${key} lacks a description`,
      );
      assert.ok(
        definition.description.trim(),
        `${locale}.${key} has an empty description`,
      );

      const placeholders = definition.placeholders || {};
      for (const [name, placeholder] of Object.entries(placeholders)) {
        assert.ok(
          definition.message.includes(`$${name}$`),
          `${locale}.${key} does not use ${name}`,
        );
        assert.match(
          placeholder.content,
          /^\$[1-9]$/,
          `${locale}.${key}.${name} has invalid content`,
        );
        assert.equal(
          typeof placeholder.example,
          "string",
          `${locale}.${key}.${name} lacks an example`,
        );
      }
      const usedPlaceholders = [
        ...definition.message.matchAll(/\$([A-Za-z0-9_]+)\$/g),
      ]
        .map((match) => match[1])
        .sort();
      assert.deepEqual(
        usedPlaceholders,
        Object.keys(placeholders).sort(),
        `${locale}.${key} has inconsistent placeholder definitions`,
      );
    }

    if (locale === "en") {
      catalogKeys.forEach((key) => expectedKeys.add(key));
      assert.equal(
        catalogKeys.length,
        106,
        "English catalog no longer accounts for all legacy messages",
      );
    } else {
      assert.deepEqual(
        catalogKeys.sort(),
        [...expectedKeys].sort(),
        `${locale} message keys differ from English`,
      );
    }
    catalogs.set(locale, catalog);
  }

  const defaultCatalog = catalogs.get("en");
  assert.ok(defaultCatalog.language, "legacy Language message was dropped");
  assert.ok(
    defaultCatalog.searchEngine,
    "legacy Search Engine message was dropped",
  );
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, "manifest.json"), "utf8"),
  );
  assert.equal(manifest.default_locale, "en");
  for (const match of JSON.stringify(manifest).matchAll(
    /__MSG_([A-Za-z0-9_]+)__/g,
  )) {
    assert.ok(
      defaultCatalog[match[1]],
      `manifest references missing message ${match[1]}`,
    );
  }
});

test("application references only native Chrome messages and has no old locale source", () => {
  const root = path.join(__dirname, "..");
  const jsFiles = fs
    .readdirSync(path.join(root, "js"))
    .filter((file) => file.endsWith(".js"));
  const javascript = jsFiles
    .map((file) => fs.readFileSync(path.join(root, "js", file), "utf8"))
    .join("\n");
  const greetingsSource = fs.readFileSync(
    path.join(root, "js", "greetings.js"),
    "utf8",
  );
  const appI18nSource = fs.readFileSync(
    path.join(root, "js", "appI18n.js"),
    "utf8",
  );
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const staticBindings = fs.readFileSync(
    path.join(root, "js", "localizePage.js"),
    "utf8",
  );
  const defaultCatalog = JSON.parse(
    fs.readFileSync(path.join(root, "_locales", "en", "messages.json"), "utf8"),
  );
  const referencedKeys = new Set(
    [
      ...javascript.matchAll(/chrome\.i18n\.getMessage\(\s*["']([^"']+)["']/g),
    ].map((match) => match[1]),
  );
  const bindingIds = [];

  for (const match of staticBindings.matchAll(
    /\["([^"]+)", "([^"]+)", "(?:textContent|placeholder|innerHTML|aria-label)"\]/g,
  )) {
    bindingIds.push(match[1]);
    referencedKeys.add(match[2]);
    const escapedId = match[1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const elementId = new RegExp(`\\bid="${escapedId}"`, "g");
    assert.equal(
      [...html.matchAll(elementId)].length,
      1,
      `static binding ${match[1]} must target one HTML element`,
    );
  }
  assert.equal(
    new Set(bindingIds).size,
    bindingIds.length,
    "static message bindings contain duplicate element IDs",
  );
  for (const key of referencedKeys) {
    assert.ok(
      defaultCatalog[key],
      `application references missing message ${key}`,
    );
  }
  for (const match of greetingsSource.matchAll(
    /"(greeting[A-Z][A-Za-z0-9]+)"/g,
  )) {
    assert.ok(
      defaultCatalog[match[1]],
      `greeting lookup references missing message ${match[1]}`,
    );
  }
  assert.doesNotMatch(
    greetingsSource,
    /greeting_(morning|afternoon|evening|night)_/,
  );

  assert.doesNotMatch(html, /data-i18n/);
  assert.equal((html.match(/id="languageSelector"/g) || []).length, 1);
  for (const locale of ["en", "fr", "ja", "ko", "ru", "uk", "zh_CN"]) {
    assert.match(html, new RegExp(`<option value="${locale}">`));
  }
  assert.doesNotMatch(
    javascript,
    /updateTranslations|loadTranslations|currentLang|assets\/\$\{lang\}\.json/,
  );
  assert.doesNotMatch(javascript, /chrome\.i18n\.getMessage/);
  assert.match(appI18nSource, /chrome\.i18n\.getUILanguage/);
  assert.equal(fs.existsSync(path.join(root, "js", "i18nlocalize.js")), false);
  for (const locale of ["en", "fr", "ja", "ko", "ru", "uk", "zh"]) {
    assert.equal(
      fs.existsSync(path.join(root, "assets", `${locale}.json`)),
      false,
      `obsolete assets/${locale}.json remains`,
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
    /id="localized-currentVersion-1">Current Version 1\.1\.0<\/span>/,
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
    assert.throws(() => getRequiredWeatherApiKey(missingValue), {
      message: MISSING_WEATHER_API_KEY_MESSAGE,
    });
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

function readLocaleCatalog(locale) {
  return JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "..", "_locales", locale, "messages.json"),
      "utf8",
    ),
  );
}

test("application locale matching supports all configured Chrome locale forms", () => {
  assert.deepEqual(SUPPORTED_LOCALES, [
    "en",
    "fr",
    "ja",
    "ko",
    "ru",
    "uk",
    "zh_CN",
  ]);
  assert.equal(normalizeAppLocale("en-US"), "en");
  assert.equal(normalizeAppLocale("en-GB"), "en");
  assert.equal(normalizeAppLocale("ko-KR"), "ko");
  assert.equal(normalizeAppLocale("uk-UA"), "uk");
  assert.equal(normalizeAppLocale("ru-RU"), "ru");
  assert.equal(normalizeAppLocale("ja-JP"), "ja");
  assert.equal(normalizeAppLocale("fr-FR"), "fr");
  assert.equal(normalizeAppLocale("zh-CN"), "zh_CN");
  assert.equal(normalizeAppLocale("de-DE"), null);
});

test("saved application language takes priority over Chrome locale", async () => {
  const service = createAppI18n({
    loadCatalog: async (locale) => readLocaleCatalog(locale),
    readPreference: async () => "en",
    getChromeLocale: () => "uk-UA",
  });

  await service.initialize();
  assert.equal(service.getLocale(), "en");
  assert.equal(service.getMessage("bookmark"), "Bookmark");
});

test("supported Chrome locale and English fallback are used when no app choice exists", async () => {
  const supported = createAppI18n({
    loadCatalog: async (locale) => readLocaleCatalog(locale),
    readPreference: async () => null,
    getChromeLocale: () => "uk-UA",
  });
  await supported.initialize();
  assert.equal(supported.getLocale(), "uk");
  assert.equal(supported.getMessage("bookmark"), "Закладка");

  const unsupported = createAppI18n({
    loadCatalog: async (locale) => readLocaleCatalog(locale),
    readPreference: async () => null,
    getChromeLocale: () => "de-DE",
  });
  await unsupported.initialize();
  assert.equal(unsupported.getLocale(), "en");
  assert.equal(unsupported.getMessage("bookmark"), "Bookmark");
});

test("each supported app locale loads and returns its own translation", async () => {
  const expectedBookmark = {
    en: "Bookmark",
    fr: "Favoris",
    ja: "ブックマーク",
    ko: "북마크",
    ru: "Закладка",
    uk: "Закладка",
    zh_CN: "书签",
  };

  for (const locale of SUPPORTED_LOCALES) {
    const loaded = [];
    const service = createAppI18n({
      loadCatalog: async (requestedLocale) => {
        loaded.push(requestedLocale);
        return readLocaleCatalog(requestedLocale);
      },
      readPreference: async () => locale,
      getChromeLocale: () => "en-US",
    });

    await service.initialize();
    assert.equal(service.getLocale(), locale);
    assert.equal(service.getMessage("bookmark"), expectedBookmark[locale]);
    assert.ok(loaded.includes(locale), `${locale} catalog was not loaded`);
  }
});

test("application language changes persist and restore across service instances", async () => {
  let savedLocale = null;
  const writes = [];
  const options = {
    loadCatalog: async (locale) => readLocaleCatalog(locale),
    readPreference: async () => savedLocale,
    writePreference: async (locale) => {
      savedLocale = locale;
      writes.push(locale);
    },
    getChromeLocale: () => "uk-UA",
  };

  const firstPage = createAppI18n(options);
  const localeChanges = [];
  firstPage.onLanguageChanged((locale) => localeChanges.push(locale));
  await firstPage.initialize();
  await firstPage.setLanguage("ko");
  assert.equal(savedLocale, "ko");
  assert.deepEqual(writes, ["ko"]);
  assert.deepEqual(localeChanges, ["uk", "ko"]);

  const reopenedPage = createAppI18n(options);
  await reopenedPage.initialize();
  assert.equal(reopenedPage.getLocale(), "ko");
  assert.equal(reopenedPage.getMessage("bookmark"), "북마크");
});

test("missing locale messages and catalogs fall back to English without exposing keys", async () => {
  const english = readLocaleCatalog("en");
  const korean = { ...readLocaleCatalog("ko") };
  delete korean.searchEngine;

  const missingMessage = createAppI18n({
    loadCatalog: async (locale) => (locale === "en" ? english : korean),
    readPreference: async () => "ko",
  });
  await missingMessage.initialize();
  assert.equal(missingMessage.getMessage("searchEngine"), "Search Engine");
  assert.equal(missingMessage.getMessage("notARealMessage"), "");

  const missingCatalog = createAppI18n({
    loadCatalog: async (locale) => {
      if (locale === "ru") {
        throw new Error("missing catalog");
      }
      return english;
    },
    readPreference: async () => "ru",
  });
  await missingCatalog.initialize();
  assert.equal(missingCatalog.getLocale(), "en");
  assert.equal(missingCatalog.getMessage("bookmark"), "Bookmark");
});

test("Chrome message placeholders substitute values and malformed definitions fall back", async () => {
  const english = readLocaleCatalog("en");
  const korean = { ...readLocaleCatalog("ko") };
  korean.greetingMorning1 = {
    message: "안녕하세요, $name$!",
    placeholders: { name: { content: "bad", example: "친구" } },
  };

  const service = createAppI18n({
    loadCatalog: async (locale) => (locale === "en" ? english : korean),
    readPreference: async () => "ko",
  });
  await service.initialize();

  assert.equal(
    service.getMessage("greetingMorning1", ["Mina"]),
    "Good Morning, Mina!",
  );
  assert.equal(
    service.getMessage("greetingMorning2", ["Mina"]),
    "Mina님, 일어나세요!",
  );
});

test("every supported locale has the expected greeting fallback name", async () => {
  const expectedNames = {
    en: "Friend",
    fr: "Ami",
    ja: "友達",
    ko: "친구",
    ru: "Друг",
    uk: "Друже",
    zh_CN: "朋友",
  };

  for (const locale of SUPPORTED_LOCALES) {
    const catalog = readLocaleCatalog(locale);
    assert.equal(catalog.greetingDefaultName.message, expectedNames[locale]);

    const service = createAppI18n({
      loadCatalog: async (requestedLocale) =>
        readLocaleCatalog(requestedLocale),
      readPreference: async () => locale,
    });
    await service.initialize();
    assert.equal(
      service.getMessage("greetingDefaultName"),
      expectedNames[locale],
    );
  }
});

test("configured greeting names take priority and empty names use the locale fallback", async () => {
  for (const locale of SUPPORTED_LOCALES) {
    const service = createAppI18n({
      loadCatalog: async (requestedLocale) =>
        readLocaleCatalog(requestedLocale),
      readPreference: async () => locale,
    });
    await service.initialize();

    assert.equal(resolveGreetingName("Alex", service.getMessage), "Alex");
    assert.equal(
      resolveGreetingName("", service.getMessage),
      service.getMessage("greetingDefaultName"),
    );
    assert.equal(
      resolveGreetingName(undefined, service.getMessage),
      service.getMessage("greetingDefaultName"),
    );
  }
});

test("greeting fallback follows app language changes without persisting as the user name", async () => {
  const storage = { language: null, userName: undefined };
  const service = createAppI18n({
    loadCatalog: async (locale) => readLocaleCatalog(locale),
    readPreference: async () => storage.language,
    writePreference: async (locale) => {
      storage.language = locale;
    },
    getChromeLocale: () => "uk-UA",
  });
  await service.initialize();

  assert.equal(
    resolveGreetingName(storage.userName, service.getMessage),
    "Друже",
  );
  await service.setLanguage("en");
  assert.equal(
    resolveGreetingName(storage.userName, service.getMessage),
    "Friend",
  );
  await service.setLanguage("ru");
  assert.equal(
    resolveGreetingName(storage.userName, service.getMessage),
    "Друг",
  );
  await service.setLanguage("ko");
  assert.equal(
    resolveGreetingName(storage.userName, service.getMessage),
    "친구",
  );
  assert.equal(storage.userName, undefined);

  storage.userName = "Alex";
  await service.setLanguage("en");
  assert.equal(
    resolveGreetingName(storage.userName, service.getMessage),
    "Alex",
  );
  await service.setLanguage("ru");
  assert.equal(
    resolveGreetingName(storage.userName, service.getMessage),
    "Alex",
  );
  await service.setLanguage("ko");
  assert.equal(
    resolveGreetingName(storage.userName, service.getMessage),
    "Alex",
  );
  assert.equal(storage.userName, "Alex");
});
