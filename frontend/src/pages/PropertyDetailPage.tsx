import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Bed, Bath, Maximize, MapPin, Calendar, Car, Droplets,
  Zap, Cpu, Plus, Check
} from 'lucide-react';
import { getProperty, getSimilarProperties } from '../api';
import PropertyCard from '../components/PropertyCard';
import { PropertyDetailSkeleton } from '../components/Skeletons';
import { useCompare } from '../context/CompareContext';

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();

  const propertyId = parseInt(id || '0', 10);

  const { data: property, isLoading, isError } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => getProperty(propertyId),
    enabled: propertyId > 0,
  });

  const { data: similar } = useQuery({
    queryKey: ['similar', propertyId],
    queryFn: () => getSimilarProperties(propertyId),
    enabled: propertyId > 0,
  });

  if (isLoading) return <PropertyDetailSkeleton />;

  if (isError || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h2>
          <p className="text-gray-500 mb-4">The property you're looking for doesn't exist.</p>
          <button onClick={() => navigate('/')} className="btn-primary">Go Home</button>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);

  const inCompare = isInCompare(property.id);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Image */}
      <div className="relative h-[28rem] overflow-hidden">
        <img src={property.image_url} alt={property.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute top-6 left-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 bg-white/90 backdrop-blur-sm rounded-xl hover:bg-white transition-all shadow-lg"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
        </div>
        <div className="absolute bottom-8 left-8 right-8">
          {/* <span className="px-3 py-1 bg-primary-500 text-white text-sm font-medium rounded-full mb-3 inline-block">
            {property.property_type}
          </span> */}
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{property.title}</h1>
          <div className="flex items-center gap-2 text-white/80">
            <MapPin className="w-4 h-4" />
            <span>{property.location}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price & Actions */}
            <div className="glass-card p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Price</p>
                <p className="text-3xl font-bold text-gray-900">{formatPrice(property.price)}</p>
              </div>
              <button
                onClick={() => inCompare ? removeFromCompare(property.id) : addToCompare(property)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${inCompare
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {inCompare ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {inCompare ? 'In Compare' : 'Add to Compare'}
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Bed, label: 'Bedrooms', value: property.bedrooms },
                { icon: Bath, label: 'Bathrooms', value: property.bathrooms },
                { icon: Maximize, label: 'Size', value: `${property.size_sqft.toLocaleString()} sqft` },
                // { icon: Calendar, label: 'Year Built', value: property.year_built },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="glass-card p-4 text-center">
                  <Icon className="w-5 h-5 text-primary-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-600 leading-relaxed">{property.description}</p>
            </div>

            {/* Amenities */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map(a => (
                  <span key={a} className="px-3 py-1.5 bg-primary-50 text-primary-700 text-sm rounded-lg font-medium">{a}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Features */}
            {/* <div className="glass-card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Property Features</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Car className={`w-5 h-5 ${property.has_garage ? 'text-green-500' : 'text-gray-300'}`} />
                  <span className="text-sm text-gray-700">Garage: {property.has_garage ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Droplets className={`w-5 h-5 ${property.has_pool ? 'text-blue-500' : 'text-gray-300'}`} />
                  <span className="text-sm text-gray-700">Pool: {property.has_pool ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div> */}

            {property.energy_features.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" /> Energy Features
                </h3>
                <div className="space-y-2">
                  {property.energy_features.map(f => (
                    <div key={f} className="px-3 py-2 bg-yellow-50 text-yellow-800 text-sm rounded-lg">{f}</div>
                  ))}
                </div>
              </div>
            )}

            {property.smart_features.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-500" /> Smart Features
                </h3>
                <div className="space-y-2">
                  {property.smart_features.map(f => (
                    <div key={f} className="px-3 py-2 bg-purple-50 text-purple-800 text-sm rounded-lg">{f}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Similar Properties */}
        {similar && similar.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar Properties</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similar.slice(0, 3).map(p => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
