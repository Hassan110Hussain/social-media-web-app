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
