import React, { useState, useEffect } from 'react';
import { Heart, X, Play, Calendar, Star, Download, Tv, GripVertical, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { getImageUrl } from '../services/tmdbApi';
import jsPDF from 'jspdf';

interface SavedMovie {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  release_date: string;
  savedAt: string;
  streaming_services?: string;
  director?: string;
  genres?: string;
  overview?: string;
}

interface SavedMoviesProps {
  onMovieClick: (movieId: number) => void;
  savedCount: number;
}

const SavedMovies: React.FC<SavedMoviesProps> = ({ onMovieClick, savedCount }) => {
  const [savedMovies, setSavedMovies] = useState<SavedMovie[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  // Detectar se é mobile
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    loadSavedMovies();
  }, [savedCount]);

  useEffect(() => {
    const handleSavedMoviesChange = () => {
      loadSavedMovies();
    };

    window.addEventListener('savedMoviesChanged', handleSavedMoviesChange);
    return () => {
      window.removeEventListener('savedMoviesChanged', handleSavedMoviesChange);
    };
  }, []);

  const loadSavedMovies = () => {
    const saved = JSON.parse(localStorage.getItem('savedMovies') || '[]');
    setSavedMovies(saved);
  };

  const removeSavedMovie = (movieId: number) => {
    const updated = savedMovies.filter(movie => movie.id !== movieId);
    setSavedMovies(updated);
    localStorage.setItem('savedMovies', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('savedMoviesChanged'));
  };

  // Função para mover filmes (mobile)
  const moveMovie = (fromIndex: number, direction: 'up' | 'down') => {
    const newMovies = [...savedMovies];
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    
    if (toIndex >= 0 && toIndex < newMovies.length) {
      [newMovies[fromIndex], newMovies[toIndex]] = [newMovies[toIndex], newMovies[fromIndex]];
      setSavedMovies(newMovies);
      localStorage.setItem('savedMovies', JSON.stringify(newMovies));
      window.dispatchEvent(new CustomEvent('savedMoviesChanged'));
    }
  };

  // Drag & Drop functions (desktop only)
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (isMobile) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (isMobile) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    if (isMobile) return;
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    if (isMobile) return;
    e.preventDefault();
    
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      const newMovies = [...savedMovies];
      const draggedMovie = newMovies[draggedIndex];
      
      newMovies.splice(draggedIndex, 1);
      newMovies.splice(dropIndex, 0, draggedMovie);
      
      setSavedMovies(newMovies);
      localStorage.setItem('savedMovies', JSON.stringify(newMovies));
      window.dispatchEvent(new CustomEvent('savedMoviesChanged'));
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    if (isMobile) return;
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStreamingBadgeColor = (service: string) => {
    const lowerService = service.toLowerCase();
    if (lowerService.includes('netflix')) return 'bg-red-600';
    if (lowerService.includes('amazon') || lowerService.includes('prime')) return 'bg-blue-600';
    if (lowerService.includes('disney')) return 'bg-blue-800';
    if (lowerService.includes('hbo') || lowerService.includes('max')) return 'bg-purple-600';
    if (lowerService.includes('paramount')) return 'bg-blue-500';
    if (lowerService.includes('apple')) return 'bg-gray-800';
    if (lowerService.includes('globoplay')) return 'bg-blue-700';
    if (lowerService.includes('telecine')) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  const parseStreamingServices = (services: string) => {
    if (!services || services === 'Não disponível') return [];
    return services.split(',').map(s => s.trim()).slice(0, 2);
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

  const handleStreamingClick = (e: React.MouseEvent, service: string, movieTitle: string) => {
    e.stopPropagation();
    const url = getStreamingUrl(service, movieTitle);
    window.open(url, '_blank');
  };

  const generateSavedMoviesPDF = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Header
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, 60, 'F');
    
    pdf.setTextColor(59, 130, 246);
    pdf.setFontSize(24);
    pdf.text('❤️', 20, 35);
    
    pdf.setFontSize(22);
    pdf.setTextColor(255, 255, 255);
    pdf.text('Minha Lista Personalizada de Filmes', 40, 30);
    
    pdf.setFontSize(10);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 40, 45);
    pdf.text(`Total de filmes: ${savedMovies.length} (na ordem personalizada)`, 40, 55);
    
    let yPosition = 80;
    
    savedMovies.forEach((movie, index) => {
      if (yPosition > pageHeight - 80) {
        pdf.addPage();
        yPosition = 30;
      }
      
      // Movie number
      pdf.setFillColor(220, 38, 127);
      pdf.circle(25, yPosition - 5, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.text((index + 1).toString(), 25, yPosition - 2, { align: 'center' });
      
      // Movie title
      pdf.setFontSize(16);
      pdf.setTextColor(40, 40, 40);
      pdf.text(`#${index + 1} - ${movie.title}`, 40, yPosition);
      yPosition += 12;
      
      // Movie details
      pdf.setFontSize(9);
      pdf.setTextColor(80, 80, 80);
      
      const details = [
        `Posição na lista: #${index + 1}`,
        `Ano: ${new Date(movie.release_date).getFullYear()}`,
        `Diretor: ${movie.director || 'N/A'}`,
        `Avaliação: ${movie.vote_average.toFixed(1)}/10`,
        `Gêneros: ${movie.genres || 'N/A'}`,
        `Streaming: ${movie.streaming_services || 'N/A'}`,
        `Adicionado em: ${formatDate(movie.savedAt)}`
      ];
      
      details.forEach((detail) => {
        pdf.text(detail, 40, yPosition);
        yPosition += 6;
      });
      
      // Synopsis
      if (movie.overview) {
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        const splitText = pdf.splitTextToSize(movie.overview, pageWidth - 60);
        pdf.text(splitText, 40, yPosition);
        yPosition += splitText.length * 3.5;
      }
      
      // Separator line
      pdf.setDrawColor(226, 232, 240);
      pdf.line(20, yPosition + 5, pageWidth - 20, yPosition + 5);
      yPosition += 20;
    });
    
    // Footer
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text(`Página ${i} de ${totalPages}`, pageWidth - 30, pageHeight - 10);
      pdf.text('Lista Personalizada - Busca Filmes Pro', 20, pageHeight - 10);
    }
    
    pdf.save(`minha-lista-filmes-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-red-600 text-white p-3 md:p-4 rounded-full shadow-lg hover:bg-red-700 transition-colors z-40"
      >
        <Heart size={20} className="md:w-6 md:h-6" />
        {savedCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center">
            {savedCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-2 md:p-4 z-50">
      <div className="bg-slate-800 rounded-lg max-w-6xl max-h-[95vh] overflow-y-auto w-full">
        <div className="p-4 md:p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="text-red-400" size={24} />
              <h2 className="text-lg md:text-xl font-bold text-white">
                Filmes Salvos ({savedMovies.length})
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {savedMovies.length > 0 && (
                <button
                  onClick={generateSavedMoviesPDF}
                  className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                >
                  <Download size={16} />
                  <span className="hidden md:inline">PDF Salvos</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors p-1"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6">
          {savedMovies.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="mx-auto text-slate-600 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-white mb-2">
                Nenhum filme salvo ainda
              </h3>
              <p className="text-slate-400">
                Salve filmes clicando no coração ❤️ nos cards dos filmes
              </p>
            </div>
          ) : (
            <>
              {/* MOBILE: Lista simples e limpa */}
              {isMobile ? (
                <div className="space-y-4">
                  {savedMovies.map((movie, index) => (
                    <div
                      key={movie.id}
                      className="bg-slate-700 rounded-lg p-4 hover:bg-slate-600 transition-colors"
                    >
                      <div className="flex gap-4">
                        {/* Poster pequeno */}
                        <div className="relative flex-shrink-0">
                          <img
                            src={getImageUrl(movie.poster_path)}
                            alt={movie.title}
                            className="w-20 h-28 object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-movie.jpg';
                            }}
                          />
                          {/* Número da posição */}
                          <div className="absolute -top-2 -left-2 bg-blue-600 text-white text-sm px-2 py-1 rounded-full font-bold">
                            #{index + 1}
                          </div>
                        </div>
                        
                        {/* Informações */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-white font-medium text-sm line-clamp-2 pr-2">
                              {movie.title}
                            </h3>
                            
                            {/* Controles de ordem */}
                            <div className="flex flex-col gap-1 flex-shrink-0">
                              {index > 0 && (
                                <button
                                  onClick={() => moveMovie(index, 'up')}
                                  className="bg-blue-600 text-white p-1 rounded hover:bg-blue-700 transition-colors"
                                  title="Mover para cima"
                                >
                                  <ChevronUp size={14} />
                                </button>
                              )}
                              {index < savedMovies.length - 1 && (
                                <button
                                  onClick={() => moveMovie(index, 'down')}
                                  className="bg-blue-600 text-white p-1 rounded hover:bg-blue-700 transition-colors"
                                  title="Mover para baixo"
                                >
                                  <ChevronDown size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-slate-400 mb-2">
                            <div className="flex items-center gap-1">
                              <Calendar size={10} />
                              {formatDate(movie.release_date)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="text-yellow-400 fill-current" size={10} />
                              {movie.vote_average.toFixed(1)}
                            </div>
                          </div>
                          
                          {/* Streaming */}
                          {movie.streaming_services && movie.streaming_services !== 'Não disponível' && (
                            <div className="mb-2">
                              <div className="flex flex-wrap gap-1">
                                {parseStreamingServices(movie.streaming_services).map((service, serviceIndex) => (
                                  <button
                                    key={serviceIndex}
                                    onClick={(e) => handleStreamingClick(e, service, movie.title)}
                                    className={`${getStreamingBadgeColor(service)} text-white text-xs px-2 py-1 rounded-full hover:scale-105 transition-transform cursor-pointer`}
                                    title={`Assistir ${movie.title} no ${service}`}
                                  >
                                    🎬 {service}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Botões */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                onMovieClick(movie.id);
                                setIsOpen(false);
                              }}
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                            >
                              <Play size={12} />
                              Detalhes
                            </button>
                            <button
                              onClick={() => removeSavedMovie(movie.id)}
                              className="px-3 py-2 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* DESKTOP: Grid com drag & drop */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {savedMovies.map((movie, index) => (
                    <div
                      key={movie.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`bg-slate-700 rounded-lg overflow-hidden transition-all duration-200 cursor-move ${
                        draggedIndex === index 
                          ? 'opacity-50 scale-95 rotate-2' 
                          : dragOverIndex === index 
                            ? 'ring-2 ring-blue-500 scale-105' 
                            : 'hover:bg-slate-600'
                      }`}
                    >
                      {/* Indicadores de Ordem e Handle */}
                      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
                        <div className="bg-blue-600 text-white text-sm px-3 py-2 rounded-lg font-bold shadow-lg border-2 border-white">
                          #{index + 1}
                        </div>
                        <div className="bg-black bg-opacity-75 rounded p-1 cursor-grab active:cursor-grabbing">
                          <GripVertical size={14} className="text-white" />
                        </div>
                      </div>
                      
                      {/* Número GRANDE no canto inferior esquerdo */}
                      <div className="absolute bottom-2 left-2 z-10">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg px-3 py-2 rounded-full font-bold shadow-xl border-2 border-white">
                          #{index + 1}
                        </div>
                      </div>
                      
                      <div className="relative">
                        <img
                          src={getImageUrl(movie.poster_path)}
                          alt={movie.title}
                          className="w-full h-48 md:h-64 object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-movie.jpg';
                          }}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSavedMovie(movie.id);
                          }}
                          className="absolute top-2 left-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-colors z-10"
                        >
                          <X size={14} />
                        </button>
                        
                        {/* Streaming Badge */}
                        <div className="absolute top-16 left-2">
                          {movie.streaming_services && movie.streaming_services !== 'Não disponível' ? (
                            <div className="flex flex-col gap-1">
                              {parseStreamingServices(movie.streaming_services).map((service, serviceIndex) => (
                                <button
                                  key={serviceIndex}
                                  onClick={(e) => handleStreamingClick(e, service, movie.title)}
                                  className={`${getStreamingBadgeColor(service)} text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-200 cursor-pointer border border-white/20 hover:border-white/40`}
                                  title={`Assistir ${movie.title} no ${service}`}
                                >
                                  🎬 {service}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg">
                              <Tv size={12} className="inline mr-1" />
                              N/A
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-3 md:p-4 pt-6">
                        {/* Título com indicador de posição */}
                        <div className="flex items-start gap-2 mb-2">
                          <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-bold flex-shrink-0 mt-1">
                            #{index + 1}
                          </div>
                          <h3 className="text-white font-medium line-clamp-2 text-sm md:text-base">
                            {movie.title}
                          </h3>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs md:text-sm text-slate-400 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            {formatDate(movie.release_date)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="text-yellow-400 fill-current" size={12} />
                            {movie.vote_average.toFixed(1)}
                          </div>
                        </div>
                        
                        {/* Streaming Info */}
                        {movie.streaming_services && (
                          <div className="mb-3 p-2 bg-slate-600 rounded text-xs">
                            <div className="flex items-center gap-1 text-blue-400 mb-1">
                              <Tv size={12} />
                              <span>Disponível em:</span>
                            </div>
                            {movie.streaming_services === 'Não disponível' || movie.streaming_services === 'N/A' ? (
                              <p className="text-slate-400">Não disponível</p>
                            ) : (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {parseStreamingServices(movie.streaming_services).map((service, serviceIndex) => (
                                  <button
                                    key={serviceIndex}
                                    onClick={(e) => handleStreamingClick(e, service, movie.title)}
                                    className={`${getStreamingBadgeColor(service)} text-white text-xs px-2 py-1 rounded hover:scale-105 transition-transform cursor-pointer`}
                                    title={`Assistir ${movie.title} no ${service}`}
                                  >
                                    {service}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        
                        <button
                          onClick={() => {
                            onMovieClick(movie.id);
                            setIsOpen(false);
                          }}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                        >
                          <Play size={14} />
                          Ver Detalhes
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Instruções de Uso */}
              {savedMovies.length > 1 && (
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg border border-blue-500/30">
                  <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                    <ArrowUpDown size={16} className="text-blue-400" />
                    🎬 Sua Lista Personalizada de Filmes para Assistir:
                  </h4>
                  <div className="text-sm text-slate-300 space-y-1">
                    <p>📋 <strong>Ordem atual:</strong> Os números #1, #2, #3... mostram a sequência para assistir</p>
                    {!isMobile ? (
                      <p>🖱️ <strong>Reordenar:</strong> Arraste os cards pela alça <GripVertical size={12} className="inline" /> para mudar a ordem</p>
                    ) : (
                      <p>📱 <strong>Reordenar:</strong> Use os botões ↑↓ ao lado de cada filme</p>
                    )}
                    <p>📄 <strong>PDF:</strong> Será gerado exatamente nesta ordem personalizada</p>
                    <p>🎯 <strong>Dica:</strong> #1 = próximo filme, #2 = segundo da fila, etc.</p>
                  </div>
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