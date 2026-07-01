import { WeatherData, CitySuggestion } from "../types";

// Helper to map WMO weather interpretation codes to condition code
function mapWmoCondition(code: number): string {
  if (code === 0) return "clear";
  if (code >= 1 && code <= 3) return "clouds";
  if (code === 45 || code === 48) return "mist";
  if (code >= 51 && code <= 57) return "drizzle";
  if (code >= 61 && code <= 67) return "rain";
  if (code >= 80 && code <= 82) return "rain"; // rain showers
  if (code >= 71 && code <= 77) return "snow";
  if (code >= 85 && code <= 86) return "snow"; // snow showers
  if (code >= 95 && code <= 99) return "thunderstorm";
  return "clouds";
}

// Helper to map WMO weather interpretation codes to Russian weather description
function getWmoDescription(code: number): string {
  const mapping: Record<number, string> = {
    0: "ясно",
    1: "преимущественно ясно",
    2: "переменная облачность",
    3: "пасмурно",
    45: "туман",
    48: "туман с изморозью",
    51: "легкая морось",
    53: "умеренная морось",
    55: "интенсивная морось",
    56: "слабая ледяная морось",
    57: "интенсивная ледяная морось",
    61: "слабый дождь",
    63: "умеренный дождь",
    65: "сильный дождь",
    66: "слабый замерзающий дождь",
    67: "сильный замерзающий дождь",
    71: "слабый снегопад",
    73: "умеренный снегопад",
    75: "сильный снегопад",
    77: "снежные зерна",
    80: "слабый ливневый дождь",
    81: "умеренный ливневый дождь",
    82: "сильный ливневый дождь",
    85: "слабый ливневый снегопад",
    86: "сильный ливневый снегопад",
    95: "слабая или умеренная гроза",
    96: "гроза с небольшим градом",
    99: "сильная гроза с градом"
  };
  return mapping[code] || "переменная облачность";
}

// Format ISO8601 time string to HH:MM (local time representation)
function formatIsoTime(isoStr: string): string {
  if (!isoStr || !isoStr.includes("T")) return "--:--";
  return isoStr.split("T")[1].substring(0, 5);
}

// Helper to format Date to standard ISO string date and Russian day names
function getRussianDayName(dateStr: string): string {
  const days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  const d = new Date(dateStr);
  return days[d.getDay()] || "Ср";
}

// Check if IP is from Russia and prompt for VPN
async function checkVpnRequired(): Promise<void> {
  try {
    const res = await fetch("https://api.country.is/");
    if (res.ok) {
      const data = await res.json();
      if (data.country === "RU" || data.country === "BY") {
        throw new Error("К сожалению в вашем регионе проблемы с доступом к метеоданным. Пожалуйста, включите VPN для обхода блокировки.");
      }
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("VPN")) {
      throw err;
    }
    // Ignore other country check errors
  }
}

