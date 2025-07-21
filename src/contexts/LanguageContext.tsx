import React, { createContext, useContext, useState, useEffect } from 'react';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Traduções completas PT/EN
const translations = {
  pt: {
    navigation: {
      search: 'Buscar Filmes',
      about: 'Sobre',
      contact: 'Contato',
      tutorial: 'Tutorial'
    },
    search: {
      title: 'Busca Básica',
      moviePlaceholder: 'Escolha um ou + filmes',
      directorPlaceholder: 'Escolha um ou + diretores',
      discoverButton: 'Descobrir Filmes',
      combinedSearch: 'Busca Combinada',
      searching: 'Buscando...',
      clearAll: 'Nova Busca (Limpar Tudo)',
      uploadTitle: 'Upload de Lista',
      uploadText: 'Arraste arquivo .txt/.csv ou clique',
      uploadSubtext: 'Cada linha = um filme',
      advancedFilters: 'Filtros Avançados',
      genres: 'Gêneros',
      yearStart: 'Ano Inicial',
      yearEnd: 'Ano Final',
      sortBy: 'Ordenar por',
      processing: 'Processando...',
      processed: 'Processado!'
    },
    results: {
      title: 'Resultados da Busca',
      found: 'Encontrados',
      movies: 'filmes',
      noResults: 'Nenhum filme encontrado',
      noResultsSubtext: 'Tente ajustar os critérios de busca ou filtros',
      welcome: 'Bem-vindo ao QualPlay',
      welcomeSubtext: 'Use a barra lateral para pesquisar filmes por título, diretor ou descobrir novos filmes com filtros avançados'
    },
    movie: {
      director: 'Diretor',
      cast: 'Elenco Principal',
      genres: 'Gêneros',
      year: 'Ano',
      rating: 'Avaliação',
      runtime: 'Duração',
      budget: 'Orçamento',
      revenue: 'Bilheteria',
      synopsis: 'Sinopse',
      whereToWatch: 'Onde Assistir',
      notAvailable: 'Não disponível',
      watchTrailer: 'Assistir Trailer',
      save: 'Salvar',
      viewOnTMDB: 'Ver no TMDB',
      details: 'Ver Detalhes',
      streaming: 'Disponível em',
      included: 'Incluído',
      rental: 'Aluguel',
      purchase: 'Compra'
    },
    recommendations: {
      title: 'Recomendações para Você',
      smart: 'Inteligente',
      quality: 'Qualidade',
      trending: 'Em Alta',
      analyzing: 'Analisando seus gostos...',
      basedOn: 'Baseado nos',
      moviesAnalyzed: 'filmes que você pesquisou',
      highQuality: 'Filmes bem avaliados pela crítica e público',
      popular: 'Os mais populares no momento',
      noRecommendations: 'Não foi possível gerar recomendações no momento.',
      tryMore: 'Tente buscar mais filmes para melhorar as sugestões.',
      systemTitle: 'Sistema de Recomendação Inteligente',
      systemSubtext: 'Busque alguns filmes primeiro para receber recomendações personalizadas baseadas nos seus gostos!',
      howItWorks: 'Como funciona:',
      analyzes: 'Analisa os gêneros dos filmes que você busca',
      identifies: 'Identifica seus padrões de preferência',
      suggests: 'Sugere filmes similares de qualidade',
      diversifies: 'Diversifica por diferentes tipos de recomendação'
    },
    favorites: {
      title: 'Filmes Salvos',
      empty: 'Nenhum filme salvo ainda',
      emptySubtext: 'Salve filmes clicando no ❤️ nos cards ou no botão "Salvar" nos detalhes do filme',
      exportPDF: 'PDF Lista',
      personalizedList: 'Sua Lista Personalizada de Filmes para Assistir:',
      currentOrder: 'Ordem atual: Os números #1, #2, #3... mostram a sequência para assistir',
      reorderDesktop: 'Reordenar: Arraste os cards pela alça para mudar a ordem',
      reorderMobile: 'Reordenar: Use os botões ↑↓ ao lado de cada filme',
      pdfOrder: 'PDF: Será gerado exatamente nesta ordem personalizada',
      tip: 'Dica: #1 = próximo filme, #2 = segundo da fila, etc.'
    },
    analytics: {
      title: 'Dashboard de Analytics',
      overview: 'Visão Geral',
      genres: 'Gêneros',
      timeline: 'Timeline',
      correlations: 'Correlações',
      profile: 'Perfil',
      financial: 'Financeiro',
      hierarchy: 'Hierarquia',
      statistics: 'Estatísticas',
      totalMovies: 'Filmes',
      avgRating: 'Avaliação Média',
      totalGenres: 'Gêneros',
      period: 'Período',
      totalRevenue: 'Bilheteria Total',
      totalBudget: 'Orçamento Total',
      avgDuration: 'Duração Média'
    },
    sortOptions: {
      popularityDesc: 'Popularidade ↓',
      releaseDateDesc: 'Mais Recente',
      voteAverageDesc: 'Melhor Avaliado',
      revenueDesc: 'Maior Bilheteria'
    },
    tutorial: {
      welcome: 'Bem-vindo ao QualPlay!',
      skip: 'Pular Tutorial',
      next: 'Próximo',
      previous: 'Anterior',
      start: 'Começar a Usar!',
      minimize: 'Minimizar',
      close: 'Fechar tutorial'
    },
    about: {
      title: 'Sobre a Aplicação',
      subtitle: 'Uma aplicação moderna e completa para descobrir, explorar e analisar filmes com tecnologias de ponta',
      keyFeatures: 'Principais Funcionalidades',
      technologies: 'Tecnologias Utilizadas',
      developer: 'Sobre o Desenvolvedor',
      architecture: 'Arquitetura do Projeto'
    },
    contact: {
      title: 'Entre em Contato',
      subtitle: 'Tem alguma dúvida, sugestão ou feedback sobre o QualPlay? Adoraria ouvir de você!',
      sendMessage: 'Envie uma Mensagem',
      name: 'Nome',
      email: 'Email',
      subject: 'Assunto',
      message: 'Mensagem',
      send: 'Enviar Mensagem',
      sending: 'Enviando...',
      sent: 'Mensagem Enviada!',
      thanks: 'Obrigado pelo seu contato. Retornarei em breve!'
    },
    common: {
      loading: 'Carregando...',
      error: 'Erro',
      success: 'Sucesso',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      close: 'Fechar',
      save: 'Salvar',
      edit: 'Editar',
      delete: 'Excluir',
      search: 'Buscar',
      filter: 'Filtrar',
      export: 'Exportar',
      import: 'Importar'
    }
  },
  en: {
    navigation: {
      search: 'Search Movies',
      about: 'About',
      contact: 'Contact',
      tutorial: 'Tutorial'
    },
    search: {
      title: 'Basic Search',
      moviePlaceholder: 'Choose one or more movies',
      directorPlaceholder: 'Choose one or more directors',
      discoverButton: 'Discover Movies',
      combinedSearch: 'Combined Search',
      searching: 'Searching...',
      clearAll: 'New Search (Clear All)',
      uploadTitle: 'Upload List',
      uploadText: 'Drag .txt/.csv file or click',
      uploadSubtext: 'Each line = one movie',
      advancedFilters: 'Advanced Filters',
      genres: 'Genres',
      yearStart: 'Start Year',
      yearEnd: 'End Year',
      sortBy: 'Sort by',
      processing: 'Processing...',
      processed: 'Processed!'
    },
    results: {
      title: 'Search Results',
      found: 'Found',
      movies: 'movies',
      noResults: 'No movies found',
      noResultsSubtext: 'Try adjusting search criteria or filters',
      welcome: 'Welcome to QualPlay',
      welcomeSubtext: 'Use the sidebar to search movies by title, director or discover new movies with advanced filters'
    },
    movie: {
      director: 'Director',
      cast: 'Main Cast',
      genres: 'Genres',
      year: 'Year',
      rating: 'Rating',
      runtime: 'Runtime',
      budget: 'Budget',
      revenue: 'Box Office',
      synopsis: 'Synopsis',
      whereToWatch: 'Where to Watch',
      notAvailable: 'Not available',
      watchTrailer: 'Watch Trailer',
      save: 'Save',
      viewOnTMDB: 'View on TMDB',
      details: 'View Details',
      streaming: 'Available on',
      included: 'Included',
      rental: 'Rental',
      purchase: 'Purchase'
    },
    recommendations: {
      title: 'Recommendations for You',
      smart: 'Smart',
      quality: 'Quality',
      trending: 'Trending',
      analyzing: 'Analyzing your taste...',
      basedOn: 'Based on the',
      moviesAnalyzed: 'movies you searched',
      highQuality: 'Movies well rated by critics and audience',
      popular: 'Most popular at the moment',
      noRecommendations: 'Could not generate recommendations at the moment.',
      tryMore: 'Try searching more movies to improve suggestions.',
      systemTitle: 'Smart Recommendation System',
      systemSubtext: 'Search some movies first to receive personalized recommendations based on your taste!',
      howItWorks: 'How it works:',
      analyzes: 'Analyzes the genres of movies you search',
      identifies: 'Identifies your preference patterns',
      suggests: 'Suggests similar quality movies',
      diversifies: 'Diversifies by different recommendation types'
    },
    favorites: {
      title: 'Saved Movies',
      empty: 'No saved movies yet',
      emptySubtext: 'Save movies by clicking ❤️ on cards or "Save" button in movie details',
      exportPDF: 'PDF List',
      personalizedList: 'Your Personalized Movie Watchlist:',
      currentOrder: 'Current order: Numbers #1, #2, #3... show the sequence to watch',
      reorderDesktop: 'Reorder: Drag cards by the handle to change order',
      reorderMobile: 'Reorder: Use ↑↓ buttons next to each movie',
      pdfOrder: 'PDF: Will be generated exactly in this personalized order',
      tip: 'Tip: #1 = next movie, #2 = second in queue, etc.'
    },
    analytics: {
      title: 'Analytics Dashboard',
      overview: 'Overview',
      genres: 'Genres',
      timeline: 'Timeline',
      correlations: 'Correlations',
      profile: 'Profile',
      financial: 'Financial',
      hierarchy: 'Hierarchy',
      statistics: 'Statistics',
      totalMovies: 'Movies',
      avgRating: 'Average Rating',
      totalGenres: 'Genres',
      period: 'Period',
      totalRevenue: 'Total Revenue',
      totalBudget: 'Total Budget',
      avgDuration: 'Average Duration'
    },
    sortOptions: {
      popularityDesc: 'Popularity ↓',
      releaseDateDesc: 'Most Recent',
      voteAverageDesc: 'Best Rated',
      revenueDesc: 'Highest Grossing'
    },
    tutorial: {
      welcome: 'Welcome to QualPlay!',
      skip: 'Skip Tutorial',
      next: 'Next',
      previous: 'Previous',
      start: 'Start Using!',
      minimize: 'Minimize',
      close: 'Close tutorial'
    },
    about: {
      title: 'About the Application',
      subtitle: 'A modern and complete application to discover, explore and analyze movies with cutting-edge technologies',
      keyFeatures: 'Key Features',
      technologies: 'Technologies Used',
      developer: 'About the Developer',
      architecture: 'Project Architecture'
    },
    contact: {
      title: 'Get in Touch',
      subtitle: 'Have any questions, suggestions or feedback about QualPlay? Would love to hear from you!',
      sendMessage: 'Send a Message',
      name: 'Name',
      email: 'Email',
      subject: 'Subject',
      message: 'Message',
      send: 'Send Message',
      sending: 'Sending...',
      sent: 'Message Sent!',
      thanks: 'Thank you for your contact. Will get back to you soon!'
    },
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      confirm: 'Confirm',
      close: 'Close',
      save: 'Save',
      edit: 'Edit',
      delete: 'Delete',
      search: 'Search',
      filter: 'Filter',
      export: 'Export',
      import: 'Import'
    }
  }
};

// Detecta idioma do navegador
const detectLanguage = (): string => {
  const browserLang = navigator.language.split('-')[0];
  const supportedLangs = ['pt', 'en'];
  return supportedLangs.includes(browserLang) ? browserLang : 'pt';
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<string>(() => {
    const saved = localStorage.getItem('qualplay-language');
    return saved || detectLanguage();
  });

  useEffect(() => {
    localStorage.setItem('qualplay-language', language);
  }, [language]);

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language as keyof typeof translations];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key; // Fallback para a chave se não encontrar
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};