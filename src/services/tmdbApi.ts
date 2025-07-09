import { Genre, SearchFilters, SearchResults, MovieDetails, Person } from '../types/movie';

const API_KEY = 'a2e13943c4fab8524d1a35e31b4e32bc';
const BASE_URL = 'https://api.themoviedb.org/3';

// Cache para melhorar performance
const cache = new Map<string, any>();

// Normaliza o texto, removendo acentos. Ex: "Rogério" -> "Rogerio"
const normalizeQuery = (query: string) => {
  return query.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

// Função auxiliar para fazer requisições com cache
const makeRequest = async (endpoint: string): Promise<any> => {
  if (cache.has(endpoint)) {
    return cache.get(endpoint);
  }
  
  const response = await fetch(`${BASE_URL}${endpoint}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  cache.set(endpoint, data);
  return data;
};

// Função para mapear IDs de gênero para objetos Genre
const mapGenreIds = async (genreIds: number[]): Promise<Genre[]> => {
  const allGenres = await getGenres();
  const genresMap = new Map(allGenres.map(g => [g.id, g]));
  
  return genreIds
    .map(id => genresMap.get(id))
    .filter((genre): genre is Genre => genre !== undefined);
};

// Função para obter URL da imagem
export const getImageUrl = (path: string | null, size: string = 'w500'): string => {
  if (!path) return '/placeholder-movie.jpg';
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

// Função para buscar filmes
export const searchMovies = async (query: string, page: number = 1): Promise<SearchResults> => {
  try {
    // 🔍 BUSCA COM NORMALIZAÇÃO DE ACENTOS
    const normalizedQuery = normalizeQuery(query);
    const queries = new Set([query]); // Sempre incluir query original
    
    // Adicionar versão normalizada se for diferente
    if (query !== normalizedQuery) {
      queries.add(normalizedQuery);
    }
    
    console.log(`🔍 Buscando por: [${[...queries].join(', ')}]`);
    
    const searches = [
      // Buscar com cada variação da query
      ...[...queries].map(q => 
        makeRequest(`/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(q)}&page=${page}&language=pt-BR&include_adult=false`)
      )
    ];

    const results = await Promise.all(searches);
    
    // Combinar todos os resultados únicos
    const allMovies = new Map();
    results.forEach(data => {
      if (data.results) {
        data.results.forEach((movie: any) => {
          if (!allMovies.has(movie.id)) {
            allMovies.set(movie.id, movie);
          }
        });
      }
    });

    const uniqueMovies = Array.from(allMovies.values());
    
    // Processar filmes com detalhes completos (até 10 por busca)
    const moviesWithDetails = await Promise.all(
      uniqueMovies.slice(0, 10).map(async (movie: any) => {
        try {
          return await getMovieDetails(movie.id);
        } catch (error) {
          console.error(`Error getting details for movie ${movie.id}:`, error);
          // Retorna dados básicos se falhar
          return {
            ...movie,
            genres: await mapGenreIds(movie.genre_ids || []),
            genre_ids: movie.genre_ids || [],
            director: 'Não informado',
            cast: 'Não informado',
            streaming_services: 'Não disponível',
            runtime: 0,
            budget: 0,
            revenue: 0,
            overview: movie.overview || '',
            poster_path: movie.poster_path || null,
            backdrop_path: movie.backdrop_path || null,
            vote_average: movie.vote_average || 0,
            vote_count: movie.vote_count || 0,
            popularity: movie.popularity || 0,
            adult: movie.adult || false,
            original_language: movie.original_language || '',
            original_title: movie.original_title || movie.title || '',
            video: movie.video || false,
            release_date: movie.release_date || ''
          };
        }
      })
    );
    
    return {
      movies: moviesWithDetails,
      totalResults: uniqueMovies.length,
      page: 1,
      totalPages: 1
    };
  } catch (error) {
    console.error('Error searching movies:', error);
    return {
      movies: [],
      totalResults: 0,
      page: 1,
      totalPages: 1
    };
  }
};

// Função para buscar diretores
export const searchDirectors = async (query: string): Promise<Person[]> => {
  try {
    // 🔍 BUSCA ROBUSTA COM NORMALIZAÇÃO DE ACENTOS PARA DIRETORES
    const normalizedQuery = normalizeQuery(query);
    const queries = new Set([query]); // Query original
    
    // Adicionar versão normalizada se for diferente
    if (query !== normalizedQuery) {
      queries.add(normalizedQuery);
    }
    
    // Adicionar variações comuns para nomes brasileiros
    const variations = generateNameVariations(query);
    variations.forEach(variation => queries.add(variation));
    
    console.log(`🎭 Buscando diretor por: [${[...queries].join(', ')}]`);
    
    const searches = [...queries].map(q => 
      makeRequest(`/search/person?api_key=${API_KEY}&query=${encodeURIComponent(q)}&language=pt-BR`)
    );
    
    const results = await Promise.all(searches);
    
    // Combinar resultados únicos
    const allPeople = new Map();
    results.forEach(data => {
      if (data.results) {
        data.results.forEach((person: any) => {
          if (!allPeople.has(person.id)) {
            allPeople.set(person.id, person);
          }
        });
      }
    });
    
    return Array.from(allPeople.values()).filter((person: any) => 
      person.known_for_department === 'Directing'
    );
  } catch (error) {
    console.error('Error searching directors:', error);
    return [];
  }
};

// 🔍 FUNÇÃO PARA GERAR VARIAÇÕES DE NOMES
const generateNameVariations = (name: string): string[] => {
  const variations = new Set<string>();
  
  // Normalização básica
  const normalized = normalizeQuery(name);
  if (normalized !== name) {
    variations.add(normalized);
  }
  
  // Variações específicas para nomes brasileiros comuns
  const commonVariations: Record<string, string[]> = {
    'jose': ['josé', 'Jose', 'José'],
    'josé': ['jose', 'Jose', 'José'],
    'rogerio': ['rogério', 'Rogerio', 'Rogério'],
    'rogério': ['rogerio', 'Rogerio', 'Rogério'],
    'antonio': ['antônio', 'Antonio', 'Antônio'],
    'antônio': ['antonio', 'Antonio', 'Antônio'],
    'joao': ['joão', 'Joao', 'João'],
    'joão': ['joao', 'Joao', 'João'],
    'paulo': ['paulo', 'Paulo'],
    'carlos': ['carlos', 'Carlos'],
    'fernando': ['fernando', 'Fernando'],
    'sergio': ['sérgio', 'Sergio', 'Sérgio'],
    'sérgio': ['sergio', 'Sergio', 'Sérgio'],
    'marcio': ['márcio', 'Marcio', 'Márcio'],
    'márcio': ['marcio', 'Marcio', 'Márcio'],
    'fabio': ['fábio', 'Fabio', 'Fábio'],
    'fábio': ['fabio', 'Fabio', 'Fábio'],
    'lucio': ['lúcio', 'Lucio', 'Lúcio'],
    'lúcio': ['lucio', 'Lucio', 'Lúcio']
  };
  
  // Verificar se o nome (ou parte dele) tem variações conhecidas
  const lowerName = name.toLowerCase();
  Object.keys(commonVariations).forEach(key => {
    if (lowerName.includes(key)) {
      commonVariations[key].forEach(variation => {
        // Substituir no contexto completo
        const newName = name.toLowerCase().replace(key, variation);
        variations.add(newName);
        // Também adicionar com primeira letra maiúscula
        variations.add(newName.charAt(0).toUpperCase() + newName.slice(1));
      });
    }
  });
  
  return Array.from(variations);
};

// Função para obter detalhes completos do filme
export const getMovieDetails = async (movieId: number): Promise<MovieDetails> => {
  try {
    const [movieData, creditsData, watchProvidersData] = await Promise.all([
      makeRequest(`/movie/${movieId}?api_key=${API_KEY}&language=pt-BR`),
      makeRequest(`/movie/${movieId}/credits?api_key=${API_KEY}`),
      makeRequest(`/movie/${movieId}/watch/providers?api_key=${API_KEY}`)
    ]);

    // Extrair diretor dos créditos
    const director = creditsData.crew?.find((person: any) => person.job === 'Director')?.name || 'Não informado';
    
    // Extrair elenco principal (primeiros 5)
    const cast = creditsData.cast?.slice(0, 5).map((actor: any) => actor.name).join(', ') || 'Não informado';
    
    // Extrair serviços de streaming para o Brasil
    let streamingServices = 'Não disponível';
    if (watchProvidersData.results?.BR) {
      const providers = watchProvidersData.results.BR;
      
      // 🎯 SEPARAR POR TIPO DE DISPONIBILIDADE
      const streamingTypes = [];
      
      // Disponível na assinatura (flatrate)
      if (providers.flatrate && providers.flatrate.length > 0) {
        const flatrateServices = providers.flatrate.map(p => `${p.provider_name} (Incluído)`);
        streamingTypes.push(...flatrateServices);
      }
      
      // Disponível para alugar (rent)
      if (providers.rent && providers.rent.length > 0) {
        const rentServices = providers.rent
          .filter(p => !providers.flatrate?.some(f => f.provider_name === p.provider_name))
          .map(p => `${p.provider_name} (Aluguel)`);
        streamingTypes.push(...rentServices);
      }
      
      // Disponível para comprar (buy)
      if (providers.buy && providers.buy.length > 0) {
        const buyServices = providers.buy
          .filter(p => 
            !providers.flatrate?.some(f => f.provider_name === p.provider_name) &&
            !providers.rent?.some(r => r.provider_name === p.provider_name)
          )
          .map(p => `${p.provider_name} (Compra)`);
        streamingTypes.push(...buyServices);
      }
      
      if (streamingTypes.length > 0) {
        streamingServices = streamingTypes.join(', ');
      }
    }

    return {
      ...movieData,
      genres: movieData.genres || [],
      genre_ids: movieData.genres?.map((g: any) => g.id) || [],
      director,
      cast,
      streaming_services: streamingServices,
      credits: creditsData,
      watch_providers: watchProvidersData,
      runtime: movieData.runtime || 0,
      budget: movieData.budget || 0,
      revenue: movieData.revenue || 0,
      overview: movieData.overview || '',
      poster_path: movieData.poster_path || null,
      backdrop_path: movieData.backdrop_path || null,
      vote_average: movieData.vote_average || 0,
      vote_count: movieData.vote_count || 0,
      popularity: movieData.popularity || 0,
      adult: movieData.adult || false,
      original_language: movieData.original_language || '',
      original_title: movieData.original_title || movieData.title || '',
      video: movieData.video || false,
      release_date: movieData.release_date || ''
    };
  } catch (error) {
    console.error('Error getting movie details:', error);
    throw error;
  }
};

// Função para descobrir filmes com filtros - CORRIGIDA
export const discoverMovies = async (filters: SearchFilters): Promise<SearchResults> => {
  try {
    console.log('🔍 Discover Movies - Filtros recebidos:', filters);
    
    let endpoint = `/discover/movie?api_key=${API_KEY}&language=pt-BR&include_adult=false&sort_by=${filters.sortBy}`;
    
    if (filters.genres.length > 0) {
      endpoint += `&with_genres=${filters.genres.join(',')}`;
    }
    
    if (filters.yearStart && filters.yearEnd) {
      endpoint += `&primary_release_date.gte=${filters.yearStart}-01-01&primary_release_date.lte=${filters.yearEnd}-12-31`;
    }
    
    if (filters.region) {
      endpoint += `&region=${filters.region}`;
    }
    
    // Adicionar filtros de qualidade mínima
    endpoint += `&vote_count.gte=10`; // Pelo menos 10 votos
    endpoint += `&vote_average.gte=4.0`; // Avaliação mínima 4.0
    
    console.log('🌐 Endpoint final:', endpoint);
    const pages = [1, 2, 3]; // Aumentar para 3 páginas
    const allResults = [];
    
    for (const page of pages) {
      try {
        const data = await makeRequest(`${endpoint}&page=${page}`);
        console.log(`📄 Página ${page}: ${data.results?.length || 0} filmes`);
        if (data.results) {
          allResults.push(...data.results);
        }
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error);
      }
    }
    
    console.log(`📊 Total de filmes brutos: ${allResults.length}`);
    // Remover duplicatas e pegar os melhores
    const uniqueMovies = Array.from(
      new Map(allResults.map(movie => [movie.id, movie])).values()
    ).slice(0, 30); // Aumentar para 30
    
    // Processar filmes com detalhes completos
    const moviesWithDetails = await Promise.all(
      uniqueMovies.slice(0, 20).map(async (movie: any) => { // Aumentar para 20
        try {
          return await getMovieDetails(movie.id);
        } catch (error) {
          console.warn(`⚠️ Erro ao buscar detalhes do filme ${movie.id}:`, error);
          // Retorna dados básicos se falhar
          return {
            ...movie,
            genres: await mapGenreIds(movie.genre_ids || []),
            genre_ids: movie.genre_ids || [],
            director: 'Não informado',
            cast: 'Não informado',
            streaming_services: 'Não disponível',
            runtime: 0,
            budget: 0,
            revenue: 0,
            overview: movie.overview || '',
            poster_path: movie.poster_path || null,
            backdrop_path: movie.backdrop_path || null,
            vote_average: movie.vote_average || 0,
            vote_count: movie.vote_count || 0,
            popularity: movie.popularity || 0,
            adult: movie.adult || false,
            original_language: movie.original_language || '',
            original_title: movie.original_title || movie.title || '',
            video: movie.video || false,
            release_date: movie.release_date || ''
          };
        }
      })
    );
    
    console.log(`✅ Filmes processados com detalhes: ${moviesWithDetails.length}`);
    
    return {
      movies: moviesWithDetails,
      totalResults: moviesWithDetails.length,
      page: 1,
      totalPages: 1
    };
  } catch (error) {
    console.error('❌ Erro no discoverMovies:', error);
    return {
      movies: [],
      totalResults: 0,
      page: 1,
      totalPages: 1
    };
  }
};

// Função para obter lista de gêneros
export const getGenres = async (): Promise<Genre[]> => {
  try {
    const data = await makeRequest(`/genre/movie/list?api_key=${API_KEY}&language=pt-BR`);
    return data.genres || [];
  } catch (error) {
    console.error('Error getting genres:', error);
    return [];
  }
};

// Função principal para buscar filmes e diretores - CORRIGIDA
export const searchMoviesAndDirectors = async (
  movieNames: string[],
  directorNames: string[],
  filters: SearchFilters
): Promise<SearchResults> => {
  try {
    const allMovies: MovieDetails[] = [];
    
    // 🎬 BUSCAR FILMES POR NOME
    for (const movieName of movieNames) {
      try {
        console.log(`Buscando filme: ${movieName}`);
        const searchResults = await searchMovies(movieName);
        console.log(`Encontrados ${searchResults.movies.length} filmes para "${movieName}"`);
        allMovies.push(...searchResults.movies.slice(0, 8));
      } catch (error) {
        console.error(`Error searching for movie "${movieName}":`, error);
      }
    }
    
    // 🎭 BUSCAR FILMES POR DIRETOR - ALGORITMO COM NORMALIZAÇÃO ROBUSTA
    for (const directorName of directorNames) {
      try {
        console.log(`Buscando diretor: ${directorName}`);
        
        // 🔍 BUSCA ROBUSTA COM MÚLTIPLAS VARIAÇÕES
        const queries = new Set([directorName]);
        const normalizedName = normalizeQuery(directorName);
        
        if (normalizedName !== directorName) {
          queries.add(normalizedName);
        }
        
        // Adicionar variações específicas
        const variations = generateNameVariations(directorName);
        variations.forEach(variation => queries.add(variation));
        
        console.log(`🔍 Buscando diretor com variações: [${[...queries].join(', ')}]`);
        
        // Buscar com todas as variações
        const searchPromises = [...queries].map(query => 
          makeRequest(`/search/person?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`)
        );
        
        const searchResults = await Promise.all(searchPromises);
        
        // Combinar resultados únicos
        const allDirectors = new Map();
        searchResults.forEach(data => {
          if (data.results) {
            data.results.forEach((person: any) => {
              if (person.known_for_department === 'Directing' && !allDirectors.has(person.id)) {
                allDirectors.set(person.id, person);
              }
            });
          }
        });
        
        const directors = Array.from(allDirectors.values());
        
        console.log(`Encontrados ${directors.length} diretores para "${directorName}"`);
        
        // Para cada diretor encontrado (máximo 2 para evitar resultados irrelevantes)
        for (const director of directors.slice(0, 2)) {
          try {
            console.log(`🎬 Buscando filmes do diretor: ${director.name} (ID: ${director.id})`);
            
            // Discover movies com filtro de diretor
            const discoverResults = await makeRequest(
              `/discover/movie?api_key=${API_KEY}&with_crew=${director.id}&language=pt-BR&include_adult=false&sort_by=popularity.desc&page=1`
            );
            
            console.log(`📊 Discover encontrou ${discoverResults.results?.length || 0} filmes para ${director.name}`);
            
            // Processar filmes do discover
            if (discoverResults.results && discoverResults.results.length > 0) {
              for (const movie of discoverResults.results.slice(0, 15)) {
                try {
                  const movieDetails = await getMovieDetails(movie.id);
                  
                  // 🎯 VERIFICAÇÃO MAIS ROBUSTA DO DIRETOR
                  const movieDirector = movieDetails.director.toLowerCase();
                  const searchTerms = [...queries].map(q => q.toLowerCase());
                  
                  const isDirectorMatch = searchTerms.some(term => {
                    const firstWord = term.split(' ')[0];
                    return movieDirector.includes(firstWord) || 
                           movieDirector.includes(term) ||
                           normalizeQuery(movieDirector).includes(normalizeQuery(term));
                  });
                  
                  if (movieDetails.director && isDirectorMatch) {
                    console.log(`✅ Filme confirmado: ${movieDetails.title} - Diretor: ${movieDetails.director}`);
                    allMovies.push(movieDetails);
                  } else {
                    console.log(`❌ Filme rejeitado: ${movieDetails.title} - Diretor real: ${movieDetails.director} (buscado: ${directorName})`);
                  }
                } catch (error) {
                  console.error(`Error getting details for movie ${movie.id}:`, error);
                }
              }
            }
          } catch (error) {
            console.error(`Error processing director ${director.name}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error searching for director "${directorName}":`, error);
      }
    }
    
    // Se não há filmes específicos, usar discover para preencher
    if (movieNames.length === 0 && directorNames.length === 0) {
      console.log('Usando discover movies para preencher resultados');
      const discoverResults = await discoverMovies(filters);
      allMovies.push(...discoverResults.movies);
    }
    
    console.log(`Total de filmes antes da filtragem: ${allMovies.length}`);
    
    // Remover duplicatas
    const uniqueMovies = allMovies.filter((movie, index, self) => 
      index === self.findIndex(m => m.id === movie.id)
    );
    
    console.log(`Filmes únicos: ${uniqueMovies.length}`);
    
    // Aplicar filtros
    let filteredMovies = uniqueMovies;
    
    if (filters.genres.length > 0) {
      filteredMovies = filteredMovies.filter(movie => 
        movie.genres && movie.genres.some(genre => filters.genres.includes(genre.id))
      );
      console.log(`Após filtro de gênero: ${filteredMovies.length}`);
    }
    
    if (filters.yearStart && filters.yearEnd) {
      filteredMovies = filteredMovies.filter(movie => {
        const year = new Date(movie.release_date).getFullYear();
        return year >= filters.yearStart && year <= filters.yearEnd;
      });
      console.log(`Após filtro de ano: ${filteredMovies.length}`);
    }
    
    // Ordenar resultados
    if (filters.sortBy === 'vote_average.desc') {
      filteredMovies.sort((a, b) => b.vote_average - a.vote_average);
    } else if (filters.sortBy === 'release_date.desc') {
      filteredMovies.sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime());
    } else if (filters.sortBy === 'popularity.desc') {
      filteredMovies.sort((a, b) => b.popularity - a.popularity);
    }
    
    // Limitar a 50 resultados para melhor performance
    const limitedMovies = filteredMovies.slice(0, 50);
    
    console.log(`Resultado final: ${limitedMovies.length} filmes`);
    
    return {
      movies: limitedMovies,
      totalResults: limitedMovies.length,
      page: 1,
      totalPages: 1
    };
  } catch (error) {
    console.error('Error in searchMoviesAndDirectors:', error);
    return {
      movies: [],
      totalResults: 0,
      page: 1,
      totalPages: 1
    };
  }
};