export async function fetchAutocompleteFromClient(query: string): Promise<CitySuggestion[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  await checkVpnRequired();

  const trimmedQuery = query.trim();
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmedQuery)}&count=10&language=ru&format=json`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("К сожалению в вашем регионе проблемы с доступом к метеоданным. Пожалуйста, включите VPN для обхода блокировки.");
  }
  
  const data = await response.json();
  if (data.results && Array.isArray(data.results)) {
    return data.results.map((item: any) => ({
      name: item.name,
      country: item.country_code ? item.country_code.toUpperCase() : "??",
      state: item.admin1 || ""
    }));
  }

  return [];
}

// Client-side Direct Fetch for Weather details
export async function fetchWeatherFromClient(city: string): Promise<WeatherData> {
  await checkVpnRequired();

  // Step A: Geocode city name to get lat and lon
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city.trim())}&count=1&language=ru&format=json`;
  const geoRes = await fetch(geoUrl);
  if (!geoRes.ok) {
    throw new Error("К сожалению в вашем регионе проблемы с доступом к метеоданным. Пожалуйста, включите VPN для обхода блокировки.");
  }

  const geoData = await geoRes.json();
  if (!geoData.results || geoData.results.length === 0) {
    throw new Error(`Город "${city}" не найден`);
  }

  const matchedCity = geoData.results[0];
  const lat = matchedCity.latitude;
  const lon = matchedCity.longitude;
  const cityName = matchedCity.name;
  const countryCode = matchedCity.country_code ? matchedCity.country_code.toUpperCase() : "??";

  // Step B: Fetch Weather Forecast
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m,cloud_cover,visibility&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum&wind_speed_unit=ms&timezone=auto`;
  const weatherRes = await fetch(weatherUrl);
  if (!weatherRes.ok) {
    throw new Error("К сожалению в вашем регионе проблемы с доступом к метеоданным. Пожалуйста, включите VPN для обхода блокировки.");
  }

  const weatherData = await weatherRes.json();
  const currentObj = weatherData.current;
  const dailyObj = weatherData.daily;
  const hourlyObj = weatherData.hourly;

  if (!currentObj || !dailyObj) {
    throw new Error("Неверный формат данных погоды");
  }

  // Calculate dew point: T - (100 - RH) / 5
  const calculatedDewPoint = Math.round(currentObj.temperature_2m - ((100 - currentObj.relative_humidity_2m) / 5));

  const currentMerged = {
    temp: Math.round(currentObj.temperature_2m),
    feels_like: Math.round(currentObj.apparent_temperature),
    humidity: Math.round(currentObj.relative_humidity_2m),
    wind_speed: Math.round(currentObj.wind_speed_10m * 10) / 10,
    wind_direction: Math.round(currentObj.wind_direction_10m || 0),
    pressure: Math.round(currentObj.pressure_msl),
    description: getWmoDescription(currentObj.weather_code),
    conditionCode: mapWmoCondition(currentObj.weather_code),
    temp_min: Math.round(dailyObj.temperature_2m_min[0]),
    temp_max: Math.round(dailyObj.temperature_2m_max[0]),
    uv_index: dailyObj.uv_index_max ? Math.round(dailyObj.uv_index_max[0]) : 3,
    sunrise: formatIsoTime(dailyObj.sunrise[0]),
    sunset: formatIsoTime(dailyObj.sunset[0]),
    visibility: currentObj.visibility ? Math.round(currentObj.visibility / 1000) : 10,
    cloud_cover: Math.round(currentObj.cloud_cover || 0),
    precipitation: Math.round((currentObj.precipitation || 0) * 10) / 10,
    dew_point: calculatedDewPoint
  };

  const forecastMerged = dailyObj.time.map((timeStr: string, index: number) => {
    return {
      date: timeStr,
      dayName: getRussianDayName(timeStr),
      temp_day: Math.round(dailyObj.temperature_2m_max[index]),
      temp_night: Math.round(dailyObj.temperature_2m_min[index]),
      description: getWmoDescription(dailyObj.weather_code[index]),
      conditionCode: mapWmoCondition(dailyObj.weather_code[index]),
      precipitation_sum: Math.round((dailyObj.precipitation_sum?.[index] || 0) * 10) / 10,
      uv_index: dailyObj.uv_index_max ? Math.round(dailyObj.uv_index_max[index]) : 3
    };
  });

  let hourlyMerged: any[] = [];
  if (hourlyObj && Array.isArray(hourlyObj.time)) {
    let startIndex = hourlyObj.time.indexOf(currentObj.time);
    if (startIndex === -1) {
      const currentHourStr = currentObj.time.substring(0, 13);
      startIndex = hourlyObj.time.findIndex((t: string) => t.startsWith(currentHourStr));
      if (startIndex === -1) startIndex = 0;
    }

    for (let i = 0; i < 24; i++) {
      const idx = startIndex + i;
      if (idx < hourlyObj.time.length) {
        hourlyMerged.push({
          time: formatIsoTime(hourlyObj.time[idx]),
          temp: Math.round(hourlyObj.temperature_2m[idx]),
          conditionCode: mapWmoCondition(hourlyObj.weather_code[idx]),
          description: getWmoDescription(hourlyObj.weather_code[idx]),
          precipProb: Math.round(hourlyObj.precipitation_probability?.[idx] || 0),
          humidity: Math.round(hourlyObj.relative_humidity_2m?.[idx] || 0),
          wind_speed: Math.round((hourlyObj.wind_speed_10m?.[idx] || 0) * 10) / 10
        });
      }
    }
  }

  return {
    city: cityName,
    country: countryCode,
    current: currentMerged,
    forecast: forecastMerged.slice(0, 7),
    hourly: hourlyMerged
  };
}
