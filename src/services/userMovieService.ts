// ============================================================================
// QUALPLAY - USER MOVIE SERVICE v2
// ============================================================================
// Serviço centralizado para gerenciar listas, favoritos e interações
// Usa o novo schema: custom_lists, list_items, likes, ratings
// ============================================================================

import { supabase } from '../lib/supabase'
import type {
  CustomList,
  CustomListInsert,
  ListItem,
  ListItemInsert,
  MovieMetadata
} from '../types/supabase'
import type { MovieDetails } from '../types/movie'

// ============================================================================
// TIPOS
// ============================================================================

export interface UserMovieData {
  isLiked: boolean
  rating: number | null
  inMyList: boolean
  lists: string[] // IDs das listas que contém o filme
}

export interface SavedMovieWithDetails {
  id: string
  movie_id: number
  movie_title: string
  movie_poster: string | null
  movie_metadata: MovieMetadata
  position: number
  notes: string | null
  added_at: string
  userRating?: number
}

// ============================================================================
// LISTAS DO USUÁRIO
// ============================================================================

/**
 * Obtém ou cria a lista padrão "Meus Filmes" do usuário
 */
async function getOrCreateMyList(userId: string): Promise<CustomList | null> {
  if (!supabase || !userId) return null

  try {
    // Tentar buscar lista existente
    const { data: existingList, error: searchError } = await supabase
      .from('custom_lists')
      .select('*')
      .eq('user_id', userId)
      .eq('list_type', 'favorites')
      .eq('name', 'Meus Filmes')
      .single()

    if (existingList) return existingList

    // Se não existir, criar
    if (searchError?.code === 'PGRST116') {
      const listInsert: CustomListInsert = {
        user_id: userId,
        name: 'Meus Filmes',
        list_type: 'favorites',
        is_public: false
      }

      const { data: newList, error: createError } = await supabase
        .from('custom_lists')
        .insert(listInsert)
        .select()
        .single()

      if (createError) throw createError
      console.log('[UserMovieService] Created default list for user')
      return newList
    }

    throw searchError
  } catch (error) {
    console.error('[UserMovieService] Error getting/creating list:', error)
    return null
  }
}

/**
 * Salva um filme na lista "Meus Filmes"
 */
export async function saveToMyList(
  userId: string,
  movie: MovieDetails
): Promise<{ success: boolean; error?: string }> {
  if (!supabase || !userId) {
    return { success: false, error: 'Usuário não autenticado' }
  }

  try {
    // Obter ou criar lista
    const myList = await getOrCreateMyList(userId)
    if (!myList) {
      return { success: false, error: 'Erro ao criar lista' }
    }

    // Verificar se já existe
    const { data: existing } = await supabase
      .from('list_items')
      .select('id')
      .eq('list_id', myList.id)
      .eq('movie_id', movie.id)
      .single()

    if (existing) {
      return { success: false, error: 'Filme já está na lista' }
    }

    // Obter próxima posição
    const { count } = await supabase
      .from('list_items')
      .select('*', { count: 'exact', head: true })
      .eq('list_id', myList.id)

    const position = (count || 0) + 1

    // Preparar metadata
    const metadata: MovieMetadata = {
      genres: movie.genres?.map(g => g.id) || [],
      genre_names: movie.genres?.map(g => g.name) || [],
      year: movie.release_date ? new Date(movie.release_date).getFullYear() : 0,
      tmdb_rating: movie.vote_average || 0,
      director: movie.director,
      runtime: movie.runtime
    }

    // Inserir item
    const itemInsert: ListItemInsert = {
      list_id: myList.id,
      movie_id: movie.id,
      movie_title: movie.title,
      movie_poster: movie.poster_path,
      movie_metadata: metadata,
      position
    }

    const { error: insertError } = await supabase
      .from('list_items')
      .insert(itemInsert)

    if (insertError) throw insertError

    console.log(`[UserMovieService] Movie ${movie.id} saved to list`)

    // Disparar evento para atualizar UI
    window.dispatchEvent(new CustomEvent('myListChanged'))

    return { success: true }
  } catch (error) {
    console.error('[UserMovieService] Error saving to list:', error)
    return { success: false, error: 'Erro ao salvar filme' }
  }
}

