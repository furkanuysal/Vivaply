// Book Read Status
export const ReadStatus = {
  None: 0,
  PlanToRead: 1, // Okuyacağım
  Reading: 2, // Okuyorum
  Completed: 3, // Bitti
  OnHold: 4, // Ara Verdim
  Dropped: 5, // Yarım Bıraktım
} as const;
export type ReadStatus = (typeof ReadStatus)[keyof typeof ReadStatus];

// Book Content (Same as Backend DTO)
export interface BookContentDto {
  id: string; // Google Book ID (String value)
  title: string;
  authors: string[];
  coverUrl?: string;
  description?: string;
  pageCount: number;
  publishedDate?: string;
  averageRating: number;

  // User data
  userStatus: ReadStatus;
  currentPage: number;
  userRating?: number;
  userReview?: string;
}

// Book Add Request
export interface AddBookDto {
  googleBookId: string;
  title: string;
  authors: string[];
  coverUrl?: string;
  pageCount: number;
  status: ReadStatus;
}

// Update Book Progress
export interface UpdateBookProgressDto {
  googleBookId: string;
  currentPage: number;
}

export interface RateBookDto {
  googleBookId: string;
  rating: number;
}

export interface ReviewBookDto {
  googleBookId: string;
  review: string;
}
