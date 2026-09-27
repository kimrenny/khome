const DEFAULT_SLIDESHOW_INTERVAL = 10;
const MIN_SLIDESHOW_INTERVAL = 3;
const MAX_SLIDESHOW_INTERVAL = 900;

function normalizeSlideshowInterval(value) {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : NaN;

  if (!Number.isFinite(numericValue)) {
    return DEFAULT_SLIDESHOW_INTERVAL;
  }

  return Math.min(
    MAX_SLIDESHOW_INTERVAL,
    Math.max(MIN_SLIDESHOW_INTERVAL, Math.round(numericValue)),
  );
}

function normalizeSlideshowSettings(stored = {}) {
  return {
    currentSpeed: normalizeSlideshowInterval(stored.currentSpeed),
    enabled:
      typeof stored["slideshow-toggle"] === "boolean"
        ? stored["slideshow-toggle"]
        : true,
  };
}

function shouldRunSlideshow(enabled, selectedImageCount) {
  return (
    enabled === true &&
    Number.isInteger(selectedImageCount) &&
    selectedImageCount > 1
  );
}

module.exports = {
  DEFAULT_SLIDESHOW_INTERVAL,
  MIN_SLIDESHOW_INTERVAL,
  MAX_SLIDESHOW_INTERVAL,
  normalizeSlideshowInterval,
  normalizeSlideshowSettings,
  shouldRunSlideshow,
};
