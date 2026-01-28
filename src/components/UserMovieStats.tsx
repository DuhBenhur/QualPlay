import React, { useEffect, useState } from 'react';
import { BarChart3, Clock, Film, Star, Award, Calendar, Check, Search, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserStats, type UserStats } from '../services/userMovieService';

const MINIMUM_RATINGS = 5;

interface UserMovieStatsProps {
  onNavigate?: (page: 'home' | 'about' | 'contact' | 'community') => void;
}

const UserMovieStats: React.FC<UserMovieStatsProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      // Se não houver usuário, não tente buscar estatísticas
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 2000)
        );

        const fetchData = async () => {
          const { data, error } = await getUserStats(user.id);
          if (error) throw new Error(error);
          return data;
        };

        const data = await Promise.race([fetchData(), timeout]);
        setStats(data as UserStats);
      } catch (error) {
        console.error('Error fetching user stats:', error);
        // Em caso de erro, definimos um estado vazio para não travar a tela
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  // Se não houver usuário, não renderize nada
  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 mb-6">
        {/* Loading Skeleton */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-6 h-6 bg-slate-700 rounded animate-pulse" />
          <div className="h-6 w-48 bg-slate-700 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-slate-700 rounded-lg p-4 animate-pulse">
              <div className="h-6 w-6 mx-auto mb-2 bg-slate-600 rounded" />
              <div className="h-8 w-16 mx-auto mb-2 bg-slate-600 rounded" />
              <div className="h-4 w-20 mx-auto bg-slate-600 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Verificar se há dados suficientes (threshold de 5 avaliações)
  const hasEnoughData = stats && stats.totalMovies >= MINIMUM_RATINGS;
  const ratingsCount = stats?.totalMovies || 0;
  const progress = Math.min((ratingsCount / MINIMUM_RATINGS) * 100, 100);

  if (!hasEnoughData) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="text-blue-400" size={24} />
          <h3 className="text-xl font-semibold text-white">
            Suas Estatísticas
          </h3>
        </div>

        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-900/30 border-2 border-blue-500/50 mb-4">
            <TrendingUp className="text-blue-400" size={36} />
          </div>

          <h4 className="text-xl font-bold text-white mb-2">
            {ratingsCount === 0 ? 'Comece Sua Jornada!' : 'Você Está Quase Lá!'}
          </h4>

          <p className="text-slate-300 mb-6 max-w-md mx-auto">
            {ratingsCount === 0
              ? 'Avalie seus primeiros filmes para desbloquear estatísticas personalizadas incríveis!'
              : `Avalie mais ${MINIMUM_RATINGS - ratingsCount} ${MINIMUM_RATINGS - ratingsCount === 1 ? 'filme' : 'filmes'} para desbloquear suas estatísticas personalizadas.`
            }
          </p>

          {/* Progress Bar */}
          <div className="max-w-sm mx-auto mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">
                <Film className="inline mr-1" size={14} />
                {ratingsCount} de {MINIMUM_RATINGS} avaliações
              </span>
              <span className="text-blue-400 font-bold text-sm">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => {
              if (onNavigate) {
                onNavigate('home');
              } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/25 font-medium"
          >
            <Search size={18} />
            Encontrar Filmes para Avaliar
          </button>

          {/* Motivação */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg border border-blue-500/20">
            <p className="text-blue-300 text-sm">
              ✨ Desbloqueie insights sobre seus gêneros favoritos, tempo assistido e muito mais!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Formatar tempo assistido
  const formatWatchTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} dia${days > 1 ? 's' : ''} e ${hours % 24} hora${hours % 24 !== 1 ? 's' : ''}`;
    }
    return `${hours} hora${hours !== 1 ? 's' : ''}`;
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="text-blue-400" size={24} />
          <h3 className="text-xl font-semibold text-white">
            Suas Estatísticas
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-slate-700 rounded-lg p-4 text-center">
          <Film className="text-blue-400 mx-auto mb-2" size={24} />
          <div className="text-2xl font-bold text-white">{stats.totalMovies}</div>
          <div className="text-slate-400 text-sm">Total de Filmes</div>
        </div>

        <div className="bg-slate-700 rounded-lg p-4 text-center">
          <Check className="text-green-400 mx-auto mb-2" size={24} />
          <div className="text-2xl font-bold text-white">{stats.watchedMovies}</div>
          <div className="text-slate-400 text-sm">Assistidos</div>
        </div>

        <div className="bg-slate-700 rounded-lg p-4 text-center">
          <Star className="text-yellow-400 mx-auto mb-2" size={24} />
          <div className="text-2xl font-bold text-white">{stats.averageRating.toFixed(1)}</div>
          <div className="text-slate-400 text-sm">Nota Média</div>
        </div>

        <div className="bg-slate-700 rounded-lg p-4 text-center">
          <Clock className="text-purple-400 mx-auto mb-2" size={24} />
          <div className="text-lg font-bold text-white">{formatWatchTime(stats.watchTime)}</div>
          <div className="text-slate-400 text-sm">Tempo Assistido</div>
        </div>

        <div className="bg-slate-700 rounded-lg p-4 text-center">
          <Calendar className="text-cyan-400 mx-auto mb-2" size={24} />
          <div className="text-lg font-bold text-white">
            {new Date().getFullYear()}
          </div>
          <div className="text-slate-400 text-sm">Ano Atual</div>
        </div>
      </div>

      {/* Gêneros Favoritos */}
      <div className="bg-slate-700 rounded-lg p-4 mb-6">
        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Award className="text-yellow-400" size={18} />
          Seus Gêneros Favoritos
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {stats.favoriteGenres.map((genre, index) => (
            <div
              key={genre}
              className="bg-slate-600 rounded-lg p-3 text-center"
              style={{
                background: `linear-gradient(to bottom right, ${['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'][index % 5]
                  }33, transparent)`
              }}
            >
              <div className="text-white font-medium">{genre}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-4 border border-blue-500/20">
        <h4 className="text-white font-medium mb-3">🎯 Insights Personalizados</h4>
        <div className="text-slate-300 text-sm space-y-2">
          {/* Total de filmes assistidos */}
          {stats.watchedMovies > 0 && (
            <p>• Você já assistiu <strong>{stats.watchedMovies}</strong> {stats.watchedMovies === 1 ? 'filme' : 'filmes'}!</p>
          )}

          {/* Tempo assistido - só mostrar se > 0 */}
          {stats.watchTime > 0 && (
            <p>• Você já passou aproximadamente <strong>{formatWatchTime(stats.watchTime)}</strong> assistindo filmes!</p>
          )}

          {/* Gênero favorito - só se tiver pelo menos 3 filmes */}
          {stats.favoriteGenres.length > 0 && stats.watchedMovies >= 3 && (
            <p>• Seu gênero favorito é <strong>{stats.favoriteGenres[0]}</strong>.</p>
          )}

          {/* Avaliação média - com emoji baseado na nota */}
          {stats.averageRating > 0 && (
            <p>
              • Média de notas: <strong>{stats.averageRating.toFixed(1)}/10</strong>
              {stats.averageRating >= 8 && ' ⭐ Você é exigente!'}
              {stats.averageRating < 8 && stats.averageRating >= 6 && ' 👍 Gosta de variedade!'}
              {stats.averageRating < 6 && ' 🤔 Um crítico honesto!'}
            </p>
          )}

          {/* Call to action se tiver poucos filmes */}
          {stats.watchedMovies < 5 && (
            <p className="text-indigo-300">
              • 💡 <strong>Dica:</strong> Avalie mais {5 - stats.watchedMovies} {5 - stats.watchedMovies === 1 ? 'filme' : 'filmes'} para desbloquear estatísticas detalhadas!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserMovieStats;
