import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CompareProvider } from './context/CompareContext';
import HomePage from './pages/HomePage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import ComparePage from './pages/ComparePage';
import CompareFloatingBar from './components/CompareFloatingBar';
import { Chatbot } from './components/Chatbot';
import { GlobalHeader } from './components/GlobalHeader';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CompareProvider>
        <Router>
          <div className="flex flex-col min-h-screen">
            <GlobalHeader />
            <div className="flex-1 w-full bg-gray-50 dark:bg-gray-900">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/property/:id" element={<PropertyDetailPage />} />
                <Route path="/compare" element={<ComparePage />} />
              </Routes>
            </div>
            <CompareFloatingBar />
          </div>
        </Router>
      </CompareProvider>
    </QueryClientProvider>
  );
}
