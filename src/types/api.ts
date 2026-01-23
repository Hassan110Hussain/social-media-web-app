export type FeedFilter = 'for-you' | 'following';

export type Post = {
  id: string;
  author: string;
  handle: string;
  avatarUrl: string;
  imageUrl: string;
  liked: boolean;
  likes: number;
  comments: number;
  shares: number;
  shared: boolean;
  saved: boolean;
  timeAgo: string;
  caption: string;
  following: boolean;
  userId: string;
};

export type SuggestedProfile = {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  isFollowing: boolean;
  reason: string;
};

// Auth types
export type Message = { type: 'success' | 'error'; text: string } | null;

// Dashboard component types
export type Board = {
  id: string;
  title: string;
  category: string;
  coverUrl: string;
  items: number;
  collaborators: number;
  updated: string;
  pinned?: boolean;
};

export type ChatMessage = {
  id: string;
  from: "you" | "them";
  text: string;
  time: string;
};

export type Chat = {
  id: string;
  name: string;
  handle: string;
  status: "online" | "offline";
  avatarUrl: string;
  lastActive: string;
  unread: number;
  messages: ChatMessage[];
};

export type ExploreItem = {
  id: string;
  title: string;
  category: string;
  tags: string[];
  description: string;
  coverUrl: string;
  gradient: string;
  likes: number;
  saves: number;
  views: number;
};

// Posts API types
export type CreatePostInput = {
  content: string;
  imageUrl?: string | null;
};

export type SupabaseUser = {
  id: string;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url: string | null;
};

export type SupabaseCountWrapper = {
  count: number | null;
};

export type SupabasePostRow = {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  user_id?: string;
  users?: SupabaseUser[];
  likes?: SupabaseCountWrapper[] | null;
  comments?: SupabaseCountWrapper[] | null;
  shares?: SupabaseCountWrapper[] | null;
  user_liked?: { id: string }[] | null;
  user_shared?: { id: string }[] | null;
  user_saved?: { id: string }[] | null;
};

// Comment types
export type Comment = {
  id: string;
  content: string;
  created_at: string;
  post_id: string;
  user_id: string;
  users: {
    username: string;
    avatar_url: string | null;
  };
};

// User profile types
export type UserProfile = {
  id: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  email?: string;
  date_of_birth?: string | null;
  avatar_url: string | null;
  bio?: string | null;
  created_at?: string;
  updated_at?: string;
};

// Notification types
export type NotificationType = 'like' | 'comment' | 'follow' | 'share';

export type Notification = {
  id: string;
  type: NotificationType;
  userId: string;
  userAvatar: string;
  userName: string;
  userHandle: string;
  postId?: string;
  postImageUrl?: string;
  commentContent?: string;
  timeAgo: string;
  is_read: boolean;
};

