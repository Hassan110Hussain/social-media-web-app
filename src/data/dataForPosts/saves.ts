import { supabase } from "@/lib/supabase";
import type { Post, SupabaseUser, SupabasePostRow } from "@/types/api";
import { getCurrentUser } from "./currentUser";
import { hasPostAuthorData, mapSupabasePostToUi } from "@/lib/posts";

export async function savePost(postId: string) {
  const user = await getCurrentUser();

  // Check if already saved
  const { data: existingSave } = await supabase
    .from("saved_posts")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .single();

  if (existingSave) {
    // Already saved, do nothing
    return;
  }

  const { error } = await supabase.from("saved_posts").insert({
    post_id: postId,
    user_id: user.id,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function unsavePost(postId: string) {
  const user = await getCurrentUser();

  const { error } = await supabase
    .from("saved_posts")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function toggleSavePost(postId: string): Promise<boolean> {
  const user = await getCurrentUser();

  // Check if post is already saved
  const { data: existingSave } = await supabase
    .from("saved_posts")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .single();

  if (existingSave) {
    // Unsave the post
    await unsavePost(postId);
    return false;
  } else {
    // Save the post
    await savePost(postId);
    return true;
  }
}

export async function fetchSavedPosts(): Promise<Post[]> {
  const user = await getCurrentUser();

  // Fetch saved posts with related post and user data
  // Try with explicit foreign key first
  let savedPostsData: any[] | null = null;
  let savedPostsError: any = null;

  const query1 = supabase
    .from("saved_posts")
    .select(`
      post_id,
      created_at,
      posts!saved_posts_post_id_fkey(
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
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const result1 = await query1;

  if (!result1.error && result1.data && result1.data.length > 0) {
    savedPostsData = result1.data;
    savedPostsError = null;
  } else {
    // Second attempt: Try without explicit foreign key
    const query2 = supabase
      .from("saved_posts")
      .select(`
        post_id,
        created_at,
        posts(
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
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const result2 = await query2;
    savedPostsData = result2.data;
    savedPostsError = result2.error;
  }

  if (savedPostsError) {
    throw new Error(savedPostsError.message);
  }

  if (!savedPostsData || savedPostsData.length === 0) {
    return [];
  }

  // Extract post IDs and flatten posts
  const posts: any[] = [];
  const postIds: string[] = [];

  savedPostsData.forEach((savedPost: any) => {
    const post = savedPost.posts;
    if (post) {
      if (Array.isArray(post)) {
        posts.push(...post);
        post.forEach((p: any) => {
          if (p?.id) postIds.push(p.id);
        });
      } else if (post.id) {
        posts.push(post);
        postIds.push(post.id);
      }
    }
  });

  if (posts.length === 0) {
    return [];
  }

  // Fetch all likes, shares, and saved status by current user for all saved posts
  const [userLikes, userShares, userSaved] = await Promise.all([
    supabase
      .from("likes")
      .select("post_id")
      .eq("user_id", user.id)
      .in("post_id", postIds),
    supabase
      .from("shares")
      .select("post_id")
      .eq("user_id", user.id)
      .in("post_id", postIds),
    supabase
      .from("saved_posts")
      .select("post_id")
      .eq("user_id", user.id)
      .in("post_id", postIds),
  ]);

  if (userLikes.error) {
    throw new Error(userLikes.error.message);
  }
  if (userShares.error) {
    throw new Error(userShares.error.message);
  }
  if (userSaved.error) {
    throw new Error(userSaved.error.message);
  }

  const likedPostIds = new Set(userLikes.data?.map((like) => like.post_id) ?? []);
  const sharedPostIds = new Set(userShares.data?.map((share) => share.post_id) ?? []);
  const savedPostIds = new Set(userSaved.data?.map((saved) => saved.post_id) ?? []);

  // Handle missing user data with fallback
  const needsFallback = posts.some((p) => !hasPostAuthorData(p as { users?: unknown; user_id?: string }));
  if (needsFallback) {
    const userIds = [...new Set(posts.map((p) => p.user_id).filter(Boolean))];
    if (userIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, username, first_name, last_name, avatar_url")
        .in("id", userIds);

      if (!usersError && usersData && usersData.length > 0) {
        const usersMap = new Map(usersData.map((u) => [u.id, u]));
        posts.forEach((post) => {
          if (!hasPostAuthorData(post as { users?: unknown; user_id?: string })) {
            const userData = usersMap.get(post.user_id);
            if (userData) (post as { users?: SupabaseUser[] }).users = [userData];
          }
        });
      }
    }
  }

  // Map saved posts to Post format
  return posts
    .map((post: any) => {
      if (!post || !post.id) {
        return null;
      }

      const postWithRelations: SupabasePostRow = {
        id: post.id,
        content: post.content,
        image_url: post.image_url,
        created_at: post.created_at,
        user_id: post.user_id,
        users: Array.isArray(post.users) ? post.users : post.users ? [post.users] : undefined,
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
        user_liked: likedPostIds.has(post.id) ? [{ id: "" }] : null,
        user_shared: sharedPostIds.has(post.id) ? [{ id: "" }] : null,
        user_saved: savedPostIds.has(post.id) ? [{ id: "" }] : null,
      };

      return mapSupabasePostToUi(postWithRelations);
    })
    .filter((post): post is Post => post !== null);
}
