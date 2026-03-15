import axios from 'axios';
import type { Property, SearchResult, SearchParams, SuggestionResult, ApiResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export async function searchProperties(params: SearchParams): Promise<SearchResult> {
  const { data } = await api.get<ApiResponse<SearchResult>>('/search', { params });
  return data.data;
}

export async function getProperty(id: number): Promise<Property> {
  const { data } = await api.get<ApiResponse<Property>>(`/properties/${id}`);
  return data.data;
}

export async function compareProperties(ids: number[]): Promise<{ properties: Property[]; count: number; ai_summary?: string }> {
  const { data } = await api.get<ApiResponse<{ properties: Property[]; count: number; ai_summary?: string }>>('/properties/compare', {
    params: { ids: ids.join(',') },
  });
  return data.data;
}

export async function getSimilarProperties(id: number): Promise<Property[]> {
  const { data } = await api.get<ApiResponse<Property[]>>(`/properties/${id}/similar`);
  return data.data;
}

export async function getSuggestions(q: string): Promise<SuggestionResult> {
  const { data } = await api.get<ApiResponse<SuggestionResult>>('/suggestions', { params: { q } });
  return data.data;
}

export default api;
