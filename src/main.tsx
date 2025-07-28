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
      super(input, base);
    } catch (error) {
      console.warn('URL inválida detectada, usando fallback:', input);
      // Retornar uma URL válida como fallback
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