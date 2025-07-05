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
      
      const movieNames: string[] = [];
      const directorNames: string[] = [];
      
      lines.forEach(line => {
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
    <div>
      <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
        <Upload size={14} />
        Upload de Lista
      </h3>
      
      {!uploadedFile ? (
        <div
          className={`border-2 border-dashed rounded-lg p-3 text-center transition-colors cursor-pointer ${
            isDragOver
              ? 'border-blue-400 bg-blue-400/10'
              : 'border-slate-500 hover:border-slate-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mx-auto text-slate-400 mb-1" size={20} />
          <p className="text-slate-300 mb-1 text-xs">
            Arraste arquivo .txt/.csv ou clique
          </p>
          <p className="text-slate-500 text-xs">
            Cada linha = um filme
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
        <div className="bg-slate-700/50 rounded-lg p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isProcessing ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
              ) : (
                <CheckCircle className="text-green-400" size={14} />
              )}
              <div>
                <div className="flex items-center gap-1">
                  <FileText className="text-slate-400" size={10} />
                  <span className="text-white font-medium text-xs">{uploadedFile.name}</span>
                </div>
                <p className="text-slate-400 text-xs">
                  {isProcessing ? 'Processando...' : 'Processado!'}
                </p>
              </div>
            </div>
            
            {!isProcessing && (
              <button
                onClick={clearFile}
                className="text-slate-400 hover:text-white transition-colors p-0.5"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;