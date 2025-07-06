import React from 'react';
import { Download, Film } from 'lucide-react';
import { MovieDetails } from '../types/movie';
import jsPDF from 'jspdf';

interface PDFExportProps {
  movies: MovieDetails[];
}

const PDFExport: React.FC<PDFExportProps> = ({ movies }) => {
  const generatePDF = async () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Header mais compacto
    pdf.setFillColor(15, 23, 42); // slate-900
    pdf.rect(0, 0, pageWidth, 45, 'F');
    
    // Logo QualPlay mais próximo
    pdf.setTextColor(59, 130, 246); // blue-400
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('QualPlay', 20, 25);
    
    // Title na mesma linha
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Relatório de Filmes', 85, 25);
    
    // Subtitle mais próximo
    pdf.setFontSize(10);
    pdf.setTextColor(148, 163, 184); // slate-400
    pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 35);
    pdf.text(`Total de filmes: ${movies.length}`, 20, 42);
    
    let yPosition = 60; // Começar mais cedo
    
    movies.forEach((movie, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 80) {
        pdf.addPage();
        yPosition = 25;
      }
      
      // Movie number
      pdf.setFillColor(59, 130, 246); // blue-600
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
        `Gêneros: ${movie.genres?.map(g => g.name).join(', ') || 'N/A'}`,
        `Elenco: ${movie.cast || 'N/A'}`
      ];
      
      details.forEach((detail) => {
        pdf.setTextColor(80, 80, 80);
        pdf.text(detail, 40, yPosition);
        yPosition += 6;
      });
      
      // Disponibilidade em linha separada com quebra de linha
      if (movie.streaming_services && movie.streaming_services !== 'N/A' && movie.streaming_services !== 'Não disponível') {
        pdf.setTextColor(59, 130, 246); // blue-600
        pdf.text('Disponibilidade: ', 40, yPosition);
        
        // Quebrar texto longo em múltiplas linhas
        const availabilityText = movie.streaming_services;
        const maxWidth = pageWidth - 60;
        const splitAvailability = pdf.splitTextToSize(availabilityText, maxWidth);
        
        pdf.setTextColor(80, 80, 80);
        pdf.text(splitAvailability, 40, yPosition + 6);
        yPosition += 6 + (splitAvailability.length * 4);
      } else {
        pdf.setTextColor(100, 100, 100);
        pdf.text('Disponibilidade: Não disponível', 40, yPosition);
        yPosition += 6;
      }
      
      // Trailer link com quebra de linha CORRIGIDA
      pdf.setTextColor(59, 130, 246);
      const trailerText = `Trailer: https://youtube.com/results?search_query=${encodeURIComponent(movie.title + ' trailer')}`;
      
      // Quebrar URL longa em múltiplas linhas
      const maxTrailerWidth = pageWidth - 60;
      const splitTrailer = pdf.splitTextToSize(trailerText, maxTrailerWidth);
      
      pdf.text(splitTrailer, 40, yPosition);
      yPosition += splitTrailer.length * 4 + 4; // Espaço proporcional ao número de linhas
      
      // Synopsis
      if (movie.overview) {
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        const splitText = pdf.splitTextToSize(movie.overview, pageWidth - 60);
        pdf.text(splitText, 40, yPosition);
        yPosition += splitText.length * 3.5;
      }
      
      // Separator line
      pdf.setDrawColor(226, 232, 240); // slate-200
      pdf.line(20, yPosition + 5, pageWidth - 20, yPosition + 5);
      yPosition += 18; // Espaço menor entre filmes
    });
    
    // Footer
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text(`Página ${i} de ${totalPages}`, pageWidth - 30, pageHeight - 10);
      pdf.text('Gerado por QualPlay', 20, pageHeight - 10);
    }
    
    // Save the PDF
    pdf.save(`QualPlay-relatorio-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (movies.length === 0) {
    return null;
  }

  return (
    <button
      onClick={generatePDF}
      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
    >
      <Download size={16} />
      Exportar PDF ({movies.length} filmes)
    </button>
  );
};

export default PDFExport;