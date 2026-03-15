import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GitCompareArrows, X } from 'lucide-react';
import { useCompare } from '../context/CompareContext';

export default function CompareFloatingBar() {
  const navigate = useNavigate();
  const { state, clearCompare } = useCompare();

  if (state.properties.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="flex items-center gap-4 px-6 py-3 bg-gray-900 text-white rounded-2xl shadow-2xl backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <GitCompareArrows className="w-5 h-5 text-primary-400" />
          <span className="font-medium">{state.properties.length} properties selected</span>
        </div>
        <button
          onClick={() => navigate('/compare')}
          className="px-4 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-xl transition-colors"
        >
          Compare Now
        </button>
        <button onClick={clearCompare} className="text-gray-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
