import api from "../../../lib/api";
import type {
  BookContentDto,
  AddBookDto,
  ReadStatus,
  UpdateBookProgressDto,
  ReviewBookDto,
  RateBookDto,
} from "../types";

export const booksService = {
  // Search books
  searchBooks: async (query: string, options?: { signal?: AbortSignal }) => {
    const response = await api.get<BookContentDto[]>(
      `/Knowledge/books/search?query=${query}`,
      { signal: options?.signal }
    );
    return response.data;
  },

  // Get book detail
  getBookDetail: async (id: string) => {
    const response = await api.get<BookContentDto>(`/Knowledge/books/${id}`);
    return response.data;
  },

  // Get library
  getLibrary: async () => {
    const response = await api.get<BookContentDto[]>(
      "/Knowledge/books/library"
    );
    return response.data;
  },

  // Add book (Track)
  trackBook: async (data: AddBookDto) => {
    const response = await api.post("/Knowledge/books/track", data);
    return response.data;
  },

  // Update status
  updateStatus: async (googleBookId: string, status: ReadStatus) => {
    const response = await api.put("/Knowledge/books/status", {
      googleBookId,
      status,
    });
    return response.data;
  },

  // Update progress
  updateProgress: async (data: UpdateBookProgressDto) => {
    const response = await api.put("/Knowledge/books/progress", data);
    return response.data;
  },

  // Remove book
  removeBook: async (id: string) => {
    const response = await api.delete(`/Knowledge/books/remove/${id}`);
    return response.data;
  },

  // Rate book
  rateBook: async (data: RateBookDto) => {
    const response = await api.put("/Knowledge/books/rating", data);
    return response.data;
  },

  // Review book
  reviewBook: async (data: ReviewBookDto) => {
    const response = await api.put("/Knowledge/books/review", data);
    return response.data;
  },
};
