import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "./currentUser";

export async function deletePost(postId: string) {
  const user = await getCurrentUser();

  // First verify the post belongs to the current user
  const { data: post, error: fetchError } = await supabase
    .from("posts")
    .select("user_id")
    .eq("id", postId)
    .single();

  if (fetchError) {
    throw new Error(fetchError.message || "Post not found");
  }

  if (post.user_id !== user.id) {
    throw new Error("You can only delete your own posts");
  }

  // Delete the post (cascade should handle likes and comments)
  const { error: deleteError } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("user_id", user.id);

  if (deleteError) {
    throw new Error(deleteError.message || "Failed to delete post");
  }
}
