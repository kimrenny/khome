if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", function () {
    function fetchWeatherByLocation() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            fetchWeatherDataByCoordinates(latitude, longitude);
          },
          (error) => {
            console.error("Error getting geolocation:", error);
          }
        );
      } else {
        console.error("Geolocation is not supported by this browser");
      }
    }

    function fetchWeatherDataByCoordinates(latitude, longitude) {
      const apiKey = ""; // Enter your api key here
      const apiUrl = `https://api.weatherapi.com/v1/current.json?key=${key}&q=${latitude},${longitude}&aqi=no`;

      fetch(apiUrl)
        .then((response) => response.json())
        .then((data) => {
          updateWeather(data);
        })
        .catch((error) => {
          console.error("Error fetching weather data:", error);
        });
    }

    function updateWeather(data) {
      const temperatureElement = document.getElementById("weatherTemperature");
      const locationElement = document.getElementById("weatherLocation");
      const iconElement = document.getElementById("weatherIcon");

      if (data.error) {
        console.error("Error fetching weather data:", data.error);
        return;
      }

      temperatureElement.textContent = data.current.temp_c + "°C";
      locationElement.textContent = data.location.name;

      const weatherIcons = {
        clear: "../css/weather-icons/sunny.png",
        sunny: "../css/weather-icons/sunny.png",
        cloudy: "../css/weather-icons/cloudy.png",
        overcast: "../css/weather-icons/overcast.png",
        "light drizzle": "../css/weather-icons/rain.png",
        rain: "../css/weather-icons/rain.png",
        snow: "../css/weather-icons/snow.png",
        thunderstorm: "../css/weather-icons/thunderstorm.png",
        fog: "../css/weather-icons/fog.png",
        windy: "../css/weather-icons/windy.png",
        downpour: "../css/weather-icons/downpour.png",
        hail: "../css/weather-icons/hail.png",
        dust: "../css/weather-icons/dust.png",
        sandstorm: "../css/weather-icons/sandstorm.png",
        hurricane: "../css/weather-icons/hurricane.png",
        typhoon: "../css/weather-icons/typhoon.png",
      };

      const weatherCondition = data.current.condition.text.toLowerCase();

      if (!weatherCondition) {
        fetchWeatherByLocation();
      }

      for (const condition in weatherIcons) {
        if (weatherCondition.includes(condition)) {
          iconElement.src = weatherIcons[condition];
          iconElement.alt = weatherCondition;
          return;
        }
      }

      iconElement.src = `https:${data.current.condition.icon}`;
      iconElement.alt = weatherCondition;
      return;
    }

    fetchWeatherByLocation();
  });
}
