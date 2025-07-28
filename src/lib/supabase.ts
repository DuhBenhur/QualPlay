import { createClient } from '@supabase/supabase-js'
import { isValidEnvironment } from './utils'

// Verificar variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Verificar se as variáveis estão configuradas corretamente
const isSupabaseConfigured = supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://seu-projeto.supabase.co' && 
  supabaseAnonKey !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

// Verificar se estamos no Netlify
const isNetlify = typeof window !== 'undefined' && 
  (window.location.hostname.includes('netlify.app') || 
   window.location.hostname.includes('netlify.com'))

if (!isSupabaseConfigured) {
  console.error('⚠️ Supabase não configurado corretamente!')
  console.error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Netlify')
}

if (isNetlify) {
  console.log('🌐 Detectado ambiente Netlify - inicializando Supabase com cuidado')
}

// Criar cliente apenas se as variáveis estiverem configuradas
const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Desabilitar detecção de URL no Netlify
    storageKey: 'qualplay-auth',
    storage: localStorage,
    flowType: 'pkce',
    debug: false // Desabilitar debug no Netlify
  }
}) : {
  auth: {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signUp: async () => ({ data: null, error: { message: 'Autenticação não disponível' } }),
    signIn: async () => ({ data: null, error: { message: 'Autenticação não disponível' } }),
    signOut: async () => ({ error: null }),
    getUser: async () => ({ data: { user: null } }),
    verifyOtp: async () => ({ error: { message: 'Autenticação não disponível' } })
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: { message: 'Autenticação não disponível' } })
      })
    }),
    update: () => ({
      eq: async () => ({ error: { message: 'Autenticação não disponível' } })
    }),
    insert: async () => ({ error: { message: 'Autenticação não disponível' } }),
    upsert: async () => ({ error: { message: 'Autenticação não disponível' } })
  })
}

// Verificar se há token de confirmação na URL
// Isso é necessário para processar a confirmação de email
const checkConfirmationToken = async () => {
  if (!supabase) return;
  
  try {
    // Verificar se estamos em um ambiente válido
    if (!isValidEnvironment()) {
      console.log('Ambiente inválido detectado, ignorando verificação de token');
      return;
    }
    
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
  } catch (error) {
    // Ignorar erro de URL inválida
    console.log('URL inválida detectada, ignorando verificação de token');
  }
};

// Executar verificação de token apenas se estivermos em um ambiente válido
if (isValidEnvironment() && supabase) {
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