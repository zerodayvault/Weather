import { Heart, X, Globe } from "lucide-react";

interface SavedLocationsProps {
  saved: string[];
  activeCity: string;
  onSelect: (city: string) => void;
  onRemove: (city: string) => void;
}

export default function SavedLocations({ saved, activeCity, onSelect, onRemove }: SavedLocationsProps) {
  if (saved.length === 0) {
    return (
      <div className="text-center p-4 bg-slate-100/50 dark:bg-slate-800/10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700/50" id="saved-empty-state">
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
          У вас пока нет сохраненных городов. Нажмите ❤ на главном экране погоды.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3" id="saved-locations-section">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
        <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 shrink-0" />
        <span>Избранные локации</span>
      </div>

      <div className="flex flex-wrap gap-2" id="saved-locations-list">
        {saved.map((city, index) => {
          const isActive = city.toLowerCase().trim() === activeCity.toLowerCase().trim();
          return (
            <div
              key={`${city}-${index}`}
              id={`saved-chip-${index}`}
              className={`group flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full border transition-all text-xs font-extrabold cursor-pointer theme-transition uppercase tracking-wider ${
                isActive
                  ? "bg-gradient-to-tr from-blue-500 to-indigo-600 border-transparent text-white shadow-md shadow-blue-500/20"
                  : "bg-slate-100/80 dark:bg-slate-800/80 border-slate-200/60 dark:border-white/10 text-slate-650 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-200 dark:hover:bg-slate-700/80"
              }`}
              onClick={() => onSelect(city)}
            >
              <Globe className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-white" : "text-slate-400 dark:text-slate-500"}`} />
              <span>{city}</span>
              <button
                type="button"
                id={`delete-saved-${index}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(city);
                }}
                className={`p-1 rounded-full transition-all shrink-0 ${
                  isActive
                    ? "hover:bg-indigo-600 text-white/80 hover:text-white"
                    : "text-slate-400 hover:text-red-500 dark:text-slate-450 dark:hover:text-red-400"
                }`}
                title="Удалить из избранного"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
