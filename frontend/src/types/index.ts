export interface Property {
  id: number;
  title: string;
  description: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  size_sqft: number;
  // property_type: string;
  // year_built: number;
  amenities: string[];
  has_garage: boolean;
  has_pool: boolean;
  energy_features: string[];
  smart_features: string[];
  image_url: string;
}

export interface SearchResult {
  total: number;
  properties: Property[];
  page: number;
  limit: number;
  totalPages: number;
}

export interface SearchParams {
  q?: string;
  bedrooms?: number;
  bathrooms?: number;
  min_size?: number;
  max_size?: number;
  min_price?: number;
  max_price?: number;
  amenities?: string;
  // property_type?: string;
  location?: string;
  has_garage?: boolean;
  has_pool?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface SuggestionResult {
  suggestions: string[];
  recentSearches: string[];
  popularSearches: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
