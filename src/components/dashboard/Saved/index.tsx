"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Post } from "@/types/api";
import ICONS from "@/components/assets/icons";
import { fetchSavedPosts, toggleSavePost } from "@/lib/posts";

const Saved = () => {
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSavedPosts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const posts = await fetchSavedPosts();
        setSavedPosts(posts);
      } catch (err) {
        console.error("Failed to load saved posts:", err);
        setError("Unable to load saved posts right now. Please try again.");
        setSavedPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadSavedPosts();
  }, []);

  const handleUnsave = async (postId: string) => {
    // Optimistic update
    const previousPosts = [...savedPosts];
    setSavedPosts((current) => current.filter((post) => post.id !== postId));

    try {
      await toggleSavePost(postId);
      // Refresh saved posts to get accurate list
      const updatedPosts = await fetchSavedPosts();
      setSavedPosts(updatedPosts);
    } catch (err) {
      console.error("Failed to unsave post:", err);
      // Revert optimistic update on error
      setSavedPosts(previousPosts);
    }
  };

  return (
    <div className="min-h-screen px-3 py-4 text-slate-900 transition-colors dark:text-white sm:px-4 sm:py-6 md:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-4 sm:space-y-5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Library</p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">Saved Posts</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">All posts you've saved for later.</p>
          </div>
        </header>

        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-6 text-center text-sm text-slate-500 shadow-sm shadow-slate-200 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
            Loading saved posts...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-4 text-center text-xs text-rose-700 shadow-sm shadow-rose-100 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-200">
            {error}
          </div>
        ) : savedPosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-4 py-10 text-center text-sm text-slate-500 shadow-sm shadow-slate-200 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
            <p className="font-medium">No saved posts yet</p>
            <p className="mt-1 text-xs">Start saving posts you want to revisit later.</p>
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-4 sm:gap-5 lg:gap-6">
            {savedPosts.map((post) => (
              <article
                key={post.id}
                className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white/90 shadow-sm shadow-slate-200 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none sm:rounded-2xl"
              >
                {/* Post header */}
                <header className="flex items-start justify-between gap-2 px-4 py-3 sm:px-5 min-h-[72px]">
                  <div className="flex min-w-0 items-start gap-3 flex-1">
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-slate-800 sm:h-10 sm:w-10">
                      <Image
                        src={post.avatarUrl || ICONS.land}
                        alt={post.author}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = ICONS.land;
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="space-y-1">
                        <div>
                          <span className="block truncate text-sm font-semibold leading-tight">
                            {post.author}
                          </span>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {post.handle} · {post.timeAgo}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </header>

                {/* Post media */}
                {post.imageUrl && (
                  <div className="relative w-full h-[500px] bg-slate-900/90">
                    <Image
                      src={post.imageUrl}
                      alt={post.caption}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = ICONS.solid;
                      }}
                    />
                  </div>
                )}

                {/* Post content and actions */}
                <div className="flex flex-1 flex-col justify-between space-y-2 px-4 py-3 sm:px-5 sm:py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                      <div className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold">
                        <span className="text-slate-700 dark:text-slate-200">
                          {post.likes.toLocaleString()} likes
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUnsave(post.id)}
                      className="rounded-full px-3 py-1 text-xs font-semibold bg-blue-500/10 text-blue-600 transition hover:bg-blue-500/20 dark:text-blue-400"
                    >
                      Unsave
                    </button>
                  </div>

                  <div className="space-y-1 text-xs sm:text-sm">
                    <p className="line-clamp-2 text-slate-700 dark:text-slate-200">
                      <span className="font-semibold">{post.author}</span> {post.caption}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </div>
  );
};

export default Saved;
