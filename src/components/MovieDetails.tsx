import React, { useState, useEffect } from 'react';
import { X, Star, Calendar, Clock, Users, Play, Download, ExternalLink, MessageCircle } from 'lucide-react';
import { MovieDetails as MovieDetailsType } from '../types/movie';
import { getImageUrl } from '../services/tmdbApi';
import { useAuth } from '../contexts/AuthContext';
import { StarRating, QuickReview } from './Ratings';
import { rateMovie, getUserRating, addQuickReview, logMovieView, getMovieReviews } from '../services/interactionService';
import type { Comment } from '../types/supabase';
import { saveToMyList, removeFromMyList } from '../services/userMovieService';
import { useUserMovieData } from '../hooks/useUserMovieData';

interface MovieDetailsProps {
  movie: MovieDetailsType;
  onClose: () => void;
}

const MovieDetails: React.FC<MovieDetailsProps> = ({ movie, onClose }) => {
  const { user } = useAuth();
  const { inMyList, loading: dataLoading } = useUserMovieData(movie.id);
  const [userRating, setUserRating] = useState<number>(0);
  const [isRatingLoading, setIsRatingLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [ratingSaved, setRatingSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [reviews, setReviews] = useState<Comment[]>([]);

  // Carregar reviews iniciais
  useEffect(() => {
    if (movie?.id) {
      loadReviews();
    }
  }, [movie?.id]);

  const loadReviews = async () => {
    try {
      const { data } = await getMovieReviews(movie.id);
      if (data) setReviews(data);
    } catch (err) {
      console.error('Falha ao carregar reviews', err);
    }
  };

  // Carregar rating do usuário ao abrir
  useEffect(() => {
    if (user && movie?.id) {
      loadUserRating();
      // Log de visualização para ML - fire and forget
      logMovieView(user.id, movie.id, { page: 'details' }).catch(console.error);
    }
  }, [user, movie?.id]);

  const loadUserRating = async () => {
    if (!user) return;
    const { data } = await getUserRating(user.id, movie.id);
    if (data) {
      setUserRating(data.score);
    }
  };

  const handleRatingChange = async (score: 1 | 2 | 3 | 4 | 5) => {
    if (!user) {
      alert('Faça login para avaliar filmes');
      return;
    }

    // Atualização otimista
    const previousRating = userRating;
    setUserRating(score);
    setIsRatingLoading(true);
    // Resetar estado de salvo para disparar animacao novamente se necessario
    setRatingSaved(false);

    try {
      // Timeout para evitar UI travada
      const timeoutPromise = new Promise<{ data: any, error?: Error }>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout ao salvar avaliação')), 10000)
      );

      const ratePromise = rateMovie(user.id, movie.id, score, {
        page: 'details',
        rating_source: 'details'
      });

      const result = await Promise.race([ratePromise, timeoutPromise]);
      const { error } = result as { error?: Error };

      if (error) throw error;

      setRatingSaved(true);
      // Disparar evento global para atualizar cards na lista
      window.dispatchEvent(new CustomEvent('ratingChanged', {
        detail: { movieId: movie.id, rating: score }
      }));

      // Manter feedback por 3 segundos
      setTimeout(() => setRatingSaved(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      // Reverter em caso de erro
      setUserRating(previousRating);
      alert('Não foi possível salvar sua avaliação. Verifique sua conexão.');
    } finally {
      setIsRatingLoading(false);
    }
  };

  const handleQuickReviewSubmit = async (content: string) => {
    if (!user) {
      throw new Error('Faça login para enviar reviews');
    }

    // Evitar reviews vazios
    if (!content.trim()) return;

    // Timeout de 10s para evitar travar a UI
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Tempo limite excedido. Verifique sua conexão.')), 10000)
    );

    try {
      const submit = async () => {
        const { error } = await addQuickReview(user.id, movie.id, content, {
          page: 'details'
        });
        if (error) throw error;
      }

      await Promise.race([submit(), timeout]);
      loadReviews();
      setShowReviewForm(false);
    } catch (error) {
      console.error('Erro ao enviar review:', error);
      alert('Erro ao enviar comentário. Tente novamente.');
      throw error; // Propagar para o componente filho destravar form
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data não informada';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

  const formatRuntime = (minutes: number) => {
    if (!minutes || minutes <= 0) return 'Duração não informada';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatCurrency = (amount: number) => {
    if (!amount || amount <= 0) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatGenres = (genres: any[]) => {
    if (!genres || !Array.isArray(genres) || genres.length === 0) return 'Gênero não informado';
    return genres.map(g => g?.name || 'Desconhecido').join(', ');
  };

  const getStreamingUrl = (service: string, movieTitle: string) => {
    const lowerService = service.toLowerCase();
    const searchQuery = encodeURIComponent(movieTitle);

    if (lowerService.includes('netflix')) {
      return `https://www.netflix.com/search?q=${searchQuery}`;
    }
    if (lowerService.includes('amazon') || lowerService.includes('prime')) {
      return `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${searchQuery}`;
    }
    if (lowerService.includes('disney')) {
      return `https://www.disneyplus.com/search?q=${searchQuery}`;
    }
    if (lowerService.includes('hbo') || lowerService.includes('max')) {
      return `https://play.max.com/search?q=${searchQuery}`;
    }
    if (lowerService.includes('paramount')) {
      return `https://www.paramountplus.com/search/?query=${searchQuery}`;
    }
    if (lowerService.includes('apple')) {
      return `https://tv.apple.com/search?term=${searchQuery}`;
    }
    if (lowerService.includes('globoplay')) {
      return `https://globoplay.globo.com/busca/?q=${searchQuery}`;
    }
    if (lowerService.includes('telecine')) {
      return `https://telecineplay.com.br/busca?q=${searchQuery}`;
    }

    return `https://www.google.com/search?q=${searchQuery}+${encodeURIComponent(service)}+assistir+online`;
  };

  const handleStreamingClick = (service: string) => {
    const url = getStreamingUrl(service, safeMovie.title);
    window.open(url, '_blank');
  };

  const handleWatchTrailer = () => {
    const searchQuery = `${movie.title} ${new Date(movie.release_date).getFullYear()} trailer`;
    const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
    window.open(youtubeUrl, '_blank');
  };



  const handleSaveMovie = async () => {
    if (!user) {
      alert('Faça login para salvar filmes na sua lista');
      return;
    }

    setIsSaving(true);
    try {
      const timeoutPromise = new Promise<{ success: boolean, error?: string }>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout de conexão')), 5000)
      );

      let actionPromise;
      if (inMyList) {
        actionPromise = removeFromMyList(user.id, movie.id);
      } else {
        actionPromise = saveToMyList(user.id, movie);
      }

      const result = await Promise.race([actionPromise, timeoutPromise]) as { success: boolean, error?: string };

      if (!result.success) {
        throw new Error(result.error || 'Erro desconhecido');
      }

      // Feedback visual é tratado via hook useUserMovieData que ouve o evento
    } catch (error) {
      console.error('Erro ao gerenciar lista:', error);
      alert('Erro ao atualizar sua lista. Verifique sua conexão.');
    } finally {
      setIsSaving(false);
    }
  };

  // Garantir que os dados existem
  const safeMovie = {
    id: movie?.id || 0,
    title: movie?.title || 'Título não disponível',
    overview: movie?.overview || 'Sinopse não disponível',
    poster_path: movie?.poster_path || null,
    backdrop_path: movie?.backdrop_path || null,
    release_date: movie?.release_date || '',
    vote_average: movie?.vote_average || 0,
    vote_count: movie?.vote_count || 0,
    runtime: movie?.runtime || 0,
    budget: movie?.budget || 0,
    revenue: movie?.revenue || 0,
    genres: movie?.genres || [],
    director: movie?.director || 'Não informado',
    cast: movie?.cast || 'Não informado',
    streaming_services: movie?.streaming_services || 'Não disponível'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto w-full">
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 rounded-full p-2 text-white hover:bg-opacity-75 transition-colors"
          >
            <X size={24} />
          </button>

          <div className="relative">
            <img
              src={getImageUrl(safeMovie.backdrop_path || safeMovie.poster_path, 'w1280')}
              alt={safeMovie.title}
              className="w-full h-64 object-cover"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-movie.jpg';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-800 to-transparent" />
          </div>
        </div>

        <div className="p-6 -mt-20 relative z-10">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <img
                src={getImageUrl(safeMovie.poster_path)}
                alt={safeMovie.title}
                className="w-48 h-72 object-cover rounded-lg shadow-lg"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-movie.jpg';
                }}
              />
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{safeMovie.title}</h1>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="text-yellow-400 fill-current" size={20} />
                  <span className="text-white font-medium">
                    {safeMovie.vote_average.toFixed(1)}
                  </span>
                  <span className="text-slate-400">
                    ({safeMovie.vote_count.toLocaleString()} votos)
                  </span>
                </div>

                <div className="flex items-center gap-1 text-slate-300">
                  <Calendar size={16} />
                  <span>{formatDate(safeMovie.release_date)}</span>
                </div>

                {safeMovie.runtime > 0 && (
                  <div className="flex items-center gap-1 text-slate-300">
                    <Clock size={16} />
                    <span>{formatRuntime(safeMovie.runtime)}</span>
                  </div>
                )}
              </div>

              {/* User Rating Section */}
              <div className="mb-4 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                      {user ? 'Sua Avaliação' : 'Avalie este filme'}
                      {ratingSaved && (
                        <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                          Salvo!
                        </span>
                      )}
                    </h4>
                    <StarRating
                      value={userRating}
                      onChange={handleRatingChange}
                      size="lg"
                      showLabel
                      readonly={!user || isRatingLoading}
                    />
                  </div>
                  {user && (
                    <button
                      onClick={() => setShowReviewForm(!showReviewForm)}
                      className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                      <MessageCircle size={20} />
                      <span className="text-sm">Review</span>
                    </button>
                  )}
                </div>




                {showReviewForm && user && (
                  <div className="mt-4 pt-4 border-t border-slate-600">
                    <QuickReview
                      onSubmit={handleQuickReviewSubmit}
                      placeholder="O que você achou desse filme?"
                    />
                  </div>
                )}

                {/* Lista de Reviews */}
                {reviews.length > 0 && (
                  <div className="mt-6 border-t border-slate-600 pt-4">
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                      <MessageCircle size={16} />
                      Comentários da Comunidade
                    </h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {reviews.map((review) => (
                        <div key={review.id} className="bg-slate-800 p-3 rounded-lg text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                              {review.user?.full_name?.[0] || 'U'}
                            </div>
                            <span className="text-slate-300 font-medium text-xs">
                              {review.user?.full_name || 'Usuário'}
                            </span>
                            <span className="text-slate-600 text-xs">• {new Date(review.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-slate-300">{review.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!user && (
                  <p className="text-slate-400 text-sm mt-2">
                    Faça login para avaliar e escrever reviews
                  </p>
                )}
              </div>

              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-block bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                    {formatGenres(safeMovie.genres)}
                  </span>
                  {safeMovie.streaming_services && safeMovie.streaming_services !== 'Não disponível' && safeMovie.streaming_services !== 'N/A' && (
                    <span className="inline-block bg-green-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      <Users size={14} />
                      Disponível para assistir
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Sinopse</h3>
                <p className="text-slate-300 leading-relaxed">{safeMovie.overview}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {safeMovie.director && safeMovie.director !== 'N/A' && safeMovie.director !== 'Não informado' && (
                  <div>
                    <h4 className="font-semibold text-white mb-1">Diretor</h4>
                    <p className="text-slate-300">{safeMovie.director}</p>
                  </div>
                )}

                {safeMovie.cast && safeMovie.cast !== 'N/A' && safeMovie.cast !== 'Não informado' && (
                  <div>
                    <h4 className="font-semibold text-white mb-1">Elenco Principal</h4>
                    <p className="text-slate-300">{safeMovie.cast}</p>
                  </div>
                )}

                {safeMovie.streaming_services && (
                  <div className="md:col-span-2">
                    <div className="bg-slate-700 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <Users className="text-green-400" size={20} />
                        Onde Assistir
                      </h4>
                      {safeMovie.streaming_services !== 'Não disponível' && safeMovie.streaming_services !== 'N/A' ? (
                        <div className="flex flex-wrap gap-3">
                          {safeMovie.streaming_services.split(',').map((service, index) => {
                            const trimmedService = service.trim();
                            const isIncluded = trimmedService.includes('(Incluído)');
                            const isRental = trimmedService.includes('(Aluguel)');
                            const isPurchase = trimmedService.includes('(Compra)');

                            let bgColor = 'bg-green-600 hover:bg-green-700 border-green-500/30 hover:border-green-400';
                            let icon = '✅';
                            let typeText = 'Incluído na assinatura';

                            if (isRental) {
                              bgColor = 'bg-yellow-600 hover:bg-yellow-700 border-yellow-500/30 hover:border-yellow-400';
                              icon = '💰';
                              typeText = 'Disponível para aluguel';
                            } else if (isPurchase) {
                              bgColor = 'bg-red-600 hover:bg-red-700 border-red-500/30 hover:border-red-400';
                              icon = '🛒';
                              typeText = 'Disponível para compra';
                            }

                            const serviceName = trimmedService.replace(/\s*\([^)]*\)/, '');

                            return (
                              <button
                                key={index}
                                onClick={() => handleStreamingClick(trimmedService)}
                                className={`${bgColor} text-white px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg border flex flex-col items-center gap-1 min-w-[120px]`}
                                title={`${typeText} - ${serviceName}`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{icon}</span>
                                  <span className="font-semibold">{serviceName}</span>
                                </div>
                                <span className="text-xs opacity-90 font-medium">
                                  {isIncluded ? 'Incluído' : isRental ? 'Aluguel' : isPurchase ? 'Compra' : 'Assistir'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="bg-slate-600 text-slate-400 px-4 py-3 rounded-lg text-sm">
                          📺 Não disponível em serviços de streaming
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {(safeMovie.budget > 0 || safeMovie.revenue > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {safeMovie.budget > 0 && (
                    <div>
                      <h4 className="font-semibold text-white mb-1">Orçamento</h4>
                      <p className="text-slate-300">{formatCurrency(safeMovie.budget)}</p>
                    </div>
                  )}

                  {safeMovie.revenue > 0 && (
                    <div>
                      <h4 className="font-semibold text-white mb-1">Bilheteria</h4>
                      <p className="text-slate-300">{formatCurrency(safeMovie.revenue)}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <div className="flex gap-2">
                  <button
                    onClick={handleWatchTrailer}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Play size={16} />
                    Assistir Trailer
                  </button>
                  <button
                    onClick={handleSaveMovie}
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${inMyList
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                      } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {inMyList ? (
                      <>
                        <X size={16} />
                        Remover
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        Salvar
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => window.open(`https://www.themoviedb.org/movie/${safeMovie.id}`, '_blank')}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors"
                  >
                    <ExternalLink size={16} />
                    Ver no TMDB
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetails;