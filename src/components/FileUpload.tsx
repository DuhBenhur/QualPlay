import React, { useRef, useState } from 'react';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';

interface FileUploadProps {
  onFilesProcessed: (movieNames: string[], directorNames: string[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesProcessed }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setUploadedFile(file);

    try {
      const text = await file.text();
      const lines = text.split('\n').map(line => line.trim()).filter(line => line);
      
      // Simple heuristic: assume movies if more entries, directors if fewer
      // In a real app, you might want to let users specify the type
      const movieNames: string[] = [];
      const directorNames: string[] = [];
      
      lines.forEach(line => {
        // You could implement more sophisticated logic here
        // For now, we'll assume all entries are movie names
        if (line.length > 0) {
          movieNames.push(line);
        }
      });

      onFilesProcessed(movieNames, directorNames);
      
      setTimeout(() => {
        setUploadedFile(null);
        setIsProcessing(false);
      }, 2000);
    } catch (error) {
      console.error('Error processing file:', error);
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'text/plain' || file.type === 'text/csv' || file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
        processFile(file);
      } else {
        alert('Por favor, selecione um arquivo .txt ou .csv');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const clearFile = () => {
    setUploadedFile(null);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">Upload de Lista</h3>
      
      {!uploadedFile ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
            isDragOver
              ? 'border-blue-400 bg-blue-400/10'
              : 'border-slate-600 hover:border-slate-500'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mx-auto text-slate-400 mb-3" size={32} />
          <p className="text-slate-300 mb-2">
            Arraste um arquivo .txt ou .csv aqui ou clique para selecionar
          </p>
          <p className="text-slate-500 text-sm">
            Cada linha deve conter um nome de filme
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.csv"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>
      ) : (
        <div className="bg-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isProcessing ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              ) : (
                <CheckCircle className="text-green-400" size={24} />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="text-slate-400" size={16} />
                  <span className="text-white font-medium">{uploadedFile.name}</span>
                </div>
                <p className="text-slate-400 text-sm">
                  {isProcessing ? 'Processando arquivo...' : 'Arquivo processado com sucesso!'}
                </p>
              </div>
            </div>
            
            {!isProcessing && (
              <button
                onClick={clearFile}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>
      )}
      
      <div className="mt-3 text-xs text-slate-500">
        <p>• Formatos suportados: .txt, .csv</p>
        <p>• Um nome de filme por linha</p>
        <p>• Máximo 100 filmes por arquivo</p>
      </div>
    </div>
  );
};

export default FileUpload;