import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Bed, Bath, Maximize, MapPin, Car, Droplets, Zap, Cpu, X, Sparkles } from 'lucide-react';
import { useCompare } from '../context/CompareContext';
import { compareProperties } from '../api';

export default function ComparePage() {
  const navigate = useNavigate();
  const { state, removeFromCompare, clearCompare } = useCompare();
  const { properties } = state;
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  useEffect(() => {
    if (properties.length >= 2 && properties.length <= 5) {
      setIsLoadingSummary(true);
      const ids = properties.map(p => p.id);
      compareProperties(ids)
        .then(res => setAiSummary(res.ai_summary || null))
        .catch(() => setAiSummary(null))
        .finally(() => setIsLoadingSummary(false));
    } else {
      setAiSummary(null);
    }
  }, [properties]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);

  if (properties.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Properties to Compare</h2>
          <p className="text-gray-500 mb-6">Add properties from the listing page to compare them side-by-side.</p>
          <button onClick={() => navigate('/')} className="btn-primary">Browse Properties</button>
        </div>
      </div>
    );
  }

  const rows = [
    { label: 'Price', icon: null, render: (p: any) => formatPrice(p.price) },
    { label: 'Location', icon: MapPin, render: (p: any) => p.location },
    // { label: 'Type', icon: null, render: (p: any) => p.property_type },
    { label: 'Bedrooms', icon: Bed, render: (p: any) => p.bedrooms },
    { label: 'Bathrooms', icon: Bath, render: (p: any) => p.bathrooms },
    { label: 'Size (sqft)', icon: Maximize, render: (p: any) => p.size_sqft.toLocaleString() },
    // { label: 'Year Built', icon: null, render: (p: any) => p.year_built },
    // { label: 'Garage', icon: Car, render: (p: any) => p.has_garage ? '✅ Yes' : '❌ No' },
    // { label: 'Pool', icon: Droplets, render: (p: any) => p.has_pool ? '✅ Yes' : '❌ No' },
    { label: 'Amenities', icon: null, render: (p: any) => p.amenities.join(', ') },
    // { label: 'Energy Features', icon: Zap, render: (p: any) => p.energy_features?.join(', ') || '—' },
    // { label: 'Smart Features', icon: Cpu, render: (p: any) => p.smart_features?.join(', ') || '—' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Compare Properties ({properties.length}/5)</h1>
          </div>
          <button
            onClick={clearCompare}
            className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" /> Clear All
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* AI Summary Section */}
        {properties.length >= 2 && (
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">AI Comparison Analysis</h2>
            </div>
            {isLoadingSummary ? (
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
                <p className="text-gray-600 text-sm">Analyzing properties...</p>
              </div>
            ) : aiSummary ? (
              <p className="text-gray-700 leading-relaxed text-sm md:text-base">{aiSummary}</p>
            ) : (
              <p className="text-gray-500 text-sm">Add more properties to see an AI-generated comparison summary.</p>
            )}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            {/* Property Headers */}
            <thead>
              <tr>
                <th className="text-left p-4 w-40 text-sm font-semibold text-gray-500 sticky left-0 bg-gray-50"></th>
                {properties.map(p => (
                  <th key={p.id} className="p-4 min-w-[220px]">
                    <div className="glass-card p-3 text-center relative">
                      <button
                        onClick={() => removeFromCompare(p.id)}
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <img src={p.image_url} alt={p.title} className="w-full h-32 object-cover rounded-xl mb-3" />
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{p.title}</h3>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.label} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="p-4 text-sm font-medium text-gray-600 sticky left-0 bg-inherit flex items-center gap-2">
                    {row.icon && <row.icon className="w-4 h-4 text-primary-500 flex-shrink-0" />}
                    {row.label}
                  </td>
                  {properties.map(p => (
                    <td key={p.id} className="p-4 text-sm text-gray-800 text-center">
                      {row.render(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
