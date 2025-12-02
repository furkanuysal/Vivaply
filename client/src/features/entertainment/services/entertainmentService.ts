import api from '../../../lib/api';
import type { TmdbContentDto } from '../../entertainment/types';

export const entertainmentService = {
  // Dizi Arama
  searchTv: async (query: string, language: string = 'en-US') => {
    const response = await api.get<TmdbContentDto[]>(`/Entertainment/tv/search?query=${query}&language=${language}`);
    return response.data;
  },

  // Film Arama
  searchMovie: async (query: string, language: string = 'en-US') => {
    const response = await api.get<TmdbContentDto[]>(`/Entertainment/movie/search?query=${query}&language=${language}`);
    return response.data;
  },

  // Trend Diziler
  getTrendingTv: async (language: string = 'en-US') => {
    const response = await api.get<TmdbContentDto[]>(`/Entertainment/tv/trending?language=${language}`);
    return response.data;
  },

  // Tv show detail by ID
  getTvDetail: async (id: number, language: string = 'en-US') => {
    const response = await api.get<any>(`/Entertainment/tv/${id}?language=${language}`);
    return response.data;
  },

  // Movie detail by ID
  getMovieDetail: async (id: number, language: string = 'en-US') => {
    const response = await api.get<TmdbContentDto>(`/Entertainment/movie/${id}?language=${language}`);
    return response.data;
  }
};