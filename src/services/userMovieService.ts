import { supabase, UserMovie, UserList } from '../lib/supabase'
import { MovieDetails } from '../types/movie'

export class UserMovieService {
  // Adicionar filme à lista do usuário
  static async addMovieToUser(
    movieData: MovieDetails,
    status: 'watched' | 'want_to_watch' | 'watching' | 'dropped' = 'want_to_watch',
    rating?: number,
    review?: string
  ): Promise<{ data: UserMovie | null; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const userMovie = {
        user_id: user.id,
        movie_id: movieData.id,
        movie_title: movieData.title,
        movie_poster: movieData.poster_path,
        status,
        rating,
        review,
        watched_at: status === 'watched' ? new Date().toISOString() : null,
        movie_data: {
          genres: movieData.genres?.map(g => g.name) || [],
          director: movieData.director || '',
          year: new Date(movieData.release_date).getFullYear(),
          tmdb_rating: movieData.vote_average
        }
      }

      const { data, error } = await supabase
        .from('user_movies')
        .upsert(userMovie, {
          onConflict: 'user_id,movie_id',
          ignoreDuplicates: false
        })
        .select()
        .single()

      if (error) throw error

      // Registrar interação
      await this.logInteraction(movieData.id, 'add_to_list', { status, rating })

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Buscar filmes do usuário
  static async getUserMovies(
    status?: 'watched' | 'want_to_watch' | 'watching' | 'dropped'
  ): Promise<{ data: UserMovie[]; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { data: [], error: new Error('User not authenticated') }

      let query = supabase
        .from('user_movies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) throw error

      return { data: data || [], error: null }
    } catch (error) {
      return { data: [], error: error as Error }
    }
  }

  // Atualizar status/rating de um filme
  static async updateUserMovie(
    movieId: number,
    updates: Partial<Pick<UserMovie, 'status' | 'rating' | 'review'>>
  ): Promise<{ error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      if (updates.status === 'watched' && !updates.rating) {
        updateData.watched_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('user_movies')
        .update(updateData)
        .eq('user_id', user.id)
        .eq('movie_id', movieId)

      if (error) throw error

      // Registrar interação
      await this.logInteraction(movieId, 'rate', updates)

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Remover filme da lista
  static async removeUserMovie(movieId: number): Promise<{ error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('user_movies')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', movieId)

      if (error) throw error

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Criar lista personalizada
  static async createUserList(
    name: string,
    description?: string,
    isPublic: boolean = false
  ): Promise<{ data: UserList | null; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('user_lists')
        .insert({
          user_id: user.id,
          name,
          description,
          is_public: isPublic
        })
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Registrar interação do usuário
  static async logInteraction(
    movieId: number,
    type: 'search' | 'view_details' | 'add_to_list' | 'rate' | 'share',
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('user_interactions')
        .insert({
          user_id: user.id,
          movie_id: movieId,
          interaction_type: type,
          metadata
        })
    } catch (error) {
      console.error('Error logging interaction:', error)
    }
  }

  // Obter estatísticas do usuário
  static async getUserStats(): Promise<{
    data: {
      totalMovies: number
      watchedMovies: number
      averageRating: number
      favoriteGenres: string[]
      watchTime: number
    } | null
    error: Error | null
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { data: null, error: new Error('User not authenticated') }

      // Timeout agressivo de 2 segundos
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Stats timeout')), 2000)
      )

      const fetchStats = async () => {
        const { data: movies, error } = await supabase
          .from('user_movies')
          .select('*')
          .eq('user_id', user.id)

        if (error) throw error

        const watchedMovies = movies?.filter(m => m.status === 'watched') || []
        const totalMovies = movies?.length || 0

        const averageRating = watchedMovies.length > 0
          ? watchedMovies.reduce((sum, m) => sum + (m.personal_rating || 0), 0) / watchedMovies.length
          : 0

        // Calcular gêneros favoritos
        const genreCount: Record<string, number> = {}
        movies?.forEach(movie => {
          movie.movie_data.genres.forEach(genre => {
            genreCount[genre] = (genreCount[genre] || 0) + 1
          })
        })

        const favoriteGenres = Object.entries(genreCount)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([genre]) => genre)

        // Estimar tempo assistido (assumindo 120 min por filme)
        const watchTime = watchedMovies.length * 120

        return {
          totalMovies,
          watchedMovies: watchedMovies.length,
          averageRating,
          favoriteGenres,
          watchTime
        }
      }

      const stats = await Promise.race([fetchStats(), timeout])

      return {
        data: stats,
        error: null
      }
    } catch (error) {
      console.error('[UserStats] Error fetching stats:', error)
      return {
        data: null,
        error: error as Error
      }
    }
  }
}