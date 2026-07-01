import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sun, 
  Moon, 
  RefreshCw, 
  Heart, 
  AlertCircle,
  HelpCircle,
  Activity,
  CloudLightning,
  Share2
} from "lucide-react";
import { WeatherData } from "./types";
import { fetchWeatherFromClient } from "./utils/weatherClientFallback";
import SearchAutocomplete from "./components/SearchAutocomplete";
import SavedLocations from "./components/SavedLocations";
import WeatherDetails from "./components/WeatherDetails";
import ForecastSection from "./components/ForecastSection";
import WeatherIcon from "./components/WeatherIcon";
import HourlyForecastChart from "./components/HourlyForecastChart";

export default function App() {
  const [city, setCity] = useState("Москва");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const weatherCardRef = useRef<HTMLDivElement>(null);
  const [unit, setUnit] = useState<"C" | "F">("C");

  // Load Saved Cities
  const [savedCities, setSavedCities] = useState<string[]>(() => {
    const saved = localStorage.getItem("weather_saved_cities");
    return saved ? JSON.parse(saved) : ["Москва", "Токио", "Париж"];
  });

  // Load and apply Theme
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("weather_theme");
    return (saved as "light" | "dark") || "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("weather_theme", theme);
  }, [theme]);

  // Fetch Weather Data
  const fetchWeather = async (targetCity: string) => {
    setLoading(true);
    setError(null);
    try {
      const isStaticHosting = window.location.hostname.includes("github.io") || 
                              window.location.hostname.includes("github.com") ||
                              (window.location.hostname !== "localhost" && !window.location.port);
      
      if (isStaticHosting) {
        // Direct browser client fetch on static environments like GitHub Pages to avoid hitting a dead /api endpoint
        const data = await fetchWeatherFromClient(targetCity);
        setWeather(data);
        setCity(data.city);
        return;
      }

      try {
        const response = await fetch(`/api/weather?city=${encodeURIComponent(targetCity)}`);
        if (!response.ok) {
          throw new Error("API failed");
        }
        const data: WeatherData = await response.json();
        setWeather(data);
        setCity(data.city);
      } catch (backendErr) {
        // Fallback to client-side direct API if the backend is down, unreachable, or returns an error
        console.warn("Backend API unavailable, falling back to client-side fetching...", backendErr);
        const data = await fetchWeatherFromClient(targetCity);
        setWeather(data);
        setCity(data.city);
      }
    } catch (err: any) {
      setError(err.message || "Произошла непредвиденная ошибка");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    // Try to load first saved city, or fallback to Moscow
    const initialCity = savedCities.length > 0 ? savedCities[0] : "Москва";
    fetchWeather(initialCity);
  }, []);

  // Save/Unsave City Handler
  const handleToggleSave = () => {
    if (!weather) return;
    const currentCity = weather.city;
    let updated: string[];

    if (isSaved(currentCity)) {
      updated = savedCities.filter(c => c.toLowerCase() !== currentCity.toLowerCase());
    } else {
      updated = [currentCity, ...savedCities];
    }

    setSavedCities(updated);
    localStorage.setItem("weather_saved_cities", JSON.stringify(updated));
  };

  const isSaved = (cityName: string) => {
    return savedCities.some(c => c.toLowerCase() === cityName.toLowerCase());
  };

  const handleSelectSaved = (selectedCity: string) => {
    fetchWeather(selectedCity);
  };

  const handleRemoveSaved = (cityToRemove: string) => {
    const updated = savedCities.filter(c => c.toLowerCase() !== cityToRemove.toLowerCase());
    setSavedCities(updated);
    localStorage.setItem("weather_saved_cities", JSON.stringify(updated));
  };

  const formatTemp = (celsius: number) => {
    if (unit === "F") {
      return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    }
    return `${Math.round(celsius)}°C`;
  };

  const formatRawTemp = (celsius: number) => {
    if (unit === "F") {
      return `${Math.round((celsius * 9) / 5 + 32)}°`;
    }
    return `${Math.round(celsius)}°`;
  };

  const handleShare = async () => {
    if (!weather) return;

    const url = window.location.href;
    const shareText = `Погода в городе ${weather.city}: ${formatRawTemp(weather.current.temp)}${unit}, ${weather.current.description}. Смотреть подробнее: ${url}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Погода: ${weather.city}`,
          text: `Погода в городе ${weather.city}: ${formatRawTemp(weather.current.temp)}${unit}, ${weather.current.description}.`,
          url: url,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        setShareMessage("Ссылка скопирована!");
        setTimeout(() => setShareMessage(null), 3000);
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        try {
           await navigator.clipboard.writeText(shareText);
           setShareMessage("Ссылка скопирована!");
           setTimeout(() => setShareMessage(null), 3000);
        } catch (fallbackErr) {
           console.warn("Failed to copy text", fallbackErr);
        }
      }
    }
  };

  return (
    <div 
      className="min-h-screen theme-transition bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-[#0f172a] dark:via-[#131b2e] dark:to-[#1e1b4b] text-slate-800 dark:text-slate-100 flex flex-col px-3 sm:px-6 py-4 sm:py-6 relative overflow-hidden"
      id="app-root"
    >
      {/* Mesh Gradient Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/15 dark:bg-blue-600/30 rounded-full blur-[120px] pointer-events-none animate-float-1"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 dark:bg-purple-600/20 rounded-full blur-[120px] pointer-events-none animate-float-2"></div>
      <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-cyan-400/10 dark:bg-cyan-500/15 rounded-full blur-[100px] pointer-events-none animate-float-1"></div>

      {/* Top Navbar */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between mb-8 relative z-10" id="app-header">
        <div className="flex items-center gap-2.5" id="logo-container">
          <div className="p-2 bg-gradient-to-br from-[#00c6ff] to-[#0072ff] rounded-full shadow-lg shadow-blue-500/30 text-white shrink-0">
            <Sun className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <span className="font-extrabold text-lg tracking-widest font-sans text-slate-800 dark:text-white theme-transition uppercase">
            Oleg Weather
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3" id="header-controls">
          {/* Unit Toggle */}
          <div className="flex items-center bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/80 dark:border-slate-700/80 rounded-2xl p-1 shadow-sm theme-transition">
            <button
              onClick={() => setUnit("C")}
              id="toggle-celsius-btn"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                unit === "C"
                  ? "bg-white/95 dark:bg-slate-600/90 text-blue-600 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              °C
            </button>
            <button
              onClick={() => setUnit("F")}
              id="toggle-fahrenheit-btn"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                unit === "F"
                  ? "bg-white/95 dark:bg-slate-600/90 text-blue-600 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              °F
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            id="toggle-theme-btn"
            className="p-3 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-2xl shadow-sm hover:shadow-md transition-all theme-transition"
            title={theme === "light" ? "Включить темную тему" : "Включить светлую тему"}
          >
            {theme === "light" ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5 text-amber-400" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl w-full mx-auto flex-1 flex flex-col gap-6 relative z-10" id="app-main">
        {/* Search & Suggestions */}
        <SearchAutocomplete onSearch={fetchWeather} />

        {/* Favorite Quick Links */}
        <SavedLocations
          saved={savedCities}
          activeCity={city}
          onSelect={handleSelectSaved}
          onRemove={handleRemoveSaved}
        />

        {/* Loader, Error, or Weather Dashboard */}
        <div className="relative min-h-[300px] flex flex-col justify-center" id="weather-display-container">
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="loading-spinner"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-4 py-12"
                id="loading-spinner"
              >
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-slate-700 dark:text-slate-300">Получение погоды...</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Опрашиваем метеорологические спутники</p>
                </div>
              </motion.div>
            )}

            {!loading && error && (
              <motion.div
                key="error-box"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-6 bg-red-50/80 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-3xl flex flex-col items-center text-center gap-3 max-w-md mx-auto my-12 shadow-sm theme-transition"
                id="error-box"
              >
                <AlertCircle className="w-10 h-10 text-red-500" />
                <div>
                  <h3 className="font-bold text-red-800 dark:text-red-400">Что-то пошло не так</h3>
                  <p className="text-sm text-red-600 dark:text-red-300 mt-1 font-medium">{error}</p>
                </div>
                <button
                  onClick={() => fetchWeather(city)}
                  id="retry-fetch-btn"
                  className="mt-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold text-sm rounded-xl transition-all shadow-sm"
                >
                  Повторить попытку
                </button>
              </motion.div>
            )}

            {!loading && !error && weather && (
              <motion.div
                key="weather-dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
                id="weather-dashboard"
              >
                {/* Current Weather Highlight Card - iOS Apple Weather inspired */}
                <div 
                  id="main-weather-card"
                  ref={weatherCardRef}
                  className="pt-8 sm:pt-10 pb-10 sm:pb-12 px-4 sm:px-10 glass-card rounded-[32px] sm:rounded-[36px] shadow-xl relative overflow-hidden theme-transition border-t-0 flex flex-col items-center justify-center text-center group"
                >
                  {/* Dynamic Apple-style weather background glow */}
                  <div className={`absolute inset-0 opacity-80 dark:opacity-40 transition-all duration-700 ${
                    weather.current.conditionCode.toLowerCase().includes("clear") ? "bg-gradient-to-b from-amber-500/10 via-orange-500/5 to-transparent" :
                    weather.current.conditionCode.toLowerCase().includes("rain") ? "bg-gradient-to-b from-blue-500/15 via-indigo-500/5 to-transparent" :
                    weather.current.conditionCode.toLowerCase().includes("snow") ? "bg-gradient-to-b from-sky-300/20 via-slate-400/5 to-transparent" :
                    weather.current.conditionCode.toLowerCase().includes("thunderstorm") ? "bg-gradient-to-b from-violet-600/20 via-indigo-500/5 to-transparent" :
                    weather.current.conditionCode.toLowerCase().includes("clouds") ? "bg-gradient-to-b from-slate-400/15 via-blue-500/5 to-transparent" :
                    "bg-gradient-to-b from-sky-400/15 via-blue-500/5 to-transparent"
                  }`} />

                  {/* Absolute subtle glowing ambient circle background */}
                  <div className={`absolute -top-32 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-700 animate-float-1 ${
                    weather.current.conditionCode.toLowerCase().includes("clear") ? "bg-amber-400/15 dark:bg-amber-500/10" :
                    weather.current.conditionCode.toLowerCase().includes("rain") ? "bg-blue-500/20 dark:bg-indigo-500/15" :
                    weather.current.conditionCode.toLowerCase().includes("snow") ? "bg-sky-200/25 dark:bg-sky-300/10" :
                    weather.current.conditionCode.toLowerCase().includes("thunder") ? "bg-purple-500/25 dark:bg-purple-600/15" :
                    "bg-blue-400/15 dark:bg-blue-500/10"
                  }`}></div>

                  {/* Top Corner Quick Action Controls */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
                    {/* Favorite toggle on the left */}
                    <button
                      onClick={handleToggleSave}
                      id="favorite-toggle-btn"
                      className="p-2.5 rounded-full bg-white/60 hover:bg-white/80 dark:bg-slate-800/60 dark:hover:bg-slate-700/80 border border-white/60 dark:border-slate-700/50 transition-all group shadow-sm active:scale-95 duration-200"
                      title={isSaved(weather.city) ? "Удалить из избранного" : "Добавить в избранное"}
                    >
                      <Heart 
                        className={`w-4.5 h-4.5 transition-transform group-hover:scale-110 duration-200 ${
                          isSaved(weather.city) 
                            ? "text-rose-500 fill-rose-500" 
                            : "text-slate-500 dark:text-slate-400 hover:text-rose-500"
                        }`} 
                      />
                    </button>

                    {/* Today badge centered on iOS style */}
                    <span className="absolute left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-500/10 dark:bg-slate-800/60 border border-slate-500/10 dark:border-slate-700/50 text-slate-550 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-full select-none shadow-sm backdrop-blur-md">
                      {new Date().toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "short" })}
                    </span>

                    {/* Refresh & Share on the right */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleShare}
                        id="share-weather-btn"
                        className="p-2.5 rounded-full bg-white/60 hover:bg-white/80 dark:bg-slate-800/60 dark:hover:bg-slate-700/80 border border-white/60 dark:border-slate-700/50 text-slate-550 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-sm active:scale-95 transition-all duration-300"
                        title="Поделиться"
                      >
                        <Share2 className="w-4.5 h-4.5" />
                      </button>
                      <button
                        onClick={() => fetchWeather(weather.city)}
                        id="refresh-weather-btn"
                        className="p-2.5 rounded-full bg-white/60 hover:bg-white/80 dark:bg-slate-800/60 dark:hover:bg-slate-700/80 border border-white/60 dark:border-slate-700/50 text-slate-550 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-sm active:scale-95 transition-all duration-300"
                        title="Обновить данные"
                      >
                        <RefreshCw className="w-4.5 h-4.5 active:rotate-180 transition-transform duration-500" />
                      </button>
                    </div>
                  </div>

                  {/* Centered Apple Weather Info */}
                  <div className="relative z-10 flex flex-col items-center mt-6 select-none">
                    {/* Weather Icon badge floating subtle above */}
                    <div className="mb-4 p-4 bg-white/15 dark:bg-slate-900/10 backdrop-blur-md rounded-full border border-white/30 dark:border-white/5 shadow-sm hover:scale-105 transition-transform duration-500">
                      <WeatherIcon conditionCode={weather.current.conditionCode} className="w-12 h-12 drop-shadow-md" />
                    </div>

                    {/* City and Country Info */}
                    <div className="flex flex-col items-center gap-1">
                      <h2 className="text-3xl sm:text-4xl font-semibold text-slate-800 dark:text-white font-sans tracking-tight">
                        {weather.city}
                      </h2>
                      <span className="text-[11px] sm:text-[11px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">
                        {weather.country}
                      </span>
                    </div>

                    {/* Massive Temperature display */}
                    <div className="relative my-2">
                      <span className="text-[72px] sm:text-[98px] font-thin text-slate-800 dark:text-white font-sans tracking-tighter leading-none block pl-3 sm:pl-4">
                        {formatRawTemp(weather.current.temp)}
                      </span>
                    </div>

                    {/* Condition details */}
                    <p className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-200 mt-1 leading-snug">
                      {weather.current.description}
                    </p>

                    {/* High & Low Temp */}
                    <div className="flex items-center gap-2 sm:gap-3 mt-2 text-xs sm:text-base font-bold text-slate-450 dark:text-slate-400">
                      <span>Макс: {formatRawTemp(weather.current.temp_max)}</span>
                      <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-slate-300 dark:bg-slate-750"></span>
                      <span>Мин: {formatRawTemp(weather.current.temp_min)}</span>
                    </div>

                    {/* Feels like */}
                    <span className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-2">
                      Ощущается как {formatRawTemp(weather.current.feels_like)}
                    </span>
                  </div>
                </div>

                {/* Weather Details Grid (Bento) */}
                <WeatherDetails current={weather.current} unit={unit} />

                {/* Hourly Forecast Curve Chart */}
                <HourlyForecastChart hourly={weather.hourly} unit={unit} />

                {/* Forecast section (3 and 7 Days) */}
                <ForecastSection forecast={weather.forecast} unit={unit} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Share Toast */}
      <AnimatePresence>
        {shareMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-bold text-sm rounded-full shadow-2xl z-50 flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            {shareMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="max-w-4xl w-full mx-auto text-center mt-12 mb-4 pt-6 border-t border-slate-100 dark:border-slate-800/50" id="app-footer">
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
          Погода в реальном времени • Oleg Weather © 2026
        </p>
      </footer>
    </div>
  );
}
