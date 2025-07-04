import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area, Treemap
} from 'recharts';
import { BarChart3, PieChart as PieIcon, TrendingUp, ScatterChart as Scatter3D, Radar as RadarIcon, Activity, TreePine, Calendar, DollarSign, Star, Clock, Users, Award, Zap, Box } from 'lucide-react';
import { MovieDetails } from '../types/movie';

interface DataVisualizationDashboardProps {
  movies: MovieDetails[];
}

const DataVisualizationDashboard: React.FC<DataVisualizationDashboardProps> = ({ movies }) => {
  const [activeChart, setActiveChart] = useState<string>('overview');

  // Cores personalizadas para os gráficos
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6366F1',
    '#14B8A6', '#F472B6', '#A78BFA', '#34D399', '#FBBF24'
  ];

  // Função para calcular quartis e estatísticas
  const calculateStatistics = (values: number[]) => {
    if (values.length === 0) return null;
    
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    
    const q1Index = Math.floor(n * 0.25);
    const medianIndex = Math.floor(n * 0.5);
    const q3Index = Math.floor(n * 0.75);
    
    const q1 = sorted[q1Index];
    const median = sorted[medianIndex];
    const q3 = sorted[q3Index];
    const min = sorted[0];
    const max = sorted[n - 1];
    
    const iqr = q3 - q1;
    const lowerFence = q1 - 1.5 * iqr;
    const upperFence = q3 + 1.5 * iqr;
    
    const outliers = sorted.filter(v => v < lowerFence || v > upperFence);
    
    return {
      min,
      q1,
      median,
      q3,
      max,
      mean: values.reduce((sum, v) => sum + v, 0) / values.length,
      std: Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - (values.reduce((s, val) => s + val, 0) / values.length), 2), 0) / values.length),
      outliers: outliers.length,
      iqr
    };
  };

  // Processamento de dados
  const analytics = useMemo(() => {
    if (!movies.length) return null;

    // 1. Distribuição por Gênero
    const genreDistribution = movies.reduce((acc, movie) => {
      if (movie.genres && movie.genres.length > 0) {
        movie.genres.forEach(genre => {
          acc[genre.name] = (acc[genre.name] || 0) + 1;
        });
      }
      return acc;
    }, {} as Record<string, number>);

    const genreData = Object.entries(genreDistribution)
      .map(([name, value]) => ({ name, value, percentage: (value / movies.length * 100).toFixed(1) }))
      .sort((a, b) => b.value - a.value);

    // 2. Distribuição por Década
    const decadeDistribution = movies.reduce((acc, movie) => {
      const year = new Date(movie.release_date).getFullYear();
      const decade = Math.floor(year / 10) * 10;
      const decadeLabel = `${decade}s`;
      acc[decadeLabel] = (acc[decadeLabel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const decadeData = Object.entries(decadeDistribution)
      .map(([decade, count]) => ({ decade, count }))
      .sort((a, b) => a.decade.localeCompare(b.decade));

    // 3. Análise de Avaliações vs Popularidade
    const ratingPopularityData = movies.map(movie => ({
      title: movie.title,
      rating: movie.vote_average,
      popularity: movie.popularity,
      votes: movie.vote_count,
      revenue: movie.revenue || 0
    }));

    // 4. Timeline de Lançamentos
    const releaseTimeline = movies.reduce((acc, movie) => {
      const year = new Date(movie.release_date).getFullYear();
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const timelineData = Object.entries(releaseTimeline)
      .map(([year, count]) => ({ year: parseInt(year), count }))
      .sort((a, b) => a.year - b.year);

    // 5. Análise de Orçamento vs Bilheteria
    const budgetRevenueData = movies
      .filter(movie => movie.budget > 0 && movie.revenue > 0)
      .map(movie => ({
        title: movie.title,
        budget: movie.budget / 1000000, // Em milhões
        revenue: movie.revenue / 1000000, // Em milhões
        roi: ((movie.revenue - movie.budget) / movie.budget * 100).toFixed(1),
        rating: movie.vote_average
      }));

    // 6. Radar Chart - Perfil dos Filmes
    const avgRating = movies.reduce((sum, m) => sum + m.vote_average, 0) / movies.length;
    const avgPopularity = movies.reduce((sum, m) => sum + m.popularity, 0) / movies.length;
    const avgVotes = movies.reduce((sum, m) => sum + m.vote_count, 0) / movies.length;
    const avgRevenue = movies.filter(m => m.revenue > 0).reduce((sum, m) => sum + m.revenue, 0) / movies.filter(m => m.revenue > 0).length;
    const avgBudget = movies.filter(m => m.budget > 0).reduce((sum, m) => sum + m.budget, 0) / movies.filter(m => m.budget > 0).length;
    const avgRuntime = movies.filter(m => m.runtime > 0).reduce((sum, m) => sum + m.runtime, 0) / movies.filter(m => m.runtime > 0).length;

    const radarData = [
      { metric: 'Avaliação', value: (avgRating / 10 * 100).toFixed(0), fullMark: 100 },
      { metric: 'Popularidade', value: Math.min(avgPopularity / 100 * 100, 100).toFixed(0), fullMark: 100 },
      { metric: 'Votos', value: Math.min(avgVotes / 10000 * 100, 100).toFixed(0), fullMark: 100 },
      { metric: 'Bilheteria', value: avgRevenue > 0 ? Math.min(avgRevenue / 1000000000 * 100, 100).toFixed(0) : 0, fullMark: 100 },
      { metric: 'Orçamento', value: avgBudget > 0 ? Math.min(avgBudget / 200000000 * 100, 100).toFixed(0) : 0, fullMark: 100 },
      { metric: 'Duração', value: avgRuntime > 0 ? Math.min(avgRuntime / 180 * 100, 100).toFixed(0) : 0, fullMark: 100 }
    ];

    // 7. Treemap - Gêneros por Popularidade
    const treemapData = genreData.map((genre, index) => ({
      name: genre.name,
      size: genre.value,
      color: colors[index % colors.length]
    }));

    // 8. Estatísticas Gerais
    const stats = {
      totalMovies: movies.length,
      avgRating: avgRating.toFixed(1),
      totalGenres: genreData.length,
      yearRange: `${Math.min(...movies.map(m => new Date(m.release_date).getFullYear()))} - ${Math.max(...movies.map(m => new Date(m.release_date).getFullYear()))}`,
      totalRevenue: movies.reduce((sum, m) => sum + (m.revenue || 0), 0),
      totalBudget: movies.reduce((sum, m) => sum + (m.budget || 0), 0),
      avgRuntime: avgRuntime.toFixed(0)
    };

    // 9. Análise Estatística por Gênero
    const genreStatistics = genreData.slice(0, 8).map(genre => {
      const genreMovies = movies.filter(movie => 
        movie.genres && movie.genres.some(g => g.name === genre.name)
      );
      
      const ratings = genreMovies.map(m => m.vote_average);
      const popularity = genreMovies.map(m => m.popularity);
      const runtime = genreMovies.filter(m => m.runtime > 0).map(m => m.runtime);
      const votes = genreMovies.map(m => m.vote_count);
      
      return {
        genre: genre.name,
        count: genreMovies.length,
        ratings: calculateStatistics(ratings),
        popularity: calculateStatistics(popularity),
        runtime: calculateStatistics(runtime),
        votes: calculateStatistics(votes)
      };
    }).filter(stat => stat.ratings !== null);

    // 10. Box Plot Data Simplificado para Recharts
    const boxPlotData = genreStatistics.map(stat => ({
      genre: stat.genre,
      min: stat.ratings?.min || 0,
      q1: stat.ratings?.q1 || 0,
      median: stat.ratings?.median || 0,
      q3: stat.ratings?.q3 || 0,
      max: stat.ratings?.max || 0,
      mean: stat.ratings?.mean || 0,
      outliers: stat.ratings?.outliers || 0
    }));

    return {
      genreData,
      decadeData,
      ratingPopularityData,
      timelineData,
      budgetRevenueData,
      radarData,
      treemapData,
      stats,
      genreStatistics,
      boxPlotData
    };
  }, [movies]);

  if (!analytics) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 text-center">
        <BarChart3 className="mx-auto text-slate-600 mb-4" size={48} />
        <h3 className="text-xl font-semibold text-white mb-2">
          Dashboard de Analytics
        </h3>
        <p className="text-slate-400">
          Busque alguns filmes para ver visualizações incríveis dos dados!
        </p>
      </div>
    );
  }

  const chartOptions = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'genres', label: 'Gêneros', icon: PieIcon },
    { id: 'timeline', label: 'Timeline', icon: TrendingUp },
    { id: 'scatter', label: 'Correlações', icon: Scatter3D },
    { id: 'radar', label: 'Perfil', icon: RadarIcon },
    { id: 'financial', label: 'Financeiro', icon: DollarSign },
    { id: 'treemap', label: 'Hierarquia', icon: TreePine },
    { id: 'statistics', label: 'Estatísticas', icon: Box }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-700 p-3 rounded-lg border border-slate-600 shadow-lg">
          <p className="text-white font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="text-blue-400" size={24} />
          <h3 className="text-xl font-semibold text-white">
            Dashboard de Analytics
          </h3>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {chartOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => setActiveChart(option.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  activeChart === option.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <Icon size={16} />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Estatísticas Gerais */}
      {activeChart === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
            <div className="bg-slate-700 rounded-lg p-4 text-center">
              <Users className="text-blue-400 mx-auto mb-2" size={24} />
              <div className="text-2xl font-bold text-white">{analytics.stats.totalMovies}</div>
              <div className="text-slate-400 text-sm">Filmes</div>
            </div>
            <div className="bg-slate-700 rounded-lg p-4 text-center">
              <Star className="text-yellow-400 mx-auto mb-2" size={24} />
              <div className="text-2xl font-bold text-white">{analytics.stats.avgRating}</div>
              <div className="text-slate-400 text-sm">Avaliação Média</div>
            </div>
            <div className="bg-slate-700 rounded-lg p-4 text-center">
              <Award className="text-purple-400 mx-auto mb-2" size={24} />
              <div className="text-2xl font-bold text-white">{analytics.stats.totalGenres}</div>
              <div className="text-slate-400 text-sm">Gêneros</div>
            </div>
            <div className="bg-slate-700 rounded-lg p-4 text-center">
              <Calendar className="text-green-400 mx-auto mb-2" size={24} />
              <div className="text-lg font-bold text-white">{analytics.stats.yearRange}</div>
              <div className="text-slate-400 text-sm">Período</div>
            </div>
            <div className="bg-slate-700 rounded-lg p-4 text-center">
              <DollarSign className="text-green-400 mx-auto mb-2" size={24} />
              <div className="text-lg font-bold text-white">{formatCurrency(analytics.stats.totalRevenue)}</div>
              <div className="text-slate-400 text-sm">Bilheteria Total</div>
            </div>
            <div className="bg-slate-700 rounded-lg p-4 text-center">
              <DollarSign className="text-red-400 mx-auto mb-2" size={24} />
              <div className="text-lg font-bold text-white">{formatCurrency(analytics.stats.totalBudget)}</div>
              <div className="text-slate-400 text-sm">Orçamento Total</div>
            </div>
            <div className="bg-slate-700 rounded-lg p-4 text-center">
              <Clock className="text-cyan-400 mx-auto mb-2" size={24} />
              <div className="text-2xl font-bold text-white">{analytics.stats.avgRuntime}min</div>
              <div className="text-slate-400 text-sm">Duração Média</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-700 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-4">Top 5 Gêneros</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.genreData.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-slate-700 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-4">Filmes por Década</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.decadeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="decade" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Gráfico de Pizza - Gêneros */}
      {activeChart === 'genres' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-4">Distribuição por Gênero</h4>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={analytics.genreData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.genreData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-4">Ranking de Gêneros</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {analytics.genreData.map((genre, index) => (
                <div key={genre.name} className="flex items-center justify-between p-3 bg-slate-600 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <span className="text-white font-medium">{genre.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">{genre.value}</div>
                    <div className="text-slate-400 text-sm">{genre.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      {activeChart === 'timeline' && (
        <div className="bg-slate-700 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-4">Timeline de Lançamentos</h4>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={analytics.timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="year" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Scatter Plot */}
      {activeChart === 'scatter' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-4">Avaliação vs Popularidade</h4>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart data={analytics.ratingPopularityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="rating" stroke="#9CA3AF" name="Avaliação" />
                <YAxis dataKey="popularity" stroke="#9CA3AF" name="Popularidade" />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-600 p-3 rounded-lg border border-slate-500">
                          <p className="text-white font-medium">{data.title}</p>
                          <p className="text-yellow-400">Avaliação: {data.rating}</p>
                          <p className="text-blue-400">Popularidade: {data.popularity.toFixed(1)}</p>
                          <p className="text-green-400">Votos: {data.votes.toLocaleString()}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter dataKey="popularity" fill="#3B82F6" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {analytics.budgetRevenueData.length > 0 && (
            <div className="bg-slate-700 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-4">Orçamento vs Bilheteria (Milhões USD)</h4>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart data={analytics.budgetRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="budget" stroke="#9CA3AF" name="Orçamento" />
                  <YAxis dataKey="revenue" stroke="#9CA3AF" name="Bilheteria" />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-600 p-3 rounded-lg border border-slate-500">
                            <p className="text-white font-medium">{data.title}</p>
                            <p className="text-red-400">Orçamento: ${data.budget.toFixed(1)}M</p>
                            <p className="text-green-400">Bilheteria: ${data.revenue.toFixed(1)}M</p>
                            <p className="text-yellow-400">ROI: {data.roi}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter dataKey="revenue" fill="#10B981" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Radar Chart */}
      {activeChart === 'radar' && (
        <div className="bg-slate-700 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-4">Perfil da Coleção</h4>
          <ResponsiveContainer width="100%" height={500}>
            <RadarChart data={analytics.radarData}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="metric" stroke="#9CA3AF" />
              <PolarRadiusAxis stroke="#9CA3AF" />
              <Radar
                name="Perfil"
                dataKey="value"
                stroke="#8B5CF6"
                fill="#8B5CF6"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Análise Financeira */}
      {activeChart === 'financial' && (
        <div className="space-y-6">
          {analytics.budgetRevenueData.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-700 rounded-lg p-4 text-center">
                  <DollarSign className="text-green-400 mx-auto mb-2" size={24} />
                  <div className="text-2xl font-bold text-white">
                    {formatCurrency(analytics.budgetRevenueData.reduce((sum, m) => sum + (m.revenue || 0) * 1000000, 0))}
                  </div>
                  <div className="text-slate-400 text-sm">Bilheteria Total</div>
                </div>
                <div className="bg-slate-700 rounded-lg p-4 text-center">
                  <DollarSign className="text-red-400 mx-auto mb-2" size={24} />
                  <div className="text-2xl font-bold text-white">
                    {formatCurrency(analytics.budgetRevenueData.reduce((sum, m) => sum + (m.budget || 0) * 1000000, 0))}
                  </div>
                  <div className="text-slate-400 text-sm">Orçamento Total</div>
                </div>
                <div className="bg-slate-700 rounded-lg p-4 text-center">
                  <TrendingUp className="text-blue-400 mx-auto mb-2" size={24} />
                  <div className="text-2xl font-bold text-white">
                    {analytics.budgetRevenueData.length > 0 ? 
                      (analytics.budgetRevenueData.reduce((sum, m) => sum + (parseFloat(m.roi) || 0), 0) / analytics.budgetRevenueData.length).toFixed(1) 
                      : '0.0'
                    }%
                  </div>
                  <div className="text-slate-400 text-sm">ROI Médio</div>
                </div>
              </div>

              <div className="bg-slate-700 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-4">Top 10 - Maior ROI</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {analytics.budgetRevenueData
                    .filter(movie => movie.roi && !isNaN(parseFloat(movie.roi)))
                    .sort((a, b) => parseFloat(b.roi) - parseFloat(a.roi))
                    .slice(0, 10)
                    .map((movie, index) => (
                      <div key={movie.title} className="flex items-center justify-between p-3 bg-slate-600 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <span className="text-white font-medium">{movie.title}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-green-400 font-bold">+{movie.roi}%</div>
                          <div className="text-slate-400 text-sm">${movie.revenue.toFixed(1)}M</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-slate-700 rounded-lg p-8 text-center">
              <DollarSign className="mx-auto text-slate-600 mb-4" size={48} />
              <h4 className="text-xl font-semibold text-white mb-2">
                Dados Financeiros Indisponíveis
              </h4>
              <p className="text-slate-400 mb-4">
                Os filmes encontrados não possuem informações de orçamento e bilheteria disponíveis.
              </p>
              <div className="bg-slate-600 rounded-lg p-4 text-left">
                <h5 className="text-white font-medium mb-2">💡 Dica:</h5>
                <p className="text-slate-300 text-sm">
                  Filmes mais recentes e blockbusters geralmente têm dados financeiros mais completos. 
                  Tente buscar por filmes como "Avengers", "Star Wars", "Jurassic Park", etc.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Treemap */}
      {activeChart === 'treemap' && (
        <div className="bg-slate-700 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-4">Hierarquia de Gêneros</h4>
          <ResponsiveContainer width="100%" height={500}>
            <Treemap
              data={analytics.treemapData}
              dataKey="size"
              stroke="#374151"
              fill="#8884d8"
            >
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-600 p-3 rounded-lg border border-slate-500">
                        <p className="text-white font-medium">{data.name}</p>
                        <p className="text-blue-400">{data.size} filmes</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </Treemap>
          </ResponsiveContainer>
        </div>
      )}

      {/* Estatísticas Detalhadas */}
      {activeChart === 'statistics' && (
        <div className="space-y-6">
          <div className="bg-slate-700 rounded-lg p-6">
            <h4 className="text-white font-semibold mb-6 text-center">📊 Análise Estatística por Gênero</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.genreStatistics.map((stat, index) => (
                <div key={stat.genre} className="bg-slate-600 rounded-lg p-4">
                  <h5 className="text-white font-medium mb-3 flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    {stat.genre}
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Filmes:</span>
                      <span className="text-white font-medium">{stat.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Avaliação Média:</span>
                      <span className="text-yellow-400">{stat.ratings?.mean.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Mediana:</span>
                      <span className="text-blue-400">{stat.ratings?.median.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Desvio Padrão:</span>
                      <span className="text-purple-400">{stat.ratings?.std.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Amplitude:</span>
                      <span className="text-green-400">{((stat.ratings?.max || 0) - (stat.ratings?.min || 0)).toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Outliers:</span>
                      <span className="text-red-400">{stat.ratings?.outliers}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gráfico de Barras com Estatísticas */}
          <div className="bg-slate-700 rounded-lg p-6">
            <h4 className="text-white font-semibold mb-4">Comparação de Avaliações por Gênero</h4>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={analytics.boxPlotData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="genre" stroke="#9CA3AF" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-600 p-3 rounded-lg border border-slate-500">
                          <p className="text-white font-medium mb-2">{label}</p>
                          <div className="space-y-1 text-sm">
                            <p className="text-green-400">Mínimo: {data.min.toFixed(1)}</p>
                            <p className="text-blue-400">Q1: {data.q1.toFixed(1)}</p>
                            <p className="text-yellow-400">Mediana: {data.median.toFixed(1)}</p>
                            <p className="text-orange-400">Q3: {data.q3.toFixed(1)}</p>
                            <p className="text-red-400">Máximo: {data.max.toFixed(1)}</p>
                            <p className="text-purple-400">Média: {data.mean.toFixed(1)}</p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="mean" fill="#8B5CF6" name="Média" />
                <Bar dataKey="median" fill="#3B82F6" name="Mediana" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Insights */}
          <div className="bg-slate-700 rounded-lg p-6">
            <h4 className="text-white font-semibold mb-4">🔍 Insights Estatísticos</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="text-blue-400 font-medium mb-3">📈 Gêneros Mais Bem Avaliados</h5>
                <div className="space-y-2">
                  {analytics.genreStatistics
                    .sort((a, b) => (b.ratings?.mean || 0) - (a.ratings?.mean || 0))
                    .slice(0, 3)
                    .map((stat, index) => (
                      <div key={stat.genre} className="flex justify-between items-center">
                        <span className="text-slate-300">{index + 1}. {stat.genre}</span>
                        <span className="text-yellow-400 font-medium">{stat.ratings?.mean.toFixed(1)}</span>
                      </div>
                    ))}
                </div>
              </div>
              
              <div>
                <h5 className="text-green-400 font-medium mb-3">📊 Gêneros Mais Consistentes</h5>
                <div className="space-y-2">
                  {analytics.genreStatistics
                    .sort((a, b) => (a.ratings?.std || 0) - (b.ratings?.std || 0))
                    .slice(0, 3)
                    .map((stat, index) => (
                      <div key={stat.genre} className="flex justify-between items-center">
                        <span className="text-slate-300">{index + 1}. {stat.genre}</span>
                        <span className="text-green-400 font-medium">σ = {stat.ratings?.std.toFixed(2)}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataVisualizationDashboard;