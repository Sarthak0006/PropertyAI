import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, Navigation, History, Bookmark, Activity } from 'lucide-react';

export function GlobalHeader() {
  const [locationName, setLocationName] = useState('Any Location');
  const [isLocating, setIsLocating] = useState(false);

  // Example Geolocation Logic
  const handleGetLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Reverse Geocoding API or Mock
            // For this case study, we just use a mocked "San Francisco, CA" 
            setTimeout(() => {
              setLocationName('San Francisco, CA');
              setIsLocating(false);
            }, 800);
          } catch (e) {
            setIsLocating(false);
          }
        },
        () => {
          setIsLocating(false);
          setLocationName('Location Denied');
        }
      );
    } else {
      setIsLocating(false);
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="p-2 bg-blue-600 rounded-lg group-hover:bg-blue-700 transition-colors shadow-sm">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Property<span className="text-blue-600">AI</span>
          </span>
        </Link>

        {/* Links */}
        <div className="flex items-center space-x-4 md:space-x-6">
          <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 text-sm font-medium transition-colors">Find Homes</Link>
          <Link to="/compare" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 text-sm font-medium transition-colors flex items-center gap-1">
            <Activity className="w-4 h-4" /> Compare
          </Link>
          
          <button className="text-gray-600 dark:text-gray-300 hover:text-blue-600 text-sm font-medium transition-colors flex items-center gap-1 group relative">
             <Bookmark className="w-4 h-4" /> Saved
             <div className="absolute top-full mt-2 w-48 bg-white border border-gray-100 rounded-lg shadow-xl py-2 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all flex flex-col z-50">
                <span className="px-4 py-2 text-xs text-gray-500 font-semibold uppercase tracking-wider">Bookmarked</span>
                <span className="px-4 py-2 text-sm text-gray-600 border-t border-gray-50 bg-gray-50">Coming Soon</span>
             </div>
          </button>
          
          <button className="text-gray-600 dark:text-gray-300 hover:text-blue-600 text-sm font-medium transition-colors flex items-center gap-1 group relative">
             <History className="w-4 h-4" /> History
             <div className="absolute top-full mt-2 w-48 bg-white border border-gray-100 rounded-lg shadow-xl py-2 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all flex flex-col z-50">
                <span className="px-4 py-2 text-xs text-gray-500 font-semibold uppercase tracking-wider">Chat History</span>
                <span className="px-4 py-2 text-sm text-gray-600 border-t border-gray-50 bg-gray-50">Coming Soon</span>
             </div>
          </button>
        </div>

        {/* Location Picker */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleGetLocation}
            className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 transition-colors"
          >
            {isLocating ? (
              <Navigation className="w-4 h-4 text-blue-600 animate-spin" />
            ) : (
              <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            )}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
              {locationName}
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}
