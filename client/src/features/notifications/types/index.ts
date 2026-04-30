export interface NotificationActorDto {
  id: string;
  username: string;
  avatarUrl?: string | null;
}

export interface NotificationItemDto {
  id: string;
  type: "follow" | "like" | "reply" | "quote" | "mention" | string;
  category: "social" | "system" | "message" | string;
  isRead: boolean;
  createdAt: string;
  actor?: NotificationActorDto | null;
  postId?: string | null;
  postPreview?: string | null;
}

export interface NotificationListDto {
  items: NotificationItemDto[];
  unreadCount: number;
}

export interface NotificationUnreadCountDto {
  count: number;
}

export type NotificationTab = "all" | "unread";
