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
  canViewProfile?: boolean;
  relationStatus?: FollowStatus | null;
  followPolicy?: FollowPolicy | null;
  profileVisibility?: ProfileVisibility | null;
  activityVisibility?: ActivityVisibility | null;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
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

export const ProfileVisibility = {
  Public: 0,
  FollowersOnly: 1,
  Private: 2,
} as const;
export type ProfileVisibility = (typeof ProfileVisibility)[keyof typeof ProfileVisibility];

export const ActivityVisibility = {
  OnlyMe: 0,
  Followers: 1,
  Public: 2,
} as const;
export type ActivityVisibility = (typeof ActivityVisibility)[keyof typeof ActivityVisibility];

export interface UpdateProfileDto {
  username: string;
  bio?: string;
  location?: string;
}

export interface UpdatePreferencesDto {
  profileVisibility: ProfileVisibility;
  activityVisibility: ActivityVisibility;
  followPolicy: FollowPolicy;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}
