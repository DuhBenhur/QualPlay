import React from 'react';
import { Film, Code, Database, Palette, Zap, Globe } from 'lucide-react';

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <img 
              src="/seu_logo.png" 
              alt="Eduardo Ben-Hur Logo" 
              className="w-16 h-16 rounded-full"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <Film className="text-blue-400" size={48} />
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            QualPlay
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Uma aplicação moderna e completa para descobrir, explorar e analisar filmes com tecnologias de ponta
          </p>
        </div>

        {/* About the Application */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-blue-400">Sobre a Aplicação</h2>
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <p className="text-slate-300 leading-relaxed mb-4">
              Pense no <strong>QualPlay</strong> como seu cúmplice na hora de escolher um filme. 
              Aquele amigo que sempre tem uma boa indicação quando você manda um "não sei o que ver!". 
              Nós vasculhamos o universo de filmes e séries do The Movie Database (TMDB) 
              para trazer as melhores opções direto pra sua tela. 
              Chega de briga pelo controle remoto, agora a decisão ficou fácil e rápida.
            </p>
            <p className="text-slate-300 leading-relaxed">
              A aplicação combina funcionalidades de busca inteligente, filtros avançados, visualização de dados 
              e uma interface moderna e responsiva, proporcionando uma experiência completa para os usuários.
            </p>
          </div>
        </div>

        {/* Key Features */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-blue-400">Principais Funcionalidades</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <Film className="text-blue-400" size={24} />
                <h3 className="text-lg font-semibold">Busca Avançada</h3>
              </div>
              <p className="text-slate-300 text-sm">
                Busque filmes por título, diretor ou use filtros por gênero, ano de lançamento e critérios de ordenação
              </p>
            </div>

            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <Database className="text-green-400" size={24} />
                <h3 className="text-lg font-semibold">Informações Detalhadas</h3>
              </div>
              <p className="text-slate-300 text-sm">
                Acesse sinopses, elenco, diretor, avaliações e disponibilidade em serviços de streaming
              </p>
            </div>

            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <Palette className="text-purple-400" size={24} />
                <h3 className="text-lg font-semibold">Visualização de Dados</h3>
              </div>
              <p className="text-slate-300 text-sm">
                Gráficos interativos mostrando distribuição de filmes por gênero e análise estatística
              </p>
            </div>

            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <Globe className="text-cyan-400" size={24} />
                <h3 className="text-lg font-semibold">Interface Responsiva</h3>
              </div>
              <p className="text-slate-300 text-sm">
                Design moderno e responsivo que funciona perfeitamente em desktop, tablet e mobile
              </p>
            </div>
          </div>
        </div>

        {/* Technologies Used */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-blue-400">Tecnologias Utilizadas</h2>
          <div className="bg-slate-800 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-blue-300 mb-3 flex items-center gap-2">
                  <Code size={20} />
                  Frontend
                </h3>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• React 18 com TypeScript</li>
                  <li>• Vite (Build Tool)</li>
                  <li>• Tailwind CSS</li>
                  <li>• Lucide React (Ícones)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-green-300 mb-3 flex items-center gap-2">
                  <Database size={20} />
                  Dados & APIs
                </h3>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• The Movie Database (TMDB) API</li>
                  <li>• Chart.js para visualizações</li>
                  <li>• React Chart.js 2</li>
                  <li>• Date-fns para manipulação de datas</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-purple-300 mb-3 flex items-center gap-2">
                  <Zap size={20} />
                  Funcionalidades
                </h3>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• Exportação para PDF (jsPDF)</li>
                  <li>• Captura de tela (html2canvas)</li>
                  <li>• Cache inteligente</li>
                  <li>• Busca em tempo real</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Developer Info */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-blue-400">Sobre o Desenvolvedor</h2>
          <div className="bg-slate-800 rounded-lg p-6">
            <div className="flex items-center gap-4 mb-4">
              <img 
                src="/seu_logo.png" 
                alt="Eduardo Ben-Hur" 
                className="w-16 h-16 rounded-full"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div>
                <h3 className="text-xl font-semibold text-white">Eduardo Ben-Hur</h3>
                <p className="text-blue-400">Analista de Dados, entusiasta em Gen IA e curioso em tecnologias e na vida</p>
              </div>
            </div>
            <p className="text-slate-300 leading-relaxed">
              E aí! Sou especialista em Digital Business e Data Science pela USP ESALQ, o que na prática significa que sei usar planilhas chiques e convencer robôs a melhorarem o meu trabalho.
              Prova disso é este projeto, quase inteiramente concebido por uma Inteligência Artificial (Com muito refninamento café e engenharia de prompt) enquanto eu cuidava de tarefas mais importantes, como otimizar a refrigeração do meu PC gamer, encontrar a playlist de samba perfeita e testar a densidade de novas cervejas artesanais.
              Basicamente, sou só o gerente da IA. Um gerente que sabe fazer perguntas, gosta de hardware, samba e cerveja. Bem-vindo(a)!
              
            </p>
          </div>
        </div>

        {/* Project Architecture */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-blue-400">Arquitetura do Projeto</h2>
          <div className="bg-slate-800 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-green-300 mb-3">Estrutura Modular</h3>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• Componentes reutilizáveis</li>
                  <li>• Separação de responsabilidades</li>
                  <li>• Tipagem forte com TypeScript</li>
                  <li>• Hooks customizados</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-purple-300 mb-3">Performance</h3>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• Cache de requisições API</li>
                  <li>• Lazy loading de imagens</li>
                  <li>• Otimização de re-renders</li>
                  <li>• Bundle splitting</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-slate-700">
          <p className="text-slate-400">
            © 2025 Eduardo Ben-Hur. Desenvolvido com ❤️, engenharia de prompt🤖 e muito ☕
          </p>
          <p className="text-slate-500 text-sm mt-2">
            Dados fornecidos por The Movie Database (TMDB)
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;