import api from "@/shared/lib/api";
import type {
  ChangePasswordDto,
  FollowUserDto,
  UpdatePreferencesDto,
  UpdateProfileDto,
  UserProfileDto,
} from "@/features/account/types";

export const accountApi = {
  updateProfile: async (data: UpdateProfileDto) => {
    const response = await api.put("/Account/profile", data);
    return response.data;
  },

  changePassword: async (data: ChangePasswordDto) => {
    const response = await api.put("/Account/password", data);
    return response.data;
  },

  updatePreferences: async (data: UpdatePreferencesDto) => {
    const response = await api.put("/Account/preferences", data);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get<UserProfileDto>("/Account");
    return response.data;
  },

  getProfileByUsername: async (username: string) => {
    const response = await api.get<UserProfileDto>(`/users/${username}`);
    return response.data;
  },

  followUser: async (targetUserId: string) => {
    await api.post(`/users/${targetUserId}/follow`);
  },

  unfollowUser: async (targetUserId: string) => {
    await api.delete(`/users/${targetUserId}/follow`);
  },

  acceptFollowRequest: async (requesterId: string) => {
    await api.put(`/users/${requesterId}/follow/accept`);
  },

  rejectFollowRequest: async (requesterId: string) => {
    await api.put(`/users/${requesterId}/follow/reject`);
  },

  getFollowers: async (userId: string) => {
    const response = await api.get<FollowUserDto[]>(`/users/${userId}/followers`);
    return response.data;
  },

  getFollowing: async (userId: string) => {
    const response = await api.get<FollowUserDto[]>(`/users/${userId}/following`);
    return response.data;
  },

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<{ avatarUrl: string }>(
      "/Account/avatar",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },

  deleteAccount: async () => {
    const response = await api.delete("/Account");
    return response.data;
  },
};
