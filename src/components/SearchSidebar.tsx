import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Filter, Calendar, Star, TrendingUp, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { Genre, SearchFilters } from '../types/movie';
import { getGenres } from '../services/tmdbApi';
import FileUpload from './FileUpload';

interface SearchSidebarProps {
  onSearch: (movieNames: string[], directorNames: string[], filters: SearchFilters) => void;
  onFilesProcessed: (movieNames: string[], directorNames: string[]) => void;
  onReset: () => void;
  isLoading: boolean;
}

const SearchSidebar: React.FC<SearchSidebarProps> = ({ onSearch, onFilesProcessed, onReset, isLoading }) => {
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
    setShowFilters(false);
    onReset();
  };

  const sortOptions = [
    { value: 'popularity.desc', label: 'Popularidade ↓' },
    { value: 'release_date.desc', label: 'Mais Recente' },
    { value: 'vote_average.desc', label: 'Melhor Avaliado' },
    { value: 'revenue.desc', label: 'Maior Bilheteria' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header Compacto */}
      <div className="p-3 md:p-4 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          <img 
            src="/seu_logo.png" 
            alt="Eduardo Ben-Hur Logo" 
            className="w-6 h-6 md:w-8 md:h-8 rounded-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="flex flex-col justify-center">
            <h1 className="text-base md:text-lg font-bold text-white">QualPlay</h1>
            <p className="text-slate-400 text-xs hidden md:block">by Eduardo Ben-Hur</p>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 md:p-4 space-y-4">
          
          {/* 🎯 BUSCA BÁSICA - PRIORIDADE PRINCIPAL */}
          <div className="space-y-4">
            <h2 className="text-base md:text-lg font-semibold text-white">Busca Básica</h2>
            
            {/* Movie Names */}
            <div>
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
                  className="flex-1 px-3 py-2 md:py-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                />
                <button
                  onClick={addMovie}
                  className="px-3 py-2 md:py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              {movieNames.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {movieNames.map((name, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded-full"
                    >
                      {name.length > 20 ? `${name.substring(0, 20)}...` : name}
                      <button
                        onClick={() => removeMovie(index)}
                        className="hover:text-red-300"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Director Names */}
            <div>
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
                  className="flex-1 px-3 py-2 md:py-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                />
                <button
                  onClick={addDirector}
                  className="px-3 py-2 md:py-3 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              {directorNames.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {directorNames.map((name, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-amber-600 text-white text-xs rounded-full"
                    >
                      {name.length > 20 ? `${name.substring(0, 20)}...` : name}
                      <button
                        onClick={() => removeDirector(index)}
                        className="hover:text-red-300"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 📁 UPLOAD DE LISTA - POSIÇÃO SECUNDÁRIA (CORRETA) */}
          <div className="border-t border-slate-600 pt-4">
            <FileUpload onFilesProcessed={onFilesProcessed} />
          </div>

          {/* Filtros Avançados - Colapsável no Mobile */}
          <div className="border-t border-slate-600 pt-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-between w-full p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                <Filter size={18} />
                <span className="text-white font-medium text-sm md:text-base">Filtros Avançados</span>
                <span className="text-slate-400 text-sm">
                  ({selectedGenres.length} gêneros)
                </span>
              </div>
              {showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {showFilters && (
              <div className="mt-3 space-y-4 bg-slate-700/30 rounded-lg p-3">
                {/* Gêneros - Grid Responsivo */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Gêneros ({selectedGenres.length} selecionados)
                  </label>
                  <div className="max-h-40 overflow-y-auto bg-slate-700/50 rounded p-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                      {genres.map((genre) => (
                        <label key={genre.id} className="flex items-center gap-2 cursor-pointer text-sm p-1">
                          <input
                            type="checkbox"
                            checked={selectedGenres.includes(genre.id)}
                            onChange={() => handleGenreToggle(genre.id)}
                            className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-slate-300">{genre.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Ano e Ordenação - Stack no Mobile */}
                <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Ano Inicial
                    </label>
                    <input
                      type="number"
                      value={yearStart}
                      onChange={(e) => setYearStart(Number(e.target.value))}
                      min="1900"
                      max="2024"
                      className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Ano Final
                    </label>
                    <input
                      type="number"
                      value={yearEnd}
                      onChange={(e) => setYearEnd(Number(e.target.value))}
                      min="1900"
                      max="2024"
                      className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Ordenar por
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        </div>
      </div>

      {/* Botões de Ação - Fixos no Bottom */}
      <div className="p-3 md:p-4 border-t border-slate-700 space-y-2 flex-shrink-0">
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 md:py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-base md:text-lg"
        >
          <Search size={20} />
          {isLoading ? 'Buscando...' : 'Buscar Filmes'}
        </button>

        <button
          onClick={handleReset}
          className="w-full px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors text-sm"
        >
          Nova Busca (Limpar Tudo)
        </button>

        {/* Dicas Compactas - Ocultas no Mobile */}
        <div className="hidden md:block p-2 bg-slate-700/50 rounded text-xs text-slate-400 text-center">
          💡 <strong>Dica:</strong> Digite nomes exatos para melhor precisão<br/>
          🎬 <strong>Upload:</strong> Arraste arquivo .txt/.csv para busca em lote<br/>
          ⚡ <strong>Performance:</strong> Máximo 20 resultados por busca
        </div>
      </div>
    </div>
  );
};

export default SearchSidebar;