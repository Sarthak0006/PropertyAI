import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, Clock, TrendingUp } from 'lucide-react';
import { getSuggestions } from '../api';

interface SearchBarProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
}

export default function SearchBar({ onSearch, initialQuery = '' }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (value: string) => {
    if (value.length < 2) { setSuggestions([]); return; }
    setLoading(true);
    try {
      const result = await getSuggestions(value);
      setSuggestions(result.suggestions || []);
      setRecentSearches(result.recentSearches || []);
      setPopularSearches(result.popularSearches || []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowDropdown(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setShowDropdown(false);
    }
  };

  const handleSuggestionClick = (text: string) => {
    setQuery(text);
    onSearch(text);
    setShowDropdown(false);
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl blur-lg opacity-25 group-hover:opacity-40 transition-opacity" />
          <div className="relative flex items-center bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <Sparkles className="ml-5 w-5 h-5 text-primary-500 flex-shrink-0" />
            <input
              ref={inputRef}
              id="ai-search-box"
              type="text"
              value={query}
              onChange={handleChange}
              onFocus={() => setShowDropdown(true)}
              placeholder='Try "3 bedroom apartments with gym" or "luxury villa"...'
              className="flex-1 px-4 py-4 text-gray-900 placeholder:text-gray-400 focus:outline-none text-lg"
            />
            <button
              type="submit"
              className="m-2 px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-medium rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all flex items-center gap-2 shadow-lg shadow-primary-500/25"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>
      </form>

      {showDropdown && (query.length >= 2 || recentSearches.length > 0 || popularSearches.length > 0) && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fade-in"
        >
          {loading && (
            <div className="px-5 py-3 text-sm text-gray-400 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              Finding suggestions...
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Suggestions</div>
              {suggestions.map((s, i) => (
                <button
                  key={`s-${i}`}
                  onClick={() => handleSuggestionClick(s)}
                  className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-xl flex items-center gap-3 transition-colors"
                >
                  <Search className="w-4 h-4 text-gray-400" />
                  {s}
                </button>
              ))}
            </div>
          )}

          {recentSearches.length > 0 && (
            <div className="p-2 border-t border-gray-100 z-50">
              <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3" /> Recent
              </div>
              {recentSearches.slice(0, 3).map((s, i) => (
                <button key={`r-${i}`} onClick={() => handleSuggestionClick(s)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-xl flex items-center gap-3 transition-colors">
                  <Clock className="w-4 h-4 text-gray-300" />{s}
                </button>
              ))}
            </div>
          )}

          {popularSearches.length > 0 && (
            <div className="p-2 border-t border-gray-100 z-50">
              <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Popular
              </div>
              {popularSearches.slice(0, 3).map((s, i) => (
                <button key={`p-${i}`} onClick={() => handleSuggestionClick(s)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-xl flex items-center gap-3 transition-colors">
                  <TrendingUp className="w-4 h-4 text-orange-400" />{s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
