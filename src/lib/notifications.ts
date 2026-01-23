import { supabase } from "@/lib/supabase";
import type { Notification } from "@/types/api";
import { getCurrentUser } from "@/data/dataForPosts/currentUser";
import { formatTimeAgo, capitalizeName } from "@/data/dataForPosts/utils";

export async function fetchNotifications(): Promise<Notification[]> {
  const user = await getCurrentUser();

  // Fetch notifications from the notifications table
  const { data: notificationsData, error: notificationsError } = await supabase
    .from("notifications")
    .select(`
      id,
      type,
      created_at,
      post_id,
      actor_id,
      is_read
    `)
    .eq("user_id", user.id) // Notifications for the current user
    .order("created_at", { ascending: false });

  if (notificationsError) {
    console.error("Error fetching notifications:", notificationsError);
    return [];
  }

  if (!notificationsData || notificationsData.length === 0) {
    return [];
  }

  // Get unique actor IDs and post IDs
  const actorIds = [...new Set(notificationsData.map((n) => n.actor_id).filter(Boolean))];
  const postIds = [...new Set(notificationsData.map((n) => n.post_id).filter(Boolean))];

  // Fetch actor user data
  const { data: actorsData } = await supabase
    .from("users")
    .select("id, username, first_name, last_name, avatar_url")
    .in("id", actorIds);

  // Fetch post data
  const { data: postsData } = await supabase
    .from("posts")
    .select("id, image_url")
    .in("id", postIds);

  // Fetch comment content for comment notifications
  const commentPostIds = notificationsData
    .filter((n) => n.type === "comment" && n.post_id)
    .map((n) => n.post_id!);
  
  let commentMap = new Map<string, string>();
  if (commentPostIds.length > 0) {
    const { data: commentsData } = await supabase
      .from("comments")
      .select("post_id, content, created_at, user_id")
      .in("post_id", commentPostIds)
      .order("created_at", { ascending: false });

    if (commentsData) {
      // Map post_id to the latest comment content by matching actor_id
      for (const notif of notificationsData) {
        if (notif.type === "comment" && notif.post_id && notif.actor_id) {
          const comment = commentsData.find(
            (c) => c.post_id === notif.post_id && c.user_id === notif.actor_id
          );
          if (comment) {
            commentMap.set(notif.id, comment.content);
          }
        }
      }
    }
  }

  // Create maps for quick lookup
  const actorMap = new Map(
    (actorsData || []).map((actor) => [actor.id, actor])
  );
  const postMap = new Map(
    (postsData || []).map((post) => [post.id, post])
  );

  // Process notifications
  const notifications: Notification[] = [];

  for (const notif of notificationsData) {
    if (!notif.actor_id) continue;

    const actor = actorMap.get(notif.actor_id);
    if (!actor) continue;

    const post = notif.post_id ? postMap.get(notif.post_id) : null;

    const userName = formatUserName(actor);
    const userHandle = actor.username || "user";

    const notification: Notification = {
      id: notif.id,
      type: notif.type as "like" | "comment" | "share",
      userId: actor.id,
      userAvatar: actor.avatar_url || "",
      userName,
      userHandle,
      postId: post?.id || notif.post_id || undefined,
      postImageUrl: post?.image_url || undefined,
      timeAgo: formatTimeAgo(notif.created_at),
      is_read: notif.is_read || false,
    };

    // Add comment content if it's a comment notification
    if (notif.type === "comment") {
      const commentContent = commentMap.get(notif.id);
      if (commentContent) {
        notification.commentContent = commentContent;
      }
    }

    notifications.push(notification);
  }

  return notifications;
}

function formatUserName(user: {
  first_name?: string | null;
  last_name?: string | null;
  username?: string;
}): string {
  if (user.first_name && user.last_name) {
    return `${capitalizeName(user.first_name)} ${capitalizeName(user.last_name)}`;
  } else if (user.first_name) {
    return capitalizeName(user.first_name);
  } else if (user.last_name) {
    return capitalizeName(user.last_name);
  } else if (user.username) {
    return capitalizeName(user.username);
  }
  return "User";
}
