import type {
  FeedItemDto,
  FeedStatsDto,
  FeedViewerStateDto,
} from "@/features/feed/types";

const POST_UPDATED_EVENT = "vivaply:post-updated";

export interface PostUpdatePayload {
  postId?: string;
  stats?: Partial<FeedStatsDto>;
  viewer?: Partial<FeedViewerStateDto>;
  remove?: boolean;
  createdPost?: FeedItemDto;
}

export function publishPostUpdate(payload: PostUpdatePayload) {
  window.dispatchEvent(
    new CustomEvent<PostUpdatePayload>(POST_UPDATED_EVENT, { detail: payload }),
  );
}

export function subscribeToPostUpdates(
  handler: (payload: PostUpdatePayload) => void,
) {
  const listener = (event: Event) => {
    handler((event as CustomEvent<PostUpdatePayload>).detail);
  };

  window.addEventListener(POST_UPDATED_EVENT, listener);

  return () => window.removeEventListener(POST_UPDATED_EVENT, listener);
}

export function applyPostUpdateToList(
  items: FeedItemDto[],
  update: PostUpdatePayload,
): FeedItemDto[] {
  let changed = false;
  let nextItems = items;

  if (update.createdPost && !items.some((item) => item.id === update.createdPost?.id)) {
    nextItems = [update.createdPost, ...items];
    changed = true;
  }

  if (!update.postId) {
    return changed ? nextItems : items;
  }

  nextItems = nextItems.flatMap((item) => {
    if (update.remove && item.id == update.postId) {
      changed = true;
      return [];
    }

    const nextItem = applyPostUpdate(item, update);
    changed ||= nextItem !== item;
    return [nextItem];
  });

  return changed ? nextItems : items;
}

export function applyPostUpdate(
  item: FeedItemDto,
  update: PostUpdatePayload,
): FeedItemDto {
  if (!update.postId) {
    return item;
  }

  const children = item.children
    ? applyPostUpdateToList(item.children, update)
    : item.children;
  const replies = item.replies
    ? applyPostUpdateToList(item.replies, update)
    : item.replies;
  const nestedChanged = children !== item.children || replies !== item.replies;

  if (item.id !== update.postId) {
    return nestedChanged ? { ...item, children, replies } : item;
  }

  return {
    ...item,
    stats: update.stats ? { ...item.stats, ...update.stats } : item.stats,
    viewer: update.viewer ? { ...item.viewer, ...update.viewer } : item.viewer,
    children,
    replies,
  };
}