/**
 * Remove um filme da lista "Meus Filmes"
 */
export async function removeFromMyList(
  userId: string,
  movieId: number
): Promise<{ success: boolean; error?: string }> {
  if (!supabase || !userId) {
    return { success: false, error: 'Usuário não autenticado' }
  }

  try {
    const myList = await getOrCreateMyList(userId)
    if (!myList) {
      return { success: false, error: 'Lista não encontrada' }
    }

    const { error } = await supabase
      .from('list_items')
      .delete()
      .eq('list_id', myList.id)
      .eq('movie_id', movieId)

    if (error) throw error

    console.log(`[UserMovieService] Movie ${movieId} removed from list`)

    // Disparar evento
    window.dispatchEvent(new CustomEvent('myListChanged'))

    return { success: true }
  } catch (error) {
    console.error('[UserMovieService] Error removing from list:', error)
    return { success: false, error: 'Erro ao remover filme' }
  }
}

/**
 * Obtém todos os filmes salvos do usuário
 */
export async function getMyMovies(
  userId: string
): Promise<{ data: SavedMovieWithDetails[]; error?: string }> {
  if (!supabase || !userId) {
    return { data: [], error: 'Usuário não autenticado' }
  }

  try {
    const myList = await getOrCreateMyList(userId)
    if (!myList) {
      return { data: [] }
    }

    const { data: items, error } = await supabase
      .from('list_items')
      .select('*')
      .eq('list_id', myList.id)
      .order('position', { ascending: true })

    if (error) throw error

    // Buscar ratings para cada filme (em paralelo)
    const moviesWithRatings = await Promise.all(
      (items || []).map(async (item) => {
        const { data: rating } = await supabase
          .from('ratings')
          .select('score')
          .eq('user_id', userId)
          .eq('movie_id', item.movie_id)
          .single()

        return {
          ...item,
          userRating: rating?.score
        }
      })
    )

    return { data: moviesWithRatings }
  } catch (error) {
    console.error('[UserMovieService] Error getting movies:', error)
    return { data: [], error: 'Erro ao buscar filmes' }
  }
}

/**
 * Reordena filmes na lista
 */
export async function reorderMyList(
  userId: string,
  items: Array<{ movieId: number; position: number }>
): Promise<{ success: boolean; error?: string }> {
  if (!supabase || !userId) {
    return { success: false, error: 'Usuário não autenticado' }
  }

  try {
    const myList = await getOrCreateMyList(userId)
    if (!myList) {
      return { success: false, error: 'Lista não encontrada' }
    }

    // Atualizar posições em batch
    for (const item of items) {
      await supabase
        .from('list_items')
        .update({ position: item.position })
        .eq('list_id', myList.id)
        .eq('movie_id', item.movieId)
    }

    window.dispatchEvent(new CustomEvent('myListChanged'))

    return { success: true }
  } catch (error) {
    console.error('[UserMovieService] Error reordering:', error)
    return { success: false, error: 'Erro ao reordenar' }
  }
}

// ============================================================================
// FAVORITOS (LIKES)
// ============================================================================

/**
 * Toggle favorito (like/unlike)
 */
export async function toggleFavorite(
  userId: string,
  movieId: number
): Promise<{ isLiked: boolean; error?: string }> {
  if (!supabase || !userId) {
    return { isLiked: false, error: 'Usuário não autenticado' }
  }

  try {
    // Verificar se já existe
    const { data: existing } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .single()

    if (existing) {
      // Remover like
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('id', existing.id)

      if (error) throw error

      console.log(`[UserMovieService] Movie ${movieId} unliked`)

      // Disparar evento
      window.dispatchEvent(new CustomEvent('favoriteChanged', { detail: { movieId, isLiked: false } }))

      return { isLiked: false }
    } else {
      // Adicionar like
      const { error } = await supabase
        .from('likes')
        .insert({
          user_id: userId,
          movie_id: movieId
        })

      if (error) throw error

      console.log(`[UserMovieService] Movie ${movieId} liked`)

      // Disparar evento
      window.dispatchEvent(new CustomEvent('favoriteChanged', { detail: { movieId, isLiked: true } }))

      return { isLiked: true }
    }
  } catch (error) {
    console.error('[UserMovieService] Error toggling favorite:', error)
    return { isLiked: false, error: 'Erro ao favoritar' }
  }
}

