import React from 'react';
import { Star, Calendar, User, Play } from 'lucide-react';
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
      </div>
      
      <div className="p-4">
        <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">
          {movie.title}
        </h3>
        
        <div className="space-y-2 text-sm text-slate-300">
          <div className="flex items-center gap-2">
            <Calendar size={14} />
            <span>{formatDate(movie.release_date)}</span>
          </div>
          
          {movie.director && (
            <div className="flex items-center gap-2">
              <User size={14} />
              <span>{movie.director}</span>
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