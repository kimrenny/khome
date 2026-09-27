function createWeatherResponseError(kind, message) {
  const error = new Error(message);
  error.kind = kind;
  return error;
}

function isJsonContentType(contentType) {
  const mediaType = String(contentType || "")
    .split(";")[0]
    .trim()
    .toLowerCase();

  return mediaType === "application/json" || mediaType.endsWith("+json");
}

function isWeatherPayload(payload) {
  return Boolean(
    payload &&
    payload.location &&
    typeof payload.location.name === "string" &&
    payload.location.name.trim() &&
    payload.current &&
    typeof payload.current.temp_c === "number" &&
    Number.isFinite(payload.current.temp_c) &&
    payload.current.condition &&
    typeof payload.current.condition.text === "string" &&
    payload.current.condition.text.trim() &&
    typeof payload.current.condition.icon === "string" &&
    payload.current.condition.icon.trim(),
  );
}

async function parseWeatherResponse(response) {
  if (!response || !response.ok) {
    const status =
      response && Number.isFinite(response.status) ? ` ${response.status}` : "";
    const statusText =
      response && response.statusText ? ` ${response.statusText}` : "";
    throw createWeatherResponseError(
      "http",
      `Weather API returned an unsuccessful HTTP response${status}${statusText}.`,
    );
  }

  const contentType = response.headers?.get("content-type") || "";
  if (!isJsonContentType(contentType)) {
    throw createWeatherResponseError(
      "content-type",
      `Weather API returned unexpected content type: ${contentType || "missing"}.`,
    );
  }

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    throw createWeatherResponseError(
      "json",
      "Weather API response contained invalid JSON.",
    );
  }

  if (payload && payload.error) {
    const message =
      typeof payload.error.message === "string"
        ? payload.error.message.slice(0, 240)
        : "The provider reported an error.";
    throw createWeatherResponseError(
      "payload",
      `Weather API error: ${message}`,
    );
  }

  if (!isWeatherPayload(payload)) {
    throw createWeatherResponseError(
      "payload",
      "Weather API response is missing required weather fields.",
    );
  }

  return payload;
}

function formatWeatherFailure(error) {
  if (error && error.kind) {
    return `Weather ${error.kind} failure: ${error.message}`;
  }

  const message =
    error && error.message ? error.message : "Unknown network error.";
  return `Weather network failure: ${message}`;
}

module.exports = {
  createWeatherResponseError,
  isJsonContentType,
  isWeatherPayload,
  parseWeatherResponse,
  formatWeatherFailure,
};
