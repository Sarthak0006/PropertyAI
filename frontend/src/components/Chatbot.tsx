import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Mic, MicOff, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';
import { Property } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  properties?: Property[];
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionId = 'demo-session-id'; // In a real app, from Auth or LocalStorage

  // Speech Recognition setup
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Load history from MongoDB via backend
    fetch(`http://localhost:3001/api/v1/chat/history/${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.messages) {
          setMessages(data.data.messages.map((m: any) => ({ role: m.role, content: m.content })));
        } else {
          setMessages([{ role: 'assistant', content: 'Hi! I am your real estate AI. How can I help you find your dream home today?' }]);
        }
      })
      .catch(err => {
        console.error('Failed to load history', err);
        setMessages([{ role: 'assistant', content: 'Hi! I am your real estate AI. How can I help you find your dream home today?' }]);
      });

    // Initialize STT
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        // Auto-send if voice input stops
        handleSend(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error("Mic error:", e);
      }
    }
  };

  const speak = (text: string) => {
    if (!ttsEnabled || !window.speechSynthesis) return;
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Add empty assistant message that will be streamed into
    setMessages(prev => [...prev, { role: 'assistant', content: '', isStreaming: true }]);

    try {
      const response = await fetch('http://localhost:3001/api/v1/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({ sessionId, message: text })
      });

      if (!response.body) throw new Error('No readable stream available');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let fullAssistantMessage = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunkStr = decoder.decode(value, { stream: true });
          const lines = chunkStr.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.replace('data: ', '');
              if (data === '[DONE]') {
                done = true;
                break;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  fullAssistantMessage += parsed.text;
                  setMessages(prev => {
                    const newMsgs = [...prev];
                    const lastMsg = newMsgs[newMsgs.length - 1];
                    if (lastMsg.role === 'assistant') {
                      lastMsg.content = fullAssistantMessage;
                    }
                    return newMsgs;
                  });
                }
                if (parsed.properties) {
                  setMessages(prev => {
                    const newMsgs = [...prev];
                    const lastMsg = newMsgs[newMsgs.length - 1];
                    if (lastMsg.role === 'assistant') {
                      lastMsg.properties = parsed.properties;
                    }
                    return newMsgs;
                  });
                }
              } catch (e) {
                // Ignore parse errors on chunks
              }
            }
          }
        }
      }

      // Cleanup streaming flag and speak response
      setMessages(prev => {
        const newMsgs = [...prev];
        const lastMsg = newMsgs[newMsgs.length - 1];
        if (lastMsg) lastMsg.isStreaming = false;
        return newMsgs;
      });
      setIsTyping(false);
      speak(fullAssistantMessage);

    } catch (error) {
      console.error('Streaming error', error);
      setIsTyping(false);
      setMessages(prev => {
        const newMsgs = [...prev];
        const lastMsg = newMsgs[newMsgs.length - 1];
        lastMsg.content = 'Sorry, I encountered an error connecting to the server.';
        lastMsg.isStreaming = false;
        return newMsgs;
      });
    }
  };

  const handlePromptClick = (prompt: string) => {
    handleSend(prompt);
  };

  const preDefinedPrompts = [
    "Find me a 3 bedroom house",
    "Show me luxury properties",
    "Apartments under $500k"
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110 z-50 flex items-center justify-center group"
      >
        <MessageSquare className="w-7 h-7" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap pl-0 group-hover:pl-2">
          Chat with AI
        </span>
      </button>
    );
  }

  const containerClass = isFullScreen
    ? "fixed inset-0 sm:inset-4 md:inset-8 bg-white dark:bg-gray-900 shadow-2xl rounded-2xl z-50 flex flex-col transition-all overflow-hidden"
    : "fixed bottom-6 right-6 w-80 sm:w-96 h-[32rem] bg-white dark:bg-gray-900 shadow-2xl rounded-2xl z-50 flex flex-col transition-all overflow-hidden border border-gray-200 dark:border-gray-800";

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center shrink-0">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5" />
          <h3 className="font-semibold text-lg">PropertyAI Agent</h3>
        </div>
        <div className="flex items-center space-x-1">
          <button onClick={() => setTtsEnabled(!ttsEnabled)} className="p-1.5 hover:bg-blue-700 rounded transition-colors" title={ttsEnabled ? "Mute Voice" : "Enable Voice"}>
            {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-blue-300" />}
          </button>
          <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-1.5 hover:bg-blue-700 rounded transition-colors hide-on-mobile">
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-blue-700 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900 scroll-smooth">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2 shadow-sm ${msg.role === 'user'
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-100 dark:border-gray-700'
              }`}>
              {msg.content}
              {msg.isStreaming && <span className="inline-block w-1.5 h-4 ml-1 bg-current animate-pulse align-middle" />}
            </div>
            {msg.properties && msg.properties.length > 0 && (
              <div className="mt-2 flex overflow-x-auto gap-3 pb-2 w-full snap-x">
                {msg.properties.map(p => (
                  <div key={p.id} className="w-48 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 overflow-hidden shrink-0 snap-start">
                    <img src={p.image_url || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80'} alt={p.title} className="w-full h-24 object-cover" />
                    <div className="p-3">
                      <p className="font-bold text-gray-900 dark:text-white">${p.price?.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{p.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {isTyping && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-none px-4 py-2 border border-gray-100 dark:border-gray-700 shadow-sm flex space-x-1 items-center h-10">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Pre-defined Prompts */}
      {messages.length <= 1 && !isTyping && (
        <div className="px-4 py-2 flex flex-wrap gap-2 shrink-0 bg-gray-50 dark:bg-gray-900">
          {preDefinedPrompts.map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePromptClick(prompt);
              }}
              className="text-xs bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-3 py-1.5 rounded-full transition-colors font-medium cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 shrink-0">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your property search..."
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full pl-4 pr-24 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:text-white"
            disabled={isTyping}
          />
          <div className="absolute right-2 flex items-center space-x-1">
            {SpeechRecognition && (
              <button
                onClick={toggleListening}
                className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500'}`}
                title={isListening ? "Listening..." : "Speak"}
                disabled={isTyping}
              >
                {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>
            )}
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white p-2 text-sm rounded-full transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
