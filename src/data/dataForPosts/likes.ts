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

  // After like insert succeeds, create notification if post owner is different
  const { data: post } = await supabase
    .from("posts")
    .select("user_id")
    .eq("id", postId)
    .single();

  if (post && post.user_id !== user.id) {
    await supabase.from("notifications").insert({
      user_id: post.user_id, // receiver
      actor_id: user.id, // who liked
      post_id: postId,
      type: "like",
    });
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
