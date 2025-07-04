import React from 'react';
import { Star, Calendar, User, Eye } from 'lucide-react';
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
                    {movie.director || 'N/A'}
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