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
}

export interface UpdateProfileDto {
  username: string;
  bio?: string;
  location?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}
