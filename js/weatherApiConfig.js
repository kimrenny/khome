const MISSING_WEATHER_API_KEY_MESSAGE =
  "WEATHER_API_KEY is not configured. Create a .env file based on .env.example before building.";

function getRequiredWeatherApiKey(value) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(MISSING_WEATHER_API_KEY_MESSAGE);
  }

  return value.trim();
}

module.exports = {
  MISSING_WEATHER_API_KEY_MESSAGE,
  getRequiredWeatherApiKey,
};