import { supabase } from "@/lib/supabase";
import type { CreatePostInput } from "@/types/api";
import { getCurrentUser, ensureUserRowExists } from "./currentUser";

export async function uploadPostImage(file: File | Blob): Promise<string> {
  const user = await getCurrentUser();
  await ensureUserRowExists();
  
  const fileName = `post-${user.id}-${Date.now()}.png`;

  const { error: uploadError } = await supabase.storage
    .from("Social")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
      metadata: {
        owner: user.id,
      },
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from("Social").getPublicUrl(fileName);

  if (!data || !data.publicUrl) {
    throw new Error("Failed to get public URL for uploaded image");
  }

  return data.publicUrl;
}

export async function createPost({ content, imageUrl }: CreatePostInput) {
  const user = await getCurrentUser();
  await ensureUserRowExists();

  const insertPayload: { content: string; user_id: string; image_url?: string | null } = {
    content,
    user_id: user.id,
  };

  if (typeof imageUrl !== "undefined") {
    insertPayload.image_url = imageUrl;
  }

  const { error } = await supabase.from("posts").insert(insertPayload);

  if (error) {
    throw new Error(error.message);
  }
}
