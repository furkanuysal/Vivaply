import api from "@/lib/api";
import type {
  BookContentDto,
  AddBookDto,
  ReadStatus,
  UpdateBookProgressDto,
  ReviewBookDto,
  RateBookDto,
} from "@/features/knowledge/types";

export const bookService = {
  // Search books
  searchBooks: async (query: string, options?: { signal?: AbortSignal }) => {
    const response = await api.get<BookContentDto[]>("/books/search", {
      params: { query },
      signal: options?.signal,
    });
    return response.data;
  },

  // Discover books
  discoverBooks: async (lang: string, options?: { signal?: AbortSignal }) => {
    const response = await api.get<BookContentDto[]>("/books/discover", {
      params: { lang },
      signal: options?.signal,
    });
    return response.data;
  },

  // Get book detail
  getBookDetail: async (id: string) => {
    const response = await api.get<BookContentDto>(`/books/${id}`);
    return response.data;
  },

  // Get library
  getLibrary: async () => {
    const response = await api.get<BookContentDto[]>("/books/library");
    return response.data;
  },

  // Add book (Track)
  trackBook: async (data: AddBookDto) => {
    const response = await api.post("/books", data);
    return response.data;
  },

  // Update status
  updateStatus: async (googleBookId: string, status: ReadStatus) => {
    const response = await api.put("/books/status", {
      googleBookId,
      status,
    });
    return response.data;
  },

  // Update progress
  updateProgress: async (data: UpdateBookProgressDto) => {
    const response = await api.put("/books/progress", data);
    return response.data;
  },

  // Remove book
  removeBook: async (id: string) => {
    const response = await api.delete(`/books/${id}`);
    return response.data;
  },

  // Rate book
  rateBook: async (data: RateBookDto) => {
    const response = await api.put("/books/rating", data);
    return response.data;
  },

  // Review book
  reviewBook: async (data: ReviewBookDto) => {
    const response = await api.put("/books/review", data);
    return response.data;
  },
};
