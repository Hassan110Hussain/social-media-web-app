import { supabase } from "@/lib/supabase";
import type { Post, SupabaseUser, SupabasePostRow } from "@/types/api";
import { getCurrentUser } from "./currentUser";
import { getFollowingIds } from "@/lib/follows";
import { hasPostAuthorData, mapSupabasePostToUi } from "./utils";

/**
 * Helper function to fetch user data fallback if join fails
 */
async function fetchUserDataFallback(userIds: string[]): Promise<Map<string, SupabaseUser>> {
  if (userIds.length === 0) return new Map();

  const { data: usersData, error: usersError } = await supabase
    .from("users")
    .select("id, username, first_name, last_name, avatar_url")
    .in("id", userIds);

  if (usersError || !usersData || usersData.length === 0) {
    return new Map();
  }

  return new Map(usersData.map((u) => [u.id, u]));
}

/**
 * Helper function to apply user data fallback to posts
 */
function applyUserDataFallback(
  postsData: any[],
  usersMap: Map<string, SupabaseUser>
): void {
  postsData.forEach((post) => {
    if (!hasPostAuthorData(post as { users?: unknown; user_id?: string })) {
      const userData = usersMap.get(post.user_id);
      if (userData) (post as { users?: SupabaseUser[] }).users = [userData];
    }
  });
}

/**
 * Helper function to fetch user interactions (likes, shares, saved)
 */
async function fetchUserInteractions(userId: string) {
  const [likesResult, sharesResult, savedResult] = await Promise.all([
    supabase.from("likes").select("post_id").eq("user_id", userId),
    supabase.from("shares").select("post_id").eq("user_id", userId),
    supabase.from("saved_posts").select("post_id").eq("user_id", userId),
  ]);

  if (likesResult.error) throw new Error(likesResult.error.message);
  if (sharesResult.error) throw new Error(sharesResult.error.message);
  if (savedResult.error) throw new Error(savedResult.error.message);

  return {
    likedPostIds: new Set(likesResult.data?.map((like) => like.post_id) ?? []),
    sharedPostIds: new Set(sharesResult.data?.map((share) => share.post_id) ?? []),
    savedPostIds: new Set(savedResult.data?.map((saved) => saved.post_id) ?? []),
  };
}

/**
 * Helper function to map posts with user interactions
 */
function mapPostsWithInteractions(
  postsData: Omit<SupabasePostRow, "user_liked" | "user_shared" | "user_saved">[],
  likedPostIds: Set<string>,
  sharedPostIds: Set<string>,
  savedPostIds: Set<string>,
  followingIds: Set<string>
): Post[] {
  return postsData.map((post) => {
    const postWithLikedAndShared: SupabasePostRow = {
      ...post,
      user_liked: likedPostIds.has(post.id) ? [{ id: "" }] : null,
      user_shared: sharedPostIds.has(post.id) ? [{ id: "" }] : null,
      user_saved: savedPostIds.has(post.id) ? [{ id: "" }] : null,
    };
    const isFollowing = post.user_id ? followingIds.has(post.user_id) : false;
    return mapSupabasePostToUi(postWithLikedAndShared, isFollowing);
  });
}

export async function fetchFeedPosts(): Promise<Post[]> {
  const user = await getCurrentUser();

  // Fetch all posts with user data
  // Try with explicit foreign key relationship first
  let postsData: any[] | null = null;
  let postsError: any = null;

  // First attempt: Try with explicit foreign key name
  const query1 = supabase
    .from("posts")
    .select(
      `
      id,
      content,
      image_url,
      created_at,
      user_id,
      users!posts_user_id_fkey (
        id,
        username,
        first_name,
        last_name,
        avatar_url
      ),
      likes:likes(count),
      comments:comments(count),
      shares:shares(count)
    `
    )
    .order("created_at", { ascending: false });

  const result1 = await query1;
  const firstHasUser = result1.data?.[0] && hasPostAuthorData(result1.data[0] as { users?: unknown; user_id?: string });

  if (!result1.error && result1.data && result1.data.length > 0 && firstHasUser) {
    postsData = result1.data;
    postsError = null;
  } else {
    // Second attempt: Try without explicit foreign key name
    const query2 = supabase
      .from("posts")
      .select(
        `
        id,
        content,
        image_url,
        created_at,
        user_id,
        users (
          id,
          username,
          first_name,
          last_name,
          avatar_url
        ),
        likes:likes(count),
        comments:comments(count),
        shares:shares(count)
      `
      )
      .order("created_at", { ascending: false });

    const result2 = await query2;
    postsData = result2.data;
    postsError = result2.error;
    
    const firstHasUser2 = postsData?.[0] && hasPostAuthorData(postsData[0] as { users?: unknown; user_id?: string });
    if (!postsError && postsData && postsData.length > 0 && !firstHasUser2) {
      console.warn("Both query attempts failed to fetch user data via join");
    }
  }

  if (postsError) {
    console.error("Error fetching posts:", postsError);
    throw new Error(postsError.message);
  }

  if (!postsData) return [];

  // Apply fallback for user data if needed
  const needsFallback = postsData.length > 0 && postsData.some((p) => !hasPostAuthorData(p as { users?: unknown; user_id?: string }));
  if (needsFallback) {
    const userIds = [...new Set(postsData.map((p) => p.user_id).filter(Boolean))];
    if (userIds.length > 0) {
      const usersMap = await fetchUserDataFallback(userIds);
      applyUserDataFallback(postsData, usersMap);
    }
  }

  // Fetch user interactions
  const { likedPostIds, sharedPostIds, savedPostIds } = await fetchUserInteractions(user.id);

  // Get following IDs to mark posts as following
  let followingIds: Set<string> = new Set();
  try {
    const following = await getFollowingIds();
    followingIds = new Set(following);
  } catch (error) {
    console.warn("Failed to fetch following IDs:", error);
  }

  // Map posts and mark which ones are liked, shared, and saved
  return mapPostsWithInteractions(
    postsData as Omit<SupabasePostRow, "user_liked" | "user_shared" | "user_saved">[],
    likedPostIds,
    sharedPostIds,
    savedPostIds,
    followingIds
  );
}

