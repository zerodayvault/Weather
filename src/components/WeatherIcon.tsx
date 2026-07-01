import { 
  Sun, 
  Cloud, 
  CloudRain, 
  Snowflake, 
  CloudDrizzle, 
  CloudLightning, 
  CloudFog, 
  HelpCircle 
} from "lucide-react";

interface WeatherIconProps {
  conditionCode: string;
  className?: string;
}

export default function WeatherIcon({ conditionCode, className = "w-6 h-6" }: WeatherIconProps) {
  const code = conditionCode.toLowerCase().trim();

  switch (code) {
    case "clear":
      return <Sun className={`${className} text-amber-500`} id="icon-sun" />;
    case "clouds":
      return <Cloud className={`${className} text-slate-400`} id="icon-cloud" />;
    case "rain":
      return <CloudRain className={`${className} text-blue-400`} id="icon-rain" />;
    case "snow":
      return <Snowflake className={`${className} text-sky-200`} id="icon-snow" />;
    case "drizzle":
      return <CloudDrizzle className={`${className} text-blue-300`} id="icon-drizzle" />;
    case "thunderstorm":
      return <CloudLightning className={`${className} text-indigo-500`} id="icon-thunder" />;
    case "mist":
    case "fog":
    case "haze":
      return <CloudFog className={`${className} text-teal-300`} id="icon-mist" />;
    default:
      return <HelpCircle className={`${className} text-slate-400`} id="icon-unknown" />;
  }
}