/**
 * Verifica se um filme está favoritado
 */
export async function isMovieLiked(
  userId: string,
  movieId: number
): Promise<boolean> {
  if (!supabase || !userId) return false

  try {
    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .single()

    return !!data
  } catch {
    return false
  }
}

// ============================================================================
// DADOS CONSOLIDADOS
// ============================================================================

/**
 * Obtém todos os dados do usuário para um filme específico
 */
export async function getUserMovieData(
  userId: string,
  movieId: number
): Promise<UserMovieData> {
  if (!supabase || !userId) {
    return {
      isLiked: false,
      rating: null,
      inMyList: false,
      lists: []
    }
  }

  try {
    // Buscar em paralelo
    const [likeData, ratingData, listData] = await Promise.all([
      supabase
        .from('likes')
        .select('id')
        .eq('user_id', userId)
        .eq('movie_id', movieId)
        .single(),
      supabase
        .from('ratings')
        .select('score')
        .eq('user_id', userId)
        .eq('movie_id', movieId)
        .single(),
      // Verificar se está em alguma lista do usuário
      supabase
        .from('list_items')
        .select('list_id, custom_lists!inner(user_id)')
        .eq('movie_id', movieId)
        .eq('custom_lists.user_id', userId)
    ])

    return {
      isLiked: !!likeData.data,
      rating: ratingData.data?.score || null,
      inMyList: (listData.data?.length || 0) > 0,
      lists: listData.data?.map(item => item.list_id) || []
    }
  } catch (error) {
    console.error('[UserMovieService] Error getting user movie data:', error)
    return {
      isLiked: false,
      rating: null,
      inMyList: false,
      lists: []
    }
  }
}

// ============================================================================
// MIGRAÇÃO DE DADOS (UTILITÁRIO)
// ============================================================================

/**
 * Migra dados do localStorage para Supabase (executar uma vez)
 */
export async function migrateLocalStorageToSupabase(
  userId: string
): Promise<{ migrated: number; errors: number }> {
  if (!supabase || !userId) {
    return { migrated: 0, errors: 0 }
  }

  let migrated = 0
  let errors = 0

  try {
    const savedMoviesStr = localStorage.getItem('savedMovies')
    if (!savedMoviesStr) return { migrated, errors }

    const savedMovies = JSON.parse(savedMoviesStr)
    if (!Array.isArray(savedMovies) || savedMovies.length === 0) {
      return { migrated, errors }
    }

    console.log(`[Migration] Found ${savedMovies.length} movies to migrate`)

    for (const movie of savedMovies) {
      try {
        // Converter para formato MovieDetails simplificado
        const movieDetails: Partial<MovieDetails> = {
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          release_date: movie.release_date,
          vote_average: movie.vote_average,
          overview: movie.overview,
          director: movie.director,
          genres: movie.genres?.split(',').map((name: string, index: number) => ({
            id: index,
            name: name.trim()
          })) || []
        }

        const result = await saveToMyList(userId, movieDetails as MovieDetails)
        if (result.success) {
          migrated++
        } else {
          errors++
        }
      } catch (error) {
        console.error('[Migration] Error migrating movie:', movie.id, error)
        errors++
      }
    }

    // Limpar localStorage após migração bem-sucedida
    if (migrated > 0) {
      localStorage.removeItem('savedMovies')
      console.log(`[Migration] Completed: ${migrated} migrated, ${errors} errors`)
    }

    return { migrated, errors }
  } catch (error) {
    console.error('[Migration] Fatal error:', error)
    return { migrated, errors }
  }
}

// ============================================================================
// ESTATÍSTICAS DO USUÁRIO
// ============================================================================

