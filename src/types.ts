export interface CurrentWeather {
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  wind_direction: number; // degrees
  pressure: number;
  description: string;
  conditionCode: string; // "clear" | "clouds" | "rain" | "snow" | "drizzle" | "thunderstorm" | "mist"
  temp_min: number;
  temp_max: number;
  uv_index: number;
  sunrise: string;
  sunset: string;
  visibility: number; // km
  cloud_cover: number; // %
  precipitation: number; // mm
  dew_point: number; // °C
}

export interface HourlyForecast {
  time: string; // "14:00"
  temp: number;
  conditionCode: string;
  description: string;
  precipProb: number; // %
  humidity: number; // %
  wind_speed: number; // m/s
}

export interface ForecastDay {
  date: string;
  dayName: string; // Russian abbreviation: Пн, Вт, Ср, Чт, Пт, Сб, Вс
  temp_day: number;
  temp_night: number;
  description: string;
  conditionCode: string;
  precipitation_sum: number; // mm
  uv_index: number;
}

export interface WeatherData {
  city: string;
  country: string;
  current: CurrentWeather;
  forecast: ForecastDay[];
  hourly: HourlyForecast[];
}

export interface CitySuggestion {
  name: string;
  country: string;
  state?: string;
}
