import { supabase } from "@/lib/supabase";

export async function getCurrentUser() {
  // First check for an active session (more reliable for client-side)
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(sessionError.message || "Auth session missing!");
  }

  if (!session?.user) {
    throw new Error("Auth session missing!");
  }

  return session.user;
}

export async function ensureUserRowExists() {
  const user = await getCurrentUser();

  const usernameFromMeta =
    (user.user_metadata && (user.user_metadata as { username?: string }).username) ||
    (user.email ? user.email.split("@")[0] : undefined);

  // Try to extract first_name and last_name from user_metadata
  const nameFromMeta = (user.user_metadata && (user.user_metadata as { name?: string }).name) || null;
  let firstNameFromMeta: string | null = null;
  let lastNameFromMeta: string | null = null;

  if (nameFromMeta) {
    const nameParts = nameFromMeta.trim().split(/\s+/);
    firstNameFromMeta = nameParts[0] || null;
    lastNameFromMeta = nameParts.slice(1).join(' ') || null;
  }

  const avatarFromMeta =
    (user.user_metadata &&
      (user.user_metadata as { avatar_url?: string; avatarUrl?: string }).avatar_url) ||
    (user.user_metadata &&
      (user.user_metadata as { avatar_url?: string; avatarUrl?: string }).avatarUrl) ||
    null;

  // Ensure user row exists in the users table
  const { error } = await supabase.from("users").upsert(
    {
      id: user.id,
      username: usernameFromMeta ?? `user_${user.id.slice(0, 8)}`,
      first_name: firstNameFromMeta,
      last_name: lastNameFromMeta,
      avatar_url: avatarFromMeta ?? null,
    },
    { onConflict: "id" }
  );
  
  if (error) {
    throw error instanceof Error ? error : new Error("Failed to provision user profile");
  }
}
