import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "./currentUser";

export async function likePost(postId: string) {
  const user = await getCurrentUser();

  // Check if already liked
  const { data: existingLike } = await supabase
    .from("likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .single();

  if (existingLike) {
    // Already liked, do nothing
    return;
  }

  const { error } = await supabase.from("likes").insert({
    post_id: postId,
    user_id: user.id,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function unlikePost(postId: string) {
  const user = await getCurrentUser();

  const { error } = await supabase
    .from("likes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function toggleLikePost(postId: string): Promise<boolean> {
  const user = await getCurrentUser();

  // Check if already liked
  const { data: existingLike } = await supabase
    .from("likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .single();

  if (existingLike) {
    // Unlike
    await unlikePost(postId);
    return false;
  } else {
    // Like
    await likePost(postId);
    return true;
  }
}
