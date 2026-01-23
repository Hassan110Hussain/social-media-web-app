"use client";

import { useRef } from "react";
import Image from "next/image";
import ICONS from "@/components/assets/icons";

interface PostComposerProps {
  composerContent: string;
  setComposerContent: (content: string) => void;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  currentUserAvatar: string;
  isCreatingPost: boolean;
  createError: string | null;
  onCreatePost: () => void;
}

const PostComposer = ({
  composerContent,
  setComposerContent,
  selectedFile,
  setSelectedFile,
  currentUserAvatar,
  isCreatingPost,
  createError,
  onCreatePost,
}: PostComposerProps) => {
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  return (
    <section className="rounded-xl border border-slate-200 bg-white/90 p-3 shadow-sm shadow-slate-200 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none sm:rounded-2xl sm:p-4">
      <div className="flex items-start gap-3">
        <div className="relative mt-1 h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-800">
          <Image
            src={currentUserAvatar}
            alt="Your profile"
            fill
            className="object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = ICONS.land;
            }}
          />
        </div>
        <div className="flex-1 space-y-2">
          <textarea
            ref={composerRef}
            value={composerContent}
            onChange={(event) => setComposerContent(event.target.value)}
            rows={2}
            placeholder="What&apos;s on your mind?"
            className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-0 transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500 dark:focus:ring-slate-700"
          />

          {createError && (
            <p className="text-xs font-medium text-rose-500">
              {createError}
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-slate-300 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500 transition hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-900">
                <span>📷</span>
                <span>Attach image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    setSelectedFile(file ?? null);
                  }}
                />
              </label>
              {selectedFile && (
                <span className="truncate max-w-[160px] text-[11px] text-slate-500 dark:text-slate-400">
                  {selectedFile.name}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onCreatePost}
              disabled={isCreatingPost || !composerContent.trim()}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold tracking-wide text-white shadow-sm transition hover:bg-blue-500 hover:shadow-md disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
            >
              {isCreatingPost ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PostComposer;
