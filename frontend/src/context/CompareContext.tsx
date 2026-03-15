import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { Property } from '../types';

interface CompareState {
  properties: Property[];
}

type CompareAction =
  | { type: 'ADD'; property: Property }
  | { type: 'REMOVE'; id: number }
  | { type: 'CLEAR' };

const CompareContext = createContext<{
  state: CompareState;
  addToCompare: (property: Property) => void;
  removeFromCompare: (id: number) => void;
  clearCompare: () => void;
  isInCompare: (id: number) => boolean;
} | null>(null);

function compareReducer(state: CompareState, action: CompareAction): CompareState {
  switch (action.type) {
    case 'ADD':
      if (state.properties.length >= 5) return state;
      if (state.properties.some(p => p.id === action.property.id)) return state;
      return { properties: [...state.properties, action.property] };
    case 'REMOVE':
      return { properties: state.properties.filter(p => p.id !== action.id) };
    case 'CLEAR':
      return { properties: [] };
    default:
      return state;
  }
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(compareReducer, { properties: [] });

  const addToCompare = useCallback((property: Property) => dispatch({ type: 'ADD', property }), []);
  const removeFromCompare = useCallback((id: number) => dispatch({ type: 'REMOVE', id }), []);
  const clearCompare = useCallback(() => dispatch({ type: 'CLEAR' }), []);
  const isInCompare = useCallback((id: number) => state.properties.some(p => p.id === id), [state.properties]);

  return (
    <CompareContext.Provider value={{ state, addToCompare, removeFromCompare, clearCompare, isInCompare }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within CompareProvider');
  return ctx;
}
