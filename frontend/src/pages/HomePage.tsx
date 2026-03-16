import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Send, Mic, MicOff, Volume2, VolumeX, Home, ArrowLeft, Search, MapPin, Loader2 } from 'lucide-react';
import { searchProperties } from '../api';
import PropertyCard from '../components/PropertyCard';
import FilterPanel from '../components/FilterPanel';
import Pagination from '../components/Pagination';
import { PropertyCardSkeleton } from '../components/Skeletons';
import type { SearchParams } from '../types';
import { Property } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  properties?: Property[];
}

interface SearchInputBarProps {
  input: string;
  setInput: (val: string) => void;
  handleSend: (text?: string) => void;
  isTyping: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  locationName: string;
  setLocationName: (val: string) => void;
  fetchLocation: () => void;
  locatingUser: boolean;
  isListening: boolean;
  toggleListening: () => void;
  ttsEnabled: boolean;
  setTtsEnabled: (val: boolean) => void;
  className?: string;
  SpeechRecognition: any;
}

const SearchInputBar = ({
  input,
  setInput,
  handleSend,
  isTyping,
  inputRef,
  locationName,
  setLocationName,
  fetchLocation,
  locatingUser,
  isListening,
  toggleListening,
  ttsEnabled,
  setTtsEnabled,
  className = '',
  SpeechRecognition,
}: SearchInputBarProps) => (
  <div className={`relative group ${className}`}>
    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-2xl blur opacity-0 group-hover:opacity-15 transition duration-500" />
    <div className="relative flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden transition-shadow hover:shadow-lg shadow-sm">
      <Sparkles className="ml-4 w-4 h-4 text-blue-500 shrink-0" />

      {/* Location Badge */}
      {locationName && (
        <span className="ml-2 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-full flex items-center gap-1 shrink-0">
          <MapPin className="w-3 h-3" />
          <span className="max-w-[100px] truncate">{locationName}</span>
          <button onClick={(e) => { e.stopPropagation(); setLocationName(''); }} className="hover:text-red-500 ml-0.5">&times;</button>
        </span>
      )}

      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        placeholder={locationName ? `Search properties in ${locationName}...` : "Describe your dream property..."}
        className="flex-1 bg-transparent px-3 py-3.5 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none text-base min-w-0"
        disabled={isTyping}
      />
      <div className="flex items-center gap-1 pr-2 shrink-0">
        {/* Location Button */}
        <button
          onClick={fetchLocation}
          className={`p-2 rounded-full transition-all ${locationName
            ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/30'
            : locatingUser
              ? 'text-blue-500 animate-pulse'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400'
            }`}
          title={locationName || 'Use my location'}
          disabled={locatingUser}
        >
          {locatingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
        </button>
        {SpeechRecognition && (
          <button
            onClick={toggleListening}
            className={`p-2 rounded-full transition-all ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400'}`}
            disabled={isTyping}
          >
            {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>
        )}
        {/* <button
          onClick={() => setTtsEnabled(!ttsEnabled)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"
        >
          {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button> */}

        <button
          onClick={() => {
            if (ttsEnabled && window.speechSynthesis) {
              window.speechSynthesis.cancel();
            }
            setTtsEnabled(!ttsEnabled);
          }}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"
        >
          {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isTyping}
          className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${input.trim() && !isTyping
            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20'
            : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
            }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
);

export default function HomePage() {
  // ── Chat State ──
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [activeQuery, setActiveQuery] = useState('');
  const [resultProperties, setResultProperties] = useState<Property[]>([]);
  const [locationName, setLocationName] = useState('');
  const [locatingUser, setLocatingUser] = useState(false);

  // ── Unified Search State (Reactive to filters + activeQuery) ──
  const [filters, setFilters] = useState<SearchParams>({ page: 1, limit: 9, sort: 'relevance' });
  const { data, isLoading: searchLoading } = useQuery({
    queryKey: ['properties', filters, activeQuery],
    queryFn: () => searchProperties({ ...filters, q: activeQuery }),
  });

  const searchResults = data?.properties || [];
  const searchTotal = data?.total || 0;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionId = 'demo-session-id';

  // ── Speech Recognition ──
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognitionRef = useRef<any>(null);
  const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

  useEffect(() => {
    fetch(`${API_BASE}/chat/history/${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.messages && data.data.messages.length > 0) {
          setMessages(data.data.messages.map((m: any) => ({
            role: m.role, content: m.content, properties: m.properties,
          })));
        }
      })
      .catch(err => console.error('Failed to load history', err));

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        handleSend(transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
    inputRef.current?.focus();
  }, []);

  // ── Geolocation ──
  const fetchLocation = () => {
    if (!navigator.geolocation) return;
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || '';
          const state = data.address?.state || '';
          setLocationName(city ? `${city}, ${state}` : `${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`);
        } catch {
          setLocationName(`${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`);
        } finally {
          setLocatingUser(false);
        }
      },
      () => setLocatingUser(false),
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    if (!ttsEnabled && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [ttsEnabled]);

  useEffect(() => {
    const last = messages[messages.length - 1];

    if (last?.role === 'assistant' && last?.isStreaming) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const toggleListening = () => {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }
    else { try { recognitionRef.current?.start(); setIsListening(true); } catch (e) { console.error("Mic error:", e); } }
  };

  const speak = (text: string) => {
    if (!ttsEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.0; u.pitch = 1.0;
    window.speechSynthesis.speak(u);
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;
    setActiveQuery(text);
    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setResultProperties([]);
    setMessages(prev => [...prev, { role: 'assistant', content: '', isStreaming: true }]);

    // ── AI Stream starts ──
    try {
      const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';
      const response = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
        body: JSON.stringify({ sessionId, message: text }),
      });
      if (!response.body) throw new Error('No readable stream');
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let fullMsg = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split('\n')) {
            if (line.startsWith('data: ')) {
              const payload = line.replace('data: ', '');
              if (payload === '[DONE]') { done = true; break; }
              try {
                const parsed = JSON.parse(payload);
                if (parsed.text) {
                  fullMsg += parsed.text;
                  setMessages(prev => { const m = [...prev]; const l = m[m.length - 1]; if (l.role === 'assistant') l.content = fullMsg; return m; });
                }
                if (parsed.properties) {
                  setResultProperties(parsed.properties);
                  setMessages(prev => { const m = [...prev]; const l = m[m.length - 1]; if (l.role === 'assistant') l.properties = parsed.properties; return m; });
                }
              } catch { /* partial json */ }
            }
          }
        }
      }
      setMessages(prev => { const m = [...prev]; const l = m[m.length - 1]; if (l) l.isStreaming = false; return m; });
      setIsTyping(false);
      speak(fullMsg);
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (error) {
      console.error('Streaming error', error);
      setIsTyping(false);
      setMessages(prev => { const m = [...prev]; const l = m[m.length - 1]; l.content = 'Sorry, I encountered an error connecting to the server.'; l.isStreaming = false; return m; });
    }
  };

  const clearFilters = () => {
    setFilters({ page: 1, limit: 9, sort: 'relevance' }); // reset filters
  };

  const handleBackToHome = () => {
    setActiveQuery('');
    setMessages([]);
    setResultProperties([]);
    setFilters({ page: 1, limit: 9, sort: 'relevance' });
  };

  const preDefinedPrompts = [
    "Show me houses with 3 bedrooms",
    "Find homes that have 2 bathrooms",
    "Show properties that include a gym",
    "Find houses with a fitness center",
    "Show homes that have a backyard",
    "List properties with outdoor backyard space"
  ];

  const hasSearched = activeQuery.length > 0 || messages.length > 0;

  const BAR_PROPS = {
    input, setInput, handleSend, isTyping, inputRef,
    locationName, setLocationName, fetchLocation, locatingUser,
    isListening, toggleListening, ttsEnabled, setTtsEnabled, SpeechRecognition
  };

  // ════════════════════════════════════════════════════════════
  // ── RENDER ──
  // ════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950 transition-colors overflow-hidden">

      {!hasSearched ? (
        /* ═══════════ INITIAL STATE: Hero + Centered Search + Grid ═══════════ */
        <main className="flex-1 overflow-y-auto">
          {/* Hero with centered search */}
          <div className="relative flex flex-col items-center justify-center text-center px-4 pt-20 lg:pt-28 pb-12">
            {/* <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-xl shadow-blue-500/25 mb-6 animate-float">
              <Home className="w-8 h-8 text-white" />
            </div> */}
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-300 dark:to-white text-transparent bg-clip-text mb-3 animate-fade-in-up">
              Find your next home
            </h1>
            <p className="max-w-xl mx-auto text-gray-500 dark:text-gray-400 text-lg mb-10 animate-fade-in-up stagger-1">
              Ask our AI or browse the featured listings below.
            </p>

            {/* ── Centered Search Bar ── */}
            <div className="w-full max-w-2xl animate-fade-in-up stagger-2">
              <SearchInputBar {...BAR_PROPS} />
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-600 mt-3 animate-fade-in-up stagger-3">
              AI responses may be inaccurate. Verify important details.
            </p>

            {/* Quick Prompts */}
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto mt-8 animate-fade-in-up stagger-4">
              {preDefinedPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(p)}
                  className="px-4 py-2 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400 rounded-full transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Default Property Grid */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Featured Properties</h2>
              <span className="text-sm text-gray-500">{searchTotal} properties</span>
            </div>
            {searchLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => <PropertyCardSkeleton key={i} />)}
              </div>
            )}
            {!searchLoading && searchResults.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchResults.map(property => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
                <Pagination
                  page={data?.page || 1}
                  totalPages={data?.totalPages || 1}
                  onPageChange={(p) => setFilters(prev => ({ ...prev, page: p }))}
                />
              </>
            )}
          </section>
        </main>
      ) : (
        /* ═══════════ SPLIT-PANEL: Chat Left + Cards Right ═══════════ */
        <>
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* ── LEFT PANEL: AI Chat ── */}
            <div className="w-full lg:w-[420px] xl:w-[480px] shrink-0 flex flex-col border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 animate-slide-in-left h-[60vh] lg:h-full min-h-0">
              {/* Chat Header */}
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <button
                  onClick={handleBackToHome}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                  title="Back to home"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">AI Assistant</span>
                {activeQuery && (
                  <span className="ml-auto text-xs text-gray-400 truncate max-w-[160px]">"{activeQuery}"</span>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] px-4 py-3 text-sm leading-relaxed rounded-2xl ${msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-bl-sm border border-gray-100 dark:border-gray-800'
                      }`}>
                      {msg.content}
                      {msg.isStreaming && <span className="inline-block w-1.5 h-4 ml-1 bg-current animate-pulse align-middle" />}
                    </div>
                  </div>
                ))}

                {/* AI Thinking Loader */}
                {isTyping && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex justify-start">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl rounded-bl-sm px-5 py-4 border border-gray-200/60 dark:border-gray-700/60 shadow-sm max-w-[280px] w-full">
                      {/* Orb + Text Row */}
                      <div className="flex items-center gap-3 mb-3">
                        {/* Pulsing Gradient Orb */}
                        <div className="relative w-9 h-9 shrink-0">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 ai-orb" />
                          <div className="absolute inset-[-3px] rounded-full border-2 border-transparent border-t-blue-400 border-r-indigo-400 ai-ring" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white drop-shadow" />
                          </div>
                        </div>
                        {/* Shimmer Text */}
                        <div>
                          <p className="text-sm font-semibold shimmer-text">Thinking...</p>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Analyzing your query</p>
                        </div>
                      </div>
                      {/* Wave Bars */}
                      <div className="flex items-end gap-[3px] h-5 px-1">
                        {[0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.5, 0.35, 0.2].map((delay, i) => (
                          <div
                            key={i}
                            className="w-[3px] rounded-full bg-gradient-to-t from-blue-500 to-indigo-400 wave-bar"
                            style={{ animationDelay: `${delay}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick re-search chips */}
              {/* <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {preDefinedPrompts.slice(0, 3).map((p, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(p)}
                      className="px-3 py-1 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 rounded-full transition-all"
                      disabled={isTyping}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div> */}

              {/* Search Bar pinned at bottom of left panel */}
              <div className="px-3 py-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
                <SearchInputBar {...BAR_PROPS} />
              </div>
            </div>

            {/* ── RIGHT PANEL: Elasticsearch Search Results ── */}
            <div className="flex flex-1 flex-col overflow-y-auto bg-gray-50 dark:bg-gray-900/50 animate-slide-in-right min-h-0">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white/60 dark:bg-gray-950/60 backdrop-blur-sm sticky top-0 z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-gray-900 dark:text-white text-lg">Search Results</h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {searchResults.length > 0
                        ? `${searchTotal} properties found — showing top ${searchResults.length}`
                        : searchLoading ? 'Searching Elasticsearch...' : 'Results will appear here'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500 truncate max-w-[200px]">"{activeQuery}"</span>
                  </div>
                </div>
                {/* Filters */}
                <FilterPanel clearFilters={clearFilters} filters={filters} onFilterChange={(f) => setFilters(prev => ({ ...prev, ...f }))} />
              </div>

              <div className="flex-1 p-6">
                {searchLoading && (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                    {Array.from({ length: 4 }).map((_, i) => <PropertyCardSkeleton key={i} />)}
                  </div>
                )}
                {!searchLoading && searchResults.length > 0 && (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 animate-fade-in-up">
                    {searchResults.map(p => (
                      <PropertyCard key={p.id} property={p} />
                    ))}
                  </div>
                )}
                {!searchLoading && searchResults.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 dark:text-gray-500">
                    <Search className="w-12 h-12 mb-4 opacity-30" />
                    <p className="font-medium">No results yet</p>
                    <p className="text-sm mt-1">Try asking in the chat panel on the left</p>
                  </div>
                )}
              </div>
            </div>


          </div>
        </>
      )}
    </div>
  );
}
