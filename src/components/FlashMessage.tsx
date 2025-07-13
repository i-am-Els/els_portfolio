"use client";
import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';

interface FlashMessageContextType {
  showMessage: (msg: string, type?: 'error' | 'success' | 'info') => void;
}

const FlashMessageContext = createContext<FlashMessageContextType | undefined>(undefined);

export const useFlashMessage = () => {
  const ctx = useContext(FlashMessageContext);
  if (!ctx) throw new Error('useFlashMessage must be used within a FlashMessageProvider');
  return ctx;
};

interface FlashMessageProviderProps {
  children: ReactNode;
}

export const FlashMessageProvider = ({ children }: FlashMessageProviderProps) => {
  const [message, setMessage] = useState<string | null>(null);
  const [type, setType] = useState<'error' | 'success' | 'info'>('info');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showMessage = useCallback((msg: string, msgType: 'error' | 'success' | 'info' = 'info') => {
    setMessage(msg);
    setType(msgType);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setMessage(null), 4000);
  }, []);

  const handleClose = () => {
    setMessage(null);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <FlashMessageContext.Provider value={{ showMessage }}>
      {children}
      {message && (
        <div
          className={`fixed top-5 left-1/2 z-50 transform -translate-x-1/2 px-6 py-3 rounded shadow-lg text-white transition-all duration-300
            ${type === 'error' ? 'bg-red-600' : type === 'success' ? 'bg-green-600' : 'bg-blue-600'}`}
          role="alert"
        >
          <div className="flex items-center">
            <span className="flex-1">{message}</span>
            <button
              onClick={handleClose}
              className="ml-4 text-white hover:text-gray-200 focus:outline-none"
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </FlashMessageContext.Provider>
  );
};
