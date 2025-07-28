import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, Profile } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await loadProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId: string) => {
    try {
      console.log('Carregando perfil para usuário:', userId)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setProfile(data)
        console.log('Perfil carregado com sucesso')
      } else {
        console.error('Perfil não encontrado')
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      console.log('Iniciando cadastro para:', email)
      console.log('Confirmação de email está desabilitada para desenvolvimento')
      
      // Limpar qualquer sessão anterior
      try {
        await supabase.auth.signOut()
      } catch (e) {
        console.log('Erro ao fazer signOut prévio:', e)
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // URL para redirecionamento após confirmação de email
          emailRedirectTo: typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://qualplay.netlify.app',
          data: {
            full_name: fullName
          }
        }
      })
      
      if (error) {
        console.error('Erro no signUp:', error)
        return { error }
      }
      
      console.log('Cadastro bem-sucedido:', data.user?.id)
      
      // Verificar se o email precisa de confirmação
      if (data.user && !data.user.confirmed_at) {
        console.log('Email precisa de confirmação. Verificando status...')
        
        // Em desenvolvimento, o email já deve estar confirmado automaticamente
        // devido à configuração no Supabase
        const { data: userData } = await supabase.auth.getUser()
        if (userData.user?.confirmed_at) {
          console.log('Email confirmado automaticamente!')
        } else {
          console.log('Email ainda não confirmado. Verifique a caixa de entrada.')
        }
      }

      // Verificar se o perfil foi criado
      if (data.user) {
        console.log('Verificando perfil para usuário:', data.user.id)
        
        // Esperar um momento maior para o trigger executar
        await new Promise(resolve => setTimeout(resolve, 3000))

        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()

          if (profileError) {
            console.error('Erro ao verificar perfil:', profileError)
          } else {
            console.log('Perfil encontrado:', profile)
            setProfile(profile)
          }
        } catch (profileCheckError) {
          console.error('Erro ao verificar perfil:', profileCheckError)
        }
      }

      // Tentar criar o perfil manualmente se não existir
      if (data.user) {
        try {
          // Tentar criar perfil diretamente
          const { error: insertError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              email: data.user.email,
              full_name: fullName || data.user.email?.split('@')[0]
            }, {
              onConflict: 'id',
              ignoreDuplicates: false
            })
          
          if (insertError) {
            console.error('Erro ao inserir perfil manualmente:', insertError)
          }
        } catch (err) {
          console.error('Erro inesperado ao criar perfil:', err)
        }
      }

      return { error: null }
    } catch (error) {
      console.error('Erro inesperado no signUp:', error)
      return { error: error as AuthError }
    }
  }

  const signIn = async (email: string, password: string) => {
    console.log('Tentando login para:', email)
    
    try {
      try {
        // Limpar qualquer sessão anterior
        await supabase.auth.signOut()
      } catch (error) {
        console.log('Erro ao fazer signOut prévio:', error)
      }
      
      // Tentar login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        console.error('Erro no login:', error.message)
        
        // Verificar se o erro é de email não confirmado
        if (error.message.includes('Email not confirmed')) {
          console.log('Email não confirmado. Verifique sua caixa de entrada para confirmar o email.')
        }
        
        return { error }
      } else {
        console.log('Login bem-sucedido:', data.user?.id)
        
        // Carregar perfil
        if (data.user) {
          await loadProfile(data.user.id)
          
          // Se não encontrou perfil, tentar criar manualmente
          if (!profile) {
            console.log('Perfil não encontrado, tentando criar manualmente')
            try {
              // Tentar criar perfil diretamente
              const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                  id: data.user.id,
                  email: data.user.email,
                  full_name: data.user.email?.split('@')[0]
                })
              
              if (insertError) {
                console.error('Erro ao inserir perfil manualmente:', insertError)
              } else {
                console.log('Perfil criado manualmente com sucesso')
                await loadProfile(data.user.id)
              }
            } catch (err) {
              console.error('Erro ao criar perfil manualmente:', err)
            }
          }
        }
        
        return { error: null }
      }
    } catch (err) {
      console.error('Erro inesperado no login:', err)
      return { error: { message: 'Erro inesperado no login' } as AuthError }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setUser(null);
      setProfile(null);
      setSession(null);
      
    } catch (error) {
      setUser(null);
      setProfile(null);
      setSession(null);
      throw error;
    }
  }
  
  // Função para verificar se o email está confirmado
  const checkEmailConfirmation = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('auth.users')
        .select('confirmed_at')
        .eq('email', email)
        .single()
      
      if (error) {
        console.error('Erro ao verificar confirmação de email:', error)
        return false
      }
      
      return data?.confirmed_at != null
    } catch (error) {
      console.error('Erro ao verificar confirmação de email:', error)
      return false
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!user) throw new Error('No user logged in')
      
      console.log('Atualizando perfil para usuário:', user.id)

      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      // Atualizar estado local
      console.log('Perfil atualizado com sucesso')
      setProfile(prev => prev ? { ...prev, ...updates } : null)
      
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    checkEmailConfirmation
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      {/* Adicionar log para debug */}
      {process.env.NODE_ENV === 'development' && (
        <div className="hidden">
          {/* eslint-disable-next-line no-console */}
          <>{console.log('AuthContext state:', { user, profile, session, loading })}</>
        </div>
      )}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}