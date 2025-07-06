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
    if (!dateString) return 'Data não informada';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

  const formatRuntime = (minutes: number) => {
    if (!minutes || minutes <= 0) return 'Duração não informada';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatCurrency = (amount: number) => {
    if (!amount || amount <= 0) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatGenres = (genres: any[]) => {
    if (!genres || !Array.isArray(genres) || genres.length === 0) return 'Gênero não informado';
    return genres.map(g => g?.name || 'Desconhecido').join(', ');
  };

  const getStreamingUrl = (service: string, movieTitle: string) => {
    const lowerService = service.toLowerCase();
    const searchQuery = encodeURIComponent(movieTitle);
    
    if (lowerService.includes('netflix')) {
      return `https://www.netflix.com/search?q=${searchQuery}`;
    }
    if (lowerService.includes('amazon') || lowerService.includes('prime')) {
      return `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${searchQuery}`;
    }
    if (lowerService.includes('disney')) {
      return `https://www.disneyplus.com/search?q=${searchQuery}`;
    }
    if (lowerService.includes('hbo') || lowerService.includes('max')) {
      return `https://play.max.com/search?q=${searchQuery}`;
    }
    if (lowerService.includes('paramount')) {
      return `https://www.paramountplus.com/search/?query=${searchQuery}`;
    }
    if (lowerService.includes('apple')) {
      return `https://tv.apple.com/search?term=${searchQuery}`;
    }
    if (lowerService.includes('globoplay')) {
      return `https://globoplay.globo.com/busca/?q=${searchQuery}`;
    }
    if (lowerService.includes('telecine')) {
      return `https://telecineplay.com.br/busca?q=${searchQuery}`;
    }
    
    return `https://www.google.com/search?q=${searchQuery}+${encodeURIComponent(service)}+assistir+online`;
  };

  const handleStreamingClick = (service: string) => {
    const url = getStreamingUrl(service, safeMovie.title);
    window.open(url, '_blank');
  };

  const handleWatchTrailer = () => {
    const searchQuery = `${movie.title} ${new Date(movie.release_date).getFullYear()} trailer`;
    const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
    window.open(youtubeUrl, '_blank');
  };

  const handleSaveMovie = () => {
    try {
      const savedMovies = JSON.parse(localStorage.getItem('savedMovies') || '[]');
      const isAlreadySaved = savedMovies.some((saved: any) => saved.id === movie.id);
      
      if (!isAlreadySaved) {
        savedMovies.push({
          id: movie.id,
          title: movie.title || 'Título não disponível',
          poster_path: movie.poster_path || null,
          vote_average: movie.vote_average || 0,
          release_date: movie.release_date || '',
          savedAt: new Date().toISOString(),
          streaming_services: movie.streaming_services && movie.streaming_services !== 'N/A' ? movie.streaming_services : 'Não disponível',
          director: movie.director && movie.director !== 'N/A' ? movie.director : 'Não informado',
          genres: movie.genres && Array.isArray(movie.genres) ? movie.genres.map(g => g.name).join(', ') : 'Não informado',
          overview: movie.overview || ''
        });
        localStorage.setItem('savedMovies', JSON.stringify(savedMovies));
        
        // Disparar evento customizado para atualizar outros componentes
        window.dispatchEvent(new CustomEvent('savedMoviesChanged'));
        
        alert('Filme salvo na sua lista!');
      } else {
        alert('Este filme já está na sua lista!');
      }
    } catch (error) {
      console.error('Erro ao salvar filme:', error);
      alert('Erro ao salvar filme. Tente novamente.');
    }
  };

  // Garantir que os dados existem
  const safeMovie = {
    id: movie?.id || 0,
    title: movie?.title || 'Título não disponível',
    overview: movie?.overview || 'Sinopse não disponível',
    poster_path: movie?.poster_path || null,
    backdrop_path: movie?.backdrop_path || null,
    release_date: movie?.release_date || '',
    vote_average: movie?.vote_average || 0,
    vote_count: movie?.vote_count || 0,
    runtime: movie?.runtime || 0,
    budget: movie?.budget || 0,
    revenue: movie?.revenue || 0,
    genres: movie?.genres || [],
    director: movie?.director || 'Não informado',
    cast: movie?.cast || 'Não informado',
    streaming_services: movie?.streaming_services || 'Não disponível'
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
              src={getImageUrl(safeMovie.backdrop_path || safeMovie.poster_path, 'w1280')}
              alt={safeMovie.title}
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
                src={getImageUrl(safeMovie.poster_path)}
                alt={safeMovie.title}
                className="w-48 h-72 object-cover rounded-lg shadow-lg"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-movie.jpg';
                }}
              />
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{safeMovie.title}</h1>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="text-yellow-400 fill-current" size={20} />
                  <span className="text-white font-medium">
                    {safeMovie.vote_average.toFixed(1)}
                  </span>
                  <span className="text-slate-400">
                    ({safeMovie.vote_count.toLocaleString()} votos)
                  </span>
                </div>
                
                <div className="flex items-center gap-1 text-slate-300">
                  <Calendar size={16} />
                  <span>{formatDate(safeMovie.release_date)}</span>
                </div>
                
                {safeMovie.runtime > 0 && (
                  <div className="flex items-center gap-1 text-slate-300">
                    <Clock size={16} />
                    <span>{formatRuntime(safeMovie.runtime)}</span>
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-block bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                    {formatGenres(safeMovie.genres)}
                  </span>
                  {safeMovie.streaming_services && safeMovie.streaming_services !== 'Não disponível' && safeMovie.streaming_services !== 'N/A' && (
                    <span className="inline-block bg-green-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      <Users size={14} />
                      Disponível para assistir
                    </span>
                  )}
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Sinopse</h3>
                <p className="text-slate-300 leading-relaxed">{safeMovie.overview}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {safeMovie.director && safeMovie.director !== 'N/A' && safeMovie.director !== 'Não informado' && (
                  <div>
                    <h4 className="font-semibold text-white mb-1">Diretor</h4>
                    <p className="text-slate-300">{safeMovie.director}</p>
                  </div>
                )}
                
                {safeMovie.cast && safeMovie.cast !== 'N/A' && safeMovie.cast !== 'Não informado' && (
                  <div>
                    <h4 className="font-semibold text-white mb-1">Elenco Principal</h4>
                    <p className="text-slate-300">{safeMovie.cast}</p>
                  </div>
                )}
                
                {safeMovie.streaming_services && (
                  <div className="md:col-span-2">
                    <div className="bg-slate-700 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <Users className="text-green-400" size={20} />
                        Onde Assistir
                      </h4>
                      {safeMovie.streaming_services !== 'Não disponível' && safeMovie.streaming_services !== 'N/A' ? (
                        <div className="flex flex-wrap gap-3">
                          {safeMovie.streaming_services.split(',').map((service, index) => (
                            <button
                              key={index}
                              onClick={() => handleStreamingClick(service.trim())}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg border border-green-500/30 hover:border-green-400 flex items-center gap-2"
                              title={`Assistir ${safeMovie.title} no ${service.trim()}`}
                            >
                              <span className="text-lg">🎬</span>
                              <span>{service.trim()}</span>
                              <span className="text-xs opacity-75">→</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-slate-600 text-slate-400 px-4 py-3 rounded-lg text-sm">
                          📺 Não disponível em serviços de streaming
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {(safeMovie.budget > 0 || safeMovie.revenue > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {safeMovie.budget > 0 && (
                    <div>
                      <h4 className="font-semibold text-white mb-1">Orçamento</h4>
                      <p className="text-slate-300">{formatCurrency(safeMovie.budget)}</p>
                    </div>
                  )}
                  
                  {safeMovie.revenue > 0 && (
                    <div>
                      <h4 className="font-semibold text-white mb-1">Bilheteria</h4>
                      <p className="text-slate-300">{formatCurrency(safeMovie.revenue)}</p>
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
                  onClick={() => window.open(`https://www.themoviedb.org/movie/${safeMovie.id}`, '_blank')}
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