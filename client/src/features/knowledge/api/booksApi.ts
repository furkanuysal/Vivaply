import api from "@/shared/lib/api";
import type {
  AddBookDto,
  BookContentDto,
  RateBookDto,
  ReadStatus,
  ReviewBookDto,
  UpdateBookProgressDto,
} from "@/features/knowledge/types";

export const booksApi = {
  searchBooks: async (query: string, options?: { signal?: AbortSignal }) => {
    const response = await api.get<BookContentDto[]>("/books/search", {
      params: { query },
      signal: options?.signal,
    });
    return response.data;
  },

  discoverBooks: async (lang: string, options?: { signal?: AbortSignal }) => {
    const response = await api.get<BookContentDto[]>("/books/discover", {
      params: { lang },
      signal: options?.signal,
    });
    return response.data;
  },

  getBookDetail: async (id: string) => {
    const response = await api.get<BookContentDto>(`/books/${id}`);
    return response.data;
  },

  getLibrary: async () => {
    const response = await api.get<BookContentDto[]>("/books/library");
    return response.data;
  },

  trackBook: async (data: AddBookDto) => {
    const response = await api.post("/books", data);
    return response.data;
  },

  updateStatus: async (googleBookId: string, status: ReadStatus) => {
    const response = await api.put("/books/status", {
      googleBookId,
      status,
    });
    return response.data;
  },

  updateProgress: async (data: UpdateBookProgressDto) => {
    const response = await api.put("/books/progress", data);
    return response.data;
  },

  removeBook: async (id: string) => {
    const response = await api.delete(`/books/${id}`);
    return response.data;
  },

  rateBook: async (data: RateBookDto) => {
    const response = await api.put("/books/rating", data);
    return response.data;
  },

  reviewBook: async (data: ReviewBookDto) => {
    const response = await api.put("/books/review", data);
    return response.data;
  },
};
