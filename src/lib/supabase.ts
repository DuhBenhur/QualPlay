import { createClient } from '@supabase/supabase-js'

// Verificar variáveis de ambiente
// Valores de fallback para desenvolvimento local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://seu-projeto.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

if (!supabaseUrl || supabaseUrl === 'https://seu-projeto.supabase.co') {
  console.error('⚠️ VITE_SUPABASE_URL não configurada corretamente!')
}

if (!supabaseAnonKey || supabaseAnonKey === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...') {
  console.error('⚠️ VITE_SUPABASE_ANON_KEY não configurada corretamente!')
}

// Criar cliente com opções adicionais
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // Importante para processar tokens de confirmação
    storageKey: 'qualplay-auth',
    storage: localStorage,
    flowType: 'pkce',
    debug: true
  }
})

// Verificar se há token de confirmação na URL
// Isso é necessário para processar a confirmação de email
const checkConfirmationToken = async () => {
  const url = new URL(window.location.href);
  const token = url.searchParams.get('token');
  const type = url.searchParams.get('type');
  
  if (token && type === 'signup') {
    try {
      console.log('Token de confirmação detectado, processando...');
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup'
      });
      
      if (error) {
        console.error('Erro ao confirmar email:', error);
      } else {
        console.log('Email confirmado com sucesso!');
        // Remover parâmetros da URL para evitar problemas de refresh
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (error) {
      console.error('Erro ao processar token de confirmação:', error);
    }
  }
};

// Executar verificação de token
if (typeof window !== 'undefined') {
  checkConfirmationToken();
}





// Tipos para o banco de dados
export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
  preferences: {
    favorite_genres: number[]
    preferred_languages: string[]
    notification_settings: {
      email_recommendations: boolean
      new_releases: boolean
    }
  }
}

export interface UserMovie {
  id: string
  user_id: string
  movie_id: number
  movie_title: string
  movie_poster: string | null
  status: 'watched' | 'want_to_watch' | 'watching' | 'dropped'
  rating: number | null
  review: string | null
  watched_at: string | null
  created_at: string
  updated_at: string
  movie_data: {
    genres: string[]
    director: string
    year: number
    tmdb_rating: number
  }
}

export interface UserList {
  id: string
  user_id: string
  name: string
  description: string | null
  is_public: boolean
  created_at: string
  updated_at: string
  movies: UserMovie[]
}

export interface UserInteraction {
  id: string
  user_id: string
  movie_id: number
  interaction_type: 'search' | 'view_details' | 'add_to_list' | 'rate' | 'share'
  metadata: Record<string, any>
  created_at: string
}

export interface Recommendation {
  id: string
  user_id: string
  movie_id: number
  movie_title: string
  movie_poster: string | null
  recommendation_type: 'collaborative' | 'content_based' | 'trending' | 'similar_users'
  score: number
  reasons: string[]
  created_at: string
  is_dismissed: boolean
  movie_data: {
    genres: string[]
    director: string
    year: number
    tmdb_rating: number
  }
}

export { supabase }