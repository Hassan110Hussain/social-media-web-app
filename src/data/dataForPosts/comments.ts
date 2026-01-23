import { supabase } from "@/lib/supabase";
import type { Comment } from "@/types/api";
import { getCurrentUser, ensureUserRowExists } from "./currentUser";

export async function createComment(postId: string, content: string) {
  const user = await getCurrentUser();
  await ensureUserRowExists();

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    user_id: user.id,
    content,
  });

  if (error) {
    throw new Error(error.message);
  }

  // After comment insert succeeds, create notification if post owner is different
  const { data: post } = await supabase
    .from("posts")
    .select("user_id")
    .eq("id", postId)
    .single();

  if (post && post.user_id !== user.id) {
    await supabase.from("notifications").insert({
      user_id: post.user_id, // receiver
      actor_id: user.id, // who commented
      post_id: postId,
      type: "comment",
    });
  }
}

export async function fetchComments(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select(`
      id,
      content,
      created_at,
      post_id,
      user_id,
      users(username, avatar_url)
    `)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return [];

  return data.map((comment: any) => {
    // Handle users as object or array (Supabase can return either)
    let userData: { username: string; avatar_url: string | null } | null = null;
    
    if (comment.users) {
      if (Array.isArray(comment.users) && comment.users.length > 0) {
        const firstUser = comment.users[0] as { username?: string; avatar_url?: string | null };
        userData = {
          username: firstUser.username || "user",
          avatar_url: firstUser.avatar_url || null,
        };
      } else if (typeof comment.users === "object" && "username" in comment.users) {
        const userObj = comment.users as { username?: string; avatar_url?: string | null };
        userData = {
          username: userObj.username || "user",
          avatar_url: userObj.avatar_url || null,
        };
      }
    }

    return {
      id: comment.id,
      content: comment.content,
      created_at: comment.created_at,
      post_id: comment.post_id,
      user_id: comment.user_id,
      users: userData || {
        username: "user",
        avatar_url: null,
      },
    };
  });
}
