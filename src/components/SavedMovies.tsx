import React, { useState, useEffect } from 'react';
import { Heart, X, Play, Calendar, Star } from 'lucide-react';
import { getImageUrl } from '../services/tmdbApi';

interface SavedMovie {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  release_date: string;
  savedAt: string;
}

interface SavedMoviesProps {
  onMovieClick: (movieId: number) => void;
}

const SavedMovies: React.FC<SavedMoviesProps> = ({ onMovieClick }) => {
  const [savedMovies, setSavedMovies] = useState<SavedMovie[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadSavedMovies();
  }, []);

  const loadSavedMovies = () => {
    const saved = JSON.parse(localStorage.getItem('savedMovies') || '[]');
    setSavedMovies(saved);
  };

  const removeSavedMovie = (movieId: number) => {
    const updated = savedMovies.filter(movie => movie.id !== movieId);
    setSavedMovies(updated);
    localStorage.setItem('savedMovies', JSON.stringify(updated));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-red-600 text-white p-4 rounded-full shadow-lg hover:bg-red-700 transition-colors z-40"
      >
        <Heart size={24} />
        {savedMovies.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
            {savedMovies.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto w-full">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="text-red-400" size={24} />
              <h2 className="text-xl font-bold text-white">
                Filmes Salvos ({savedMovies.length})
              </h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {savedMovies.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="mx-auto text-slate-600 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-white mb-2">
                Nenhum filme salvo ainda
              </h3>
              <p className="text-slate-400">
                Salve filmes clicando no botão "Salvar" nos detalhes do filme
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedMovies.map((movie) => (
                <div
                  key={movie.id}
                  className="bg-slate-700 rounded-lg overflow-hidden hover:bg-slate-600 transition-colors"
                >
                  <div className="relative">
                    <img
                      src={getImageUrl(movie.poster_path)}
                      alt={movie.title}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-movie.jpg';
                      }}
                    />
                    <button
                      onClick={() => removeSavedMovie(movie.id)}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-white font-medium mb-2 line-clamp-2">
                      {movie.title}
                    </h3>
                    
                    <div className="flex items-center justify-between text-sm text-slate-400 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(movie.release_date)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="text-yellow-400 fill-current" size={14} />
                        {movie.vote_average.toFixed(1)}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        onMovieClick(movie.id);
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Play size={14} />
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedMovies;