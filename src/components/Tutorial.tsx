import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Search, 
  Plus, 
  Heart, 
  Download, 
  Sparkles,
  Filter,
  Upload,
  BarChart3,
  Zap,
  BookOpen
} from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  target?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  content: React.ReactNode;
}

interface TutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

const Tutorial: React.FC<TutorialProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  const tutorialSteps: TutorialStep[] = [
    {
      id: 'welcome',
      title: 'Bem-vindo ao QualPlay!',
      description: 'Descubra todas as funcionalidades da sua nova ferramenta de filmes',
      icon: <Play className="text-blue-400" size={24} />,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="text-white" size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">QualPlay</h3>
            <p className="text-slate-300">
              Uma ferramenta completa para descobrir, analisar e organizar filmes
            </p>
          </div>
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">🎯 O que você vai aprender:</h4>
            <ul className="text-slate-300 text-sm space-y-1">
              <li>• Como buscar filmes e diretores</li>
              <li>• Usar filtros avançados e busca combinada</li>
              <li>• Salvar filmes favoritos e criar listas</li>
              <li>• Gerar relatórios em PDF</li>
              <li>• Entender o sistema de recomendações</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'basic-search',
      title: 'Busca Básica de Filmes',
      description: 'Aprenda a buscar filmes de forma rápida e eficiente',
      icon: <Search className="text-blue-400" size={24} />,
      content: (
        <div className="space-y-4">
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              <Zap className="text-yellow-400" size={16} />
              Busca Instantânea
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 rounded p-2">
                  <Search size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">Digite e pressione Enter</p>
                  <p className="text-slate-400 text-sm">Busca imediata do filme ou diretor</p>
                </div>
              </div>
              <div className="bg-slate-600 rounded p-3">
                <p className="text-slate-300 text-sm">
                  <strong>Exemplo:</strong> Digite "Matrix" e pressione <kbd className="bg-slate-500 px-1 rounded">Enter</kbd> para buscar instantaneamente
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              <Plus className="text-green-400" size={16} />
              Adicionar à Lista
            </h4>
            <div className="space-y-2">
              <p className="text-slate-300 text-sm">
                Use o botão <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">+</span> para adicionar filmes à sua lista de busca combinada
              </p>
              <div className="bg-slate-600 rounded p-2">
                <p className="text-slate-400 text-xs">
                  💡 <strong>Dica:</strong> Também funciona com a tecla Tab!
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'director-search',
      title: 'Busca por Diretores',
      description: 'Encontre todos os filmes de seus diretores favoritos',
      icon: <Search className="text-amber-400" size={24} />,
      content: (
        <div className="space-y-4">
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">🎭 Busca Inteligente de Diretores</h4>
            <div className="space-y-3">
              <p className="text-slate-300 text-sm">
                Nossa busca funciona mesmo sem acentos! Experimente:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="bg-slate-600 rounded p-2">
                  <p className="text-green-400">✅ "Jose Padilha"</p>
                  <p className="text-green-400">✅ "José Padilha"</p>
                </div>
                <div className="bg-slate-600 rounded p-2">
                  <p className="text-green-400">✅ "Rogerio Sganzerla"</p>
                  <p className="text-green-400">✅ "Rogério Sganzerla"</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">🔍 Como funciona:</h4>
            <ul className="text-slate-300 text-sm space-y-1">
              <li>• Busca automática com e sem acentos</li>
              <li>• Encontra variações do nome</li>
              <li>• Mostra todos os filmes do diretor</li>
              <li>• Verifica se realmente dirigiu o filme</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'combined-search',
      title: 'Busca Combinada',
      description: 'Combine múltiplos filmes e diretores em uma única busca',
      icon: <BarChart3 className="text-purple-400" size={24} />,
      content: (
        <div className="space-y-4">
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">📋 Como criar uma lista combinada:</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-white text-sm font-bold">1</div>
                <div>
                  <p className="text-white font-medium">Digite um filme</p>
                  <p className="text-slate-400 text-sm">Ex: "Cidade de Deus"</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-white text-sm font-bold">2</div>
                <div>
                  <p className="text-white font-medium">Clique no botão + ou pressione Tab</p>
                  <p className="text-slate-400 text-sm">Adiciona à lista sem buscar ainda</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-white text-sm font-bold">3</div>
                <div>
                  <p className="text-white font-medium">Repita para mais filmes/diretores</p>
                  <p className="text-slate-400 text-sm">Crie uma lista personalizada</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-white text-sm font-bold">4</div>
                <div>
                  <p className="text-white font-medium">Clique em "Busca Combinada"</p>
                  <p className="text-slate-400 text-sm">Busca todos os itens da lista juntos</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg p-4 border border-purple-500/30">
            <p className="text-purple-200 text-sm">
              <strong>💡 Exemplo prático:</strong> Adicione "Fernando Meirelles", "José Padilha" e "Cidade de Deus" 
              para ver todos os filmes relacionados ao cinema brasileiro contemporâneo!
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'advanced-filters',
      title: 'Filtros Avançados',
      description: 'Use filtros para encontrar exatamente o que procura',
      icon: <Filter className="text-green-400" size={24} />,
      content: (
        <div className="space-y-4">
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">🎛️ Filtros Disponíveis:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-600 rounded p-3">
                <h5 className="text-white font-medium mb-1">📅 Por Período</h5>
                <p className="text-slate-300 text-sm">Filtre por ano de lançamento</p>
              </div>
              <div className="bg-slate-600 rounded p-3">
                <h5 className="text-white font-medium mb-1">🎭 Por Gênero</h5>
                <p className="text-slate-300 text-sm">Ação, Drama, Comédia, etc.</p>
              </div>
              <div className="bg-slate-600 rounded p-3">
                <h5 className="text-white font-medium mb-1">⭐ Por Qualidade</h5>
                <p className="text-slate-300 text-sm">Melhor avaliados primeiro</p>
              </div>
              <div className="bg-slate-600 rounded p-3">
                <h5 className="text-white font-medium mb-1">🔥 Por Popularidade</h5>
                <p className="text-slate-300 text-sm">Mais populares primeiro</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">💡 Dicas de uso:</h4>
            <ul className="text-slate-300 text-sm space-y-1">
              <li>• Combine múltiplos gêneros para resultados específicos</li>
              <li>• Use filtros de ano para descobrir clássicos ou lançamentos</li>
              <li>• Ordene por avaliação para encontrar os melhores filmes</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'file-upload',
      title: 'Upload de Listas',
      description: 'Importe listas de filmes de arquivos .txt ou .csv',
      icon: <Upload className="text-cyan-400" size={24} />,
      content: (
        <div className="space-y-4">
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">📁 Como usar o Upload:</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-cyan-600 rounded-full w-6 h-6 flex items-center justify-center text-white text-sm font-bold">1</div>
                <div>
                  <p className="text-white font-medium">Prepare seu arquivo</p>
                  <p className="text-slate-400 text-sm">Formato .txt ou .csv, um filme por linha</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-cyan-600 rounded-full w-6 h-6 flex items-center justify-center text-white text-sm font-bold">2</div>
                <div>
                  <p className="text-white font-medium">Arraste ou clique na área</p>
                  <p className="text-slate-400 text-sm">Interface drag & drop intuitiva</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-cyan-600 rounded-full w-6 h-6 flex items-center justify-center text-white text-sm font-bold">3</div>
                <div>
                  <p className="text-white font-medium">Busca automática</p>
                  <p className="text-slate-400 text-sm">Processa e busca todos os filmes automaticamente</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">📝 Exemplo de arquivo:</h4>
            <div className="bg-slate-900 rounded p-3 font-mono text-sm">
              <div className="text-green-400">minha_lista.txt</div>
              <div className="text-slate-300 mt-2">
                Cidade de Deus<br/>
                Tropa de Elite<br/>
                Central do Brasil<br/>
                O Auto da Compadecida<br/>
                Carandiru
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'favorites',
      title: 'Sistema de Favoritos',
      description: 'Salve e organize seus filmes favoritos',
      icon: <Heart className="text-red-400" size={24} />,
      content: (
        <div className="space-y-4">
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">❤️ Como salvar favoritos:</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Heart className="text-red-400" size={20} />
                <div>
                  <p className="text-white font-medium">Clique no coração</p>
                  <p className="text-slate-400 text-sm">Nos cards de filme ou na página de detalhes</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-red-600 rounded-full w-6 h-6 flex items-center justify-center text-white text-sm font-bold">3</div>
                <div>
                  <p className="text-white font-medium">Acesse sua lista</p>
                  <p className="text-slate-400 text-sm">Botão flutuante no canto inferior direito</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">🎯 Funcionalidades da lista:</h4>
            <ul className="text-slate-300 text-sm space-y-1">
              <li>• <strong>Reordenar:</strong> Arraste para organizar por prioridade</li>
              <li>• <strong>Detalhes:</strong> Clique para ver informações completas</li>
              <li>• <strong>Streaming:</strong> Links diretos para assistir</li>
              <li>• <strong>PDF:</strong> Exporte sua lista personalizada</li>
            </ul>
          </div>
          
          <div className="bg-gradient-to-r from-red-900/50 to-pink-900/50 rounded-lg p-4 border border-red-500/30">
            <p className="text-red-200 text-sm">
              <strong>💡 Dica:</strong> Use sua lista como um "Para Assistir" personalizado. 
              A ordem que você organizar será mantida no PDF!
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'recommendations',
      title: 'Sistema de Recomendações',
      description: 'Descubra novos filmes baseados nos seus gostos',
      icon: <Sparkles className="text-purple-400" size={24} />,
      content: (
        <div className="space-y-4">
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">🤖 Como funciona a recomendação:</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-white text-sm font-bold">1</div>
                <div>
                  <p className="text-white font-medium">Analisa seus gostos</p>
                  <p className="text-slate-400 text-sm">Baseado nos filmes que você busca</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-white text-sm font-bold">2</div>
                <div>
                  <p className="text-white font-medium">Identifica padrões</p>
                  <p className="text-slate-400 text-sm">Gêneros favoritos, períodos, diretores</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-white text-sm font-bold">3</div>
                <div>
                  <p className="text-white font-medium">Sugere filmes similares</p>
                  <p className="text-slate-400 text-sm">Diversificados e de qualidade</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">🎯 Tipos de recomendação:</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-600 rounded p-2">
                <p className="text-purple-400 font-medium text-sm">🧠 Inteligente</p>
                <p className="text-slate-300 text-xs">Baseado nos seus gostos</p>
              </div>
              <div className="bg-slate-600 rounded p-2">
                <p className="text-yellow-400 font-medium text-sm">⭐ Qualidade</p>
                <p className="text-slate-300 text-xs">Bem avaliados</p>
              </div>
              <div className="bg-slate-600 rounded p-2">
                <p className="text-red-400 font-medium text-sm">🔥 Em Alta</p>
                <p className="text-slate-300 text-xs">Populares agora</p>
              </div>
              <div className="bg-slate-600 rounded p-2">
                <p className="text-blue-400 font-medium text-sm">📅 Recentes</p>
                <p className="text-slate-300 text-xs">Lançamentos</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'pdf-export',
      title: 'Relatórios em PDF',
      description: 'Exporte suas descobertas em relatórios profissionais',
      icon: <Download className="text-orange-400" size={24} />,
      content: (
        <div className="space-y-4">
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">📄 Tipos de relatório:</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 rounded p-2">
                  <Download size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">Relatório de Busca</p>
                  <p className="text-slate-400 text-sm">Todos os filmes encontrados na busca atual</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-red-600 rounded p-2">
                  <Heart size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">Lista Personalizada</p>
                  <p className="text-slate-400 text-sm">Seus filmes favoritos na ordem que você organizou</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">📋 O que inclui no PDF:</h4>
            <ul className="text-slate-300 text-sm space-y-1">
              <li>• Informações completas de cada filme</li>
              <li>• Diretor, elenco, gêneros, ano</li>
              <li>• Avaliações e sinopses</li>
              <li>• Disponibilidade em streaming</li>
              <li>• Links para trailers</li>
              <li>• Formatação profissional</li>
            </ul>
          </div>
          
          <div className="bg-gradient-to-r from-orange-900/50 to-yellow-900/50 rounded-lg p-4 border border-orange-500/30">
            <p className="text-orange-200 text-sm">
              <strong>💡 Uso prático:</strong> Perfeito para compartilhar recomendações com amigos 
              ou manter uma lista offline dos filmes que quer assistir!
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'tips',
      title: 'Dicas Avançadas',
      description: 'Aproveite ao máximo todas as funcionalidades',
      icon: <BookOpen className="text-indigo-400" size={24} />,
      content: (
        <div className="space-y-4">
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">🚀 Dicas de Produtividade:</h4>
            <div className="space-y-3">
              <div className="bg-slate-600 rounded p-3">
                <h5 className="text-blue-400 font-medium mb-1">⌨️ Atalhos de Teclado</h5>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• <kbd className="bg-slate-500 px-1 rounded">Enter</kbd> = Busca instantânea</li>
                  <li>• <kbd className="bg-slate-500 px-1 rounded">Tab</kbd> = Adicionar à lista</li>
                </ul>
              </div>
              
              <div className="bg-slate-600 rounded p-3">
                <h5 className="text-green-400 font-medium mb-1">🎯 Busca Eficiente</h5>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• Use nomes sem acentos (funciona igual)</li>
                  <li>• Combine filmes + diretores para contexto</li>
                  <li>• Aplique filtros para refinar resultados</li>
                </ul>
              </div>
              
              <div className="bg-slate-600 rounded p-3">
                <h5 className="text-purple-400 font-medium mb-1">📱 Mobile</h5>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• Interface totalmente responsiva</li>
                  <li>• Botões otimizados para toque</li>
                  <li>• Reordenação com botões ↑↓</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-lg p-4 border border-indigo-500/30">
            <h4 className="text-white font-medium mb-2">🎉 Agora você está pronto!</h4>
            <p className="text-indigo-200 text-sm">
              Explore, descubra e organize seus filmes como nunca antes. 
              A ferramenta está nas suas mãos - divirta-se descobrindo novos filmes!
            </p>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  if (!isOpen) return null;

  const currentStepData = tutorialSteps[currentStep];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className={`bg-slate-800 rounded-lg shadow-2xl transition-all duration-300 ${
        isMinimized ? 'w-80 h-20' : 'w-full max-w-4xl max-h-[90vh]'
      }`}>
        {isMinimized ? (
          // Versão minimizada
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentStepData.icon}
              <span className="text-white font-medium">Tutorial - {currentStepData.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        ) : (
          // Versão completa
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div className="flex items-center gap-3">
                {currentStepData.icon}
                <div>
                  <h2 className="text-xl font-bold text-white">{currentStepData.title}</h2>
                  <p className="text-slate-400 text-sm">{currentStepData.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(true)}
                  className="text-slate-400 hover:text-white transition-colors p-1"
                  title="Minimizar"
                >
                  <ChevronRight size={20} />
                </button>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-white transition-colors p-1"
                  title="Fechar tutorial"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="px-6 py-3 bg-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 text-sm">
                  Passo {currentStep + 1} de {tutorialSteps.length}
                </span>
                <span className="text-slate-400 text-sm">
                  {Math.round(((currentStep + 1) / tutorialSteps.length) * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-600 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-96">
              {currentStepData.content}
            </div>

            {/* Step Navigation */}
            <div className="px-6 py-2 border-t border-slate-700">
              <div className="flex justify-center gap-2 mb-4">
                {tutorialSteps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToStep(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentStep 
                        ? 'bg-blue-500' 
                        : index < currentStep 
                          ? 'bg-green-500' 
                          : 'bg-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between p-6 border-t border-slate-700">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
                Anterior
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  Pular Tutorial
                </button>
                
                {currentStep === tutorialSteps.length - 1 ? (
                  <button
                    onClick={onClose}
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 transition-colors font-medium"
                  >
                    Começar a Usar!
                    <Play size={16} />
                  </button>
                ) : (
                  <button
                    onClick={nextStep}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Próximo
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Tutorial;