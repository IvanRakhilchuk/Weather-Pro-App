const API_KEY = "5360954731f2bab43fac92027d3ee405";

const weatherForm = document.getElementById("weatherForm");
const cityInput = document.getElementById("cityInput");
const message = document.getElementById("message");
const clearBtn = document.getElementById("clearBtn");
const locationBtn = document.getElementById("locationBtn");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

const weatherSection = document.getElementById("weatherSection");
const cityName = document.getElementById("cityName");
const weatherDesc = document.getElementById("weatherDesc");
const weatherIcon = document.getElementById("weatherIcon");
const temperature = document.getElementById("temperature");
const feelsLike = document.getElementById("feelsLike");
const windSpeed = document.getElementById("windSpeed");
const humidity = document.getElementById("humidity");
const pressure = document.getElementById("pressure");
const visibility = document.getElementById("visibility");
const forecastList = document.getElementById("forecastList");
const historyList = document.getElementById("historyList");

let searchHistory = JSON.parse(localStorage.getItem("weatherHistory")) || [];

function showMessage(text, type = "") {
  message.className = "message-box";
  if (type) {
    message.classList.add(type);
  }
  message.innerHTML = `<span>${text}</span>`;
}

function clearForm() {
  cityInput.value = "";
}

function formatVisibility(meters) {
  return `${(meters / 1000).toFixed(1)} км`;
}

function formatWind(speed) {
  return `${speed} м/с`;
}

function formatPressure(value) {
  return `${value} hPa`;
}

function getIconUrl(iconCode) {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

function getDayName(dateText) {
  const days = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  const date = new Date(dateText);
  return days[date.getDay()];
}

function saveHistory() {
  localStorage.setItem("weatherHistory", JSON.stringify(searchHistory));
}

function renderHistory() {
  historyList.innerHTML = "";

  if (searchHistory.length === 0) {
    historyList.innerHTML = `<div class="empty-state">Історія поки порожня</div>`;
    return;
  }

  searchHistory.forEach((item) => {
    const div = document.createElement("div");
    div.className = "history-item";

    div.innerHTML = `
      <div class="history-city">${item.city}</div>
      <div class="history-meta">Останній пошук: ${item.time}</div>
    `;

    div.addEventListener("click", () => {
      cityInput.value = item.city;
      fetchWeatherByCity(item.city);
    });

    historyList.appendChild(div);
  });
}

function addToHistory(city) {
  const now = new Date().toLocaleString("uk-UA");

  searchHistory = searchHistory.filter(
    (item) => item.city.toLowerCase() !== city.toLowerCase()
  );

  searchHistory.unshift({
    city,
    time: now
  });

  if (searchHistory.length > 8) {
    searchHistory = searchHistory.slice(0, 8);
  }

  saveHistory();
  renderHistory();
}

function renderCurrentWeather(data) {
  cityName.textContent = `${data.name}, ${data.sys.country}`;
  weatherDesc.textContent = data.weather[0].description;
  weatherIcon.src = getIconUrl(data.weather[0].icon);
  weatherIcon.alt = data.weather[0].description;

  temperature.textContent = Math.round(data.main.temp);
  feelsLike.textContent = Math.round(data.main.feels_like);
  windSpeed.textContent = formatWind(data.wind.speed);
  humidity.textContent = `${data.main.humidity}%`;
  pressure.textContent = formatPressure(data.main.pressure);
  visibility.textContent = formatVisibility(data.visibility || 0);

  weatherSection.classList.remove("hidden");
}

function getFiveDayForecastItems(list) {
  const filtered = list.filter((item) => item.dt_txt.includes("12:00:00"));
  return filtered.slice(0, 5);
}

function renderForecast(data) {
  forecastList.innerHTML = "";

  const items = getFiveDayForecastItems(data.list);

  items.forEach((item) => {
    const article = document.createElement("article");
    article.className = "forecast-item";

    article.innerHTML = `
      <div class="forecast-day">${getDayName(item.dt_txt)}</div>
      <img src="${getIconUrl(item.weather[0].icon)}" alt="${item.weather[0].description}">
      <div class="forecast-temp">${Math.round(item.main.temp)}°C</div>
      <div class="forecast-desc">${item.weather[0].description}</div>
    `;

    forecastList.appendChild(article);
  });
}

async function getJsonOrThrow(url) {
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Помилка запиту до сервера");
  }

  return data;
}

async function fetchWeatherByCity(city) {
  const trimmedCity = city.trim();

  if (!trimmedCity) {
    showMessage("Введи назву міста", "error");
    weatherSection.classList.add("hidden");
    return;
  }

  try {
    showMessage("Завантаження погоди...", "loading");

    const currentUrl =
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(trimmedCity)}&appid=${API_KEY}&units=metric&lang=ua`;

    const forecastUrl =
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(trimmedCity)}&appid=${API_KEY}&units=metric&lang=ua`;

    const currentData = await getJsonOrThrow(currentUrl);
    const forecastData = await getJsonOrThrow(forecastUrl);

    renderCurrentWeather(currentData);
    renderForecast(forecastData);
    addToHistory(currentData.name);

    showMessage(`Погода для міста ${currentData.name} успішно завантажена`, "success");
  } catch (error) {
  weatherSection.classList.add("hidden");
  showMessage(error.message, "error");
}
}

async function fetchWeatherByCoords(lat, lon) {
  try {
    showMessage("Завантаження погоди за геолокацією...", "loading");

    const currentUrl =
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ua`;

    const forecastUrl =
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ua`;

    const currentData = await getJsonOrThrow(currentUrl);
    const forecastData = await getJsonOrThrow(forecastUrl);

    renderCurrentWeather(currentData);
    renderForecast(forecastData);
    addToHistory(currentData.name);

    showMessage(`Погода за геолокацією успішно завантажена`, "success");
  } catch (error) {
    weatherSection.classList.add("hidden");
    showMessage(`Помилка: ${error.message}`, "error");
  }
}

weatherForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await fetchWeatherByCity(cityInput.value);
});

locationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showMessage("Геолокація не підтримується у твоєму браузері", "error");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      fetchWeatherByCoords(latitude, longitude);
    },
    () => {
      showMessage("Не вдалося отримати геолокацію", "error");
    }
  );
});

clearBtn.addEventListener("click", () => {
  clearForm();
  weatherSection.classList.add("hidden");
  forecastList.innerHTML = "";
  showMessage("Введи місто або використай геолокацію");
});

clearHistoryBtn.addEventListener("click", () => {
  searchHistory = [];
  saveHistory();
  renderHistory();
});

renderHistory();