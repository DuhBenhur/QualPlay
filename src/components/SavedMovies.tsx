import React, { useState, useEffect } from 'react';
import { Heart, X, Play, Calendar, Star, Download, Tv } from 'lucide-react';
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
}

const SavedMovies: React.FC<SavedMoviesProps> = ({ onMovieClick }) => {
  const [savedMovies, setSavedMovies] = useState<SavedMovie[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadSavedMovies();
  }, []);

  const loadSavedMovies = () => {
    const saved = JSON.parse(localStorage.getItem('savedMovies') || '[]');
    setSavedMovies(saved);
  };

  const removeSavedMovie = (movieId: number) => {
    const updated = savedMovies.filter(movie => movie.id !== movieId);
    setSavedMovies(updated);
    localStorage.setItem('savedMovies', JSON.stringify(updated));
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
    pdf.text('Meus Filmes Salvos', 40, 30);
    
    pdf.setFontSize(10);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 40, 45);
    pdf.text(`Total de filmes salvos: ${savedMovies.length}`, 40, 55);
    
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
      pdf.text(movie.title, 40, yPosition);
      yPosition += 12;
      
      // Movie details
      pdf.setFontSize(9);
      pdf.setTextColor(80, 80, 80);
      
      const details = [
        `Ano: ${new Date(movie.release_date).getFullYear()}`,
        `Diretor: ${movie.director || 'N/A'}`,
        `Avaliação: ${movie.vote_average.toFixed(1)}/10`,
        `Gêneros: ${movie.genres || 'N/A'}`,
        `Streaming: ${movie.streaming_services || 'N/A'}`,
        `Salvo em: ${formatDate(movie.savedAt)}`
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
      pdf.text('Meus Filmes Salvos - Busca Filmes Pro', 20, pageHeight - 10);
    }
    
    pdf.save(`meus-filmes-salvos-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-red-600 text-white p-3 md:p-4 rounded-full shadow-lg hover:bg-red-700 transition-colors z-40"
      >
        <Heart size={20} className="md:w-6 md:h-6" />
        {savedMovies.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center">
            {savedMovies.length}
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
                Salve filmes clicando no botão "Salvar" nos detalhes do filme
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {savedMovies.map((movie) => (
                <div
                  key={movie.id}
                  className="bg-slate-700 rounded-lg overflow-hidden hover:bg-slate-600 transition-colors"
                >
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
                      onClick={() => removeSavedMovie(movie.id)}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-colors"
                    >
                      <X size={14} />
                    </button>
                    
                    {/* Streaming Badge */}
                    <div className="absolute top-2 left-2">
                      {movie.streaming_services && movie.streaming_services !== 'Não disponível' ? (
                        <div className="flex flex-col gap-1">
                          {parseStreamingServices(movie.streaming_services).map((service, index) => (
                            <div
                              key={index}
                              className={`${getStreamingBadgeColor(service)} text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg`}
                            >
                              {service}
                            </div>
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
                  
                  <div className="p-3 md:p-4">
                    <h3 className="text-white font-medium mb-2 line-clamp-2 text-sm md:text-base">
                      {movie.title}
                    </h3>
                    
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
                        <p className="text-white">
                          {movie.streaming_services === 'Não disponível' 
                            ? 'Não disponível' 
                            : movie.streaming_services
                          }
                        </p>
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
        </div>
      </div>
    </div>
  );
};

export default SavedMovies;