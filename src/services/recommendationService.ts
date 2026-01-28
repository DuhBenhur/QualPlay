import { supabase, Recommendation } from '../lib/supabase'
import { MovieDetails } from '../types/movie'
import { discoverMovies } from './tmdbApi'

export class RecommendationService {
  // Gerar recomendações personalizadas
  static async generatePersonalizedRecommendations(): Promise<{
    data: Recommendation[]
    error: Error | null
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Buscar histórico do usuário
      const { data: userMovies } = await supabase
        .from('user_movies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!userMovies || userMovies.length === 0) {
        return { data: [], error: null }
      }

      // Análise de preferências
      const preferences = this.analyzeUserPreferences(userMovies)

      // Gerar diferentes tipos de recomendação
      const [collaborative, contentBased, trending] = await Promise.all([
        this.generateCollaborativeRecommendations(user.id, preferences),
        this.generateContentBasedRecommendations(preferences),
        this.generateTrendingRecommendations(preferences)
      ])

      // Combinar e diversificar recomendações
      const allRecommendations = [
        ...collaborative.slice(0, 5),
        ...contentBased.slice(0, 5),
        ...trending.slice(0, 5)
      ]

      // Salvar no banco
      const recommendationsToSave = allRecommendations.map(rec => ({
        user_id: user.id,
        movie_id: rec.movie_id,
        movie_title: rec.movie_title,
        movie_poster: rec.movie_poster,
        recommendation_type: rec.recommendation_type,
        score: rec.score,
        reasons: rec.reasons,
        movie_data: rec.movie_data
      }))

      // Limpar recomendações antigas
      await supabase
        .from('recommendations')
        .delete()
        .eq('user_id', user.id)

      // Inserir novas recomendações
      const { data, error } = await supabase
        .from('recommendations')
        .insert(recommendationsToSave)
        .select()

      if (error) throw error

      return { data: data || [], error: null }
    } catch (error) {
      return { data: [], error: error as Error }
    }
  }

  // Buscar recomendações salvas
  static async getUserRecommendations(): Promise<{
    data: Recommendation[]
    error: Error | null
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('recommendations')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_dismissed', false)
        .order('score', { ascending: false })
        .limit(20)

      if (error) throw error

      return { data: data || [], error: null }
    } catch (error) {
      return { data: [], error: error as Error }
    }
  }

  // Analisar preferências do usuário
  private static analyzeUserPreferences(userMovies: any[]) {
    const genreCount: Record<string, number> = {}
    const directorCount: Record<string, number> = {}
    const yearCount: Record<number, number> = {}
    let totalRating = 0
    let ratedMovies = 0

    userMovies.forEach(movie => {
      // Gêneros
      movie.movie_data.genres.forEach((genre: string) => {
        genreCount[genre] = (genreCount[genre] || 0) + 1
      })

      // Diretores
      if (movie.movie_data.director) {
        directorCount[movie.movie_data.director] =
          (directorCount[movie.movie_data.director] || 0) + 1
      }

      // Anos/Décadas
      const decade = Math.floor(movie.movie_data.year / 10) * 10
      yearCount[decade] = (yearCount[decade] || 0) + 1

      // Ratings
      if (movie.rating) {
        totalRating += movie.rating
        ratedMovies++
      }
    })

    return {
      favoriteGenres: Object.entries(genreCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([genre]) => genre),
      favoriteDirectors: Object.entries(directorCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([director]) => director),
      preferredDecades: Object.entries(yearCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([decade]) => parseInt(decade)),
      averageRating: ratedMovies > 0 ? totalRating / ratedMovies : 7.0
    }
  }

  // Recomendações colaborativas (usuários similares)
  private static async generateCollaborativeRecommendations(
    userId: string,
    preferences: any
  ): Promise<Recommendation[]> {
    try {
      // Buscar usuários com gostos similares
      const { data: similarUsers } = await supabase
        .from('user_movies')
        .select('user_id, movie_data')
        .neq('user_id', userId)

      if (!similarUsers) return []

      // Calcular similaridade baseada em gêneros
      const userSimilarity: Record<string, number> = {}

      similarUsers.forEach(userMovie => {
        const similarity = this.calculateGenreSimilarity(
          preferences.favoriteGenres,
          userMovie.movie_data.genres
        )

        if (similarity > 0.3) { // Threshold de similaridade
          userSimilarity[userMovie.user_id] =
            (userSimilarity[userMovie.user_id] || 0) + similarity
        }
      })

      // Buscar filmes dos usuários similares
      const topSimilarUsers = Object.entries(userSimilarity)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([userId]) => userId)

      if (topSimilarUsers.length === 0) return []

      const { data: recommendedMovies } = await supabase
        .from('user_movies')
        .select('*')
        .in('user_id', topSimilarUsers)
        .gte('rating', preferences.averageRating - 1)
        .order('rating', { ascending: false })
        .limit(20)

      return (recommendedMovies || []).map(movie => ({
        id: '',
        user_id: userId,
        movie_id: movie.movie_id,
        movie_title: movie.movie_title,
        movie_poster: movie.movie_poster,
        recommendation_type: 'collaborative' as const,
        score: movie.rating || 0,
        reasons: ['Usuários com gostos similares gostaram'],
        created_at: new Date().toISOString(),
        is_dismissed: false,
        movie_data: movie.movie_data
      }))
    } catch (error) {
      console.error('Error generating collaborative recommendations:', error)
      return []
    }
  }

  // Recomendações baseadas em conteúdo
  private static async generateContentBasedRecommendations(
    preferences: any
  ): Promise<Recommendation[]> {
    try {
      // Usar TMDB API para descobrir filmes similares
      const genreIds = this.mapGenresToIds(preferences.favoriteGenres)

      const results = await discoverMovies({
        genres: genreIds,
        yearStart: Math.min(...preferences.preferredDecades),
        yearEnd: new Date().getFullYear(),
        sortBy: 'vote_average.desc',
        region: 'BR'
      })

      return results.movies.slice(0, 10).map(movie => ({
        id: '',
        user_id: '',
        movie_id: movie.id,
        movie_title: movie.title,
        movie_poster: movie.poster_path,
        recommendation_type: 'content_based' as const,
        score: movie.vote_average,
        reasons: [
          `Gêneros que você gosta: ${movie.genres?.map(g => g.name).join(', ')}`
        ],
        created_at: new Date().toISOString(),
        is_dismissed: false,
        movie_data: {
          genres: movie.genres?.map(g => g.name) || [],
          director: movie.director || '',
          year: new Date(movie.release_date).getFullYear(),
          tmdb_rating: movie.vote_average
        }
      }))
    } catch (error) {
      console.error('Error generating content-based recommendations:', error)
      return []
    }
  }

  // Recomendações trending
  private static async generateTrendingRecommendations(
    preferences: any
  ): Promise<Recommendation[]> {
    try {
      const results = await discoverMovies({
        genres: [],
        yearStart: new Date().getFullYear() - 2,
        yearEnd: new Date().getFullYear(),
        sortBy: 'popularity.desc',
        region: 'BR'
      })

      return results.movies.slice(0, 10).map(movie => ({
        id: '',
        user_id: '',
        movie_id: movie.id,
        movie_title: movie.title,
        movie_poster: movie.poster_path,
        recommendation_type: 'trending' as const,
        score: movie.popularity / 100,
        reasons: ['Em alta no momento'],
        created_at: new Date().toISOString(),
        is_dismissed: false,
        movie_data: {
          genres: movie.genres?.map(g => g.name) || [],
          director: movie.director || '',
          year: new Date(movie.release_date).getFullYear(),
          tmdb_rating: movie.vote_average
        }
      }))
    } catch (error) {
      console.error('Error generating trending recommendations:', error)
      return []
    }
  }

  // Calcular similaridade entre gêneros
  private static calculateGenreSimilarity(genres1: string[], genres2: string[]): number {
    const set1 = new Set(genres1)
    const set2 = new Set(genres2)
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])

    return intersection.size / union.size
  }

  // Mapear nomes de gêneros para IDs
  private static mapGenresToIds(genreNames: string[]): number[] {
    const genreMap: Record<string, number> = {
      'Action': 28,
      'Adventure': 12,
      'Animation': 16,
      'Comedy': 35,
      'Crime': 80,
      'Documentary': 99,
      'Drama': 18,
      'Family': 10751,
      'Fantasy': 14,
      'History': 36,
      'Horror': 27,
      'Music': 10402,
      'Mystery': 9648,
      'Romance': 10749,
      'Science Fiction': 878,
      'TV Movie': 10770,
      'Thriller': 53,
      'War': 10752,
      'Western': 37
    }

    return genreNames
      .map(name => genreMap[name])
      .filter(id => id !== undefined)
  }

  // ============================================================================
  // 🌟 NOVAS FUNÇÕES: RECOMENDAÇÕES BASEADAS EM RATINGS REAIS
  // ============================================================================

  /**
   * Busca filmes recomendados baseados em avaliações reais da comunidade
   * - Para usuários novos: retorna filmes mais bem avaliados
   * - Para usuários ativos: retorna filmes de usuários com gostos similares
   */
  static async getRecommendationsFromRatings(
    userId: string | null,
    limit: number = 10
  ): Promise<MovieDetails[]> {
    try {
      if (!userId) {
        return this.getTopRatedFromCommunity(limit)
      }

      // 1. Buscar avaliações altas do usuário (>= 4 estrelas)
      const { data: userHighRatings } = await supabase
        .from('ratings')
        .select('movie_id, score')
        .eq('user_id', userId)
        .gte('score', 4)

      if (!userHighRatings || userHighRatings.length === 0) {
        return this.getTopRatedFromCommunity(limit)
      }

      const userMovieIds = userHighRatings.map(r => r.movie_id)

      // 2. Buscar outros usuários que também avaliaram bem esses filmes
      const { data: similarUsersRatings } = await supabase
        .from('ratings')
        .select('user_id, movie_id, score')
        .in('movie_id', userMovieIds)
        .neq('user_id', userId)
        .gte('score', 4)

      if (!similarUsersRatings || similarUsersRatings.length === 0) {
        return this.getTopRatedFromCommunity(limit)
      }

      // 3. Agregar scores de filmes recomendados
      const movieScores = new Map<number, {
        total: number
        count: number
      }>()

      similarUsersRatings.forEach(rating => {
        if (userMovieIds.includes(rating.movie_id)) return // Já avaliou

        const current = movieScores.get(rating.movie_id) || { total: 0, count: 0 }
        movieScores.set(rating.movie_id, {
          total: current.total + rating.score,
          count: current.count + 1
        })
      })

      // 4. Buscar contagem de reviews
      const movieIds = Array.from(movieScores.keys())
      if (movieIds.length === 0) {
        return this.getTopRatedFromCommunity(limit)
      }

      const { data: reviews } = await supabase
        .from('reviews')
        .select('movie_id')
        .in('movie_id', movieIds)

      const reviewCounts = new Map<number, number>()
      reviews?.forEach(review => {
        reviewCounts.set(review.movie_id, (reviewCounts.get(review.movie_id) || 0) + 1)
      })

      // 5. Calcular relevance score e ordenar
      const recommendations = Array.from(movieScores.entries())
        .filter(([_, data]) => data.count >= 2) // Mínimo 2 avaliações
        .map(([movie_id, data]) => {
          const avg = data.total / data.count
          const reviewCount = reviewCounts.get(movie_id) || 0
          return {
            movie_id,
            avg,
            count: data.count,
            score: avg * Math.log(data.count + 1) + reviewCount * 0.1
          }
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)

      // 6. Buscar detalhes dos filmes no TMDB
      const { getMovieDetails } = await import('./tmdbApi')
      const movieDetails = await Promise.all(
        recommendations.map(rec => getMovieDetails(rec.movie_id))
      )

      return movieDetails.filter(movie => movie !== null) as MovieDetails[]

    } catch (error) {
      console.error('[RecommendationService] Erro ao gerar recomendações:', error)
      return []
    }
  }

  /**
   * Retorna filmes mais bem avaliados pela comunidade
   * Usado para usuários novos ou quando não há dados suficientes
   */
  static async getTopRatedFromCommunity(limit: number = 10): Promise<MovieDetails[]> {
    try {
      // Buscar avaliações recentes >= 4 estrelas
      const { data: topRated } = await supabase
        .from('ratings')
        .select('movie_id, score')
        .gte('score', 4)
        .order('created_at', { ascending: false })
        .limit(200)

      if (!topRated || topRated.length === 0) {
        console.log('[RecommendationService] Nenhuma avaliação encontrada na comunidade')
        return []
      }

      // Agregar por filme
      const movieStats = new Map<number, { total: number, count: number }>()

      topRated.forEach(rating => {
        const current = movieStats.get(rating.movie_id) || { total: 0, count: 0 }
        movieStats.set(rating.movie_id, {
          total: current.total + rating.score,
          count: current.count + 1
        })
      })

      // Filtrar filmes com pelo menos 3 avaliações
      const topMovies = Array.from(movieStats.entries())
        .filter(([_, data]) => data.count >= 3)
        .map(([movie_id, data]) => ({
          movie_id,
          avg: data.total / data.count,
          count: data.count,
          score: (data.total / data.count) * Math.log(data.count + 1)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)

      if (topMovies.length === 0) {
        console.log('[RecommendationService] Não há filmes com 3+ avaliações')
        return []
      }

      // Buscar detalhes no TMDB
      const { getMovieDetails } = await import('./tmdbApi')
      const movieDetails = await Promise.all(
        topMovies.map(movie => getMovieDetails(movie.movie_id))
      )

      const filtered = movieDetails.filter(movie => movie !== null) as MovieDetails[]
      console.log(`[RecommendationService] ${filtered.length} filmes populares encontrados`)

      return filtered

    } catch (error) {
      console.error('[RecommendationService] Erro ao buscar populares:', error)
      return []
    }
  }
}