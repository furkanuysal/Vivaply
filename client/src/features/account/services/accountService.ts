import api from "@/lib/api";
import type {
  UpdateProfileDto,
  ChangePasswordDto,
  UserProfileDto,
} from "@/features/account/types";

export const accountService = {
  // Update Profile (Bio, Location etc.)
  updateProfile: async (data: UpdateProfileDto) => {
    const response = await api.put("/Account/profile", data);
    return response.data;
  },

  // Change Password
  changePassword: async (data: ChangePasswordDto) => {
    const response = await api.put("/Account/password", data);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get<UserProfileDto>("/Account");
    return response.data;
  },

  // Upload Avatar (Special Case: FormData)
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

  // Delete Account
  deleteAccount: async () => {
    const response = await api.delete("/Account");
    return response.data;
  },
};