/**
 * Fetch posts for "For You" tab
 * Returns: User's own posts + posts from users they follow
 */
export async function fetchForYouPosts(): Promise<Post[]> {
  const user = await getCurrentUser();

  // Get list of users the current user is following
  const followingIds = await getFollowingIds();
  
  // Include current user's ID in the list (so we get their own posts too)
  const userIdsToShow = [...new Set([user.id, ...followingIds])];

  // Fetch posts from these users
  let postsData: any[] | null = null;
  let postsError: any = null;

  const query = supabase
    .from("posts")
    .select(
      `
      id,
      content,
      image_url,
      created_at,
      user_id,
      users!posts_user_id_fkey (
        id,
        username,
        first_name,
        last_name,
        avatar_url
      ),
      likes:likes(count),
      comments:comments(count),
      shares:shares(count)
    `
    )
    .in("user_id", userIdsToShow)
    .order("created_at", { ascending: false });

  const result = await query;
  postsData = result.data;
  postsError = result.error;

  if (postsError) {
    console.error("Error fetching For You posts:", postsError);
    throw new Error(postsError.message);
  }

  if (!postsData) return [];

  // Apply fallback for user data if needed
  const needsFallback = postsData.length > 0 && postsData.some((p) => !hasPostAuthorData(p as { users?: unknown; user_id?: string }));
  if (needsFallback) {
    const userIds = [...new Set(postsData.map((p) => p.user_id).filter(Boolean))];
    if (userIds.length > 0) {
      const usersMap = await fetchUserDataFallback(userIds);
      applyUserDataFallback(postsData, usersMap);
    }
  }

  // Fetch user interactions
  const { likedPostIds, sharedPostIds, savedPostIds } = await fetchUserInteractions(user.id);

  // Create set of following IDs
  const followingIdsSet = new Set(followingIds);

  // Map posts
  return mapPostsWithInteractions(
    postsData as Omit<SupabasePostRow, "user_liked" | "user_shared" | "user_saved">[],
    likedPostIds,
    sharedPostIds,
    savedPostIds,
    followingIdsSet
  );
}

/**
 * Fetch posts for "Following" tab
 * Returns: Only posts from users the current user follows (excludes own posts)
 */
export async function fetchFollowingPosts(): Promise<Post[]> {
  const user = await getCurrentUser();

  // Get list of users the current user is following
  const followingIds = await getFollowingIds();

  // If not following anyone, return empty array
  if (followingIds.length === 0) {
    return [];
  }

  // Fetch posts only from followed users (exclude own posts)
  let postsData: any[] | null = null;
  let postsError: any = null;

  const query = supabase
    .from("posts")
    .select(
      `
      id,
      content,
      image_url,
      created_at,
      user_id,
      users!posts_user_id_fkey (
        id,
        username,
        first_name,
        last_name,
        avatar_url
      ),
      likes:likes(count),
      comments:comments(count),
      shares:shares(count)
    `
    )
    .in("user_id", followingIds)
    .order("created_at", { ascending: false });

  const result = await query;
  postsData = result.data;
  postsError = result.error;

  if (postsError) {
    console.error("Error fetching Following posts:", postsError);
    throw new Error(postsError.message);
  }

  if (!postsData) return [];

  // Apply fallback for user data if needed
  const needsFallback = postsData.length > 0 && postsData.some((p) => !hasPostAuthorData(p as { users?: unknown; user_id?: string }));
  if (needsFallback) {
    const userIds = [...new Set(postsData.map((p) => p.user_id).filter(Boolean))];
    if (userIds.length > 0) {
      const usersMap = await fetchUserDataFallback(userIds);
      applyUserDataFallback(postsData, usersMap);
    }
  }

  // Fetch user interactions
  const { likedPostIds, sharedPostIds, savedPostIds } = await fetchUserInteractions(user.id);

  // Create set of following IDs (all posts here are from followed users)
  const followingIdsSet = new Set(followingIds);

  // Map posts (all posts here are from followed users, so isFollowing is always true)
  return (postsData as Omit<SupabasePostRow, "user_liked" | "user_shared" | "user_saved">[]).map((post) => {
    const postWithLikedAndShared: SupabasePostRow = {
      ...post,
      user_liked: likedPostIds.has(post.id) ? [{ id: "" }] : null,
      user_shared: sharedPostIds.has(post.id) ? [{ id: "" }] : null,
      user_saved: savedPostIds.has(post.id) ? [{ id: "" }] : null,
    };
    const isFollowing = post.user_id ? followingIdsSet.has(post.user_id) : true; // All posts here are from followed users
    return mapSupabasePostToUi(postWithLikedAndShared, isFollowing);
  });
}

