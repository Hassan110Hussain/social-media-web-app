"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { fetchCurrentUserProfile, updateUserProfile } from "@/lib/profile";
import { getCurrentUser } from "@/lib/posts";
import ICONS from "@/components/assets/icons";

interface GeneralProps {
  onMessage: (message: { type: "success" | "error"; text: string } | null) => void;
}

const General = ({ onMessage }: GeneralProps) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [profile, { data: { user } }] = await Promise.all([
          fetchCurrentUserProfile(),
          supabase.auth.getUser(),
        ]);
        setFirstName(profile.first_name || "");
        setLastName(profile.last_name || "");
        setEmail(user?.email || "");
        setAvatarUrl(profile.avatar_url);
      } catch (error) {
        console.error("Failed to load profile:", error);
        onMessage({
          type: "error",
          text: "Failed to load profile. Please refresh the page.",
        });
      }
    };

    void loadProfile();
  }, [onMessage]);

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        onMessage({
          type: "error",
          text: "Image size must be less than 5MB",
        });
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    const user = await getCurrentUser();
    const fileName = `avatar-${user.id}-${Date.now()}.png`;

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
  };

  const handleSaveGeneral = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      onMessage({
        type: "error",
        text: "First name and last name are required",
      });
      return;
    }

    try {
      setIsSaving(true);
      onMessage(null);

      let newAvatarUrl = avatarUrl;

      // Upload new avatar if selected
      if (avatarFile) {
        newAvatarUrl = await uploadAvatar(avatarFile);
      }

      await updateUserProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        avatar_url: newAvatarUrl,
      });

      setAvatarUrl(newAvatarUrl);
      setAvatarFile(null);
      setAvatarPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      onMessage({
        type: "success",
        text: "Profile updated successfully!",
      });

      // Clear message after 3 seconds
      setTimeout(() => onMessage(null), 3000);
    } catch (error) {
      console.error("Failed to update profile:", error);
      onMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update profile",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm shadow-slate-200 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none sm:p-6">
      <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">General Information</h2>
      
      <div className="space-y-4">
        {/* Avatar Upload */}
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-slate-800">
            <Image
              src={avatarPreview || avatarUrl || ICONS.land}
              alt="Profile"
              fill
              className="object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = ICONS.land;
              }}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Profile Picture
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Change Photo
            </button>
          </div>
        </div>

        {/* First Name */}
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            First Name
          </label>
          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none ring-0 transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500 dark:focus:ring-slate-700"
            placeholder="Enter your first name"
          />
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Last Name
          </label>
          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none ring-0 transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500 dark:focus:ring-slate-700"
            placeholder="Enter your last name"
          />
        </div>

        {/* Email (Disabled) */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            disabled
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500 outline-none ring-0 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400 cursor-not-allowed"
            placeholder="your.email@example.com"
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Email cannot be changed</p>
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSaveGeneral}
            disabled={isSaving}
            className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 hover:shadow-md disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </section>
  );
};

export default General;
