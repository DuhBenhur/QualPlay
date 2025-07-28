// Função para obter a URL base de forma segura
export const getBaseUrl = (): string => {
  try {
    if (typeof window !== 'undefined' && window.location.origin) {
      return window.location.origin;
    }
    return 'https://qualplay.netlify.app';
  } catch (error) {
    console.log('Erro ao obter URL base, usando fallback:', error);
    return 'https://qualplay.netlify.app';
  }
};

// Função para verificar se estamos em um ambiente válido
export const isValidEnvironment = (): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    if (!window.location.href) return false;
    if (window.location.href === 'about:blank') return false;
    return true;
  } catch (error) {
    return false;
  }
}; 