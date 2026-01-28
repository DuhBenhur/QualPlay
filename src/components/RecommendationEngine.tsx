import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Star, Filter } from 'lucide-react';
import { MovieDetails } from '../types/movie';
import { discoverMovies } from '../services/tmdbApi';
import MovieCard from './MovieCard';


interface RecommendationEngineProps {
  watchedMovies: MovieDetails[];
  userId: string | null; // ✅ Para buscar recomendações da comunidade
  onMovieClick: (movie: MovieDetails) => void;
}

// 🧠 SISTEMA DE SCORING AVANÇADO
interface MovieScore {
  movie: MovieDetails;
  score: number;
  reasons: string[];
}

interface UserProfile {
  genrePreferences: { [genreId: number]: number };
  directorPreferences: { [director: string]: number };
  yearPreferences: { [decade: number]: number };
  ratingPreferences: { min: number; max: number; avg: number };
  popularityPreferences: { min: number; max: number; avg: number };
  runtimePreferences: { min: number; max: number; avg: number };
}

const RecommendationEngine: React.FC<RecommendationEngineProps> = ({
  watchedMovies,
  userId, // ✅ NOVO
  onMovieClick
}) => {
  const [recommendations, setRecommendations] = useState<MovieDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendationType, setRecommendationType] = useState<'smart' | 'trending' | 'quality'>('smart');
  // Armazenar recomendações por tipo para evitar repetição
  const [recommendationsByType, setRecommendationsByType] = useState<{
    [key: string]: Set<number>;
  }>({
    smart: new Set(),
    trending: new Set(),
    quality: new Set()
  });

  useEffect(() => {
    generateAdvancedRecommendations();
  }, [watchedMovies, recommendationType, userId]); // ✅ Reagir a userId

  // 🧠 ANÁLISE AVANÇADA DO PERFIL DO USUÁRIO
  const analyzeUserProfile = (): UserProfile => {
    if (watchedMovies.length === 0) {
      return {
        genrePreferences: {},
        directorPreferences: {},
        yearPreferences: {},
        ratingPreferences: { min: 6.0, max: 10.0, avg: 7.0 },
        popularityPreferences: { min: 10, max: 1000, avg: 100 },
        runtimePreferences: { min: 90, max: 180, avg: 120 }
      };
    }

    // 🎭 ANÁLISE DE GÊNEROS COM PESO TEMPORAL
    const genrePreferences: { [genreId: number]: number } = {};
    watchedMovies.forEach((movie, index) => {
      const recencyWeight = (index + 1) / watchedMovies.length; // Filmes mais recentes têm peso maior
      movie.genres?.forEach(genre => {
        genrePreferences[genre.id] = (genrePreferences[genre.id] || 0) + recencyWeight;
      });
    });

    // 🎬 ANÁLISE DE DIRETORES
    const directorPreferences: { [director: string]: number } = {};
    watchedMovies.forEach((movie, index) => {
      if (movie.director && movie.director !== 'Não informado') {
        const recencyWeight = (index + 1) / watchedMovies.length;
        directorPreferences[movie.director] = (directorPreferences[movie.director] || 0) + recencyWeight;
      }
    });

    // 📅 ANÁLISE DE DÉCADAS
    const yearPreferences: { [decade: number]: number } = {};
    watchedMovies.forEach((movie, index) => {
      const year = new Date(movie.release_date).getFullYear();
      const decade = Math.floor(year / 10) * 10;
      const recencyWeight = (index + 1) / watchedMovies.length;
      yearPreferences[decade] = (yearPreferences[decade] || 0) + recencyWeight;
    });

    // ⭐ ANÁLISE DE PREFERÊNCIAS DE AVALIAÇÃO
    const ratings = watchedMovies.map(m => m.vote_average).filter(r => r > 0);
    const ratingPreferences = {
      min: Math.min(...ratings),
      max: Math.max(...ratings),
      avg: ratings.reduce((sum, r) => sum + r, 0) / ratings.length
    };

    // 🔥 ANÁLISE DE POPULARIDADE
    const popularities = watchedMovies.map(m => m.popularity).filter(p => p > 0);
    const popularityPreferences = {
      min: Math.min(...popularities),
      max: Math.max(...popularities),
      avg: popularities.reduce((sum, p) => sum + p, 0) / popularities.length
    };

    // ⏱️ ANÁLISE DE DURAÇÃO
    const runtimes = watchedMovies.map(m => m.runtime).filter(r => r > 0);
    const runtimePreferences = {
      min: Math.min(...runtimes),
      max: Math.max(...runtimes),
      avg: runtimes.reduce((sum, r) => sum + r, 0) / runtimes.length
    };

    return {
      genrePreferences,
      directorPreferences,
      yearPreferences,
      ratingPreferences,
      popularityPreferences,
      runtimePreferences
    };
  };

  // 🎯 SISTEMA DE SCORING AVANÇADO
  const calculateMovieScore = (movie: MovieDetails, userProfile: UserProfile, type: string): MovieScore => {
    let score = 0;
    const reasons: string[] = [];

    // 🎭 SCORE DE GÊNERO (peso: 30%)
    let genreScore = 0;
    if (movie.genres && movie.genres.length > 0) {
      movie.genres.forEach(genre => {
        const preference = userProfile.genrePreferences[genre.id] || 0;
        genreScore += preference;
      });
      genreScore = genreScore / movie.genres.length;
      if (genreScore > 0.5) reasons.push(`Gêneros favoritos (${movie.genres.map(g => g.name).join(', ')})`);
    }
    score += genreScore * 0.3;

    // 🎬 SCORE DE DIRETOR (peso: 20%)
    let directorScore = 0;
    if (movie.director && userProfile.directorPreferences[movie.director]) {
      directorScore = userProfile.directorPreferences[movie.director];
      reasons.push(`Diretor conhecido (${movie.director})`);
    }
    score += directorScore * 0.2;

    // ⭐ SCORE DE AVALIAÇÃO (peso: 25%)
    let ratingScore = 0;
    if (type === 'quality') {
      // Para qualidade, priorizar filmes com alta avaliação
      ratingScore = Math.min(movie.vote_average / 10, 1);
      if (movie.vote_average >= 8.0) reasons.push('Excelente avaliação');
    } else {
      // Para outros tipos, usar preferência do usuário
      const ratingDiff = Math.abs(movie.vote_average - userProfile.ratingPreferences.avg);
      ratingScore = Math.max(0, 1 - (ratingDiff / 5)); // Normalizar diferença
      if (ratingDiff < 1) reasons.push('Avaliação similar aos seus gostos');
    }
    score += ratingScore * 0.25;

    // 📅 SCORE DE ANO/DÉCADA (peso: 10%)
    let yearScore = 0;
    const movieYear = new Date(movie.release_date).getFullYear();
    const movieDecade = Math.floor(movieYear / 10) * 10;

    if (type === 'trending') {
      // Para trending, priorizar filmes mais novos
      const currentYear = new Date().getFullYear();
      yearScore = Math.max(0, 1 - ((currentYear - movieYear) / 10));
      if (movieYear >= currentYear - 2) reasons.push('Lançamento recente');
    } else {
      // Para outros tipos, usar preferência do usuário
      yearScore = userProfile.yearPreferences[movieDecade] || 0;
      if (yearScore > 0.3) reasons.push(`Década preferida (${movieDecade}s)`);
    }
    score += yearScore * 0.1;

    // 🔥 SCORE DE POPULARIDADE (peso: 15%)
    let popularityScore = 0;
    if (type === 'trending') {
      // Para trending, priorizar alta popularidade
      popularityScore = Math.min(movie.popularity / 100, 1);
      if (movie.popularity > 50) reasons.push('Alta popularidade');
    } else {
      // Para outros tipos, usar preferência do usuário
      const popDiff = Math.abs(movie.popularity - userProfile.popularityPreferences.avg);
      popularityScore = Math.max(0, 1 - (popDiff / userProfile.popularityPreferences.avg));
      if (popDiff < userProfile.popularityPreferences.avg * 0.5) reasons.push('Popularidade similar');
    }
    score += popularityScore * 0.15;

    // 🎬 BONUS POR QUALIDADE GERAL
    if (movie.vote_count >= 100 && movie.vote_average >= 7.0) {
      score += 0.1;
      reasons.push('Filme bem estabelecido');
    }

    // 🎯 BONUS POR DIVERSIDADE (evitar filmes muito similares)
    const genreNames = movie.genres?.map(g => g.name) || [];
    if (genreNames.length > 2) {
      score += 0.05;
      reasons.push('Boa diversidade de gêneros');
    }

    return { movie, score, reasons };
  };

  // 🚀 GERAÇÃO AVANÇADA DE RECOMENDAÇÕES
  const generateAdvancedRecommendations = async () => {
    setIsLoading(true);
    console.log(`🔍 Gerando recomendações avançadas tipo: ${recommendationType}`);

    try {
      const userProfile = analyzeUserProfile();
      console.log('👤 Perfil do usuário analisado');

      // 🎯 CONFIGURAR FILTROS BASEADOS NO PERFIL
      let filters;
      const topGenres = Object.entries(userProfile.genrePreferences)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 4) // Aumentar para 4 gêneros
        .map(([id]) => parseInt(id));

      switch (recommendationType) {
        case 'smart':
          filters = {
            genres: topGenres,
            yearStart: Math.max(2000, new Date().getFullYear() - 20),
            yearEnd: new Date().getFullYear(),
            sortBy: 'vote_average.desc',
            region: 'BR'
          };
          break;

        case 'quality':
          filters = {
            genres: topGenres,
            yearStart: 2010,
            yearEnd: new Date().getFullYear(),
            sortBy: 'vote_average.desc',
            region: 'BR'
          };
          break;

        case 'trending':
          // Filmes populares do último ano
          filters = {
            genres: topGenres,
            yearStart: new Date().getFullYear() - 1,
            yearEnd: new Date().getFullYear(),
            sortBy: 'popularity.desc',
            region: 'BR'
          };
          break;
      }

      // 🔍 BUSCAR MÚLTIPLAS PÁGINAS PARA MAIS DIVERSIDADE
      const allCandidates: MovieDetails[] = [];
      const pages = [1, 2, 3, 4]; // Buscar mais páginas

      for (const page of pages) {
        try {
          const pageFilters = { ...filters };
          const results = await discoverMovies(pageFilters);
          allCandidates.push(...results.movies);
        } catch (error) {
          console.error(`Erro na página ${page}:`, error);
        }
      }

      // 🚫 REMOVER FILMES JÁ ASSISTIDOS
      const watchedIds = new Set(watchedMovies.map(m => m.id));
      const candidates = allCandidates.filter(movie => !watchedIds.has(movie.id));

      // 🚫 REMOVER FILMES JÁ RECOMENDADOS EM OUTRAS CATEGORIAS
      const otherCategories = Object.keys(recommendationsByType).filter(type => type !== recommendationType);
      const alreadyRecommended = new Set<number>();

      otherCategories.forEach(category => {
        recommendationsByType[category].forEach(id => {
          alreadyRecommended.add(id);
        });
      });

      const uniqueCandidates = candidates.filter(movie => !alreadyRecommended.has(movie.id));
      console.log(`🔄 Removidos ${candidates.length - uniqueCandidates.length} filmes já recomendados em outras categorias`);

      console.log(`📊 Candidatos únicos encontrados: ${uniqueCandidates.length}`);

      // 🎯 APLICAR SISTEMA DE SCORING
      const scoredMovies = uniqueCandidates
        .map(movie => calculateMovieScore(movie, userProfile, recommendationType))
        .filter(scored => scored.score > 0.2) // Threshold mínimo
        .sort((a, b) => b.score - a.score);

      console.log(`🏆 Top 5 scores:`, scoredMovies.slice(0, 5).map(s => ({
        title: s.movie.title,
        score: s.score.toFixed(3),
        reasons: s.reasons
      })));

      // 🎲 DIVERSIFICAÇÃO INTELIGENTE
      const diversifiedRecommendations = diversifyIntelligently(scoredMovies, 8);

      // Atualizar recomendações e armazenar IDs para evitar repetição
      const newRecommendations = diversifiedRecommendations.map(scored => scored.movie);
      setRecommendations(newRecommendations);

      // Atualizar conjunto de IDs recomendados para esta categoria
      const newRecommendedIds = new Set(newRecommendations.map(movie => movie.id));
      setRecommendationsByType(prev => ({
        ...prev,
        [recommendationType]: newRecommendedIds
      }));

      console.log(`✅ Recomendações finalizadas: ${newRecommendations.length} filmes únicos`);
    } catch (error) {
      console.error('❌ Erro ao gerar recomendações avançadas:', error);
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 🎲 DIVERSIFICAÇÃO INTELIGENTE
  const diversifyIntelligently = (scoredMovies: MovieScore[], count: number): MovieScore[] => {
    const selected: MovieScore[] = [];
    const selectedIds = new Set<number>();
    const usedGenres = new Set<string>();
    const usedDirectors = new Set<string>();
    const usedDecades = new Set<number>();

    // 🥇 PRIMEIRA PASSADA: Pegar os melhores de cada categoria
    for (const scored of scoredMovies) {
      if (selected.length >= count) break;

      const movie = scored.movie;
      const primaryGenre = movie.genres?.[0]?.name || 'Unknown';
      const director = movie.director || 'Unknown';
      const decade = Math.floor(new Date(movie.release_date).getFullYear() / 10) * 10;

      // Priorizar diversidade, mas não ser muito restritivo
      // Verificar se este filme já foi selecionado
      if (selectedIds.has(movie.id)) continue;

      const genreUsed = usedGenres.has(primaryGenre);
      const directorUsed = usedDirectors.has(director);
      const decadeUsed = usedDecades.has(decade);

      // Se é um dos top 3, sempre incluir
      if (selected.length < 3) {
        selected.push(scored);
        selectedIds.add(movie.id);
        usedGenres.add(primaryGenre);
        usedDirectors.add(director);
        usedDecades.add(decade);
        continue;
      }

      // Para o resto, priorizar diversidade
      if (!genreUsed || (!directorUsed && !decadeUsed)) {
        selected.push(scored);
        selectedIds.add(movie.id);
        usedGenres.add(primaryGenre);
        usedDirectors.add(director);
        usedDecades.add(decade);
      }
    }

    // 🔄 SEGUNDA PASSADA: Completar com os melhores restantes
    if (selected.length < count) {
      const remaining = scoredMovies.filter(scored =>
        !selectedIds.has(scored.movie.id)
      );

      for (const scored of remaining) {
        if (selected.length >= count) break;
        if (!selectedIds.has(scored.movie.id)) {
          selected.push(scored);
          selectedIds.add(scored.movie.id);
        }
      }
    }

    return selected.slice(0, count);
  };

  // 🚫 SEM FILMES ASSISTIDOS = RECOMENDAÇÕES GERAIS
  if (watchedMovies.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 mb-6">
        <div className="text-center py-8">
          <Sparkles className="mx-auto text-slate-600 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-white mb-2">
            Sistema de Recomendação Avançado
          </h3>
          <p className="text-slate-400 mb-4">
            Busque alguns filmes primeiro para ativar nosso sistema de recomendação inteligente!
          </p>
          <div className="bg-slate-700 rounded-lg p-4 text-left max-w-md mx-auto">
            <h4 className="text-white font-medium mb-2">🔍 Como funciona:</h4>
            <ul className="text-slate-300 text-sm space-y-1">
              <li>• <strong>Análise de Perfil:</strong> Gêneros, diretores, décadas</li>
              <li>• <strong>Sistema de Scoring:</strong> Algoritmo de pontuação avançado</li>
              <li>• <strong>Diversificação:</strong> Evita repetições inteligentemente</li>
              <li>• <strong>Aprendizado:</strong> Melhora com cada busca</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const getRecommendationDescription = () => {
    switch (recommendationType) {
      case 'smart':
        return `Algoritmo inteligente baseado no seu perfil completo (${watchedMovies.length} filmes analisados)`;
      case 'quality':
        return 'Filmes de alta qualidade (7.0+) nos seus gêneros favoritos';
      case 'trending':
        return 'Populares no último ano compatíveis com seu perfil';
      default:
        return '';
    }
  };

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
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${recommendationType === 'smart'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
          >
            <Filter size={16} />
            Inteligente
          </button>
          <button
            onClick={() => setRecommendationType('quality')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${recommendationType === 'quality'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
          >
            <Star size={16} />
            Qualidade
          </button>
          <button
            onClick={() => setRecommendationType('trending')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${recommendationType === 'trending'
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
          <span className="ml-3 text-white">Analisando seus gostos...</span>
        </div>
      ) : recommendations.length > 0 ? (
        <>
          <div className="mb-4 p-3 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg border border-purple-500/20">
            <p className="text-purple-200 text-sm">
              <Sparkles size={14} className="inline mr-2" />
              {getRecommendationDescription()}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendations.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onClick={() => onMovieClick(movie)}
                onFavoriteToggle={(movie) => {
                  console.log(`Recomendação ${movie.title} favoritada!`);
                }}
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
            Tente buscar mais filmes para melhorar as recomendações.
          </p>
        </div>
      )}
    </div>
  );
};

export default RecommendationEngine;