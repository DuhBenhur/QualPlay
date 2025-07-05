import React from 'react';
import { Star, Calendar, User, Play, Tv } from 'lucide-react';
import { MovieDetails } from '../types/movie';
import { getImageUrl } from '../services/tmdbApi';

interface MovieCardProps {
  movie: MovieDetails;
  onClick: () => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick }) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data não informada';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

  const formatGenres = (genres: any[]) => {
    if (!genres || !Array.isArray(genres) || genres.length === 0) return 'Gênero não informado';
    return genres.map(g => g?.name || 'Desconhecido').join(', ');
  };

  const getStreamingBadgeColor = (service: string) => {
    const lowerService = service.toLowerCase();
    if (lowerService.includes('netflix')) return 'bg-red-600';
    if (lowerService.includes('amazon') || lowerService.includes('prime')) return 'bg-blue-600';
    if (lowerService.includes('disney')) return 'bg-blue-800';
    if (lowerService.includes('hbo') || lowerService.includes('max')) return 'bg-purple-600';
    if (lowerService.includes('paramount')) return 'bg-blue-500';
    if (lowerService.includes('apple')) return 'bg-gray-800';
    if (lowerService.includes('globoplay')) return 'bg-blue-700';
    if (lowerService.includes('telecine')) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  const parseStreamingServices = (services: string) => {
    if (!services || services === 'Não disponível' || services === 'N/A') return [];
    return services.split(',').map(s => s.trim()).slice(0, 3);
  };

  // Garantir que os dados existem antes de renderizar
  const safeMovie = {
    id: movie?.id || 0,
    title: movie?.title || 'Título não disponível',
    overview: movie?.overview || '',
    poster_path: movie?.poster_path || null,
    release_date: movie?.release_date || '',
    vote_average: movie?.vote_average || 0,
    genres: movie?.genres || [],
    director: movie?.director || 'Não informado',
    streaming_services: movie?.streaming_services || 'Não disponível'
  };

  return (
    <div
      onClick={onClick}
      className="bg-slate-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105"
    >
      <div className="relative">
        <img
          src={getImageUrl(safeMovie.poster_path)}
          alt={safeMovie.title}
          className="w-full h-80 object-cover"
          onError={(e) => {
            e.currentTarget.src = '/placeholder-movie.jpg';
          }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-all duration-300 flex items-center justify-center">
          <Play className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" size={48} />
        </div>
        <div className="absolute top-3 right-3 bg-black bg-opacity-75 rounded-full px-2 py-1 flex items-center gap-1">
          <Star className="text-yellow-400 fill-current" size={14} />
          <span className="text-white text-sm font-medium">
            {safeMovie.vote_average.toFixed(1)}
          </span>
        </div>
        
        {/* Streaming Services Badge */}
        <div className="absolute top-3 left-3">
          {safeMovie.streaming_services && safeMovie.streaming_services !== 'Não disponível' && safeMovie.streaming_services !== 'N/A' ? (
            <div className="flex flex-col gap-1">
              {parseStreamingServices(safeMovie.streaming_services).map((service, index) => (
                <div
                  key={index}
                  className={`${getStreamingBadgeColor(service)} text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg`}
                >
                  {service}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg">
              Não disponível
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">
          {safeMovie.title}
        </h3>
        
        {/* Streaming Info Destacada */}
        <div className="mb-3 p-2 bg-slate-700 rounded-md">
          <div className="flex items-center gap-2 text-sm">
            <Tv className="text-blue-400" size={14} />
            <span className="text-blue-400 font-medium">Disponível em:</span>
          </div>
          <p className="text-white text-sm mt-1">
            {safeMovie.streaming_services && safeMovie.streaming_services !== 'N/A' 
              ? safeMovie.streaming_services 
              : 'Não disponível'
            }
          </p>
        </div>
        
        <div className="space-y-2 text-sm text-slate-300">
          <div className="flex items-center gap-2">
            <Calendar size={14} />
            <span>{formatDate(safeMovie.release_date)}</span>
          </div>
          
          {safeMovie.director && safeMovie.director !== 'N/A' && (
            <div className="flex items-center gap-2">
              <User size={14} />
              <span>{safeMovie.director}</span>
            </div>
          )}
          
          <div className="text-slate-400">
            {formatGenres(safeMovie.genres)}
          </div>
        </div>
        
        {safeMovie.overview && (
          <p className="text-slate-400 text-sm mt-3 line-clamp-3">
            {safeMovie.overview}
          </p>
        )}
      </div>
    </div>
  );
};

export default MovieCard;