import { supabase } from "./supabase";
import { getCurrentUser } from "./posts";

/**
 * Follow a user
 */
export async function followUser(followingId: string): Promise<void> {
  const user = await getCurrentUser();

  if (user.id === followingId) {
    throw new Error("You cannot follow yourself");
  }

  const { error } = await supabase.from("follows").insert({
    follower_id: user.id,
    following_id: followingId,
  });

  if (error) {
    // If it's a unique constraint violation, the user is already following
    if (error.code === "23505") {
      return; // Already following, no error
    }
    throw new Error(error.message);
  }
}

/**
 * Unfollow a user
 */
export async function unfollowUser(followingId: string): Promise<void> {
  const user = await getCurrentUser();

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", followingId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Toggle follow status (follow if not following, unfollow if following)
 */
export async function toggleFollowUser(followingId: string): Promise<boolean> {
  const user = await getCurrentUser();

  // Check if already following
  const { data: existingFollow } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", followingId)
    .maybeSingle();

  if (existingFollow) {
    await unfollowUser(followingId);
    return false; // Now unfollowed
  } else {
    await followUser(followingId);
    return true; // Now following
  }
}

/**
 * Check if current user is following a specific user
 */
export async function isFollowing(followingId: string): Promise<boolean> {
  const user = await getCurrentUser();

  const { data } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", followingId)
    .maybeSingle();

  return !!data;
}

/**
 * Get list of user IDs that the current user is following
 */
export async function getFollowingIds(): Promise<string[]> {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  return data?.map((row) => row.following_id) ?? [];
}

/**
 * Get list of user IDs that are following the current user
 */
export async function getFollowerIds(): Promise<string[]> {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("following_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  return data?.map((row) => row.follower_id) ?? [];
}

/**
 * Get follow count for a user (how many users they follow)
 */
export async function getFollowingCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

/**
 * Get follower count for a user (how many users follow them)
 */
export async function getFollowerCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

/**
 * Get list of user IDs that the users you follow are following (2nd level)
 * @param directFollowingIds - Array of user IDs that the current user directly follows
 * @returns Array of user IDs (2nd level follows)
 */
export async function getSecondLevelFollowingIds(directFollowingIds: string[]): Promise<string[]> {
  if (directFollowingIds.length === 0) return [];

  const { data, error } = await supabase
    .from("follows")
    .select("following_id")
    .in("follower_id", directFollowingIds);

  if (error) {
    throw new Error(error.message);
  }

  return [...new Set(data?.map((row) => row.following_id) ?? [])];
}
