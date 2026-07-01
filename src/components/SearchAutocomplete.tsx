import React, { useState, useEffect, useRef } from "react";
import { Search, X, Clock, Trash2, MapPin } from "lucide-react";
import { CitySuggestion } from "../types";
import { fetchAutocompleteFromClient } from "../utils/weatherClientFallback";

interface SearchAutocompleteProps {
  onSearch: (city: string) => void;
}

export default function SearchAutocomplete({ onSearch }: SearchAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Load search history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("weather_search_history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        setHistory([]);
      }
    }
  }, []);

  // Save search history
  const saveToHistory = (cityName: string) => {
    const cleanedCity = cityName.trim();
    if (!cleanedCity) return;

    const updated = [
      cleanedCity,
      ...history.filter((h) => h.toLowerCase() !== cleanedCity.toLowerCase())
    ].slice(0, 5); // Keep last 5

    setHistory(updated);
    localStorage.setItem("weather_search_history", JSON.stringify(updated));
  };

  // Clear search history
  const clearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory([]);
    localStorage.removeItem("weather_search_history");
  };

  // Fetch suggestions with debounce
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsLoading(true);
      try {
        const isStaticHosting = window.location.hostname.includes("github.io") || 
                                window.location.hostname.includes("github.com") ||
                                (window.location.hostname !== "localhost" && !window.location.port);
        
        if (isStaticHosting) {
          const data = await fetchAutocompleteFromClient(query);
          setSuggestions(data);
          return;
        }

        try {
          const response = await fetch(`/api/cities/autocomplete?q=${encodeURIComponent(query)}`);
          if (response.ok) {
            const data = await response.json();
            setSuggestions(data);
          } else {
            throw new Error("API failed");
          }
        } catch (backendErr) {
          // Fallback to client geocoding directly if API is unavailable
          const data = await fetchAutocompleteFromClient(query);
          setSuggestions(data);
        }
      } catch (err) {
        console.error("Error fetching city suggestions:", err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      saveToHistory(query.trim());
      setIsFocused(false);
    }
  };

  const handleSelectSuggestion = (suggestion: CitySuggestion) => {
    const displayCity = suggestion.name;
    setQuery(displayCity);
    onSearch(displayCity);
    saveToHistory(displayCity);
    setIsFocused(false);
  };

  const handleSelectHistory = (city: string) => {
    setQuery(city);
    onSearch(city);
    saveToHistory(city);
    setIsFocused(false);
  };

  const handleClearInput = () => {
    setQuery("");
    setSuggestions([]);
  };

  return (
    <div className="relative w-full max-w-lg mx-auto z-40" ref={containerRef} id="search-container">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center w-full">
          <input
            type="text"
            id="city-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder="Поиск города..."
            className="w-full pl-11 pr-10 py-3 bg-slate-100/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-full shadow-sm focus:bg-white dark:focus:bg-slate-900/95 transition-all focus:outline-none focus:ring-2 focus:ring-slate-300/40 dark:focus:ring-white/20 text-base font-medium theme-transition"
            autoComplete="off"
          />
          <div className="absolute left-4 text-slate-400 dark:text-slate-500">
            <Search className="w-4.5 h-4.5" />
          </div>
          {query && (
            <button
              type="button"
              id="clear-search-btn"
              onClick={handleClearInput}
              className="absolute right-4 text-slate-450 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-300 transition-colors bg-slate-200/50 dark:bg-white/10 p-1 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </form>

      {/* Suggestions and History Dropdown */}
      {isFocused && (suggestions.length > 0 || history.length > 0 || isLoading) && (
        <div 
          id="autocomplete-dropdown"
          className="absolute z-50 w-full mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 theme-transition"
        >
          {isLoading && (
            <div className="px-4 py-3 text-sm text-slate-400 dark:text-slate-500 flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-slate-300 dark:border-slate-600 border-t-blue-500 rounded-full animate-spin"></span>
              Поиск городов...
            </div>
          )}

          {/* Autocomplete Suggestions */}
          {!isLoading && suggestions.length > 0 && (
            <div className="py-2 border-b border-slate-50 dark:border-slate-700/50">
              <div className="px-4 py-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Предложения
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.name}-${suggestion.country}-${index}`}
                  id={`suggestion-item-${index}`}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3 text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-medium text-sm leading-snug">{suggestion.name}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {suggestion.state ? `${suggestion.state}, ` : ""}{suggestion.country}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Search History */}
          {history.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-1.5 flex items-center justify-between text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <span>Недавние запросы</span>
                <button
                  type="button"
                  id="clear-history-btn"
                  onClick={clearHistory}
                  className="flex items-center gap-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors text-xs font-medium normal-case"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Очистить
                </button>
              </div>
              {history.map((city, index) => (
                <button
                  key={`history-${city}-${index}`}
                  id={`history-item-${index}`}
                  onClick={() => handleSelectHistory(city)}
                  className="w-full px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3 text-slate-600 dark:text-slate-300 transition-colors"
                >
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-sm font-medium">{city}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
