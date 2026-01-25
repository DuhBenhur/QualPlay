import React, { useState, useEffect } from 'react';
import { List, Filter, Check, Eye, Clock3, EyeOff, Star, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';


import { getMyMovies, removeFromMyList } from '../services/userMovieService';
import { getImageUrl } from '../services/tmdbApi';

// ... interface UserMovie (mantendo, mas mapeando dados)

interface UserMovieListProps {
  onMovieClick: (movieId: number) => void;
}

const UserMovieList: React.FC<UserMovieListProps> = ({ onMovieClick }) => {
  const { user } = useAuth();
  const [movies, setMovies] = useState<any[]>([]); // Usando any por enquanto para compatibilidade com dados retornados
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [expandedMovie, setExpandedMovie] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserMovies = async () => {
      // Se não houver usuário, não tente buscar filmes
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Criar um timeout para não ficar carregando infinitamente
        const timeoutPromise = new Promise<{ data: any[], error?: string }>((_, reject) => {
          setTimeout(() => reject(new Error('Timeout de conexão')), 5000);
        });

        const fetchPromise = getMyMovies(user.id);

        // getMyMovies retorna { data, error }
        const result = await Promise.race([fetchPromise, timeoutPromise]) as { data: any[], error?: string };
        const { data, error } = result;

        if (error) throw new Error(error);

        // Mapear para o formato esperado pelo componente
        const adaptedMovies = (data || []).map(m => ({
          id: m.id,
          movie_id: m.movie_id,
          movie_title: m.movie_title,
          movie_poster: m.movie_poster,
          status: 'want_to_watch', // Default para itens da lista
          rating: m.userRating || null,
          watched_at: null,
          created_at: m.added_at
        }));

        setMovies(adaptedMovies);
      } catch (error) {
        console.error('Error fetching user movies:', error);
        // Em caso de erro/timeout, paramos o loading para mostrar estado vazio ou erro
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserMovies();
  }, [user, statusFilter]);

  // Se não houver usuário, não renderize nada
  const handleRemoveMovie = async (e: React.MouseEvent, movieId: number) => {
    e.stopPropagation();

    if (confirm('Tem certeza que deseja remover este filme da sua lista?')) {
      try {
        const { error } = await removeFromMyList(user!.id, movieId);
        if (error) throw new Error(error);

        setMovies(movies.filter(m => m.movie_id !== movieId));
      } catch (error) {
        console.error('Error removing movie:', error);
        alert('Erro ao remover filme');
      }
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'watched':
        return <Check className="text-green-500" size={16} />;
      case 'want_to_watch':
        return <Eye className="text-blue-500" size={16} />;
      case 'watching':
        return <Clock3 className="text-yellow-500" size={16} />;
      case 'dropped':
        return <EyeOff className="text-red-500" size={16} />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'watched':
        return 'Assistido';
      case 'want_to_watch':
        return 'Quero Assistir';
      case 'watching':
        return 'Assistindo';
      case 'dropped':
        return 'Abandonei';
      default:
        return 'Desconhecido';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'watched':
        return 'bg-green-500';
      case 'want_to_watch':
        return 'bg-blue-500';
      case 'watching':
        return 'bg-yellow-500';
      case 'dropped':
        return 'bg-red-500';
      default:
        return 'bg-slate-500';
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-white">Carregando sua lista...</span>
        </div>
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 mb-6">
        <div className="text-center py-4">
          <List className="mx-auto text-slate-600 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-white mb-2">
            Sua Lista de Filmes
          </h3>
          <p className="text-slate-400 mb-4">
            Você ainda não tem filmes na sua lista. Adicione filmes para acompanhar seu progresso.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <List className="text-blue-400" size={24} />
          <h3 className="text-xl font-semibold text-white">
            Sua Lista de Filmes
          </h3>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter(null)}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${statusFilter === null
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
          >
            Todos
          </button>
          <button
            onClick={() => setStatusFilter('watched')}
            className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm transition-colors ${statusFilter === 'watched'
              ? 'bg-green-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
          >
            <Check size={14} />
            <span className="hidden md:inline">Assistidos</span>
          </button>
          <button
            onClick={() => setStatusFilter('want_to_watch')}
            className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm transition-colors ${statusFilter === 'want_to_watch'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
          >
            <Eye size={14} />
            <span className="hidden md:inline">Quero Assistir</span>
          </button>
          <button
            onClick={() => setStatusFilter('watching')}
            className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm transition-colors ${statusFilter === 'watching'
              ? 'bg-yellow-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
          >
            <Clock3 size={14} />
            <span className="hidden md:inline">Assistindo</span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {movies.map((movie) => (
          <div
            key={movie.id}
            className="bg-slate-700 rounded-lg overflow-hidden hover:bg-slate-600 transition-colors"
          >
            <div
              className="flex items-center cursor-pointer p-3"
              onClick={() => onMovieClick(movie.movie_id)}
            >
              <img
                src={getImageUrl(movie.movie_poster)}
                alt={movie.movie_title}
                className="w-12 h-16 object-cover rounded"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-movie.jpg';
                }}
              />

              <div className="ml-3 flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-white font-medium">{movie.movie_title}</h4>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(movie.status)}
                        <span>{getStatusText(movie.status)}</span>
                      </div>
                      {movie.watched_at && (
                        <span>• {formatDate(movie.watched_at)}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {movie.rating && (
                      <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded">
                        <Star className="text-yellow-500 fill-current" size={14} />
                        <span className="text-white text-sm font-medium">{movie.rating}</span>
                      </div>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedMovie(expandedMovie === movie.id ? null : movie.id);
                      }}
                      className="p-1 text-slate-400 hover:text-white transition-colors"
                    >
                      {expandedMovie === movie.id ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </button>

                    <button
                      onClick={(e) => handleRemoveMovie(e, movie.movie_id)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedMovie === movie.id && (
              <div className="p-3 pt-0 border-t border-slate-600">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-slate-600 rounded p-2">
                    <span className="text-slate-400">Status:</span>
                    <div className="flex items-center gap-1 mt-1">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(movie.status)}`}></div>
                      <span className="text-white">{getStatusText(movie.status)}</span>
                    </div>
                  </div>

                  <div className="bg-slate-600 rounded p-2">
                    <span className="text-slate-400">Adicionado em:</span>
                    <div className="text-white mt-1">{formatDate(movie.created_at)}</div>
                  </div>

                  {movie.watched_at && (
                    <div className="bg-slate-600 rounded p-2">
                      <span className="text-slate-400">Assistido em:</span>
                      <div className="text-white mt-1">{formatDate(movie.watched_at)}</div>
                    </div>
                  )}

                  {movie.rating && (
                    <div className="bg-slate-600 rounded p-2">
                      <span className="text-slate-400">Sua avaliação:</span>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="text-yellow-500 fill-current" size={14} />
                        <span className="text-white font-medium">{movie.rating}/10</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => onMovieClick(movie.movie_id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    Ver Detalhes
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserMovieList;