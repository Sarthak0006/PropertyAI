import React from 'react';

export function PropertyCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
      <div className="h-52 bg-gray-200" />
      <div className="p-5">
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
        <div className="flex gap-4">
          <div className="h-3 bg-gray-200 rounded w-16" />
          <div className="h-3 bg-gray-200 rounded w-16" />
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>
      </div>
    </div>
  );
}

export function PropertyDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-96 bg-gray-200 rounded-2xl mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-20 bg-gray-200 rounded" />
        </div>
        <div className="space-y-4">
          <div className="h-40 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
