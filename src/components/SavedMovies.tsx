import React, { useState, useEffect } from 'react';
import { Heart, X, Play, Calendar, Star, Download, Tv, ArrowUp, ArrowDown, GripVertical, ArrowUpDown, Loader2 } from 'lucide-react';
import { getImageUrl } from '../services/tmdbApi';
import { getMyMovies, removeFromMyList, reorderMyList, SavedMovieWithDetails } from '../services/userMovieService';
import { useAuth } from '../contexts/AuthContext';
import jsPDF from 'jspdf';

interface SavedMoviesProps {
  onMovieClick: (movieId: number) => void;
  savedCount: number; // Agora apenas indicativo, componente busca dados reais
}

const SavedMovies: React.FC<SavedMoviesProps> = ({ onMovieClick }) => {
  const { user } = useAuth();
  const [savedMovies, setSavedMovies] = useState<SavedMovieWithDetails[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Carregar filmes ao abrir ou quando usuário mudar
  useEffect(() => {
    if (isOpen && user) {
      loadSavedMovies();
    }
  }, [isOpen, user]);

  // Escutar atualizações globais da lista
  useEffect(() => {
    const handleListChanged = () => {
      if (isOpen && user) {
        loadSavedMovies();
      }
    };

    window.addEventListener('myListChanged', handleListChanged);
    return () => window.removeEventListener('myListChanged', handleListChanged);
  }, [isOpen, user]);

  const loadSavedMovies = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await getMyMovies(user.id);
    if (data) {
      setSavedMovies(data);
    }
    setIsLoading(false);
  };

  const removeSavedMovie = async (movieId: number) => {
    if (!user) return;

    // Otimistic update
    const previousMovies = [...savedMovies];
    setSavedMovies(prev => prev.filter(m => m.movie_id !== movieId));

    const { error } = await removeFromMyList(user.id, movieId);
    if (error) {
      // Reverter em caso de erro
      setSavedMovies(previousMovies);
      console.error('Erro ao remover filme:', error);
    } else {
      // Disparar evento para atualizar outros componentes (ex: MovieCard)
      window.dispatchEvent(new CustomEvent('myListChanged'));
    }
  };

  const moveMovie = async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || !user) return;

    const newMovies = [...savedMovies];
    const [movedMovie] = newMovies.splice(fromIndex, 1);
    newMovies.splice(toIndex, 0, movedMovie);

    // Atualizar UI imediatamente
    setSavedMovies(newMovies);

    // Preparar atualização para o backend
    // No backend, a posição é salva. Precisamos enviar a nova ordem.
    // Para simplificar e evitar muitas requisições, vamos enviar apenas os itens afetados ou todos
    const updates = newMovies.map((movie, index) => ({
      movieId: movie.movie_id,
      position: index + 1
    }));

    const { error } = await reorderMyList(user.id, updates);
    if (error) {
      console.error('Erro ao reordenar:', error);
      // Recarregar lista real em caso de erro
      loadSavedMovies();
    }
  };

  const moveUp = (index: number) => {
    if (index > 0) {
      moveMovie(index, index - 1);
    }
  };

  const moveDown = (index: number) => {
    if (index < savedMovies.length - 1) {
      moveMovie(index, index + 1);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      moveMovie(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return '';
    }
  };

  // Funções auxiliares (reutilizadas do original ou simplificadas)
  // ... (getStreamingBadgeColor, getStreamingIcon, etc.)
  // Simplificando streaming helpers para brevidade, mas mantendo a lógica se possível
  // Vou reimplementar as funções de streaming e PDF para garantir funcionalidade completa

  const parseStreamingServices = (services: string | undefined): string[] => {
    if (!services || services === 'Não disponível' || services === 'N/A') return [];
    return services.split(',').map(s => s.trim()).slice(0, 2);
  };

  const getStreamingUrl = (service: string, movieTitle: string) => {
    // Mesma lógica do original
    const lowerService = service.toLowerCase();
    const searchQuery = encodeURIComponent(movieTitle);
    return `https://www.google.com/search?q=${searchQuery}+${encodeURIComponent(service)}+assistir+online`;
  };

  const handleStreamingClick = (e: React.MouseEvent, service: string, movieTitle: string) => {
    e.stopPropagation();
    const url = getStreamingUrl(service, movieTitle);
    window.open(url, '_blank');
  };

  const generateSavedMoviesPDF = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, 45, 'F');

    pdf.setTextColor(220, 38, 127);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('QualPlay', 20, 25);

    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Minha Lista Personalizada de Filmes', 85, 25);

    let yPosition = 60;

    savedMovies.forEach((movie, index) => {
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = 25;
      }

      pdf.setFillColor(220, 38, 127);
      pdf.circle(25, yPosition - 5, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.text((index + 1).toString(), 25, yPosition - 2, { align: 'center' });

      pdf.setFontSize(16);
      pdf.setTextColor(40, 40, 40);
      pdf.text(`#${index + 1} - ${movie.movie_title}`, 40, yPosition);
      yPosition += 12;

      // Metadata handling (usando dados do Supabase)
      const year = movie.movie_metadata?.year || 'N/A';
      const director = movie.movie_metadata?.director || 'N/A';
      const rating = movie.movie_metadata?.tmdb_rating ? movie.movie_metadata.tmdb_rating.toFixed(1) : 'N/A';

      const details = [
        `Ano: ${year}`,
        `Diretor: ${director}`,
        `Avaliação TMDB: ${rating}/10`
      ];

      pdf.setFontSize(9);
      pdf.setTextColor(80, 80, 80);
      details.forEach((detail) => {
        pdf.text(detail, 40, yPosition);
        yPosition += 6;
      });

      yPosition += 8;
    });

    pdf.save(`QualPlay-meus-filmes-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-red-600 text-white p-3 md:p-4 rounded-full shadow-lg hover:bg-red-700 transition-colors z-40 group"
        title="Abrir Minha Lista"
      >
        <Heart size={20} className="md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
        {/* Carregar count dinamicamente se tiver user */}
        {savedMovies.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center">
            {savedMovies.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-2 md:p-4 z-50 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-lg max-w-6xl max-h-[95vh] overflow-y-auto w-full shadow-2xl border border-slate-700">
        <div className="p-4 md:p-6 border-b border-slate-700 bg-slate-800 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="text-red-400 fill-red-400" size={24} />
              <h2 className="text-lg md:text-xl font-bold text-white">
                Minha Lista ({savedMovies.length})
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {savedMovies.length > 0 && (
                <button
                  onClick={generateSavedMoviesPDF}
                  className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium shadow-md"
                >
                  <Download size={16} />
                  <span className="hidden md:inline">PDF</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-full"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              <p className="text-slate-400">Carregando sua lista...</p>
            </div>
          ) : savedMovies.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="text-slate-500" size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Sua lista está vazia
              </h3>
              <p className="text-slate-400 max-w-md mx-auto mb-6">
                Salve filmes que você quer assistir clicando no botão "Salvar" nos detalhes do filme. Eles aparecerão aqui!
              </p>
              <button
                onClick={() => setIsOpen(false)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Explorar Filmes
              </button>
            </div>
          ) : (
            <>
              {/* MOBILE LIST */}
              {isMobile ? (
                <div className="space-y-4">
                  {savedMovies.map((movie, index) => (
                    <div key={movie.movie_id} className="bg-slate-700 rounded-lg overflow-hidden border border-slate-600 shadow-sm">
                      <div className="flex">
                        <img
                          src={getImageUrl(movie.movie_poster)}
                          alt={movie.movie_title}
                          className="w-24 h-36 object-cover bg-slate-800"
                        />
                        <div className="flex-1 p-3 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <div className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded font-bold mb-1 inline-block">
                                #{index + 1}
                              </div>
                            </div>
                            <h3 className="text-white font-semibold text-sm line-clamp-2 mb-1">
                              {movie.movie_title}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <span>{movie.movie_metadata?.year}</span>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <Star size={10} className="text-yellow-400 fill-yellow-400" />
                                {movie.movie_metadata?.tmdb_rating?.toFixed(1)}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => {
                                onMovieClick(movie.movie_id);
                                setIsOpen(false);
                              }}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 rounded flex items-center justify-center gap-1"
                            >
                              <Play size={12} /> Ver
                            </button>
                            <button
                              onClick={() => removeSavedMovie(movie.movie_id)}
                              className="w-8 bg-slate-600 hover:bg-red-600 text-white rounded flex items-center justify-center transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* DESKTOP GRID */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {savedMovies.map((movie, index) => (
                    <div
                      key={movie.movie_id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`bg-slate-700 rounded-lg overflow-hidden group hover:shadow-xl transition-all duration-300 border border-transparent hover:border-slate-500 ${draggedIndex === index
                          ? 'opacity-40 scale-95 border-blue-500 border-dashed'
                          : dragOverIndex === index
                            ? 'ring-2 ring-blue-500 scale-105 z-10'
                            : ''
                        }`}
                    >
                      <div className="relative aspect-[2/3] overflow-hidden">
                        <img
                          src={getImageUrl(movie.movie_poster)}
                          alt={movie.movie_title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />

                        {/* Overlay Gradiente */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />

                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex flex-col gap-2">
                          <div className="bg-blue-600 text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center shadow-lg border border-white/20">
                            {index + 1}
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSavedMovie(movie.movie_id);
                          }}
                          className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white p-2 rounded-full backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X size={16} />
                        </button>

                        {/* Info Overlay on Hover */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px]">
                          <button
                            onClick={() => {
                              onMovieClick(movie.movie_id);
                              setIsOpen(false);
                            }}
                            className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium transform hover:scale-105 transition-transform shadow-lg flex items-center gap-2"
                          >
                            <Play size={16} fill="currentColor" /> Detalhes
                          </button>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-700">
                        <h3 className="text-white font-semibold line-clamp-1 mb-1" title={movie.movie_title}>
                          {movie.movie_title}
                        </h3>
                        <div className="flex items-center justify-between text-sm text-slate-400">
                          <span>{movie.movie_metadata?.year || 'N/A'}</span>
                          <div className="flex items-center gap-1 text-yellow-500">
                            <Star size={12} fill="currentColor" />
                            <span className="text-slate-300">{movie.movie_metadata?.tmdb_rating?.toFixed(1) || '0.0'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedMovies;