const API_KEY = import.meta.env.VITE_TMDB_API_KEY || 'fallback-key';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

import { Movie, MovieDetails, Genre, Person, SearchFilters, SearchResults } from '../types/movie';

// Cache for API responses
const cache = new Map<string, any>();

// Cache para gêneros (evita múltiplas chamadas)
let genresCache: Genre[] | null = null;

const makeRequest = async (endpoint: string): Promise<any> => {
  const cacheKey = endpoint;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

export const getImageUrl = (path: string | null, size: string = 'w500'): string => {
  if (!path) return '/placeholder-movie.jpg';
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

export const getGenres = async (): Promise<Genre[]> => {
  if (genresCache) {
    return genresCache;
  }
  
  const data = await makeRequest(`/genre/movie/list?api_key=${API_KEY}&language=pt-BR`);
  genresCache = data.genres || [];
  return genresCache;
};

// Função para mapear IDs de gênero para nomes
const mapGenreIdsToNames = async (genreIds: number[]): Promise<Genre[]> => {
  if (!genreIds || genreIds.length === 0) {
    return [];
  }
  
  const allGenres = await getGenres();
  const genresMap = new Map(allGenres.map(g => [g.id, g]));
  
  return genreIds
    .map(id => genresMap.get(id))
    .filter((genre): genre is Genre => genre !== undefined);
};

export const searchMovies = async (query: string, page: number = 1): Promise<SearchResults> => {
  const data = await makeRequest(
    `/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}&language=pt-BR&include_adult=false`
  );
  
  const moviesWithGenres = await Promise.all(
    data.results.map(async (movie: any) => {
      // Mapeia os IDs de gênero para objetos Genre completos
      const genres = await mapGenreIdsToNames(movie.genre_ids || []);
      
      const details = await getMovieDetails(movie.id);
      return { 
        ...movie, 
        genres, // Agora é um array de objetos Genre com id e name
        genre_ids: movie.genre_ids || [],
        ...details 
      };
    })
  );

  return {
    movies: moviesWithGenres,
    totalResults: data.total_results,
    page: data.page,
    totalPages: data.total_pages
  };
};

export const searchDirectors = async (query: string): Promise<Person[]> => {
  const data = await makeRequest(
    `/search/person?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR&include_adult=false`
  );
  return data.results.filter((person: Person) => 
    person.known_for_department === 'Directing'
  );
};

export const getMoviesByDirector = async (directorId: number): Promise<Movie[]> => {
  const data = await makeRequest(
    `/person/${directorId}/movie_credits?api_key=${API_KEY}&language=pt-BR`
  );
  
  const directorMovies = data.crew.filter((credit: any) => credit.job === 'Director');
  
  // Mapeia gêneros para cada filme do diretor
  const moviesWithGenres = await Promise.all(
    directorMovies.map(async (movie: any) => {
      const genres = await mapGenreIdsToNames(movie.genre_ids || []);
      return {
        ...movie,
        genres,
        genre_ids: movie.genre_ids || []
      };
    })
  );
  
  return moviesWithGenres;
};

export const getMovieDetails = async (movieId: number): Promise<Partial<MovieDetails>> => {
  const data = await makeRequest(
    `/movie/${movieId}?api_key=${API_KEY}&language=pt-BR&append_to_response=credits,watch/providers`
  );

  const director = data.credits.crew.find((person: any) => person.job === 'Director')?.name || 'N/A';
  const cast = data.credits.cast.slice(0, 5).map((actor: any) => actor.name).join(', ');
  
  const streamingServices = data['watch/providers']?.results?.BR?.flatrate?.map(
    (provider: any) => provider.provider_name
  ).join(', ') || 'Não disponível';

  // Mapeia os gêneros do filme para objetos Genre completos
  const genres = data.genres || [];

  return {
    runtime: data.runtime,
    budget: data.budget,
    revenue: data.revenue,
    credits: data.credits,
    watch_providers: data['watch/providers'],
    director,
    cast,
    streaming_services: streamingServices,
    genres // Agora retorna os gêneros mapeados corretamente
  };
};

export const discoverMovies = async (filters: SearchFilters, page: number = 1): Promise<SearchResults> => {
  const genreIds = filters.genres.join(',');
  let endpoint = `/discover/movie?api_key=${API_KEY}&language=pt-BR&page=${page}&sort_by=${filters.sortBy}&primary_release_date.gte=${filters.yearStart}-01-01&primary_release_date.lte=${filters.yearEnd}-12-31&include_adult=false&include_video=false`;
  
  if (genreIds) {
    endpoint += `&with_genres=${genreIds}`;
  }
  
  // Adiciona filtros de qualidade para melhorar os resultados
  endpoint += '&vote_count.gte=50'; // Mínimo de 50 votos
  endpoint += '&vote_average.gte=5.0'; // Avaliação mínima de 5.0
  
  const data = await makeRequest(endpoint);
  
  const moviesWithGenres = await Promise.all(
    data.results.map(async (movie: any) => {
      // Mapeia os IDs de gênero para objetos Genre completos
      const genres = await mapGenreIdsToNames(movie.genre_ids || []);
      
      // Filtra filmes sem gêneros válidos
      if (genres.length === 0) {
        return null;
      }
      
      const details = await getMovieDetails(movie.id);
      return { 
        ...movie, 
        genres,
        genre_ids: movie.genre_ids || [],
        ...details 
      };
    })
  );

  // Remove filmes nulos (sem gêneros válidos)
  const validMovies = moviesWithGenres.filter(movie => movie !== null);

  return {
    movies: validMovies,
    totalResults: validMovies.length,
    page: data.page,
    totalPages: data.total_pages
  };
};

export const searchMoviesAndDirectors = async (
  movieNames: string[],
  directorNames: string[],
  filters: SearchFilters
): Promise<SearchResults> => {
  let allMovies: MovieDetails[] = [];

  // Search by movie names
  for (const movieName of movieNames) {
    if (movieName.trim()) {
      const results = await searchMovies(movieName.trim());
      allMovies = allMovies.concat(results.movies);
    }
  }

  // Search by director names
  for (const directorName of directorNames) {
    if (directorName.trim()) {
      const directors = await searchDirectors(directorName.trim());
      for (const director of directors) {
        const movies = await getMoviesByDirector(director.id);
        const moviesWithDetails = await Promise.all(
          movies.map(async (movie: Movie) => {
            const details = await getMovieDetails(movie.id);
            return { ...movie, ...details };
          })
        );
        allMovies = allMovies.concat(moviesWithDetails);
      }
    }
  }

  // If no specific movies or directors, use discover
  if (movieNames.length === 0 && directorNames.length === 0) {
    const results = await discoverMovies(filters);
    allMovies = results.movies;
  }

  // Remove duplicates
  const uniqueMovies = allMovies.filter((movie, index, self) =>
    index === self.findIndex(m => m.id === movie.id)
  );

  // Apply local filters - agora com gêneros mapeados corretamente
  const filteredMovies = uniqueMovies.filter(movie => {
    const movieYear = new Date(movie.release_date).getFullYear();
    const yearMatch = movieYear >= filters.yearStart && movieYear <= filters.yearEnd;
    
    // Verifica gêneros usando os objetos Genre mapeados
    const genreMatch = filters.genres.length === 0 || 
      (movie.genres && movie.genres.some(genre => filters.genres.includes(genre.id)));
    
    // Filtra filmes sem gêneros válidos
    const hasValidGenres = movie.genres && movie.genres.length > 0;
    
    return yearMatch && genreMatch && hasValidGenres;
  });

  return {
    movies: filteredMovies,
    totalResults: filteredMovies.length,
    page: 1,
    totalPages: 1
  };
};