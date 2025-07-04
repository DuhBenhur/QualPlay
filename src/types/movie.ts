export interface Movie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  genre_ids: number[];
  genres: Genre[];
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  original_language: string;
  video: boolean;
}

export interface MovieDetails extends Movie {
  runtime: number;
  budget: number;
  revenue: number;
  credits: Credits;
  watch_providers: WatchProviders;
  director: string;
  cast: string;
  streaming_services: string;
}

export interface Genre {
  id: number;
  name: string;
}

export interface Credits {
  cast: CastMember[];
  crew: CrewMember[];
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface WatchProviders {
  results: {
    BR?: {
      flatrate?: Provider[];
      rent?: Provider[];
      buy?: Provider[];
    };
  };
}

export interface Provider {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
}

export interface SearchFilters {
  genres: number[];
  yearStart: number;
  yearEnd: number;
  sortBy: string;
  region: string;
}

export interface SearchResults {
  movies: MovieDetails[];
  totalResults: number;
  page: number;
  totalPages: number;
}

export interface Person {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
}