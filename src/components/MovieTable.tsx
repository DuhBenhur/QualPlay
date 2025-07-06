import React from 'react';
import { Star, Calendar, User, Eye, Tv } from 'lucide-react';
import { MovieDetails } from '../types/movie';
import { getImageUrl } from '../services/tmdbApi';

interface MovieTableProps {
  movies: MovieDetails[];
  onMovieClick: (movie: MovieDetails) => void;
}

const MovieTable: React.FC<MovieTableProps> = ({ movies, onMovieClick }) => {
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
    return 'bg-green-600';
  };

  const parseStreamingServices = (services: string) => {
    if (!services || services === 'Não disponível') return [];
    return services.split(',').map(s => s.trim()).slice(0, 2); // Máximo 2 na tabela
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

  const handleStreamingClick = (e: React.MouseEvent, service: string, movieTitle: string) => {
    e.stopPropagation();
    const url = getStreamingUrl(service, movieTitle);
    window.open(url, '_blank');
  };

  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Pôster
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Filme
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Ano
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Gênero
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Diretor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Streaming
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Avaliação
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {movies.map((movie) => (
              <tr key={movie.id} className="hover:bg-slate-700 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <img
                    src={getImageUrl(movie.poster_path)}
                    alt={movie.title}
                    className="w-16 h-24 object-cover rounded-md"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-movie.jpg';
                    }}
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-white">
                    {movie.title}
                  </div>
                  {movie.overview && (
                    <div className="text-sm text-slate-400 mt-1 line-clamp-2">
                      {movie.overview}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Calendar size={14} />
                    {formatDate(movie.release_date)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-300">
                    {formatGenres(movie.genres)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <User size={14} />
                    {movie.director || 'Não informado'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    {movie.streaming_services && movie.streaming_services !== 'Não disponível' ? (
                      parseStreamingServices(movie.streaming_services).map((service, index) => (
                        <button
                          key={index}
                          onClick={(e) => handleStreamingClick(e, service, movie.title)}
                          className={`${getStreamingBadgeColor(service)} text-white text-xs px-2 py-1 rounded-full font-medium inline-block w-fit hover:scale-105 transition-transform cursor-pointer border border-white/20 hover:border-white/40`}
                          title={`Assistir ${movie.title} no ${service}`}
                        >
                          🎬 {service}
                        </button>
                      ))
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Tv size={14} />
                        <span>Não disponível</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Star className="text-yellow-400 fill-current" size={16} />
                    <span className="text-white font-medium text-sm">
                      {movie.vote_average.toFixed(1)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onMovieClick(movie)}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Eye size={14} />
                    Detalhes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MovieTable;