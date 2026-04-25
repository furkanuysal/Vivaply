import type { FeedItemDto } from "@/features/feed/types";
import type { FollowStatus } from "@/features/account/types";

export interface SearchUserDto {
  id: string;
  username: string;
  avatarUrl?: string | null;
  bio?: string | null;
  isCurrentUser: boolean;
  relationStatus?: FollowStatus | null;
  isFollowingCurrentUser: boolean;
  followersCount: number;
  followingCount: number;
}

export interface SearchResponseDto {
  users: SearchUserDto[];
  posts: FeedItemDto[];
}

export type SearchTab = "users" | "posts";
