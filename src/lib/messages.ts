import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/data/dataForPosts/currentUser";
import { formatTimeAgo, capitalizeName } from "@/data/dataForPosts/utils";
import type { Chat, ChatMessage } from "@/types/api";

/**
 * Fetch all conversations (chats) for the current user
 * Returns conversations with the other user's profile info and last message
 */
export async function fetchConversations(): Promise<Chat[]> {
  const user = await getCurrentUser();

  // Fetch all messages where current user is either sender or receiver
  // First, fetch messages without joins to avoid foreign key issues
  const [sentResult, receivedResult] = await Promise.all([
    supabase
      .from("messages")
      .select("id, content, created_at, receiver_id, is_read, sender_id")
      .eq("sender_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("messages")
      .select("id, content, created_at, sender_id, is_read, receiver_id")
      .eq("receiver_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  if (sentResult.error) {
    console.error("Error fetching sent messages:", sentResult.error);
  }
  if (receivedResult.error) {
    console.error("Error fetching received messages:", receivedResult.error);
  }

  // If both queries failed, return empty array
  if (sentResult.error && receivedResult.error) {
    return [];
  }

  const sentMessages = sentResult.data || [];
  const receivedMessages = receivedResult.data || [];

  // Collect unique user IDs we need to fetch
  const userIds = new Set<string>();
  sentMessages.forEach((msg: any) => {
    if (msg.receiver_id && msg.receiver_id !== user.id) {
      userIds.add(msg.receiver_id);
    }
  });
  receivedMessages.forEach((msg: any) => {
    if (msg.sender_id && msg.sender_id !== user.id) {
      userIds.add(msg.sender_id);
    }
  });

  // Fetch user data for all unique user IDs
  const userMap = new Map<string, any>();
  if (userIds.size > 0) {
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, username, first_name, last_name, avatar_url")
      .in("id", Array.from(userIds));

    if (usersError) {
      console.error("Error fetching user data:", usersError);
    } else if (users) {
      users.forEach((u) => userMap.set(u.id, u));
    }
  }

  // Create a map of conversations by other user ID
  const conversationMap = new Map<string, {
    otherUserId: string;
    otherUser: any;
    lastMessage: any;
    lastMessageTime: string;
    unreadCount: number;
  }>();

  // Process sent messages
  for (const message of sentMessages) {
    const receiverId = message.receiver_id;
    if (!receiverId || receiverId === user.id) continue;

    const receiver = userMap.get(receiverId);
    if (!receiver) continue;

    const existing = conversationMap.get(receiverId);
    if (!existing || new Date(message.created_at) > new Date(existing.lastMessageTime)) {
      conversationMap.set(receiverId, {
        otherUserId: receiverId,
        otherUser: receiver,
        lastMessage: message,
        lastMessageTime: message.created_at,
        unreadCount: 0, // Sent messages are always read
      });
    }
  }

  // Process received messages
  for (const message of receivedMessages) {
    const senderId = message.sender_id;
    if (!senderId || senderId === user.id) continue;

    const sender = userMap.get(senderId);
    if (!sender) continue;

    const existing = conversationMap.get(senderId);
    const isUnread = !message.is_read;
    
    if (!existing || new Date(message.created_at) > new Date(existing.lastMessageTime)) {
      conversationMap.set(senderId, {
        otherUserId: senderId,
        otherUser: sender,
        lastMessage: message,
        lastMessageTime: message.created_at,
        unreadCount: isUnread ? 1 : 0,
      });
    } else if (isUnread) {
      existing.unreadCount += 1;
    }
  }

  // Convert map to Chat array
  const chats: Chat[] = Array.from(conversationMap.values()).map((conv) => {
    const otherUser = conv.otherUser;
    const userName = formatUserName(otherUser);
    const userHandle = otherUser.username || "user";
    const avatarUrl = otherUser.avatar_url || "";

    return {
      id: conv.otherUserId, // Use other user's ID as chat ID
      name: userName,
      handle: `@${userHandle}`,
      status: "offline", // TODO: Implement online status tracking
      avatarUrl,
      lastActive: formatTimeAgo(conv.lastMessageTime),
      unread: conv.unreadCount,
      messages: [], // Will be loaded separately when chat is selected
    };
  });

  // Sort by last message time (most recent first)
  chats.sort((a, b) => {
    const aTime = conversationMap.get(a.id)?.lastMessageTime || "";
    const bTime = conversationMap.get(b.id)?.lastMessageTime || "";
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  return chats;
}

/**
 * Fetch all messages for a specific conversation (between current user and another user)
 */
export async function fetchConversationMessages(otherUserId: string): Promise<ChatMessage[]> {
  const user = await getCurrentUser();

  // Fetch all messages between current user and other user
  // Use two queries: messages where user is sender, and messages where user is receiver
  const [sentResult, receivedResult] = await Promise.all([
    supabase
      .from("messages")
      .select(`
        id,
        content,
        created_at,
        sender_id,
        receiver_id
      `)
      .eq("sender_id", user.id)
      .eq("receiver_id", otherUserId)
      .order("created_at", { ascending: true }),
    supabase
      .from("messages")
      .select(`
        id,
        content,
        created_at,
        sender_id,
        receiver_id
      `)
      .eq("sender_id", otherUserId)
      .eq("receiver_id", user.id)
      .order("created_at", { ascending: true }),
  ]);

  if (sentResult.error || receivedResult.error) {
    console.error("Error fetching conversation messages:", sentResult.error || receivedResult.error);
    return [];
  }

  // Combine and sort messages
  const allMessages = [
    ...(sentResult.data || []),
    ...(receivedResult.data || []),
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  // Convert to ChatMessage format
  return allMessages.map((message) => {
    const isFromMe = message.sender_id === user.id;
    const messageDate = new Date(message.created_at);
    const timeString = messageDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    return {
      id: message.id,
      from: isFromMe ? "you" : "them",
      text: message.content,
      time: timeString,
    };
  });
}

/**
 * Send a message to another user
 */
export async function sendMessage(receiverId: string, content: string): Promise<ChatMessage> {
  const user = await getCurrentUser();

  if (!content.trim()) {
    throw new Error("Message content cannot be empty");
  }

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      content: content.trim(),
      is_read: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Error sending message:", error);
    throw new Error(error.message || "Failed to send message");
  }

  if (!message) {
    throw new Error("Failed to send message");
  }

  const messageDate = new Date(message.created_at);
  const timeString = messageDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return {
    id: message.id,
    from: "you",
    text: message.content,
    time: timeString,
  };
}

/**
 * Mark messages in a conversation as read
 */
export async function markConversationAsRead(otherUserId: string): Promise<void> {
  const user = await getCurrentUser();

  const { error } = await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("receiver_id", user.id)
    .eq("sender_id", otherUserId)
    .eq("is_read", false);

  if (error) {
    console.error("Error marking messages as read:", error);
    // Don't throw, just log - this is not critical
  }
}

/**
 * Helper function to format user name
 */
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
