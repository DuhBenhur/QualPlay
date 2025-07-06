import React from 'react';
import { Star, Calendar, User, Play, Tv, Heart } from 'lucide-react';
import { MovieDetails } from '../types/movie';
import { getImageUrl } from '../services/tmdbApi';

interface MovieCardProps {
  movie: MovieDetails;
  onClick: () => void;
  onFavoriteToggle?: (movie: MovieDetails) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick, onFavoriteToggle }) => {
  const [isFavorite, setIsFavorite] = React.useState(false);

  // Verificar se o filme está nos favoritos
  React.useEffect(() => {
    const savedMovies = JSON.parse(localStorage.getItem('savedMovies') || '[]');
    const isMovieSaved = savedMovies.some((saved: any) => saved.id === movie.id);
    setIsFavorite(isMovieSaved);
  }, [movie.id]);

  // Escutar mudanças nos favoritos
  React.useEffect(() => {
    const handleSavedMoviesChange = () => {
      const savedMovies = JSON.parse(localStorage.getItem('savedMovies') || '[]');
      const isMovieSaved = savedMovies.some((saved: any) => saved.id === movie.id);
      setIsFavorite(isMovieSaved);
    };

    window.addEventListener('savedMoviesChanged', handleSavedMoviesChange);
    return () => window.removeEventListener('savedMoviesChanged', handleSavedMoviesChange);
  }, [movie.id]);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita abrir o modal
    
    try {
      const savedMovies = JSON.parse(localStorage.getItem('savedMovies') || '[]');
      
      if (isFavorite) {
        // Remover dos favoritos
        const updatedMovies = savedMovies.filter((saved: any) => saved.id !== movie.id);
        localStorage.setItem('savedMovies', JSON.stringify(updatedMovies));
        setIsFavorite(false);
      } else {
        // Adicionar aos favoritos
        const movieToSave = {
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
        };
        
        savedMovies.push(movieToSave);
        localStorage.setItem('savedMovies', JSON.stringify(savedMovies));
        setIsFavorite(true);
      }
      
      // Disparar evento para atualizar outros componentes
      window.dispatchEvent(new CustomEvent('savedMoviesChanged'));
      
      // Callback opcional
      if (onFavoriteToggle) {
        onFavoriteToggle(movie);
      }
    } catch (error) {
      console.error('Erro ao gerenciar favorito:', error);
    }
  };

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
    // 🎯 CORES BASEADAS NO TIPO DE DISPONIBILIDADE
    if (service.includes('(Incluído)')) {
      return 'bg-green-600'; // Verde = incluído na assinatura
    }
    if (service.includes('(Aluguel)')) {
      return 'bg-yellow-600'; // Amarelo = aluguel
    }
    if (service.includes('(Compra)')) {
      return 'bg-red-600'; // Vermelho = compra
    }
    
    // Fallback para cores por serviço (caso não tenha tipo)
    const lowerService = service.toLowerCase();
    if (lowerService.includes('netflix')) return 'bg-red-600';
    if (lowerService.includes('amazon') || lowerService.includes('prime')) return 'bg-blue-600';
    if (lowerService.includes('disney')) return 'bg-blue-800';
    if (lowerService.includes('hbo') || lowerService.includes('max')) return 'bg-purple-600';
    if (lowerService.includes('paramount')) return 'bg-blue-500';
    if (lowerService.includes('apple')) return 'bg-gray-800';
    if (lowerService.includes('globoplay')) return 'bg-blue-700';
    if (lowerService.includes('telecine')) return 'bg-yellow-600';
    return 'bg-gray-600';
  };

  const getStreamingIcon = (service: string) => {
    if (service.includes('(Incluído)')) return '✅'; // Incluído
    if (service.includes('(Aluguel)')) return '💰'; // Aluguel
    if (service.includes('(Compra)')) return '🛒'; // Compra
    return '🎬'; // Padrão
  };

  const parseStreamingServices = (services: string) => {
    if (!services || services === 'Não disponível' || services === 'N/A') return [];
    return services.split(',').map(s => s.trim()).slice(0, 3);
  };

  const getStreamingUrl = (service: string, movieTitle: string) => {
    const lowerService = service.toLowerCase();
    const searchQuery = encodeURIComponent(movieTitle);
    
    // URLs diretas para os serviços de streaming
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
    
    // Fallback: busca no Google
    return `https://www.google.com/search?q=${searchQuery}+${encodeURIComponent(service)}+assistir+online`;
  };

  const handleStreamingClick = (e: React.MouseEvent, service: string) => {
    e.stopPropagation(); // Evita abrir o modal do filme
    const url = getStreamingUrl(service, safeMovie.title);
    window.open(url, '_blank');
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
        
        {/* Botão de Favorito */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 left-3 bg-black bg-opacity-75 rounded-full p-2 hover:bg-opacity-90 transition-all duration-200 group"
          title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Heart 
            size={16} 
            className={`transition-all duration-200 ${
              isFavorite 
                ? 'text-red-500 fill-red-500 scale-110' 
                : 'text-white hover:text-red-400 group-hover:scale-110'
            }`}
          />
        </button>
        
        {/* Streaming Services Badge */}
        <div className="absolute top-16 left-3">
          {safeMovie.streaming_services && safeMovie.streaming_services !== 'Não disponível' && safeMovie.streaming_services !== 'N/A' ? (
            <div className="flex flex-col gap-1">
              {parseStreamingServices(safeMovie.streaming_services).map((service, index) => (
                <button
                  key={index}
                  onClick={(e) => handleStreamingClick(e, service)}
                  className={`${getStreamingBadgeColor(service)} text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-200 cursor-pointer border border-white/20 hover:border-white/40`}
                  title={`Assistir no ${service}`}
                >
                  <span className="flex items-center gap-1 text-xs">
                    {getStreamingIcon(service)} {service.replace(/\s*\([^)]*\)/, '')}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg opacity-60">
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
          {safeMovie.streaming_services && safeMovie.streaming_services !== 'N/A' && safeMovie.streaming_services !== 'Não disponível' ? (
            <div className="flex flex-wrap gap-1 mt-2">
              {parseStreamingServices(safeMovie.streaming_services).map((service, index) => (
                <button
                  key={index}
                  onClick={(e) => handleStreamingClick(e, service)}
                  className={`${getStreamingBadgeColor(service)} text-white text-xs px-2 py-1 rounded font-medium hover:scale-105 transition-transform cursor-pointer flex items-center gap-1`}
                  title={`Assistir no ${service}`}
                >
                  {getStreamingIcon(service)} {service.replace(/\s*\([^)]*\)/, '')}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm mt-1">Não disponível</p>
          )}
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