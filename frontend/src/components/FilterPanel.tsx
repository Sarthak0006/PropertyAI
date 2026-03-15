import React, { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import type { SearchParams } from '../types';

const AMENITY_OPTIONS = [
  'Gym', 'Swimming Pool', 'Parking', 'Garage', 'Garden', 'Balcony',
  'Security', 'Laundry', 'Backyard', 'BBQ Area', 'Home Office',
  'Rooftop Terrace', 'Smart Home', 'Pet Friendly', 'Beach Access',
];

// const PROPERTY_TYPES = ['Apartment', 'House', 'Villa', 'Condo', 'Penthouse', 'Studio', 'Townhouse', 'Duplex'];

interface FilterPanelProps {
  filters: SearchParams;
  onFilterChange: (filters: SearchParams) => void;
  clearFilters: () => void;
}

export default function FilterPanel({ filters, onFilterChange, clearFilters }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (key: keyof SearchParams, value: any) => {
    onFilterChange({ ...filters, [key]: value || undefined, page: 1 });
  };

  // const clearFilters = () => {
  //   onFilterChange({ page: 1, limit: 10, sort: 'relevance' });
  // };

  const activeCount = Object.entries(filters).filter(
    ([k, v]) => !['page', 'limit', 'sort', 'q'].includes(k) && v !== undefined && v !== ''
  ).length;

  return (
    <div className="w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
      >
        <SlidersHorizontal className="w-4 h-4" />
        <span className="font-medium text-sm">Filters</span>
        {activeCount > 0 && (
          <span className="px-2 py-0.5 bg-primary-500 text-white text-xs rounded-full">{activeCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="mt-3 p-6 bg-white rounded-2xl shadow-xl border border-gray-100 animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-900">Filters</h3>
            <div className="flex gap-2">
              {activeCount > 0 && (
                <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear all
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Bedrooms</label>
              <select
                value={filters.bedrooms ?? ''}
                onChange={(e) => updateFilter('bedrooms', e.target.value ? Number(e.target.value) : undefined)}
                className="input-field text-sm"
              >
                <option value="">Any</option>
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}+</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Bathrooms</label>
              <select
                value={filters.bathrooms ?? ''}
                onChange={(e) => updateFilter('bathrooms', e.target.value ? Number(e.target.value) : undefined)}
                className="input-field text-sm"
              >
                <option value="">Any</option>
                {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}+</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Min Size (sqft)</label>
              <input
                type="number"
                value={filters.min_size ?? ''}
                onChange={(e) => updateFilter('min_size', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Min"
                className="input-field text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Max Size (sqft)</label>
              <input
                type="number"
                value={filters.max_size ?? ''}
                onChange={(e) => updateFilter('max_size', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Max"
                className="input-field text-sm"
              />
            </div>
          </div>

          {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Property Type</label>
              <select
                value={filters.property_type ?? ''}
                onChange={(e) => updateFilter('property_type', e.target.value || undefined)}
                className="input-field text-sm"
              >
                <option value="">Any</option>
                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Sort By</label>
              <select
                value={filters.sort ?? 'relevance'}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="input-field text-sm"
              >
                <option value="relevance">Relevance</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="size_asc">Size: Small to Large</option>
                <option value="size_desc">Size: Large to Small</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div> */}

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map(amenity => {
                const selected = filters.amenities?.split(',').includes(amenity);
                return (
                  <button
                    key={amenity}
                    onClick={() => {
                      const current = filters.amenities ? filters.amenities.split(',') : [];
                      const updated = selected
                        ? current.filter(a => a !== amenity)
                        : [...current, amenity];
                      updateFilter('amenities', updated.length ? updated.join(',') : undefined);
                    }}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-all ${selected
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600'
                      }`}
                  >
                    {amenity}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
