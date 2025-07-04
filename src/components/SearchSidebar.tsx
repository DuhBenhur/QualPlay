import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Filter, Calendar, Star, TrendingUp, BarChart3 } from 'lucide-react';
import { Genre, SearchFilters } from '../types/movie';
import { getGenres } from '../services/tmdbApi';

interface SearchSidebarProps {
  onSearch: (movieNames: string[], directorNames: string[], filters: SearchFilters) => void;
  onReset: () => void;
  isLoading: boolean;
}

const SearchSidebar: React.FC<SearchSidebarProps> = ({ onSearch, onReset, isLoading }) => {
  const [movieNames, setMovieNames] = useState<string[]>([]);
  const [directorNames, setDirectorNames] = useState<string[]>([]);
  const [movieInput, setMovieInput] = useState('');
  const [directorInput, setDirectorInput] = useState('');
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [yearStart, setYearStart] = useState(1950);
  const [yearEnd, setYearEnd] = useState(new Date().getFullYear());
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadGenres();
  }, []);

  const loadGenres = async () => {
    try {
      const genreList = await getGenres();
      setGenres(genreList);
    } catch (error) {
      console.error('Failed to load genres:', error);
    }
  };

  const addMovie = () => {
    if (movieInput.trim() && !movieNames.includes(movieInput.trim())) {
      setMovieNames([...movieNames, movieInput.trim()]);
      setMovieInput('');
    }
  };

  const addDirector = () => {
    if (directorInput.trim() && !directorNames.includes(directorInput.trim())) {
      setDirectorNames([...directorNames, directorInput.trim()]);
      setDirectorInput('');
    }
  };

  const removeMovie = (index: number) => {
    setMovieNames(movieNames.filter((_, i) => i !== index));
  };

  const removeDirector = (index: number) => {
    setDirectorNames(directorNames.filter((_, i) => i !== index));
  };

  const handleGenreToggle = (genreId: number) => {
    setSelectedGenres(prev => 
      prev.includes(genreId) 
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    );
  };

  const handleSearch = () => {
    const filters: SearchFilters = {
      genres: selectedGenres,
      yearStart,
      yearEnd,
      sortBy,
      region: 'BR'
    };
    onSearch(movieNames, directorNames, filters);
  };

  const handleReset = () => {
    setMovieNames([]);
    setDirectorNames([]);
    setMovieInput('');
    setDirectorInput('');
    setSelectedGenres([]);
    setYearStart(1950);
    setYearEnd(new Date().getFullYear());
    setSortBy('popularity.desc');
    onReset();
  };

  const sortOptions = [
    { value: 'popularity.desc', label: 'Popularidade (Maior)', icon: TrendingUp },
    { value: 'popularity.asc', label: 'Popularidade (Menor)', icon: TrendingUp },
    { value: 'release_date.desc', label: 'Mais Recente', icon: Calendar },
    { value: 'release_date.asc', label: 'Mais Antigo', icon: Calendar },
    { value: 'vote_average.desc', label: 'Melhor Avaliado', icon: Star },
    { value: 'vote_average.asc', label: 'Pior Avaliado', icon: Star },
    { value: 'revenue.desc', label: 'Maior Bilheteria', icon: BarChart3 },
  ];

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <img 
            src="/seu_logo.png" 
            alt="Eduardo Ben-Hur Logo" 
            className="w-12 h-12 rounded-full"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div>
            <h1 className="text-xl font-bold text-white">Qual Play</h1>
            <p className="text-slate-400 text-sm">by Eduardo Ben-Hur</p>
          </div>
        </div>
      </div>

      {/* Basic Search */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Busca Básica</h2>
        
        {/* Movie Names */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Nomes dos Filmes
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={movieInput}
              onChange={(e) => setMovieInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addMovie()}
              placeholder="Digite o nome do filme"
              className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addMovie}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {movieNames.map((name, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded-full"
              >
                {name}
                <button
                  onClick={() => removeMovie(index)}
                  className="hover:text-red-300"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Director Names */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Nomes dos Diretores
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={directorInput}
              onChange={(e) => setDirectorInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addDirector()}
              placeholder="Digite o nome do diretor"
              className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addDirector}
              className="px-3 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {directorNames.map((name, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-amber-600 text-white text-xs rounded-full"
              >
                {name}
                <button
                  onClick={() => removeDirector(index)}
                  className="hover:text-red-300"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-lg font-semibold text-white mb-4 hover:text-blue-400 transition-colors"
        >
          <Filter size={20} />
          Filtros Avançados
        </button>

        {showFilters && (
          <div className="space-y-4">
            {/* Genres */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Gêneros
              </label>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {genres.map((genre) => (
                  <label key={genre.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedGenres.includes(genre.id)}
                      onChange={() => handleGenreToggle(genre.id)}
                      className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-300">{genre.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Year Range */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Intervalo de Anos
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={yearStart}
                  onChange={(e) => setYearStart(Number(e.target.value))}
                  min="1900"
                  max="2024"
                  className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  value={yearEnd}
                  onChange={(e) => setYearEnd(Number(e.target.value))}
                  min="1900"
                  max="2024"
                  className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Ordenar por
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Search size={20} />
          {isLoading ? 'Buscando...' : 'Buscar Filmes'}
        </button>

        <button
          onClick={handleReset}
          className="w-full px-4 py-3 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors"
        >
          Nova Busca (Limpar Tudo)
        </button>
      </div>
    </div>
  );
};

export default SearchSidebar;