export interface UserStats {
  totalMovies: number;
  watchedMovies: number;
  averageRating: number;
  favoriteGenres: string[];
  watchTime: number;
}

/**
 * Obtém estatísticas consolidadas do usuário
 */
export async function getUserStats(userId: string): Promise<{ data: UserStats | null; error?: string }> {
  if (!supabase || !userId) {
    return { data: null, error: 'Usuário não autenticado' }
  }

  try {
    // Buscar ratings
    const { data: ratings, error: ratingError } = await supabase
      .from('ratings')
      .select('score, movie_id')
      .eq('user_id', userId)

    if (ratingError) throw ratingError

    // Buscar total de filmes salvos na lista "Meus Filmes"
    const { data: listItemsResult } = await getMyMovies(userId)
    const listItems = listItemsResult || []

    const totalRatings = ratings?.length || 0

    // Se não tiver dados, retornar zerado
    if (totalRatings === 0 && listItems.length === 0) {
      return {
        data: {
          totalMovies: 0,
          watchedMovies: 0,
          averageRating: 0,
          favoriteGenres: [],
          watchTime: 0
        }
      }
    }

    // Calcular estatísticas
    const avgRating = totalRatings > 0
      ? ratings.reduce((acc: number, curr: any) => acc + curr.score, 0) / totalRatings
      : 0

    // Gêneros favoritos (baseado em metadados da lista E ratings)
    const genreCounts: Record<string, number> = {}
    let totalRuntime = 0
    const processedMovieIds = new Set<number>()

    // 1. Processar itens da lista (já temos metadata)
    listItems.forEach(item => {
      processedMovieIds.add(item.movie_id)

      // Contar gêneros
      item.movie_metadata?.genre_names?.forEach((genre: string) => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1
      })

      // Somar tempo (se disponível)
      if (item.movie_metadata?.runtime) {
        totalRuntime += item.movie_metadata.runtime
      }
    })

    // 2. Processar ratings que NÃO estão na lista (precisamos buscar detalhes)
    // Para evitar muitas requisições, vamos pegar os IDs que faltam
    const movieIdsInList = new Set(listItems.map(i => i.movie_id))
    const missingMovieIds = ratings
      .map((r: any) => r.movie_id)
      .filter((id: number) => !movieIdsInList.has(id))

    // Se houver filmes avaliados fora da lista, buscar detalhes (com limite para não explodir API)
    if (missingMovieIds.length > 0) {
      console.log(`[UserStats] Found ${missingMovieIds.length} rated movies not in list, fetching details...`)

      // Importar getMovieDetails dinamicamente para evitar ciclo ou usar fetch direto
      // Mas como estamos em um service, ideal seria injetar ou usar o tmdbApi.
      // Vamos assumir que podemos importar do tmdbApi.ts

      // NOTA: Para este fix rápido, vamos tentar buscar apenas os top 5 mais recentes para não demorar muito
      // No futuro, isso deveria ser salvo no banco junto com o rating

      const { getMovieDetails } = await import('./tmdbApi')

      const moviesToFetch = missingMovieIds.slice(0, 10) // Limitado a 10 para performance

      await Promise.all(moviesToFetch.map(async (movieId: number) => {
        try {
          const details = await getMovieDetails(movieId)
          if (details) {
            // Contar gêneros
            details.genres?.forEach((g: any) => {
              genreCounts[g.name] = (genreCounts[g.name] || 0) + 1
            })

            // Somar tempo
            if (details.runtime) {
              totalRuntime += details.runtime
            }
          }
        } catch (err) {
          console.warn(`Error fetching details for movie ${movieId}`, err)
        }
      }))
    }

    const favoriteGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([genre]) => genre)

    return {
      data: {
        totalMovies: totalRatings, // Total avaliado é o mais importante para "Total de Filmes"
        watchedMovies: processedMovieIds.size + missingMovieIds.length, // Total assistido (únicos)
        averageRating: avgRating,
        favoriteGenres,
        watchTime: totalRuntime
      }
    }

  } catch (error) {
    console.error('[UserMovieService] Error getting user stats:', error)
    return { data: null, error: 'Erro ao buscar estatísticas' }
  }
}