/**
 * Fetch posts for "Explore" page
 * Returns: All posts from all users (global content)
 */
export async function fetchExplorePosts(): Promise<Post[]> {
  const user = await getCurrentUser();

  // Fetch ALL posts (no filtering)
  let postsData: any[] | null = null;
  let postsError: any = null;

  const query = supabase
    .from("posts")
    .select(
      `
      id,
      content,
      image_url,
      created_at,
      user_id,
      users!posts_user_id_fkey (
        id,
        username,
        first_name,
        last_name,
        avatar_url
      ),
      likes:likes(count),
      comments:comments(count),
      shares:shares(count)
    `
    )
    .order("created_at", { ascending: false });

  const result = await query;
  postsData = result.data;
  postsError = result.error;

  if (postsError) {
    console.error("Error fetching Explore posts:", postsError);
    throw new Error(postsError.message);
  }

  if (!postsData) return [];

  // Apply fallback for user data if needed
  const needsFallback = postsData.length > 0 && postsData.some((p) => !hasPostAuthorData(p as { users?: unknown; user_id?: string }));
  if (needsFallback) {
    const userIds = [...new Set(postsData.map((p) => p.user_id).filter(Boolean))];
    if (userIds.length > 0) {
      const usersMap = await fetchUserDataFallback(userIds);
      applyUserDataFallback(postsData, usersMap);
    }
  }

  // Fetch user interactions
  const { likedPostIds, sharedPostIds, savedPostIds } = await fetchUserInteractions(user.id);

  // Get following IDs to mark posts as following
  let followingIds: Set<string> = new Set();
  try {
    const following = await getFollowingIds();
    followingIds = new Set(following);
  } catch (error) {
    console.warn("Failed to fetch following IDs:", error);
  }

  // Map posts
  return mapPostsWithInteractions(
    postsData as Omit<SupabasePostRow, "user_liked" | "user_shared" | "user_saved">[],
    likedPostIds,
    sharedPostIds,
    savedPostIds,
    followingIds
  );
}

/**
 * Fetch posts for a specific user's profile
 * Returns: All posts by that user
 */
export async function fetchUserPosts(userId: string): Promise<Post[]> {
  const user = await getCurrentUser();

  // Fetch posts from the specified user
  let postsData: any[] | null = null;
  let postsError: any = null;

  const query = supabase
    .from("posts")
    .select(
      `
      id,
      content,
      image_url,
      created_at,
      user_id,
      users!posts_user_id_fkey (
        id,
        username,
        first_name,
        last_name,
        avatar_url
      ),
      likes:likes(count),
      comments:comments(count),
      shares:shares(count)
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const result = await query;
  postsData = result.data;
  postsError = result.error;

  if (postsError) {
    console.error("Error fetching user posts:", postsError);
    throw new Error(postsError.message);
  }

  if (!postsData) return [];

  // Apply fallback for user data if needed
  const needsFallback = postsData.length > 0 && postsData.some((p) => !hasPostAuthorData(p as { users?: unknown; user_id?: string }));
  if (needsFallback) {
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("id, username, first_name, last_name, avatar_url")
      .eq("id", userId)
      .maybeSingle();

    if (!usersError && usersData) {
      postsData.forEach((post) => {
        if (!hasPostAuthorData(post as { users?: unknown; user_id?: string })) {
          (post as { users?: SupabaseUser[] }).users = [usersData];
        }
      });
    }
  }

  // Fetch user interactions
  const { likedPostIds, sharedPostIds, savedPostIds } = await fetchUserInteractions(user.id);

  // Check if current user is following this profile user
  let isFollowing = false;
  try {
    const followingIds = await getFollowingIds();
    isFollowing = followingIds.includes(userId);
  } catch (error) {
    console.warn("Failed to check follow status:", error);
  }

  // Map posts
  return (postsData as Omit<SupabasePostRow, "user_liked" | "user_shared" | "user_saved">[]).map((post) => {
    const postWithLikedAndShared: SupabasePostRow = {
      ...post,
      user_liked: likedPostIds.has(post.id) ? [{ id: "" }] : null,
      user_shared: sharedPostIds.has(post.id) ? [{ id: "" }] : null,
      user_saved: savedPostIds.has(post.id) ? [{ id: "" }] : null,
    };
    return mapSupabasePostToUi(postWithLikedAndShared, isFollowing);
  });
}
