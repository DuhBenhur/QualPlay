import React, { useState } from 'react'
import { X, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { signIn, signUp } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{text: string, type: 'error' | 'success' | 'info'}>({text: '', type: 'error'})
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage({text: '', type: 'error'}) // Limpar mensagens anteriores
    
    console.log('Formulário submetido:', isSignUp ? 'Cadastro' : 'Login')

    try {
      if (isSignUp) {
        // Validações para cadastro
        if (formData.password !== formData.confirmPassword) {
          setMessage({text: 'As senhas não coincidem', type: 'error'})
          setLoading(false); return
        }
        if (formData.password.length < 6) {
          setMessage({text: 'A senha deve ter pelo menos 6 caracteres', type: 'error'})
          setLoading(false); return
        }
        if (!formData.fullName.trim()) {
          setMessage({text: 'Nome completo é obrigatório', type: 'error'})
          setLoading(false); return
        }
        
        // Validar formato de email
        if (!/\S+@\S+\.\S+/.test(formData.email)) {
          setMessage({text: 'Email inválido', type: 'error'})
          setLoading(false); return
        }

        const { error } = await signUp(formData.email, formData.password, formData.fullName)
        if (error) {
          setMessage({text: error.message, type: 'error'})
        } else {
          // Mostrar mensagem de sucesso com informações sobre confirmação de email
          setMessage({
            text: 'Conta criada com sucesso! Você já pode fazer login com suas credenciais. (Confirmação de email desabilitada para desenvolvimento)',
            type: 'success'
          })
          
          // Mudar para o formulário de login após 2 segundos
          setTimeout(() => {
            setIsSignUp(false)
            setLoading(false)
          }, 2000)
          return
        }
      } else {
        // Login
        console.log('Tentando login para:', formData.email)
        const { error } = await signIn(formData.email, formData.password)
        if (error) {
          console.error('Erro no login:', error)
          
          if (error.message.includes('não encontrado')) {
            setMessage({text: 'Usuário não encontrado. Verifique o email ou crie uma conta.', type: 'error'})
          } else if (error.message.includes('not found')) {
            setMessage({text: 'Usuário não encontrado. Verifique o email ou crie uma conta.', type: 'error'})
          } else if (error.message.includes('incorretos') || error.message.includes('Invalid login credentials') || error.message.includes('Invalid')) {
            setMessage({text: 'Email ou senha incorretos', type: 'error'})
          } else if (error.message.includes('Email not confirmed')) {
            // Mensagem especial para email não confirmado
            setMessage({
              text: 'Você precisa confirmar seu email antes de fazer login. Verifique sua caixa de entrada e spam.',
              type: 'info'
            })
          } else {
            setMessage({text: error.message || 'Erro ao fazer login', type: 'error'})
          }
        } else {
          console.log('Login bem-sucedido')
          // Fechar o modal após login bem-sucedido
          setTimeout(() => {
            onClose()
          }, 1000)
        }
      }
    } catch (err) {
      console.error('Erro no formulário de autenticação:', err)
      setMessage({text: 'Erro inesperado. Tente novamente.', type: 'error'})
    } finally {
      if (!isSignUp) {
        setLoading(false)
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleGoogleLogin = async () => {
    setLoading(true);
    setMessage({text: '', type: 'error'});
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://qualplay.netlify.app'
        }
      });
      if (error) {
        setMessage({text: error.message, type: 'error'});
      }
    } catch (err) {
      setMessage({text: 'Erro ao fazer login com Google', type: 'error'});
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            {isSignUp ? 'Criar Conta' : 'Entrar'}
            {isSignUp && <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">Confirmação desabilitada</span>}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Botão de login social */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 mb-4 bg-white text-slate-800 rounded-md border border-slate-300 hover:bg-slate-100 transition-colors font-medium shadow-sm"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
          Entrar com Google
        </button>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nome Completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Seu nome completo"
                  required={isSignUp}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-10 pr-12 py-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Sua senha"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirme sua senha"
                  required={isSignUp}
                />
              </div>
            </div>
          )}

          {message.text && (
            <div className={`p-3 rounded-md ${
              message.type === 'error' ? 'bg-red-900/50 border border-red-500' :
              message.type === 'success' ? 'bg-green-900/50 border border-green-500' :
              'bg-blue-900/50 border border-blue-500'
            }`}>
              <p className={`text-sm font-medium ${
                message.type === 'error' ? 'text-red-300' :
                message.type === 'success' ? 'text-green-300' :
                'text-blue-300'
              }`}>
                {message.text}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{isSignUp ? 'Criando conta...' : 'Entrando...'}</span>
              </div>
            ) : (
              isSignUp ? 'Criar Conta' : 'Entrar'
            )}
          </button>
        </form>

        {/* Toggle */}
        <div className="mt-6 text-center">
          <p className="text-slate-400">
            {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}
            <button 
              onClick={() => {
                setIsSignUp(!isSignUp)
                setMessage({text: '', type: 'error'})
                setFormData({ email: '', password: '', fullName: '', confirmPassword: '' })
              }}
              className="ml-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              {isSignUp ? 'Fazer login' : 'Criar conta'}
            </button>
          </p>
        </div>

        {/* Benefits */}
        <div className={`mt-6 p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg border border-blue-500/20 transition-opacity duration-300 ${isSignUp ? 'opacity-100' : 'opacity-50'}`}>
          <h3 className="text-white font-medium mb-2">🎯 Com sua conta você terá:</h3>
          <ul className="text-slate-300 text-sm space-y-1">
            <li>• Recomendações personalizadas baseadas no seu histórico</li>
            <li>• Listas sincronizadas entre dispositivos</li>
            <li>• Análises avançadas dos seus gostos</li>
            <li>• Histórico completo de filmes assistidos</li>
          </ul>
        </div>
      </div>
      
      {/* Mensagem de desenvolvimento */}
      <div className="fixed bottom-4 left-4 bg-yellow-600/80 text-white text-xs px-3 py-1 rounded-full">
        Modo desenvolvimento: confirmação de email desabilitada
      </div>
    </div>
  )
}

export default LoginModal