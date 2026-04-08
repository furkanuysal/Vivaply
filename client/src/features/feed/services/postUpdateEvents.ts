import type {
  FeedItemDto,
  FeedStatsDto,
  FeedViewerStateDto,
} from "@/features/feed/types";

const POST_UPDATED_EVENT = "vivaply:post-updated";

export interface PostUpdatePayload {
  postId: string;
  stats?: Partial<FeedStatsDto>;
  viewer?: Partial<FeedViewerStateDto>;
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

  const nextItems = items.map((item) => {
    const nextItem = applyPostUpdate(item, update);
    changed ||= nextItem !== item;
    return nextItem;
  });

  return changed ? nextItems : items;
}

export function applyPostUpdate(
  item: FeedItemDto,
  update: PostUpdatePayload,
): FeedItemDto {
  let changed = false;

  const children = item.children?.map((child) => {
    const nextChild = applyPostUpdate(child, update);
    changed ||= nextChild !== child;
    return nextChild;
  });

  const replies = item.replies?.map((reply) => {
    const nextReply = applyPostUpdate(reply, update);
    changed ||= nextReply !== reply;
    return nextReply;
  });

  if (item.id !== update.postId) {
    return changed ? { ...item, children, replies } : item;
  }

  return {
    ...item,
    stats: update.stats ? { ...item.stats, ...update.stats } : item.stats,
    viewer: update.viewer ? { ...item.viewer, ...update.viewer } : item.viewer,
    children,
    replies,
  };
}
