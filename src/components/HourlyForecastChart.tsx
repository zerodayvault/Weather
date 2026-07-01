import React, { useRef } from "react";
import { Clock, Droplets, Wind, ArrowUp } from "lucide-react";
import { HourlyForecast } from "../types";
import WeatherIcon from "./WeatherIcon";

interface HourlyForecastChartProps {
  hourly: HourlyForecast[];
  unit: "C" | "F";
}

export default function HourlyForecastChart({ hourly, unit }: HourlyForecastChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  if (!hourly || hourly.length === 0) return null;

  // Convert Celsius to Fahrenheit if unit is 'F'
  const getTemp = (celsius: number) => {
    if (unit === "F") {
      return Math.round((celsius * 9) / 5 + 32);
    }
    return Math.round(celsius);
  };

  const temps = hourly.map((h) => getTemp(h.temp));
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const tempRange = maxTemp - minTemp || 1;

  // Chart layout dimensions
  const colWidth = 70;
  const chartHeight = 90;
  const topPadding = 20;
  const bottomPadding = 15;
  const svgWidth = hourly.length * colWidth;

  // Calculate coordinates for SVG line
  const points = hourly.map((h, i) => {
    const x = i * colWidth + colWidth / 2;
    const tempVal = getTemp(h.temp);
    // Inverse Y so higher temp is higher on screen
    const ratio = (tempVal - minTemp) / tempRange;
    const y = chartHeight - (ratio * (chartHeight - topPadding - bottomPadding) + bottomPadding);
    return { x, y, temp: tempVal, ...h };
  });

  // Construct path string for SVG curve
  let linePath = "";
  let areaPath = "";

  if (points.length > 0) {
    // Simple line path or cubic bezier approximation
    linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      // Control points for smooth bezier
      const cpX1 = points[i - 1].x + colWidth / 2;
      const cpY1 = points[i - 1].y;
      const cpX2 = points[i].x - colWidth / 2;
      const cpY2 = points[i].y;
      linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i].x} ${points[i].y}`;
    }

    // Build closing path for the gradient fill underneath
    areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;
  }

  return (
    <div 
      className="p-6 sm:p-8 glass-card rounded-[40px] shadow-2xl relative overflow-hidden theme-transition"
      id="hourly-forecast-card"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Clock className="w-4.5 h-4.5" />
          Почасовой прогноз (24 ч)
        </h3>
        <div className="flex gap-4 text-xs text-slate-400 font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1">
            <Droplets className="w-3.5 h-3.5 text-sky-400" /> Вероятность осадков
          </span>
        </div>
      </div>

      {/* Scrollable Timeline with Edge Shadows and Touch Guides */}
      <div className="relative" id="hourly-timeline-wrapper">
        {/* Left Fade Mask */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-100/30 to-transparent dark:from-slate-900/10 dark:to-transparent z-10 pointer-events-none rounded-l-3xl"></div>
        {/* Right Fade Mask */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-100/30 to-transparent dark:from-slate-900/10 dark:to-transparent z-10 pointer-events-none rounded-r-3xl"></div>

        <div 
          ref={containerRef}
          className="overflow-x-auto scrollbar-none relative rounded-3xl cursor-grab active:cursor-grabbing select-none"
          id="hourly-scroll-container"
        >
        <div className="flex flex-col" style={{ width: `${svgWidth}px` }}>
          
          {/* Top Row: Time, Icons, Descriptions */}
          <div className="flex justify-between items-center text-center">
            {hourly.map((item, index) => (
              <div key={index} className="flex flex-col items-center justify-center group/item" style={{ width: `${colWidth}px` }}>
                <span className="text-xs font-extrabold text-slate-450 dark:text-slate-400 mb-2">
                  {item.time}
                </span>
                <div className="p-2.5 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/20 dark:border-white/5 rounded-2xl group-hover/item:scale-110 group-hover/item:bg-blue-500/10 dark:group-hover/item:bg-blue-500/20 transition-all duration-300">
                  <WeatherIcon conditionCode={item.conditionCode} className="w-8 h-8" />
                </div>
              </div>
            ))}
          </div>

          {/* SVG Inline Chart Area */}
          <div className="relative my-4" style={{ height: `${chartHeight}px` }}>
            <svg 
              className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible"
              viewBox={`0 0 ${svgWidth} ${chartHeight}`}
              width={svgWidth}
              height={chartHeight}
            >
              <defs>
                {/* Theme dependent gradient fills */}
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(14, 165, 233)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="rgb(14, 165, 233)" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="50%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#f472b6" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1={chartHeight - 1} x2={svgWidth} y2={chartHeight - 1} stroke="rgba(148, 163, 184, 0.12)" strokeWidth="1" />
              <line x1="0" y1={topPadding} x2={svgWidth} y2={topPadding} stroke="rgba(148, 163, 184, 0.06)" strokeWidth="1" strokeDasharray="3 3" />

              {/* Area Under Curve */}
              {areaPath && <path d={areaPath} fill="url(#areaGradient)" />}

              {/* Temperature Curve */}
              {linePath && (
                <path 
                  d={linePath} 
                  fill="none" 
                  stroke="url(#lineGradient)" 
                  strokeWidth="4" 
                  strokeLinecap="round" 
                />
              )}

              {/* Interaction points & Temperature values */}
              {points.map((pt, i) => (
                <g key={i}>
                  {/* Subtle vertical dotted grid lines */}
                  <line 
                    x1={pt.x} 
                    y1={pt.y + 6} 
                    x2={pt.x} 
                    y2={chartHeight} 
                    stroke="rgba(148, 163, 184, 0.15)" 
                    strokeWidth="1.2" 
                    strokeDasharray="2 3" 
                  />
                  
                  {/* Floating Glowing Dots */}
                  <circle 
                    cx={pt.x} 
                    cy={pt.y} 
                    r="4.5" 
                    fill="#ffffff" 
                    stroke="#0284c7" 
                    strokeWidth="3" 
                    className="drop-shadow-[0_2px_5px_rgba(14,165,233,0.6)]"
                  />
                  
                  {/* Temperature Text Label */}
                  <text 
                    x={pt.x} 
                    y={pt.y - 12} 
                    textAnchor="middle" 
                    fill="currentColor" 
                    className="text-[11px] font-black text-slate-800 dark:text-white font-sans"
                  >
                    {pt.temp}°
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* Bottom Row: Additional Parameters (Precipitation Prob, Wind Speed) */}
          <div className="flex justify-between items-center text-center mt-1">
            {hourly.map((item, index) => (
              <div key={index} className="flex flex-col items-center justify-center gap-1.5" style={{ width: `${colWidth}px` }}>
                {/* Precip Prob */}
                <div className="flex items-center justify-center gap-0.5">
                  <Droplets className={`w-3.5 h-3.5 ${item.precipProb > 0 ? "text-sky-500 fill-sky-400" : "text-slate-400 dark:text-slate-600"}`} />
                  <span className={`text-[10px] font-bold ${item.precipProb > 0 ? "text-sky-500 dark:text-sky-350" : "text-slate-400 dark:text-slate-500"}`}>
                    {item.precipProb}%
                  </span>
                </div>
                {/* Wind speed */}
                <div className="flex items-center justify-center gap-0.5 opacity-80">
                  <Wind className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                  <span className="text-[9px] font-bold text-slate-450 dark:text-slate-400">
                    {item.wind_speed} м/с
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
      
      {/* Scroll indicator text */}
      <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-4 animate-pulse select-none md:hidden">
        Проведите влево/вправо для просмотра 24ч →
      </p>
    </div>
  );
}
