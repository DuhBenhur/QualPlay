import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Star, Calendar, Filter } from 'lucide-react';
import { MovieDetails } from '../types/movie';
import { discoverMovies } from '../services/tmdbApi';
import MovieCard from './MovieCard';

interface RecommendationEngineProps {
  watchedMovies: MovieDetails[];
  onMovieClick: (movie: MovieDetails) => void;
}

const RecommendationEngine: React.FC<RecommendationEngineProps> = ({ 
  watchedMovies, 
  onMovieClick 
}) => {
  const [recommendations, setRecommendations] = useState<MovieDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendationType, setRecommendationType] = useState<'smart' | 'trending' | 'recent' | 'quality'>('smart');

  useEffect(() => {
    generateRecommendations();
  }, [watchedMovies, recommendationType]);

  const generateRecommendations = async () => {
    setIsLoading(true);
    
    try {
      let filters;
      
      switch (recommendationType) {
        case 'smart':
          // Recomendação inteligente baseada nos filmes assistidos
          if (watchedMovies.length > 0) {
            const genreCount = watchedMovies.reduce((acc, movie) => {
              // Só conta gêneros válidos (não vazios)
              if (movie.genres && movie.genres.length > 0) {
                movie.genres.forEach(genre => {
                  if (genre.id && genre.name) {
                    acc[genre.id] = (acc[genre.id] || 0) + 1;
                  }
                });
              }
              return acc;
            }, {} as Record<number, number>);
            
            // Pega os 2 gêneros mais comuns
            const topGenres = Object.entries(genreCount)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 2)
              .map(([id]) => parseInt(id));
            
            // Se não encontrou gêneros válidos, usa gêneros populares
            const fallbackGenres = topGenres.length > 0 ? topGenres : [28, 35, 18]; // Ação, Comédia, Drama
            
            filters = {
              genres: fallbackGenres,
              yearStart: 2015, // Filmes mais recentes
              yearEnd: new Date().getFullYear(),
              sortBy: 'vote_average.desc', // Ordenar por avaliação
              region: 'BR'
            };
          } else {
            // Se não há filmes assistidos, mostra filmes bem avaliados e populares
            filters = {
              genres: [28, 35, 18], // Ação, Comédia, Drama
              yearStart: 2020,
              yearEnd: new Date().getFullYear(),
              sortBy: 'vote_average.desc',
              region: 'BR'
            };
          }
          break;
          
        case 'trending':
          filters = {
            genres: [], // Sem filtro de gênero para pegar variedade
            yearStart: 2023,
            yearEnd: new Date().getFullYear(),
            sortBy: 'popularity.desc',
            region: 'BR'
          };
          break;
          
        case 'recent':
          filters = {
            genres: [],
            yearStart: new Date().getFullYear() - 1,
            yearEnd: new Date().getFullYear(),
            sortBy: 'release_date.desc',
            region: 'BR'
          };
          break;
          
        case 'quality':
          // Filmes bem avaliados de todos os tempos
          filters = {
            genres: [],
            yearStart: 2010,
            yearEnd: new Date().getFullYear(),
            sortBy: 'vote_average.desc',
            region: 'BR'
          };
          break;
      }
      
      const results = await discoverMovies(filters);
      
      // Filtros de qualidade mais rigorosos
      let qualityMovies = results.movies.filter(movie => {
        // Remove filmes já assistidos
        const watchedIds = new Set(watchedMovies.map(m => m.id));
        if (watchedIds.has(movie.id)) return false;
        
        // Filtros de qualidade:
        // 1. Deve ter avaliação mínima
        if (movie.vote_average < 6.0) return false;
        
        // 2. Deve ter um número mínimo de votos (popularidade real)
        if (movie.vote_count < 100) return false;
        
        // 3. Deve ter gêneros definidos
        if (!movie.genres || movie.genres.length === 0) return false;
        
        // 4. Deve ter overview (sinopse)
        if (!movie.overview || movie.overview.trim().length < 50) return false;
        
        // 5. Deve ter poster
        if (!movie.poster_path) return false;
        
        // 6. Não deve ser filme adulto
        if (movie.adult) return false;
        
        return true;
      });
      
      // Se ainda não temos filmes suficientes, relaxa alguns critérios
      if (qualityMovies.length < 4) {
        qualityMovies = results.movies.filter(movie => {
          const watchedIds = new Set(watchedMovies.map(m => m.id));
          if (watchedIds.has(movie.id)) return false;
          
          // Critérios mais relaxados
          if (movie.vote_average < 5.5) return false;
          if (movie.vote_count < 50) return false;
          if (!movie.genres || movie.genres.length === 0) return false;
          if (movie.adult) return false;
          
          return true;
        });
      }
      
      // Diversifica as recomendações por gênero
      const diversifiedMovies = diversifyByGenre(qualityMovies);
      
      setRecommendations(diversifiedMovies.slice(0, 8));
    } catch (error) {
      console.error('Error generating recommendations:', error);
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para diversificar recomendações por gênero
  const diversifyByGenre = (movies: MovieDetails[]): MovieDetails[] => {
    const genreGroups: { [key: string]: MovieDetails[] } = {};
    
    // Agrupa filmes por gênero principal
    movies.forEach(movie => {
      if (movie.genres && movie.genres.length > 0) {
        const primaryGenre = movie.genres[0].name;
        if (!genreGroups[primaryGenre]) {
          genreGroups[primaryGenre] = [];
        }
        genreGroups[primaryGenre].push(movie);
      }
    });
    
    // Pega no máximo 2 filmes de cada gênero
    const diversified: MovieDetails[] = [];
    const genreNames = Object.keys(genreGroups);
    
    for (let i = 0; i < 8 && diversified.length < 8; i++) {
      genreNames.forEach(genre => {
        if (diversified.length < 8 && genreGroups[genre].length > i) {
          diversified.push(genreGroups[genre][i]);
        }
      });
    }
    
    return diversified;
  };

  if (watchedMovies.length === 0) {
    // Gera recomendações mesmo sem filmes assistidos
    useEffect(() => {
      generateRecommendations();
    }, []);
    
    return (
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Sparkles className="text-purple-400" size={24} />
            <h3 className="text-xl font-semibold text-white">
              Filmes Recomendados
            </h3>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setRecommendationType('quality')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                recommendationType === 'quality'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Star size={16} />
              Bem Avaliados
            </button>
            <button
              onClick={() => setRecommendationType('trending')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                recommendationType === 'trending'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <TrendingUp size={16} />
              Em Alta
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            <span className="ml-3 text-white">Carregando recomendações...</span>
          </div>
        ) : recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendations.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onClick={() => onMovieClick(movie)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-400">
              Não foi possível carregar recomendações no momento.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Sparkles className="text-purple-400" size={24} />
          <h3 className="text-xl font-semibold text-white">
            Recomendações para Você
          </h3>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setRecommendationType('smart')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
              recommendationType === 'smart'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Filter size={16} />
            Inteligente
          </button>
          <button
            onClick={() => setRecommendationType('quality')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
              recommendationType === 'quality'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Star size={16} />
            Qualidade
          </button>
          <button
            onClick={() => setRecommendationType('trending')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
              recommendationType === 'trending'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <TrendingUp size={16} />
            Em Alta
          </button>
          <button
            onClick={() => setRecommendationType('recent')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
              recommendationType === 'recent'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Calendar size={16} />
            Recentes
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <span className="ml-3 text-white">Gerando recomendações...</span>
        </div>
      ) : recommendations.length > 0 ? (
        <>
          <div className="mb-4 text-sm text-slate-400">
            {recommendationType === 'smart' && 'Baseado nos seus filmes pesquisados'}
            {recommendationType === 'quality' && 'Filmes bem avaliados pela crítica'}
            {recommendationType === 'trending' && 'Os mais populares no momento'}
            {recommendationType === 'recent' && 'Lançamentos recentes'}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendations.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onClick={() => onMovieClick(movie)}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-slate-400">
            Não foi possível gerar recomendações no momento.
          </p>
        </div>
      )}
    </div>
  );
};

export default RecommendationEngine;