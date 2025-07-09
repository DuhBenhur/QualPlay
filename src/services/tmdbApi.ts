import { Genre, SearchFilters, SearchResults, MovieDetails, Person } from '../types/movie';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY || 'fallback-key';
const BASE_URL = 'https://api.themoviedb.org/3';

// Cache para melhorar performance
const cache = new Map<string, any>();

// --- NOVA FUNÇÃO AUXILIAR ---
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

// Função para obter detalhes completos do filme (sem alterações)
export const getMovieDetails = async (movieId: number): Promise<MovieDetails> => {
  try {
    const [movieData, creditsData, watchProvidersData] = await Promise.all([
      makeRequest(`/movie/${movieId}?api_key=${API_KEY}&language=pt-BR`),
      makeRequest(`/movie/${movieId}/credits?api_key=${API_KEY}`),
      makeRequest(`/movie/${movieId}/watch/providers?api_key=${API_KEY}`)
    ]);

    const director = creditsData.crew?.find((person: any) => person.job === 'Director')?.name || 'Não informado';
    const cast = creditsData.cast?.slice(0, 5).map((actor: any) => actor.name).join(', ') || 'Não informado';
    
    let streamingServices = 'Não disponível';
    if (watchProvidersData.results?.BR) {
      const providers = watchProvidersData.results.BR;
      const streamingTypes = [];
      if (providers.flatrate?.length) streamingTypes.push(...providers.flatrate.map(p => `${p.provider_name} (Incluído)`));
      if (providers.rent?.length) streamingTypes.push(...providers.rent.map(p => `${p.provider_name} (Aluguel)`));
      if (providers.buy?.length) streamingTypes.push(...providers.buy.map(p => `${p.provider_name} (Compra)`));
      if (streamingTypes.length) streamingServices = [...new Set(streamingTypes)].join(', ');
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

// Função para descobrir filmes com filtros (sem alterações)
export const discoverMovies = async (filters: SearchFilters): Promise<SearchResults> => {
    // (código original sem alterações)
};

// Função para obter lista de gêneros (sem alterações)
export const getGenres = async (): Promise<Genre[]> => {
    // (código original sem alterações)
};


// --- FUNÇÃO PRINCIPAL ATUALIZADA ---
export const searchMoviesAndDirectors = async (
  movieNames: string[],
  directorNames: string[],
  filters: SearchFilters
): Promise<SearchResults> => {
  try {
    const allMovies = new Map<number, MovieDetails>();

    // Função interna para buscar um único termo (filme ou diretor)
    const searchSingleTerm = async (term: string, type: 'movie' | 'person') => {
      const queries = new Set([term]);
      const normalizedTerm = normalizeQuery(term);
      if (term !== normalizedTerm) {
        queries.add(normalizedTerm);
      }

      console.log(`Buscando por [${[...queries].join(', ')}] do tipo ${type}`);

      const searchPromises = [...queries].map(q => 
        makeRequest(`/search/${type}?api_key=${API_KEY}&query=${encodeURIComponent(q)}&language=pt-BR&include_adult=false`)
      );

      const results = await Promise.all(searchPromises);
      const combinedResults = new Map<number, any>();
      results.forEach(res => {
        res.results?.forEach((item: any) => combinedResults.set(item.id, item));
      });

      return Array.from(combinedResults.values());
    };

    // 1. Buscar por nomes de filmes
    for (const name of movieNames) {
      const movies = await searchSingleTerm(name, 'movie');
      for (const movie of movies.slice(0, 10)) { // Limita para performance
        if (!allMovies.has(movie.id)) {
          const details = await getMovieDetails(movie.id);
          allMovies.set(details.id, details);
        }
      }
    }

    // 2. Buscar por nomes de diretores
    for (const name of directorNames) {
      const people = await searchSingleTerm(name, 'person');
      const directors = people.filter(p => p.known_for_department === 'Directing');

      for (const director of directors.slice(0, 2)) { // Limita para performance
        const moviesData = await makeRequest(`/discover/movie?api_key=${API_KEY}&with_crew=${director.id}&language=pt-BR&sort_by=popularity.desc`);
        for (const movie of moviesData.results?.slice(0, 15) || []) {
          if (!allMovies.has(movie.id)) {
            const details = await getMovieDetails(movie.id);
            allMovies.set(details.id, details);
          }
        }
      }
    }
    
    // 3. Se não há buscas, usar discover
    if (movieNames.length === 0 && directorNames.length === 0) {
      const discoverResults = await discoverMovies(filters);
      discoverResults.movies.forEach(movie => allMovies.set(movie.id, movie));
    }

    // 4. Aplicar filtros e ordenar
    let finalMovies = Array.from(allMovies.values());

    if (filters.genres.length > 0) {
      finalMovies = finalMovies.filter(movie => 
        movie.genres?.some(genre => filters.genres.includes(genre.id))
      );
    }
    
    if (filters.yearStart && filters.yearEnd) {
      finalMovies = finalMovies.filter(movie => {
        const year = new Date(movie.release_date).getFullYear();
        return year >= filters.yearStart && year <= filters.yearEnd;
      });
    }

    // Ordenar resultados
    finalMovies.sort((a, b) => {
      if (filters.sortBy === 'popularity.desc') return b.popularity - a.popularity;
      if (filters.sortBy === 'release_date.desc') return new Date(b.release_date).getTime() - new Date(a.release_date).getTime();
      if (filters.sortBy === 'vote_average.desc') return b.vote_average - a.vote_average;
      return 0;
    });

    const limitedMovies = finalMovies.slice(0, 50);

    return {
      movies: limitedMovies,
      totalResults: limitedMovies.length,
      page: 1,
      totalPages: 1
    };

  } catch (error) {
    console.error('Error in searchMoviesAndDirectors:', error);
    return { movies: [], totalResults: 0, page: 1, totalPages: 1 };
  }
};