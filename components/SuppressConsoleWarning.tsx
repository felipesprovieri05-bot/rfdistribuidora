'use client';

import { useEffect } from 'react';

/**
 * Componente para suprimir avisos específicos do console do Next.js DevTools
 * relacionados à enumeração de params
 */
export default function SuppressConsoleWarning() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Salvar referência original
    const originalError = console.error;
    const originalWarn = console.warn;

    // Interceptar console.error
    console.error = function (...args: any[]) {
      const message = args[0];
      if (
        typeof message === 'string' &&
        (message.includes('params are being enumerated') ||
          message.includes('params should be unwrapped') ||
          message.includes('searchParams') ||
          message.includes('searchParams were accessed directly') ||
          message.includes('searchParams should be unwrapped') ||
          message.includes('The keys of `searchParams` were accessed directly'))
      ) {
        // Suprimir estes avisos específicos do Next.js DevTools
        return;
      }
      originalError.apply(console, args);
    };

    // Interceptar console.warn também
    console.warn = function (...args: any[]) {
      const message = args[0];
      if (
        typeof message === 'string' &&
        (message.includes('params are being enumerated') ||
          message.includes('params should be unwrapped') ||
          message.includes('searchParams') ||
          message.includes('searchParams were accessed directly') ||
          message.includes('searchParams should be unwrapped') ||
          message.includes('The keys of `searchParams` were accessed directly'))
      ) {
        // Suprimir estes avisos específicos do Next.js DevTools
        return;
      }
      originalWarn.apply(console, args);
    };

    // Limpar ao desmontar (embora isso seja raro)
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  return null;
}
