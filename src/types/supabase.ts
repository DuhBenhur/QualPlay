// ============================================================================
// QUALPLAY - TIPOS SUPABASE SOCIAL
// ============================================================================
// Tipos TypeScript para as tabelas do banco de dados social
// ============================================================================

// ============================================================================
// PROFILES - Perfil de Usuário
// ============================================================================
export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  genre_preferences: number[] // IDs de gêneros do TMDB
  preferred_languages: string[]
  created_at: string
  updated_at: string
}

export type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at'>
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'email' | 'created_at'>>

// ============================================================================
// LIKES - Curtidas em Filmes
// ============================================================================
export interface Like {
  id: string
  user_id: string
  movie_id: number
  created_at: string
}

export type LikeInsert = Omit<Like, 'id' | 'created_at'>

// ============================================================================
// RATINGS - Avaliações 1-5 Estrelas
// ============================================================================
export interface Rating {
  id: string
  user_id: string
  movie_id: number
  score: 1 | 2 | 3 | 4 | 5
  created_at: string
  updated_at: string
}

export type RatingInsert = Omit<Rating, 'id' | 'created_at' | 'updated_at'>
export type RatingUpdate = Pick<Rating, 'score'>

// ============================================================================
// COMMENTS - Comentários
// ============================================================================
export interface Comment {
  id: string
  user_id: string
  movie_id: number
  parent_id: string | null
  content: string
  likes_count: number
  created_at: string
  updated_at: string
  // Campos populados via JOIN
  user?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
  replies?: Comment[]
}

export type CommentInsert = Pick<Comment, 'user_id' | 'movie_id' | 'content'> & {
  parent_id?: string
}
export type CommentUpdate = Pick<Comment, 'content'>

// ============================================================================
// COMMENT_LIKES - Curtidas em Comentários
// ============================================================================
export interface CommentLike {
  id: string
  user_id: string
  comment_id: string
  created_at: string
}

export type CommentLikeInsert = Omit<CommentLike, 'id' | 'created_at'>

// ============================================================================
// CUSTOM_LISTS - Listas Personalizadas
// ============================================================================
export type ListType = 'manual' | 'smart' | 'watchlist' | 'favorites'

export interface CustomList {
  id: string
  user_id: string
  name: string
  description: string | null
  cover_image_url: string | null
  is_public: boolean
  list_type: ListType
  created_at: string
  updated_at: string
  // Campos populados via JOIN
  items?: ListItem[]
  items_count?: number
  user?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
}

export type CustomListInsert = Pick<CustomList, 'user_id' | 'name'> & {
  description?: string
  cover_image_url?: string
  is_public?: boolean
  list_type?: ListType
}

export type CustomListUpdate = Partial<Omit<CustomList, 'id' | 'user_id' | 'created_at' | 'updated_at'>>

// ============================================================================
// LIST_ITEMS - Itens das Listas
// ============================================================================
export interface MovieMetadata {
  genres: number[]
  genre_names?: string[]
  year: number
  tmdb_rating: number
  director?: string
  runtime?: number
}

export interface ListItem {
  id: string
  list_id: string
  movie_id: number
  movie_title: string
  movie_poster: string | null
  movie_metadata: MovieMetadata
  position: number
  notes: string | null
  added_at: string
}

export type ListItemInsert = Pick<ListItem, 'list_id' | 'movie_id' | 'movie_title'> & {
  movie_poster?: string
  movie_metadata?: MovieMetadata
  position?: number
  notes?: string
}

export type ListItemUpdate = Partial<Pick<ListItem, 'position' | 'notes'>>

// ============================================================================
// FOLLOWERS - Sistema de Seguidores
// ============================================================================
export interface Follower {
  id: string
  follower_id: string
  following_id: string
  created_at: string
  // Campos populados via JOIN
  follower?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
  following?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
}

export type FollowerInsert = Pick<Follower, 'follower_id' | 'following_id'>

// ============================================================================
// USER_ACTIVITY_LOG - Log de Atividades
// ============================================================================
export type ActivityActionType = 'view' | 'search' | 'hover' | 'scroll' | 'click' | 'share'

export interface ActivityContext {
  page?: string
  source?: string
  duration_ms?: number
  device?: 'desktop' | 'mobile' | 'tablet'
  search_query?: string
  referrer?: string
  [key: string]: unknown
}

export interface UserActivity {
  id: string
  user_id: string
  movie_id: number | null
  action_type: ActivityActionType
  context: ActivityContext
  created_at: string
}

export type UserActivityInsert = Omit<UserActivity, 'id' | 'created_at'>

// ============================================================================
// GENRE_AFFINITY_SCORES - Cache de Afinidade por Gênero
// ============================================================================
export interface GenreAffinity {
  id: string
  user_id: string
  genre_id: number
  affinity_score: number // 0.000 a 1.000
  interaction_count: number
  last_updated: string
}

export type GenreAffinityInsert = Omit<GenreAffinity, 'id' | 'last_updated'>
export type GenreAffinityUpdate = Pick<GenreAffinity, 'affinity_score' | 'interaction_count'>

// ============================================================================
// VIEWS - Estatísticas
// ============================================================================
export interface MovieStats {
  movie_id: number
  likes_count: number
  ratings_count: number
  avg_rating: number | null
  comments_count: number
}

export interface UserStats {
  user_id: string
  full_name: string | null
  total_likes: number
  total_ratings: number
  avg_rating_given: number | null
  total_comments: number
  total_lists: number
  followers_count: number
  following_count: number
}

// ============================================================================
// TIPOS AUXILIARES
// ============================================================================

// Resposta paginada genérica
export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

// Parâmetros de paginação
export interface PaginationParams {
  page?: number
  pageSize?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
}

// Filtros de busca para listas
export interface ListFilters {
  user_id?: string
  is_public?: boolean
  list_type?: ListType
  search?: string
}

// Filtros de busca para comentários
export interface CommentFilters {
  movie_id?: number
  user_id?: string
  parent_id?: string | null // null para comentários raiz
}

// Interação do usuário com um filme (agregado)
export interface UserMovieInteraction {
  movie_id: number
  is_liked: boolean
  rating: Rating | null
  in_lists: string[] // IDs das listas que contém o filme
}
