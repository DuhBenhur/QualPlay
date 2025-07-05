import React from 'react';
import { X, Star, Calendar, Clock, Users, Play, Download, ExternalLink } from 'lucide-react';
import { MovieDetails as MovieDetailsType } from '../types/movie';
import { getImageUrl } from '../services/tmdbApi';

interface MovieDetailsProps {
  movie: MovieDetailsType;
  onClose: () => void;
}

const MovieDetails: React.FC<MovieDetailsProps> = ({ movie, onClose }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatGenres = (genres: any[]) => {
    if (!genres || genres.length === 0) return 'Gênero não informado';
    return genres.map(g => g.name).join(', ');
  };

  const handleWatchTrailer = () => {
    // Busca trailer no YouTube
    const searchQuery = `${movie.title} ${new Date(movie.release_date).getFullYear()} trailer`;
    const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
    window.open(youtubeUrl, '_blank');
  };

  const handleSaveMovie = () => {
    // Salva no localStorage
    const savedMovies = JSON.parse(localStorage.getItem('savedMovies') || '[]');
    const isAlreadySaved = savedMovies.some((saved: any) => saved.id === movie.id);
    
    if (!isAlreadySaved) {
      savedMovies.push({
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        vote_average: movie.vote_average,
        release_date: movie.release_date,
        savedAt: new Date().toISOString(),
        streaming_services: movie.streaming_services,
        director: movie.director,
        genres: movie.genres?.map(g => g.name).join(', '),
        overview: movie.overview
      });
      localStorage.setItem('savedMovies', JSON.stringify(savedMovies));
      alert('Filme salvo na sua lista!');
    } else {
      alert('Este filme já está na sua lista!');
    }
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto w-full">
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 rounded-full p-2 text-white hover:bg-opacity-75 transition-colors"
          >
            <X size={24} />
          </button>
          
          <div className="relative">
            <img
              src={getImageUrl(movie.backdrop_path || movie.poster_path, 'w1280')}
              alt={movie.title}
              className="w-full h-64 object-cover"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-movie.jpg';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-800 to-transparent" />
          </div>
        </div>
        
        <div className="p-6 -mt-20 relative z-10">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <img
                src={getImageUrl(movie.poster_path)}
                alt={movie.title}
                className="w-48 h-72 object-cover rounded-lg shadow-lg"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-movie.jpg';
                }}
              />
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{movie.title}</h1>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="text-yellow-400 fill-current" size={20} />
                  <span className="text-white font-medium">
                    {movie.vote_average.toFixed(1)}
                  </span>
                  <span className="text-slate-400">
                    ({movie.vote_count.toLocaleString()} votos)
                  </span>
                </div>
                
                <div className="flex items-center gap-1 text-slate-300">
                  <Calendar size={16} />
                  <span>{formatDate(movie.release_date)}</span>
                </div>
                
                {movie.runtime && (
                  <div className="flex items-center gap-1 text-slate-300">
                    <Clock size={16} />
                    <span>{formatRuntime(movie.runtime)}</span>
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-block bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                    {formatGenres(movie.genres)}
                  </span>
                  {movie.streaming_services && movie.streaming_services !== 'Não disponível' && (
                    <span className="inline-block bg-green-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      <Tv size={14} />
                      Disponível para assistir
                    </span>
                  )}
                </div>
              </div>
              
              {movie.overview && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">Sinopse</h3>
                  <p className="text-slate-300 leading-relaxed">{movie.overview}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {movie.director && (
                  <div>
                    <h4 className="font-semibold text-white mb-1">Diretor</h4>
                    <p className="text-slate-300">{movie.director}</p>
                  </div>
                )}
                
                {movie.cast && (
                  <div>
                    <h4 className="font-semibold text-white mb-1">Elenco Principal</h4>
                    <p className="text-slate-300">{movie.cast}</p>
                  </div>
                )}
                
                {movie.streaming_services && (
                  <div className="md:col-span-2">
                    <div className="bg-slate-700 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <Tv className="text-green-400" size={20} />
                        Onde Assistir
                      </h4>
                      {movie.streaming_services !== 'Não disponível' ? (
                        <div className="flex flex-wrap gap-2">
                          {movie.streaming_services.split(',').map((service, index) => (
                            <span
                              key={index}
                              className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium"
                            >
                              {service.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400">Não disponível em serviços de streaming no momento</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {(movie.budget > 0 || movie.revenue > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {movie.budget > 0 && (
                    <div>
                      <h4 className="font-semibold text-white mb-1">Orçamento</h4>
                      <p className="text-slate-300">{formatCurrency(movie.budget)}</p>
                    </div>
                  )}
                  
                  {movie.revenue > 0 && (
                    <div>
                      <h4 className="font-semibold text-white mb-1">Bilheteria</h4>
                      <p className="text-slate-300">{formatCurrency(movie.revenue)}</p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex gap-3">
                <button 
                  onClick={handleWatchTrailer}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Play size={16} />
                  Assistir Trailer
                </button>
                <button 
                  onClick={handleSaveMovie}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Download size={16} />
                  Salvar
                </button>
                <button 
                  onClick={() => window.open(`https://www.themoviedb.org/movie/${movie.id}`, '_blank')}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors"
                >
                  <ExternalLink size={16} />
                  Ver no TMDB
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetails;