import type { Post, SupabaseUser, SupabasePostRow } from "@/types/api";

export function formatTimeAgo(isoDate: string): string {
  const created = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;

  const years = Math.floor(days / 365);
  return `${years}y`;
}

// Helper function to capitalize first letter of each word
export function capitalizeName(name: string | null | undefined): string {
  if (!name) return "";
  return name
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/** Resolve the post author from users (Supabase returns many-to-one as object, not array). */
export function resolvePostAuthor(post: SupabasePostRow): SupabaseUser | null {
  const raw = post.users;
  const authorId = post.user_id;
  if (!raw) return null;
  if (Array.isArray(raw) && raw.length > 0) {
    const match = authorId ? raw.find((u) => u.id === authorId) : null;
    return match ?? (raw[0] as SupabaseUser);
  }
  if (typeof raw === "object" && "id" in raw) {
    const u = raw as unknown as SupabaseUser;
    return !authorId || u.id === authorId ? u : null;
  }
  return null;
}

/** Check if a post has usable user data (object or array form). */
export function hasPostAuthorData(post: { users?: unknown; user_id?: string }): boolean {
  const u = post.users;
  if (u == null) return false;
  if (Array.isArray(u)) return u.length > 0;
  return typeof u === "object" && "id" in u;
}

export function mapSupabasePostToUi(post: SupabasePostRow, isFollowing: boolean = false): Post {
  const user = resolvePostAuthor(post);

  if (!user) {
    console.warn("Post missing user data:", post.id);
  } else if (!user.username && !user.first_name && !user.last_name) {
    console.warn("Post user data incomplete:", post.id, user);
  }

  const likesCount = post.likes?.[0]?.count ?? 0;
  const commentsCount = post.comments?.[0]?.count ?? 0;
  const sharesCount = post.shares?.[0]?.count ?? 0;

  let displayName: string;
  if (user?.first_name && user?.last_name) {
    displayName = `${capitalizeName(user.first_name)} ${capitalizeName(user.last_name)}`;
  } else if (user?.first_name) {
    displayName = capitalizeName(user.first_name);
  } else if (user?.last_name) {
    displayName = capitalizeName(user.last_name);
  } else if (user?.username) {
    displayName = capitalizeName(user.username);
  } else {
    displayName = "User";
  }

  const handle = user?.username ? `@${user.username}` : "@user";
  const avatarUrl = user?.avatar_url?.trim() ? user.avatar_url : "";
  const isLiked = !!(post.user_liked && post.user_liked.length > 0);
  const isShared = !!(post.user_shared && post.user_shared.length > 0);
  const isSaved = !!(post.user_saved && post.user_saved.length > 0);

  return {
    id: post.id,
    author: displayName,
    handle,
    avatarUrl,
    imageUrl: post.image_url ?? "",
    liked: isLiked,
    likes: likesCount,
    comments: commentsCount,
    shares: sharesCount,
    shared: isShared,
    saved: isSaved,
    timeAgo: formatTimeAgo(post.created_at),
    caption: post.content,
    following: isFollowing,
    userId: post.user_id || "",
  };
}
