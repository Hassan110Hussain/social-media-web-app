"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { Post } from "@/types/api";
import { fetchExplorePosts, toggleLikePost, toggleSavePost, createComment, fetchComments } from "@/lib/posts";
import type { Comment } from "@/types/api";
import ICONS from "@/components/assets/icons";

const Explore = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [isLoadingComments, setIsLoadingComments] = useState<Record<string, boolean>>({});
  const [isSubmittingComment, setIsSubmittingComment] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const explorePosts = await fetchExplorePosts();
        setPosts(explorePosts);
      } catch (err) {
        console.error("Failed to load explore posts:", err);
        setError("Unable to load posts right now. Please try again.");
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadPosts();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return posts;
    
    const searchLower = search.toLowerCase();
    return posts.filter((post) => {
      return (
        post.caption.toLowerCase().includes(searchLower) ||
        post.author.toLowerCase().includes(searchLower) ||
        post.handle.toLowerCase().includes(searchLower)
      );
    });
  }, [posts, search]);

  const toggleLike = async (postId: string) => {
    const previousPosts = [...posts];
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              liked: !post.liked,
              likes: post.liked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );

    try {
      await toggleLikePost(postId);
      const updatedPosts = await fetchExplorePosts();
      setPosts(updatedPosts);
    } catch (error) {
      console.error("Failed to toggle like:", error);
      setPosts(previousPosts);
    }
  };

  const toggleSave = async (postId: string) => {
    const previousPosts = [...posts];
    setPosts((current) =>
      current.map((post) =>
        post.id === postId ? { ...post, saved: !post.saved } : post
      )
    );

    try {
      await toggleSavePost(postId);
      const updatedPosts = await fetchExplorePosts();
      setPosts(updatedPosts);
    } catch (error) {
      console.error("Failed to toggle save:", error);
      setPosts(previousPosts);
    }
  };

  const toggleComments = async (postId: string) => {
    if (openCommentsPostId === postId) {
      setOpenCommentsPostId(null);
    } else {
      setOpenCommentsPostId(postId);
      if (!comments[postId]) {
        try {
          setIsLoadingComments((prev) => ({ ...prev, [postId]: true }));
          const postComments = await fetchComments(postId);
          setComments((prev) => ({ ...prev, [postId]: postComments }));
        } catch (error) {
          console.error("Failed to load comments:", error);
        } finally {
          setIsLoadingComments((prev) => ({ ...prev, [postId]: false }));
        }
      }
    }
  };

  const handleSubmitComment = async (postId: string) => {
    const content = commentInputs[postId]?.trim();
    if (!content || isSubmittingComment[postId]) return;

    try {
      setIsSubmittingComment((prev) => ({ ...prev, [postId]: true }));
      await createComment(postId, content);
      
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      
      const updatedComments = await fetchComments(postId);
      setComments((prev) => ({ ...prev, [postId]: updatedComments }));
      
      const updatedPosts = await fetchExplorePosts();
      setPosts(updatedPosts);
    } catch (error) {
      console.error("Failed to submit comment:", error);
    } finally {
      setIsSubmittingComment((prev) => ({ ...prev, [postId]: false }));
    }
  };

  return (
    <div className="min-h-screen px-3 py-4 text-slate-900 transition-colors dark:text-white sm:px-4 sm:py-6 md:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:gap-6">
        <main className="min-w-0 flex-1 space-y-4 sm:space-y-5">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Discover</p>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">Explore curated inspiration</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Search UI patterns, product ideas, and motion concepts tailored for modern teams.</p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="hidden rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 sm:inline-flex">
                ⟳ Refresh picks
              </button>
              <button type="button" className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-blue-500 hover:shadow-md">
                + Submit your shot
              </button>
            </div>
          </header>

          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm shadow-slate-200 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-none sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <span className="text-lg">🔍</span>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search posts, users, or content..." className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" />
                {search && (
                  <button type="button" onClick={() => setSearch("")} className="text-xs font-semibold text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
                    Clear
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {isLoading ? (
              <div className="col-span-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-6 text-center text-sm text-slate-500 shadow-sm shadow-slate-200 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
                Loading posts...
              </div>
            ) : error ? (
              <div className="col-span-full rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-4 text-center text-xs text-rose-700 shadow-sm shadow-rose-100 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-200">
                {error}
              </div>
            ) : filtered.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-10 text-center text-sm text-slate-500 shadow-sm shadow-slate-200 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
                <p className="font-semibold">No posts found</p>
                <p className="mt-1 text-xs">Try adjusting your search or check back later.</p>
              </div>
            ) : (
              filtered.map((post) => (
                <article key={post.id} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-sm shadow-slate-200 backdrop-blur transition hover:-translate-y-[2px] hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none">
                  <div className="relative flex flex-col gap-3 p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-slate-800">
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
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">{post.author}</p>
                          <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">{post.handle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleLike(post.id)}
                          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                            post.liked ? "bg-rose-500 text-white shadow-sm shadow-rose-400/40" : "bg-white/80 text-slate-700 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800"
                          }`}
                        >
                          {post.liked ? "♥" : "♡"} {post.likes.toLocaleString()}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSave(post.id)}
                          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                            post.saved ? "bg-emerald-500 text-white shadow-sm shadow-emerald-400/40" : "bg-white/80 text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800"
                          }`}
                        >
                          {post.saved ? "Saved" : "Save"}
                        </button>
                      </div>
                    </div>

                    {post.imageUrl && (
                      <div className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-slate-950/60 shadow-inner shadow-slate-200/30 dark:border-slate-800">
                        <Image src={post.imageUrl} alt={post.caption} width={640} height={640} className="h-52 w-full object-cover sm:h-56" onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = ICONS.solid;
                        }} />
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3">{post.caption}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <button
                          type="button"
                          onClick={() => toggleComments(post.id)}
                          className="hover:text-slate-700 dark:hover:text-slate-200"
                        >
                          💬 {post.comments} comments
                        </button>
                        <span>📤 {post.shares} shares</span>
                        <span>{post.timeAgo}</span>
                      </div>
                    </div>

                    {openCommentsPostId === post.id && (
                      <div className="mt-4 space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                        <div className="flex items-start gap-2">
                          <textarea
                            value={commentInputs[post.id] || ""}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({
                                ...prev,
                                [post.id]: e.target.value,
                              }))
                            }
                            placeholder="Add a comment..."
                            rows={2}
                            className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500 dark:focus:ring-slate-700"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmitComment(post.id);
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleSubmitComment(post.id)}
                            disabled={!commentInputs[post.id]?.trim() || isSubmittingComment[post.id]}
                            className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
                          >
                            {isSubmittingComment[post.id] ? "..." : "Post"}
                          </button>
                        </div>

                        {isLoadingComments[post.id] ? (
                          <div className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">Loading comments...</div>
                        ) : comments[post.id] && comments[post.id].length > 0 ? (
                          <div className="space-y-3 max-h-[200px] overflow-y-auto">
                            {comments[post.id].map((comment) => (
                              <div key={comment.id} className="flex items-start gap-2">
                                <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-slate-800">
                                  <Image
                                    src={comment.users.avatar_url || ICONS.land}
                                    alt={comment.users.username}
                                    fill
                                    className="object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = ICONS.land;
                                    }}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-800">
                                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">@{comment.users.username}</p>
                                    <p className="mt-1 text-xs text-slate-700 dark:text-slate-200">{comment.content}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">No comments yet. Be the first!</div>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              ))
            )}
          </section>
        </main>

        <aside className="shrink-0 space-y-4 lg:w-72">
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm shadow-slate-200 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">For you</p>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Curator digest</h3>
              </div>
              <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">New</span>
            </div>
            <ul className="mt-3 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 leading-snug shadow-sm dark:bg-slate-800/70">
                <span className="text-lg">✨</span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Motion-first inspiration</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">High-impact hero reels and hover microinteractions.</p>
                </div>
              </li>
              <li className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 leading-snug shadow-sm dark:bg-slate-800/70">
                <span className="text-lg">🎨</span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Palette ideas</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Warm to cool gradients to pair with glass surfaces.</p>
                </div>
              </li>
              <li className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 leading-snug shadow-sm dark:bg-slate-800/70">
                <span className="text-lg">🧠</span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">AI-friendly UX</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Model guardrails, clarity hints, and trust-building states.</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-4 text-sm shadow-sm shadow-slate-200 dark:border-slate-700 dark:bg-slate-900/70 dark:shadow-none">
            <p className="font-semibold text-slate-900 dark:text-white">Build your set</p>
            <p className="mt-1 text-slate-500 dark:text-slate-400">Save patterns to review later or share with your squad.</p>
            <button type="button" className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-slate-800 dark:bg-white dark:text-slate-900">
              Create moodboard
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Explore;
