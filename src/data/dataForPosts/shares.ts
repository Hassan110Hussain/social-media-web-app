import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "./currentUser";

export async function sharePost(postId: string) {
  const user = await getCurrentUser();

  // Check if already shared
  const { data: existingShare } = await supabase
    .from("shares")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .single();

  if (existingShare) {
    // Already shared, do nothing
    return;
  }

  const { error } = await supabase.from("shares").insert({
    post_id: postId,
    user_id: user.id,
  });

  if (error) {
    throw new Error(error.message);
  }

  // After share insert succeeds, create notification if post owner is different
  const { data: post } = await supabase
    .from("posts")
    .select("user_id")
    .eq("id", postId)
    .single();

  if (post && post.user_id !== user.id) {
    await supabase.from("notifications").insert({
      user_id: post.user_id, // receiver
      actor_id: user.id, // who shared
      post_id: postId,
      type: "share",
    });
  }
}

export async function unsharePost(postId: string) {
  const user = await getCurrentUser();

  const { error } = await supabase
    .from("shares")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function toggleSharePost(postId: string): Promise<boolean> {
  const user = await getCurrentUser();

  // Check if already shared
  const { data: existingShare } = await supabase
    .from("shares")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .single();

  if (existingShare) {
    // Unshare
    await unsharePost(postId);
    return false;
  } else {
    // Share
    await sharePost(postId);
    return true;
  }
}
