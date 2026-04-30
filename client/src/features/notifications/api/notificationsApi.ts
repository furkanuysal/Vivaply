import api from "@/shared/lib/api";
import type {
  NotificationListDto,
  NotificationUnreadCountDto,
} from "@/features/notifications/types";

export const notificationsApi = {
  async getNotifications(unreadOnly = false): Promise<NotificationListDto> {
    const response = await api.get<NotificationListDto>("/notifications", {
      params: unreadOnly ? { unreadOnly: true } : undefined,
    });

    return response.data;
  },

  async getUnreadCount(): Promise<NotificationUnreadCountDto> {
    const response = await api.get<NotificationUnreadCountDto>("/notifications/unread-count");
    return response.data;
  },

  async markAsRead(notificationId: string): Promise<void> {
    await api.post(`/notifications/${notificationId}/read`);
  },

  async markAllAsRead(): Promise<number> {
    const response = await api.post<{ updatedCount: number }>("/notifications/mark-all-read");
    return response.data.updatedCount ?? 0;
  },
};
