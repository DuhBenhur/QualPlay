// API Key - Substitua pela sua chave do TMDB
const API_KEY = import.meta.env.VITE_TMDB_API_KEY || 'fallback-key';
const BASE_URL = 'https://api.themoviedb.org/3';

// Cache para melhorar performance
const cache = new Map<string, any>();

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
    // Busca com múltiplas estratégias para maximizar resultados
    const searches = [
      // Busca exata
      makeRequest(`/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(`"${query}"`)}&page=${page}&language=pt-BR&include_adult=false`),
      // Busca normal
      makeRequest(`/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}&language=pt-BR&include_adult=false`),
      // Busca sem aspas especiais
      makeRequest(`/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query.replace(/[^\w\s]/gi, ''))}&page=${page}&language=pt-BR&include_adult=false`)
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
    const data = await makeRequest(
      `/search/person?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`
    );
    
    return data.results.filter((person: any) => 
      person.known_for_department === 'Directing'
    );
  } catch (error) {
    console.error('Error searching directors:', error);
    return [];
  }
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
      const allProviders = [
        ...(providers.flatrate || []),
        ...(providers.rent || []),
        ...(providers.buy || [])
      ];
      
      if (allProviders.length > 0) {
        const uniqueProviders = Array.from(
          new Set(allProviders.map(p => p.provider_name))
        );
        streamingServices = uniqueProviders.join(', ');
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

// Função para descobrir filmes com filtros
export const discoverMovies = async (filters: SearchFilters): Promise<SearchResults> => {
  try {
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
    
    // Buscar múltiplas páginas para ter mais variedade
    const pages = [1, 2];
    const allResults = [];
    
    for (const page of pages) {
      try {
        const data = await makeRequest(`${endpoint}&page=${page}`);
        if (data.results) {
          allResults.push(...data.results);
        }
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error);
      }
    }
    
    // Remover duplicatas e pegar os melhores
    const uniqueMovies = Array.from(
      new Map(allResults.map(movie => [movie.id, movie])).values()
    ).slice(0, 20);
    
    // Processar filmes com detalhes completos
    const moviesWithDetails = await Promise.all(
      uniqueMovies.map(async (movie: any) => {
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
      totalResults: moviesWithDetails.length,
      page: 1,
      totalPages: 1
    };
  } catch (error) {
    console.error('Error discovering movies:', error);
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

// Função principal para buscar filmes e diretores - CORRIGIDA E EXPANDIDA
export const searchMoviesAndDirectors = async (
  movieNames: string[],
  directorNames: string[],
  filters: SearchFilters
): Promise<SearchResults> => {
  try {
    const allMovies: MovieDetails[] = [];
    
    // 🎬 BUSCAR FILMES POR NOME - EXPANDIDO
    for (const movieName of movieNames) {
      try {
        console.log(`Buscando filme: ${movieName}`);
        const searchResults = await searchMovies(movieName);
        console.log(`Encontrados ${searchResults.movies.length} filmes para "${movieName}"`);
        // Pega até 8 filmes por termo buscado
        allMovies.push(...searchResults.movies.slice(0, 8));
      } catch (error) {
        console.error(`Error searching for movie "${movieName}":`, error);
      }
    }
    
    // 🎭 BUSCAR FILMES POR DIRETOR - MUITO EXPANDIDO
    for (const directorName of directorNames) {
      try {
        console.log(`Buscando diretor: ${directorName}`);
        
        // Buscar o diretor
        const directorData = await makeRequest(
          `/search/person?api_key=${API_KEY}&query=${encodeURIComponent(directorName)}&language=pt-BR`
        );
        
        const directors = directorData.results?.filter((person: any) => 
          person.known_for_department === 'Directing'
        ) || [];
        
        console.log(`Encontrados ${directors.length} diretores para "${directorName}"`);
        
        // Para cada diretor encontrado
        for (const director of directors.slice(0, 2)) { // Máximo 2 diretores por nome
          try {
            // Buscar filmes do diretor com múltiplas páginas
            const pages = [1, 2, 3]; // 3 páginas = até 60 filmes por diretor
            
            for (const page of pages) {
              try {
                const moviesData = await makeRequest(
                  `/discover/movie?api_key=${API_KEY}&with_crew=${director.id}&language=pt-BR&include_adult=false&sort_by=popularity.desc&page=${page}`
                );
                
                if (moviesData.results && moviesData.results.length > 0) {
                  console.log(`Página ${page}: ${moviesData.results.length} filmes do diretor ${director.name}`);
                  
                  // Processar todos os filmes da página
                  for (const movie of moviesData.results) {
                    try {
                      const movieDetails = await getMovieDetails(movie.id);
                      allMovies.push(movieDetails);
                    } catch (error) {
                      console.error(`Error getting details for movie ${movie.id}:`, error);
                    }
                  }
                }
              } catch (error) {
                console.error(`Error fetching page ${page} for director ${director.name}:`, error);
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
    
    // Limitar a 50 resultados para melhor performance (aumentado de 20)
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

// Importar tipos necessários
import { Genre, SearchFilters, SearchResults, MovieDetails, Person } from '../types/movie';