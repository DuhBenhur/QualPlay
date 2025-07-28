import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext'

// Proteção global contra erros de URL inválida
const originalURL = window.URL;
window.URL = class SafeURL extends originalURL {
  constructor(input: string | URL, base?: string | URL) {
    try {
      // Validar input antes de chamar o construtor original
      if (typeof input === 'string') {
        // Verificar se é uma URL válida
        if (!input || input === 'about:blank' || input === 'undefined' || input === 'null') {
          console.warn('URL inválida detectada, usando fallback:', input);
          super('https://qualplay.netlify.app');
          return;
        }
        
        // Tentar criar URL temporariamente para validar
        try {
          new originalURL(input, base);
        } catch {
          console.warn('URL inválida detectada, usando fallback:', input);
          super('https://qualplay.netlify.app');
          return;
        }
      }
      
      super(input, base);
    } catch (error) {
      console.warn('Erro ao criar URL, usando fallback:', error);
      super('https://qualplay.netlify.app');
    }
  }
} as any;

// Manter a propriedade name para compatibilidade
Object.defineProperty(window.URL, 'name', {
  value: 'URL',
  configurable: true
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </LanguageProvider>
  </React.StrictMode>,
)