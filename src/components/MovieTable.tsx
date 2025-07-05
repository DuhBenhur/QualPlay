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
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatGenres = (genres: any[]) => {
    if (!genres || genres.length === 0) return 'Gênero não informado';
    return genres.map(g => g.name).join(', ');
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
    return 'bg-green-600'; // Cor padrão para outros serviços
  };

  const parseStreamingServices = (services: string) => {
    if (!services || services === 'Não disponível') return [];
    return services.split(',').map(s => s.trim()).slice(0, 3); // Máximo 3 serviços
  };

  return (
    <div
      onClick={onClick}
      className="bg-slate-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105"
    >
      <div className="relative">
        <img
          src={getImageUrl(movie.poster_path)}
          alt={movie.title}
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
            {movie.vote_average.toFixed(1)}
          </span>
        </div>
        
        {/* Streaming Services Badge - Posição de destaque */}
        <div className="absolute top-3 left-3">
          {movie.streaming_services && movie.streaming_services !== 'Não disponível' ? (
            <div className="flex flex-col gap-1">
              {parseStreamingServices(movie.streaming_services).map((service, index) => (
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
          {movie.title}
        </h3>
        
        {/* Streaming Info Destacada */}
        <div className="mb-3 p-2 bg-slate-700 rounded-md">
          <div className="flex items-center gap-2 text-sm">
            <Tv className="text-blue-400" size={14} />
            <span className="text-blue-400 font-medium">Disponível em:</span>
          </div>
          <p className="text-white text-sm mt-1">{movie.streaming_services || 'Informação não disponível'}</p>
        </div>
        
        <div className="space-y-2 text-sm text-slate-300">
          <div className="flex items-center gap-2">
            <Calendar size={14} />
            <span>{formatDate(movie.release_date)}</span>
          </div>
          
          {movie.director && (
            <div className="flex items-center gap-2">
              <User size={14} />
              <span>{movie.director === 'N/A' ? 'Não informado' : movie.director}</span>
            </div>
          )}
          
          <div className="text-slate-400">
            {formatGenres(movie.genres)}
          </div>
        </div>
        
        {movie.overview && (
          <p className="text-slate-400 text-sm mt-3 line-clamp-3">
            {movie.overview}
          </p>
        )}
      </div>
    </div>
  );
};

export default MovieCard;