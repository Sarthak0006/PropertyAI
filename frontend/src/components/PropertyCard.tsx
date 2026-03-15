import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bed, Bath, Maximize, MapPin, Plus, Check } from 'lucide-react';
import type { Property } from '../types';
import { useCompare } from '../context/CompareContext';

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const navigate = useNavigate();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const inCompare = isInCompare(property.id);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);

  return (
    <div
      className="group glass-card overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 animate-slide-up"
      onClick={() => navigate(`/property/${property.id}`)}
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={property.image_url}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-3 left-3">
          {/* <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold text-primary-700 rounded-full">
            {property.property_type}
          </span> */}
        </div>
        <div className="absolute top-3 right-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              inCompare ? removeFromCompare(property.id) : addToCompare(property);
            }}
            className={`p-2 rounded-full backdrop-blur-sm transition-all ${inCompare
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                : 'bg-white/80 text-gray-600 hover:bg-white hover:text-primary-600'
              }`}
            title={inCompare ? 'Remove from compare' : 'Add to compare'}
          >
            {inCompare ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
        <div className="absolute bottom-3 left-3">
          <span className="text-2xl font-bold text-white drop-shadow-lg">{formatPrice(property.price)}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-semibold text-gray-900 text-lg mb-1 group-hover:text-primary-600 transition-colors line-clamp-1">
          {property.title}
        </h3>
        <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
          <MapPin className="w-3.5 h-3.5" />
          {property.location}
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <Bed className="w-4 h-4 text-primary-500" />
            <span>{property.bedrooms} Beds</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bath className="w-4 h-4 text-primary-500" />
            <span>{property.bathrooms} Baths</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Maximize className="w-4 h-4 text-primary-500" />
            <span>{property.size_sqft.toLocaleString()} sqft</span>
          </div>
        </div>

        {property.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {property.amenities.slice(0, 3).map(a => (
              <span key={a} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md">{a}</span>
            ))}
            {property.amenities.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-md">
                +{property.amenities.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
