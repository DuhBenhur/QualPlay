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
    if (watchedMovies.length > 0) {
      generateRecommendations();
    }
  }, [watchedMovies, recommendationType]);

  const generateRecommendations = async () => {
    setIsLoading(true);
    console.log(`🎯 Gerando recomendações tipo: ${recommendationType}, filmes assistidos: ${watchedMovies.length}`);
    
    try {
      let filters;
      
      switch (recommendationType) {
        case 'smart':
          // 🧠 RECOMENDAÇÃO INTELIGENTE MELHORADA
          if (watchedMovies.length > 0) {
            // Analisar gêneros dos filmes assistidos
            const genreCount = watchedMovies.reduce((acc, movie) => {
              if (movie.genres && movie.genres.length > 0) {
                movie.genres.forEach(genre => {
                  if (genre.id && genre.name) {
                    acc[genre.id] = (acc[genre.id] || 0) + 1;
                  }
                });
              }
              return acc;
            }, {} as Record<number, number>);
            
            // Pegar os 3 gêneros mais comuns (aumentado de 2)
            const topGenres = Object.entries(genreCount)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 3)
              .map(([id]) => parseInt(id));
            
            console.log('🎨 Gêneros preferidos do usuário:', topGenres);
            
            // Analisar período preferido
            const years = watchedMovies
              .map(m => new Date(m.release_date).getFullYear())
              .filter(year => !isNaN(year));
            
            const avgYear = years.length > 0 ? Math.round(years.reduce((sum, year) => sum + year, 0) / years.length) : 2020;
            const yearStart = Math.max(avgYear - 15, 1990); // Mais flexível: 15 anos, mínimo 1990
            
            console.log(`🧠 Recomendação inteligente: gêneros ${topGenres}, anos ${yearStart}-${new Date().getFullYear()}`);
            
            filters = {
              genres: topGenres,
              yearStart,
              yearEnd: new Date().getFullYear(),
              sortBy: 'vote_average.desc',
              region: 'BR'
            };
          } else {
            // Fallback para usuários novos
            filters = {
              genres: [28, 35, 18, 878, 53], // Ação, Comédia, Drama, Ficção Científica, Thriller
              yearStart: 2015,
              yearEnd: new Date().getFullYear(),
              sortBy: 'vote_average.desc',
              region: 'BR'
            };
          }
          break;
          
        case 'trending':
          console.log('📈 Buscando filmes em alta...');
          filters = {
            genres: [],
            yearStart: 2022, // Mais flexível
            yearEnd: new Date().getFullYear(),
            sortBy: 'popularity.desc',
            region: 'BR'
          };
          break;
          
        case 'recent':
          console.log('📅 Buscando lançamentos recentes...');
          filters = {
            genres: [],
            yearStart: new Date().getFullYear() - 2, // Últimos 2 anos
            yearEnd: new Date().getFullYear(),
            sortBy: 'release_date.desc',
            region: 'BR'
          };
          break;
          
        case 'quality':
          console.log('⭐ Buscando filmes de qualidade...');
          filters = {
            genres: [],
            yearStart: 2010, // Mais flexível
            yearEnd: new Date().getFullYear(),
            sortBy: 'vote_average.desc',
            region: 'BR'
          };
          break;
      }
      
      console.log('🔍 Filtros aplicados:', filters);
      const results = await discoverMovies(filters);
      console.log(`📊 API retornou ${results.movies.length} filmes`);
      
      // 🎯 FILTROS DE QUALIDADE MUITO MAIS FLEXÍVEIS
      let qualityMovies = results.movies.filter(movie => {
        // Remove filmes já assistidos
        const watchedIds = new Set(watchedMovies.map(m => m.id));
        if (watchedIds.has(movie.id)) {
          console.log(`🚫 Filme já assistido removido: ${movie.title}`);
          return false;
        }
        
        // 🔥 FILTROS MUITO MAIS FLEXÍVEIS
        
        // 1. Avaliação mínima MUITO flexível
        if (movie.vote_average < 4.0) {
          console.log(`🚫 Avaliação muito baixa: ${movie.title} (${movie.vote_average})`);
          return false;
        }
        
        // 2. Votos mínimos MUITO flexível
        if (movie.vote_count < 5) {
          console.log(`🚫 Poucos votos: ${movie.title} (${movie.vote_count})`);
          return false;
        }
        
        // 3. Deve ter pelo menos um gênero
        if (!movie.genres || movie.genres.length === 0) {
          console.log(`🚫 Sem gêneros: ${movie.title}`);
          return false;
        }
        
        // 4. Não deve ser filme adulto
        if (movie.adult) {
          console.log(`🚫 Filme adulto: ${movie.title}`);
          return false;
        }
        
        // 5. Deve ter título válido
        if (!movie.title || movie.title.trim().length === 0) {
          console.log(`🚫 Sem título: ${movie.id}`);
          return false;
        }
        
        console.log(`✅ Filme aprovado: ${movie.title} (${movie.vote_average}/10, ${movie.vote_count} votos)`);
        return true;
      });
      
      console.log(`✅ Após filtros de qualidade: ${qualityMovies.length} filmes`);
      
      // Se ainda não temos filmes suficientes, pegar QUALQUER filme válido
      if (qualityMovies.length < 4) {
        console.log('🔄 Critérios ULTRA flexíveis - pegando qualquer filme válido...');
        qualityMovies = results.movies.filter(movie => {
          const watchedIds = new Set(watchedMovies.map(m => m.id));
          if (watchedIds.has(movie.id)) return false;
          
          // Critérios MÍNIMOS
          if (!movie.title || movie.title.trim().length === 0) return false;
          if (movie.adult) return false;
          if (movie.vote_average < 1.0) return false; // Só remove filmes com avaliação 0
          
          return true;
        });
        console.log(`🔄 Após critérios ultra flexíveis: ${qualityMovies.length} filmes`);
      }
      
      // 🎲 DIVERSIFICAR POR GÊNERO
      const diversifiedMovies = diversifyByGenre(qualityMovies);
      
      console.log(`🎉 Recomendações finais: ${diversifiedMovies.length} filmes`);
      setRecommendations(diversifiedMovies.slice(0, 8));
    } catch (error) {
      console.error('❌ Erro ao gerar recomendações:', error);
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para diversificar recomendações por gênero
  const diversifyByGenre = (movies: MovieDetails[]): MovieDetails[] => {
    if (movies.length === 0) return [];
    
    const genreGroups: { [key: string]: MovieDetails[] } = {};
    
    // Agrupa filmes por gênero principal
    movies.forEach(movie => {
      if (movie.genres && movie.genres.length > 0) {
        const primaryGenre = movie.genres[0].name;
        if (!genreGroups[primaryGenre]) {
          genreGroups[primaryGenre] = [];
        }
        genreGroups[primaryGenre].push(movie);
      } else {
        // Filmes sem gênero vão para um grupo especial
        if (!genreGroups['Outros']) {
          genreGroups['Outros'] = [];
        }
        genreGroups['Outros'].push(movie);
      }
    });
    
    const diversified: MovieDetails[] = [];
    const genreNames = Object.keys(genreGroups);
    
    // Se temos poucos filmes, não diversificar muito
    if (movies.length <= 8) {
      return movies.slice(0, 8);
    }
    
    // Primeiro, pega 1 filme de cada gênero
    genreNames.forEach(genre => {
      if (diversified.length < 8 && genreGroups[genre].length > 0) {
        diversified.push(genreGroups[genre][0]);
      }
    });
    
    // Depois, pega o segundo filme de cada gênero se ainda precisar
    genreNames.forEach(genre => {
      if (diversified.length < 8 && genreGroups[genre].length > 1) {
        diversified.push(genreGroups[genre][1]);
      }
    });
    
    // Se ainda precisar, pega qualquer filme restante
    if (diversified.length < 8) {
      const remaining = movies.filter(movie => !diversified.some(d => d.id === movie.id));
      diversified.push(...remaining.slice(0, 8 - diversified.length));
    }
    
    return diversified;
  };

  // 🚫 SEM FILMES ASSISTIDOS = SEM RECOMENDAÇÕES
  if (watchedMovies.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="text-center py-8">
          <Sparkles className="mx-auto text-slate-600 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-white mb-2">
            Sistema de Recomendação Inteligente
          </h3>
          <p className="text-slate-400 mb-4">
            Busque alguns filmes primeiro para receber recomendações personalizadas baseadas nos seus gostos!
          </p>
          <div className="bg-slate-700 rounded-lg p-4 text-left max-w-md mx-auto">
            <h4 className="text-white font-medium mb-2">🎯 Como funciona:</h4>
            <ul className="text-slate-300 text-sm space-y-1">
              <li>• <strong>Analisa</strong> os gêneros dos filmes que você busca</li>
              <li>• <strong>Identifica</strong> seus padrões de preferência</li>
              <li>• <strong>Sugere</strong> filmes similares de qualidade</li>
              <li>• <strong>Diversifica</strong> por diferentes tipos de recomendação</li>
            </ul>
          </div>
        </div>
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
          <span className="ml-3 text-white">Analisando seus gostos...</span>
        </div>
      ) : recommendations.length > 0 ? (
        <>
          <div className="mb-4 text-sm text-slate-400">
            {recommendationType === 'smart' && `Baseado nos ${watchedMovies.length} filmes que você pesquisou`}
            {recommendationType === 'quality' && 'Filmes bem avaliados pela crítica e público'}
            {recommendationType === 'trending' && 'Os mais populares no momento'}
            {recommendationType === 'recent' && 'Lançamentos recentes de qualidade'}
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
          <p className="text-slate-400 mb-2">
            Não foi possível gerar recomendações no momento.
          </p>
          <p className="text-slate-500 text-sm">
            Tente buscar mais filmes para melhorar as sugestões.
          </p>
        </div>
      )}
    </div>
  );
};

export default RecommendationEngine;