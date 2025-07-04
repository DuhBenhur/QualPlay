import React from 'react';
import { Download } from 'lucide-react';
import { MovieDetails } from '../types/movie';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PDFExportProps {
  movies: MovieDetails[];
}

const PDFExport: React.FC<PDFExportProps> = ({ movies }) => {
  const generatePDF = async () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Title
    pdf.setFontSize(20);
    pdf.setTextColor(40, 40, 40);
    pdf.text('Qual Play - Relatório', pageWidth / 2, 30, { align: 'center' });
    
    // Subtitle
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 40, { align: 'center' });
    pdf.text(`Total de filmes: ${movies.length}`, pageWidth / 2, 50, { align: 'center' });
    
    let yPosition = 70;
    
    movies.forEach((movie, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 50) {
        pdf.addPage();
        yPosition = 20;
      }
      
      // Movie title
      pdf.setFontSize(14);
      pdf.setTextColor(40, 40, 40);
      pdf.text(movie.title, 20, yPosition);
      yPosition += 10;
      
      // Movie details
      pdf.setFontSize(10);
      pdf.setTextColor(80, 80, 80);
      
      const details = [
        `Ano: ${new Date(movie.release_date).getFullYear()}`,
        `Diretor: ${movie.director || 'N/A'}`,
        `Avaliação: ${movie.vote_average.toFixed(1)}/10`,
        `Gêneros: ${movie.genres?.map(g => g.name).join(', ') || 'N/A'}`,
        `Elenco: ${movie.cast || 'N/A'}`,
        `Streaming: ${movie.streaming_services || 'N/A'}`
      ];
      
      details.forEach((detail) => {
        pdf.text(detail, 20, yPosition);
        yPosition += 7;
      });
      
      // Synopsis
      if (movie.overview) {
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        const splitText = pdf.splitTextToSize(movie.overview, pageWidth - 40);
        pdf.text(splitText, 20, yPosition);
        yPosition += splitText.length * 4;
      }
      
      yPosition += 15; // Space between movies
    });
    
    // Save the PDF
    pdf.save('busca-filmes-pro-relatorio.pdf');
  };

  if (movies.length === 0) {
    return null;
  }

  return (
    <button
      onClick={generatePDF}
      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
    >
      <Download size={16} />
      Exportar PDF ({movies.length} filmes)
    </button>
  );
};

export default PDFExport;