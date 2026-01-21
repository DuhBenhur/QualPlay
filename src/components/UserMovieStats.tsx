import React, { useEffect, useState } from 'react';
import { BarChart3, Clock, Film, Star, Award, Calendar, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserMovieService } from '../services/userMovieService';

interface UserStats {
  totalMovies: number;
  watchedMovies: number;
  averageRating: number;
  favoriteGenres: string[];
  watchTime: number;
}

const UserMovieStats: React.FC = () => {
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
          setTimeout(() => reject(new Error('Timeout')), 8000)
        );

        const fetchData = async () => {
          const { data, error } = await UserMovieService.getUserStats();
          if (error) throw error;
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
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-white">Carregando estatísticas...</span>
        </div>
      </div>
    );
  }

  if (!stats || stats.totalMovies === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 mb-6">
        <div className="text-center py-4">
          <BarChart3 className="mx-auto text-slate-600 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-white mb-2">
            Estatísticas Pessoais
          </h3>
          <p className="text-slate-400 mb-4">
            Você ainda não tem filmes na sua lista. Adicione filmes para ver estatísticas personalizadas.
          </p>
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
          <p>• Você já assistiu <strong>{stats.watchedMovies}</strong> filmes, o que representa <strong>{Math.round((stats.watchedMovies / stats.totalMovies) * 100)}%</strong> da sua lista.</p>
          <p>• Seu gênero favorito é <strong>{stats.favoriteGenres[0]}</strong>, com <strong>{Math.round((stats.favoriteGenres.length > 0 ? 1 : 0) / stats.totalMovies * 100)}%</strong> dos filmes.</p>
          <p>• Você já passou aproximadamente <strong>{formatWatchTime(stats.watchTime)}</strong> assistindo filmes!</p>
          {stats.averageRating > 7 && (
            <p>• Você é um avaliador <strong>exigente</strong>, com média de notas <strong>{stats.averageRating.toFixed(1)}</strong>.</p>
          )}
          {stats.averageRating <= 7 && (
            <p>• Você é um avaliador <strong>moderado</strong>, com média de notas <strong>{stats.averageRating.toFixed(1)}</strong>.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserMovieStats;