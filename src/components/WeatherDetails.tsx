import { 
  Droplets, 
  Wind, 
  Thermometer, 
  Compass, 
  Sun, 
  Sunrise, 
  Sunset,
  Eye,
  Cloud,
  CloudRain
} from "lucide-react";
import { CurrentWeather } from "../types";

interface WeatherDetailsProps {
  current: CurrentWeather;
  unit: "C" | "F";
}

export default function WeatherDetails({ current, unit }: WeatherDetailsProps) {
  // Convert Celsius to Fahrenheit if unit is 'F'
  const formatTemp = (celsius: number) => {
    if (unit === "F") {
      return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    }
    return `${Math.round(celsius)}°C`;
  };

  // Convert hPa to mm Hg (standard pressure unit in Russia)
  const pressureInMmHg = Math.round(current.pressure * 0.750062);

  // Convert wind direction degrees to Russian cardinal directions
  const getWindDirectionName = (deg: number) => {
    const directions = ["С", "СВ", "В", "ЮВ", "Ю", "ЮЗ", "З", "СЗ"];
    const index = Math.round(((deg % 360) / 45)) % 8;
    return `${directions[index]} (${deg}°)`;
  };

  const details = [
    {
      id: "detail-feels-like",
      icon: <Thermometer className="w-5 h-5 text-amber-500" />,
      label: "Ощущается как",
      value: formatTemp(current.feels_like),
      desc: `Макс: ${formatTemp(current.temp_max)}, Мин: ${formatTemp(current.temp_min)}`,
      span: "col-span-1",
      glowColor: "group-hover:bg-amber-500/10"
    },
    {
      id: "detail-wind",
      icon: <Wind className="w-5 h-5 text-sky-500" />,
      label: "Ветер",
      value: `${current.wind_speed} м/с`,
      desc: `Направление: ${getWindDirectionName(current.wind_direction)}`,
      span: "col-span-1 md:col-span-2",
      glowColor: "group-hover:bg-sky-500/10"
    },
    {
      id: "detail-humidity",
      icon: <Droplets className="w-5 h-5 text-blue-500" />,
      label: "Влажность",
      value: `${current.humidity}%`,
      desc: current.humidity < 40 ? "Сухо" : current.humidity > 70 ? "Влажно" : "Комфортно",
      span: "col-span-1",
      glowColor: "group-hover:bg-blue-500/10"
    },
    {
      id: "detail-pressure",
      icon: <Compass className="w-5 h-5 text-emerald-500" />,
      label: "Давление",
      value: `${pressureInMmHg} мм`,
      desc: `${current.pressure} гПа`,
      span: "col-span-1",
      glowColor: "group-hover:bg-emerald-500/10"
    },
    {
      id: "detail-uv",
      icon: <Sun className="w-5 h-5 text-yellow-500" />,
      label: "УФ-Индекс",
      value: String(current.uv_index),
      desc: current.uv_index <= 2 ? "Низкий" : current.uv_index <= 5 ? "Умеренный" : "Высокий",
      span: "col-span-1",
      glowColor: "group-hover:bg-yellow-500/10"
    },
    {
      id: "detail-sun-time",
      icon: <Sunrise className="w-5 h-5 text-orange-400" />,
      label: "Восход / Закат",
      value: current.sunrise,
      desc: `Закат в ${current.sunset}`,
      span: "col-span-1 md:col-span-2",
      glowColor: "group-hover:bg-orange-500/10"
    },
    {
      id: "detail-visibility",
      icon: <Eye className="w-5 h-5 text-indigo-400" />,
      label: "Видимость",
      value: `${current.visibility} км`,
      desc: current.visibility > 8 ? "Отличная" : "Сниженная",
      span: "col-span-1",
      glowColor: "group-hover:bg-indigo-500/10"
    },
    {
      id: "detail-clouds",
      icon: <Cloud className="w-5 h-5 text-purple-400" />,
      label: "Облачность",
      value: `${current.cloud_cover}%`,
      desc: current.cloud_cover < 20 ? "Ясно" : current.cloud_cover < 60 ? "Переменная" : "Пасмурно",
      span: "col-span-1",
      glowColor: "group-hover:bg-purple-500/10"
    },
    {
      id: "detail-precipitation",
      icon: <CloudRain className="w-5 h-5 text-cyan-400" />,
      label: "Осадки / Т. Росы",
      value: `${current.precipitation} мм`,
      desc: `Точка росы: ${formatTemp(current.dew_point)}`,
      span: "col-span-2 md:col-span-2",
      glowColor: "group-hover:bg-cyan-500/10"
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6" id="weather-details-grid">
      {details.map((detail) => (
        <div
          key={detail.id}
          id={detail.id}
          className={`p-4 sm:p-6 glass-card rounded-[24px] sm:rounded-[28px] flex flex-col justify-between theme-transition shadow-md hover:shadow-xl hover:scale-[1.015] active:scale-[0.99] transition-all duration-300 relative overflow-hidden group ${detail.span}`}
        >
          {/* Subtle background glow effect on hover */}
          <div className={`absolute -right-8 -bottom-8 w-24 h-24 rounded-full blur-2xl transition-all duration-500 pointer-events-none ${detail.glowColor || "group-hover:bg-blue-500/5"}`}></div>

          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-slate-100/60 dark:bg-white/5 border border-slate-200/20 dark:border-white/5 text-slate-700 dark:text-slate-300 shrink-0 transition-transform group-hover:scale-110 duration-350">
              {detail.icon}
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">
              {detail.label}
            </span>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white font-sans tracking-tight block">
              {detail.value}
            </span>
            <p className="text-xs text-slate-450 dark:text-slate-400 mt-1.5 font-semibold line-clamp-1">
              {detail.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
