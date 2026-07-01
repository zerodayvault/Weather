import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { ForecastDay } from "../types";
import WeatherIcon from "./WeatherIcon";

interface ForecastSectionProps {
  forecast: ForecastDay[];
  unit: "C" | "F";
}

export default function ForecastSection({ forecast, unit }: ForecastSectionProps) {
  const [showAllSeven, setShowAllSeven] = useState(false);

  // Helper to format temp
  const formatTemp = (temp: number) => {
    if (unit === "F") {
      return `${Math.round((temp * 9) / 5 + 32)}°`;
    }
    return `${Math.round(temp)}°`;
  };

  const getFullDayName = (dayName: string) => {
    const names: Record<string, string> = {
      "Пн": "Понедельник",
      "Вт": "Вторник",
      "Ср": "Среда",
      "Чт": "Четверг",
      "Пт": "Пятница",
      "Сб": "Суббота",
      "Вс": "Воскресенье",
    };
    return names[dayName] || dayName;
  };

  // 3-day subset
  const threeDayForecast = forecast.slice(0, 3);

  // 7-day subset
  const sevenDayForecast = forecast.slice(0, 7);

  // Calculate global min and max temp in forecast to scale temperature range bars
  const temps = forecast.map(d => [d.temp_day, d.temp_night]).flat();
  const globalMin = Math.min(...temps);
  const globalMax = Math.max(...temps);
  const globalRange = globalMax - globalMin || 1;

  // Render a nice visual temperature progress bar, like in iOS Weather app
  const renderTempBar = (min: number, max: number) => {
    const leftPercent = ((min - globalMin) / globalRange) * 100;
    const widthPercent = ((max - min) / globalRange) * 100;

    return (
      <div className="relative w-28 h-2.5 bg-slate-200/40 dark:bg-slate-850/60 rounded-full overflow-hidden shrink-0 border border-slate-100/10">
        <div
          className="absolute h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-amber-400"
          style={{
            left: `${Math.max(0, leftPercent)}%`,
            width: `${Math.max(12, widthPercent)}%`,
          }}
        />
        {/* Subtle dot helper on current relative position */}
        <div className="absolute top-1/2 left-[50%] -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full border border-sky-500 shadow-sm pointer-events-none opacity-40"></div>
      </div>
    );
  };

  return (
    <div className="space-y-6" id="forecast-section">
      {/* 3-Day Forecast Section */}
      <div>
        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Calendar className="w-4.5 h-4.5" />
          Прогноз на 3 дня
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="three-day-grid">
          {threeDayForecast.map((day, index) => (
            <motion.div
              key={day.date}
              id={`three-day-card-${index}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="p-6 glass-card rounded-[32px] flex sm:flex-col items-center justify-between sm:justify-center text-center theme-transition shadow-md hover:shadow-xl hover:scale-[1.015] active:scale-[0.99] transition-all duration-300 relative overflow-hidden group"
            >
              {/* Card micro-glow */}
              <div className="absolute -right-12 -bottom-12 w-28 h-28 bg-blue-500/5 dark:bg-sky-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none"></div>

              <div className="text-left sm:text-center">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest">
                  {index === 0 ? "Сегодня" : index === 1 ? "Завтра" : getFullDayName(day.dayName)}
                </span>
                <p className="text-sm font-black text-slate-800 dark:text-white sm:mt-0.5 font-sans">
                  {new Date(day.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                </p>
              </div>

              <div className="my-0 sm:my-3.5 flex items-center gap-3 sm:flex-col">
                <WeatherIcon conditionCode={day.conditionCode} className="w-12 h-12 drop-shadow-[0_4px_6px_rgba(0,0,0,0.05)]" />
                <span className="text-[11px] text-slate-550 dark:text-slate-400 max-w-[130px] line-clamp-1 capitalize sm:mt-1 font-bold leading-relaxed">
                  {day.description}
                </span>
              </div>

              <div className="text-right sm:text-center">
                <span className="text-lg font-black text-slate-800 dark:text-white font-sans tracking-tight">
                  {formatTemp(day.temp_day)}
                </span>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 ml-2">
                  {formatTemp(day.temp_night)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 7-Day Extended Forecast Toggle */}
      <div className="pt-2">
        <button
          onClick={() => setShowAllSeven(!showAllSeven)}
          id="toggle-extended-forecast-btn"
          className="w-full py-3 bg-slate-100/80 hover:bg-slate-200/50 dark:bg-slate-900/40 dark:hover:bg-slate-900/60 border border-slate-200/40 dark:border-white/5 rounded-full flex items-center justify-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-350 hover:text-slate-800 dark:hover:text-white transition-all uppercase tracking-widest active:scale-[0.98] shadow-sm"
        >
          {showAllSeven ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Скрыть подробный прогноз на 7 дней
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Показать подробный прогноз на 7 дней
            </>
          )}
        </button>

        <AnimatePresence>
          {showAllSeven && (
            <motion.div
              id="extended-7day-section"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mt-4 glass-card rounded-[32px] p-4 sm:p-6"
            >
              <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
                Прогноз на 7 дней
              </h4>

              <div className="divide-y divide-slate-100 dark:divide-slate-700/50" id="extended-forecast-list">
                {sevenDayForecast.map((day, idx) => (
                  <div
                    key={`seven-day-${day.date}`}
                    id={`seven-day-row-${idx}`}
                    className="py-3.5 flex items-center justify-between gap-4 text-sm"
                  >
                    {/* Day name */}
                    <div className="w-24 font-bold text-slate-700 dark:text-slate-300">
                      {getFullDayName(day.dayName)}
                      <span className="block text-xs text-slate-400 dark:text-slate-500 font-normal mt-0.5">
                        {new Date(day.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                      </span>
                    </div>

                    {/* Condition Icon + Label */}
                    <div className="flex-1 flex items-center gap-3">
                      <WeatherIcon conditionCode={day.conditionCode} className="w-8 h-8 shrink-0" />
                      <span className="text-xs text-slate-500 dark:text-slate-400 capitalize hidden sm:inline font-medium max-w-[150px] truncate">
                        {day.description}
                      </span>
                    </div>

                    {/* Temp visual range bar */}
                    <div className="hidden xs:flex items-center gap-3">
                      <span className="text-xs text-slate-400 font-semibold">{formatTemp(day.temp_night)}</span>
                      {renderTempBar(day.temp_night, day.temp_day)}
                      <span className="text-xs text-slate-700 dark:text-slate-300 font-bold w-6 text-right">{formatTemp(day.temp_day)}</span>
                    </div>

                    {/* Simple fallback mobile temperature display */}
                    <div className="xs:hidden text-right font-semibold">
                      <span className="text-slate-800 dark:text-slate-100 font-bold">{formatTemp(day.temp_day)}</span>
                      <span className="text-slate-400 dark:text-slate-500 ml-2 text-xs">{formatTemp(day.temp_night)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
