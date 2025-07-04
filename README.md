# Qual Play

Uma aplicação web moderna e completa para descobrir, explorar e analisar filmes utilizando a API do The Movie Database (TMDB).

![Qual Play](public/seu_logo.png)

## 🎬 Sobre o Projeto

O **Qual Play** é uma aplicação desenvolvida em React com TypeScript que oferece uma experiência rica e intuitiva para entusiastas de cinema. A aplicação combina funcionalidades avançadas de busca, visualização de dados e uma interface moderna e responsiva.

### ✨ Principais Funcionalidades

- **Busca Avançada**: Pesquise filmes por título, diretor ou use filtros por gênero, ano e critérios de ordenação
- **Informações Detalhadas**: Acesse sinopses, elenco, diretor, avaliações e disponibilidade em streaming
- **Visualização de Dados**: Gráficos interativos mostrando distribuição de filmes por gênero
- **Sistema de Recomendação**: Sugestões personalizadas baseadas nos filmes pesquisados
- **Upload de Listas**: Importe listas de filmes via arquivos .txt ou .csv
- **Exportação PDF**: Gere relatórios completos dos resultados de busca
- **Interface Responsiva**: Design moderno que funciona em desktop, tablet e mobile
- **Múltiplas Páginas**: Navegação entre busca, sobre e contato

## 🚀 Tecnologias Utilizadas

### Frontend
- **React 18** - Biblioteca JavaScript para interfaces de usuário
- **TypeScript** - Superset do JavaScript com tipagem estática
- **Vite** - Build tool moderna e rápida
- **Tailwind CSS** - Framework CSS utilitário
- **Lucide React** - Biblioteca de ícones moderna

### Dados & APIs
- **The Movie Database (TMDB) API** - Base de dados de filmes
- **Chart.js** - Biblioteca para visualização de dados
- **React Chart.js 2** - Wrapper React para Chart.js
- **Date-fns** - Biblioteca para manipulação de datas

### Funcionalidades Extras
- **jsPDF** - Geração de documentos PDF
- **html2canvas** - Captura de elementos HTML como imagem
- **Cache inteligente** - Otimização de requisições à API
- **Busca em tempo real** - Interface responsiva e dinâmica

## 🏗️ Arquitetura do Projeto

### Estrutura Modular
- Componentes reutilizáveis e bem organizados
- Separação clara de responsabilidades
- Tipagem forte com TypeScript
- Hooks customizados para lógica compartilhada

### Performance
- Cache de requisições API para melhor performance
- Lazy loading de imagens
- Otimização de re-renders
- Bundle splitting automático

## 📦 Instalação e Execução

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn

### Passos para instalação

1. **Clone o repositório**
```bash
git clone https://github.com/eduardobenhur/busca-filmes-pro.git
cd busca-filmes-pro
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure a API Key do TMDB**
- Obtenha uma chave gratuita em [TMDB](https://www.themoviedb.org/settings/api)
- Substitua a chave no arquivo `src/services/tmdbApi.ts`

4. **Execute o projeto**
```bash
npm run dev
```

5. **Acesse a aplicação**
- Abra [http://localhost:5173](http://localhost:5173) no seu navegador

## 🎯 Como Usar

### Busca Básica
1. Digite nomes de filmes ou diretores na barra lateral
2. Use os botões "+" para adicionar múltiplos itens
3. Clique em "Buscar Filmes" para ver os resultados

### Filtros Avançados
1. Expanda a seção "Filtros Avançados"
2. Selecione gêneros, intervalo de anos e critério de ordenação
3. Os filtros são aplicados automaticamente na busca

### Upload de Listas
1. Use a seção "Upload de Lista" na barra lateral
2. Arraste um arquivo .txt ou .csv ou clique para selecionar
3. Cada linha deve conter um nome de filme
4. A busca é executada automaticamente após o upload

### Visualização
- Alterne entre visualização em grade e tabela
- Clique em qualquer filme para ver detalhes completos
- Explore as recomendações personalizadas

### Exportação
- Use o botão "Exportar PDF" para gerar relatórios
- O PDF inclui todos os filmes encontrados com detalhes completos

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview

# Linting
npm run lint
```

## 📱 Funcionalidades Implementadas do Backlog

### ✅ Implementadas
- [x] Página "Sobre" com informações da aplicação e desenvolvedor
- [x] Página "Contato" com formulário de feedback
- [x] Menu de navegação entre páginas
- [x] Busca por gênero, ano e filtros avançados
- [x] Detalhes completos dos filmes (sinopse, elenco, pôster, streaming)
- [x] Sistema de recomendação baseado nas buscas
- [x] Gráficos de visualização de dados por gênero
- [x] Upload de listas de filmes em CSV/TXT
- [x] Exportação para PDF dos resultados
- [x] Design responsivo e moderno
- [x] Cache e otimização de performance

### 🚧 Próximas Implementações
- [ ] Sistema de login e histórico de usuário
- [ ] Integração com outras APIs de streaming
- [ ] Mapas com localizações de filmagem
- [ ] Paginação para grandes resultados
- [ ] Busca com autocompletar
- [ ] Testes automatizados
- [ ] Internacionalização

## 👨‍💻 Desenvolvedor

**Eduardo Ben-Hur**
- Desenvolvedor Full Stack especializado em React, TypeScript e Python
- Apaixonado por criar soluções elegantes e funcionais
- Focado em experiência do usuário e código de qualidade

### Contato
- GitHub: [@eduardobenhur](https://github.com/eduardobenhur)
- LinkedIn: [Eduardo Ben-Hur](https://linkedin.com/in/eduardobenhur)
- Portfolio: [eduardobenhur.dev](https://eduardobenhur.dev)

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🙏 Agradecimentos

- [The Movie Database (TMDB)](https://www.themoviedb.org/) pelos dados de filmes
- [Lucide](https://lucide.dev/) pelos ícones
- [Tailwind CSS](https://tailwindcss.com/) pelo framework CSS
- [Chart.js](https://www.chartjs.org/) pelas visualizações

---

**Desenvolvido com ❤️ e muito ☕ por Eduardo Ben-Hur**