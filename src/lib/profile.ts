import { supabase } from "./supabase";
import { getCurrentUser } from "./posts";
import type { UserProfile } from "@/types/api";
import { getFollowingCount, getFollowerCount, isFollowing } from "./follows";

/**
 * Fetch user profile data by user ID
 */
export async function fetchUserProfile(userId: string): Promise<UserProfile & { 
  followingCount: number; 
  followerCount: number; 
  isFollowing: boolean;
  isOwnProfile: boolean;
}> {
  const currentUser = await getCurrentUser();

  // Fetch user profile
  const { data: profile, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!profile) {
    throw new Error("User profile not found");
  }

  // Get follow counts
  const [followingCount, followerCount, isFollowingUser] = await Promise.all([
    getFollowingCount(userId),
    getFollowerCount(userId),
    userId !== currentUser.id ? isFollowing(userId) : Promise.resolve(false),
  ]);

  return {
    ...profile,
    followingCount,
    followerCount,
    isFollowing: isFollowingUser,
    isOwnProfile: userId === currentUser.id,
  };
}

/**
 * Fetch current user's own profile
 */
export async function fetchCurrentUserProfile(): Promise<UserProfile & { 
  followingCount: number; 
  followerCount: number; 
  isFollowing: boolean;
  isOwnProfile: boolean;
}> {
  const currentUser = await getCurrentUser();
  return fetchUserProfile(currentUser.id);
}

/**
 * Update user profile
 */
export async function updateUserProfile(updates: {
  username?: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  avatar_url?: string | null;
  date_of_birth?: string;
}): Promise<void> {
  const user = await getCurrentUser();

  const { error } = await supabase
    .from("users")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    throw new Error(error.message);
  }
}
