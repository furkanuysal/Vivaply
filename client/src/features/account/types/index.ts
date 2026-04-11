export interface UserProfileDto {
  id: string;
  username: string;
  email: string;
  bio?: string;
  location?: string;
  avatarUrl?: string;
  level?: number;
  xp?: number;
  totalXp?: number;
  money?: number;
  currentStreak?: number;
  isCurrentUser?: boolean;
  relationStatus?: FollowStatus | null;
  followPolicy?: FollowPolicy | null;
  isFollowingCurrentUser?: boolean;
  followersCount?: number;
  followingCount?: number;
}

export interface FollowUserDto {
  id: string;
  username: string;
  avatarUrl?: string;
  isFollowingCurrentUser?: boolean;
}

export const FollowStatus = {
  Pending: 0,
  Accepted: 1,
  Rejected: 2,
} as const;
export type FollowStatus = (typeof FollowStatus)[keyof typeof FollowStatus];

export const FollowPolicy = {
  AutoAccept: 0,
  RequestOnly: 1,
  Disabled: 2,
} as const;
export type FollowPolicy = (typeof FollowPolicy)[keyof typeof FollowPolicy];

export interface UpdateProfileDto {
  username: string;
  bio?: string;
  location?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}
