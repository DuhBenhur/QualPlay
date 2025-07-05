import React, { useState, useEffect } from 'react';
import { Grid, List, Film } from 'lucide-react';
import Navigation from './components/Navigation';
import SearchSidebar from './components/SearchSidebar';
import MovieCard from './components/MovieCard';
import MovieTable from './components/MovieTable';
import MovieDetails from './components/MovieDetails';
import DataVisualizationDashboard from './components/DataVisualizationDashboard';
import PDFExport from './components/PDFExport';
import AboutPage from './components/AboutPage';
import ContactPage from './components/ContactPage';
import SavedMovies from './components/SavedMovies';
import RecommendationEngine from './components/RecommendationEngine';
import { MovieDetails as MovieDetailsType, SearchFilters } from './types/movie';
import { searchMoviesAndDirectors, getMovieDetails } from './services/tmdbApi';

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'about' | 'contact'>('home');
  const [movies, setMovies] = useState<MovieDetailsType[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<MovieDetailsType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [hasSearched, setHasSearched] = useState(false);
  const [savedMoviesCount, setSavedMoviesCount] = useState(0);

  // Atualizar contador de filmes salvos
  useEffect(() => {
    const updateSavedCount = () => {
      const saved = JSON.parse(localStorage.getItem('savedMovies') || '[]');
      setSavedMoviesCount(saved.length);
    };

    // Atualizar na inicialização
    updateSavedCount();

    // Escutar mudanças no localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'savedMovies') {
        updateSavedCount();
      }
    };

    // Escutar evento customizado para mudanças internas
    const handleSavedMoviesChange = () => {
      updateSavedCount();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('savedMoviesChanged', handleSavedMoviesChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('savedMoviesChanged', handleSavedMoviesChange);
    };
  }, []);

  const handleSearch = async (
    movieNames: string[],
    directorNames: string[],
    filters: SearchFilters
  ) => {
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      const results = await searchMoviesAndDirectors(movieNames, directorNames, filters);
      setMovies(results.movies);
    } catch (error) {
      console.error('Search failed:', error);
      setMovies([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMovies([]);
    setSelectedMovie(null);
    setHasSearched(false);
  };

  const handleMovieClick = (movie: MovieDetailsType) => {
    setSelectedMovie(movie);
  };

  const handleSavedMovieClick = async (movieId: number) => {
    try {
      const movieDetails = await getMovieDetails(movieId);
      // Busca dados completos do filme
      const fullMovie = {
        id: movieId,
        title: movieDetails.title || 'Título não disponível',
        overview: movieDetails.overview || '',
        poster_path: movieDetails.poster_path || null,
        backdrop_path: movieDetails.backdrop_path || null,
        release_date: movieDetails.release_date || '',
        vote_average: movieDetails.vote_average || 0,
        vote_count: movieDetails.vote_count || 0,
        popularity: movieDetails.popularity || 0,
        adult: movieDetails.adult || false,
        original_language: movieDetails.original_language || '',
        original_title: movieDetails.original_title || '',
        video: movieDetails.video || false,
        genre_ids: movieDetails.genre_ids || [],
        genres: movieDetails.genres || [],
        ...movieDetails
      } as MovieDetailsType;
      
      setSelectedMovie(fullMovie);
    } catch (error) {
      console.error('Failed to load movie details:', error);
    }
  };

  const handleCloseDetails = () => {
    setSelectedMovie(null);
  };

  const handleFilesProcessed = (movieNames: string[], directorNames: string[]) => {
    // Auto-search with uploaded files
    const defaultFilters: SearchFilters = {
      genres: [],
      yearStart: 1950,
      yearEnd: new Date().getFullYear(),
      sortBy: 'popularity.desc',
      region: 'BR'
    };
    
    handleSearch(movieNames, directorNames, defaultFilters);
  };

  if (currentPage === 'about') {
    return (
      <>
        <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
        <AboutPage />
      </>
    );
  }

  if (currentPage === 'contact') {
    return (
      <>
        <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
        <ContactPage />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
      
      <div className="flex flex-col md:flex-row">
        {/* Sidebar - Full width no mobile, fixed width no desktop */}
        <div className="w-full md:w-80 bg-slate-800 border-b md:border-r md:border-b-0 border-slate-700 overflow-y-auto h-auto md:h-screen">
          <SearchSidebar
            onSearch={handleSearch}
            onFilesProcessed={handleFilesProcessed}
            onReset={handleReset}
            isLoading={isLoading}
          />
        </div>
        
        <main className="flex-1 p-3 md:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Film className="text-blue-400" size={32} />
                  <h1 className="text-2xl font-bold text-white">
                    Resultados da Busca
                  </h1>
                </div>
                
                {movies.length > 0 && (
                  <div className="flex items-center gap-4">
                    <PDFExport movies={movies} />
                    
                    <div className="hidden md:flex items-center gap-2">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-colors ${
                          viewMode === 'grid'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        <Grid size={20} />
                      </button>
                      <button
                        onClick={() => setViewMode('table')}
                        className={`p-2 rounded-md transition-colors ${
                          viewMode === 'table'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        <List size={20} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {movies.length > 0 && (
                <p className="text-slate-400">
                  Encontrados {movies.length} filmes
                </p>
              )}
            </div>
            
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-white">Buscando filmes...</span>
              </div>
            )}
            
            {!isLoading && movies.length > 0 && (
              <>
                <DataVisualizationDashboard movies={movies} />
                
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mb-8">
                    {movies.map((movie) => (
                      <MovieCard
                        key={movie.id}
                        movie={movie}
                        onClick={() => handleMovieClick(movie)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mb-8">
                    <MovieTable
                      movies={movies}
                      onMovieClick={handleMovieClick}
                    />
                  </div>
                )}

                <RecommendationEngine 
                  watchedMovies={movies}
                  onMovieClick={handleMovieClick}
                />
              </>
            )}
            
            {!isLoading && hasSearched && movies.length === 0 && (
              <div className="text-center py-12">
                <Film className="mx-auto text-slate-600 mb-4" size={64} />
                <h2 className="text-lg md:text-xl font-semibold text-white mb-2">
                  Nenhum filme encontrado
                </h2>
                <p className="text-slate-400">
                  Tente ajustar os critérios de busca ou filtros
                </p>
              </div>
            )}
            
            {!isLoading && !hasSearched && (
              <div className="text-center py-12">
                <Film className="mx-auto text-slate-600 mb-4" size={64} />
                <h2 className="text-lg md:text-xl font-semibold text-white mb-2">
                  Bem-vindo ao QualPlay
                </h2>
                <p className="text-slate-400 mb-6 text-sm md:text-base px-4">
                  Use a barra lateral para pesquisar filmes por título, diretor ou descobrir novos filmes com filtros avançados
                </p>
                <div className="max-w-2xl mx-auto px-4">
                  <RecommendationEngine 
                    watchedMovies={[]}
                    onMovieClick={handleMovieClick}
                  />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      
      <SavedMovies 
        onMovieClick={handleSavedMovieClick} 
        savedCount={savedMoviesCount}
      />
      {selectedMovie && (
        <MovieDetails
          movie={selectedMovie}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
}

export default App;