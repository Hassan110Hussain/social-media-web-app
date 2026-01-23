"use client";

import Image from "next/image";
import type { Post, Comment } from "@/types/api";
import ICONS from "@/components/assets/icons";

interface PostCardProps {
  post: Post;
  currentUserId: string | null;
  currentUserAvatar: string;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  openCommentsPostId: string | null;
  comments: Comment[];
  commentInput: string;
  isLoadingComments: boolean;
  isSubmittingComment: boolean;
  onDelete: (post: Post) => void;
  onLike: (postId: string) => void;
  onShare: (postId: string) => void;
  onSave: (postId: string) => void;
  onToggleComments: (postId: string) => void;
  onCommentInputChange: (postId: string, value: string) => void;
  onSubmitComment: (postId: string) => void;
}

const PostCard = ({
  post,
  currentUserId,
  currentUserAvatar,
  openMenuId,
  setOpenMenuId,
  openCommentsPostId,
  comments,
  commentInput,
  isLoadingComments,
  isSubmittingComment,
  onDelete,
  onLike,
  onShare,
  onSave,
  onToggleComments,
  onCommentInputChange,
  onSubmitComment,
}: PostCardProps) => {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white/90 shadow-sm shadow-slate-200 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none sm:rounded-2xl">
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
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  post.following
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-blue-500/10 text-blue-500"
                }`}
              >
                {post.following ? "Following" : "Featured"}
              </span>
            </div>
          </div>
        </div>
        <div className="relative shrink-0">
          <button
            type="button"
            data-menu-button
            onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="More options"
          >
            <span className="inline-block h-1 w-1 rounded-full bg-current" />
            <span className="mx-0.5 inline-block h-1 w-1 rounded-full bg-current" />
            <span className="inline-block h-1 w-1 rounded-full bg-current" />
          </button>
          {openMenuId === post.id && currentUserId === post.userId && (
            <div data-menu-dropdown className="absolute right-0 top-full mt-1 z-10 min-w-[120px] rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => onDelete(post)}
                className="w-full px-4 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 first:rounded-t-lg last:rounded-b-lg"
              >
                Delete
              </button>
            </div>
          )}
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

      {/* Post content section */}
      <div className="flex flex-1 flex-col">
        {/* Caption - always shown above actions */}
        <div className={`px-4 py-3 sm:px-5 ${post.imageUrl ? 'sm:py-4' : 'sm:py-5'} ${!post.imageUrl ? 'border-b border-slate-200 dark:border-slate-800' : ''}`}>
          {!post.imageUrl && (
            <div className="mb-3 rounded-lg bg-slate-50/80 px-4 py-3 dark:bg-slate-800/50">
              <p className="text-sm leading-relaxed text-slate-900 dark:text-slate-100 sm:text-base">
                {post.caption}
              </p>
            </div>
          )}
          {post.imageUrl && (
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200">
              <span className="font-semibold">{post.author}</span> {post.caption}
            </p>
          )}
        </div>

        {/* Post actions */}
        <div className="flex flex-1 flex-col justify-between space-y-2 px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={() => onLike(post.id)}
                className="group inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold transition hover:bg-rose-500/10"
              >
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-lg transition ${
                    post.liked
                      ? "bg-rose-500 text-white shadow-sm shadow-rose-400/40"
                      : "bg-slate-100 text-slate-600 group-hover:bg-rose-500 group-hover:text-white dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {post.liked ? "♥" : "♡"}
                </span>
                <span className="text-xs text-slate-700 dark:text-slate-200">
                  {post.liked ? "Liked" : "Like"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onToggleComments(post.id)}
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                💬
                <span className="hidden sm:inline">Comment</span>
              </button>

              <button
                type="button"
                onClick={() => onShare(post.id)}
                className={`hidden items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium transition sm:inline-flex ${
                  post.shared
                    ? "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 dark:text-blue-400"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                }`}
              >
                📤
                <span>{post.shared ? "Shared" : "Share"}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => onSave(post.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                post.saved
                  ? "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 dark:text-blue-400"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              }`}
            >
              {post.saved ? "Saved" : "Save"}
            </button>
          </div>

          {/* Likes count - always below actions */}
          <div className="space-y-1 text-xs sm:text-sm">
            <p className="font-semibold text-slate-900 dark:text-slate-50">
              {post.likes.toLocaleString()} likes
            </p>
            {post.comments > 0 && (
              <button
                type="button"
                onClick={() => onToggleComments(post.id)}
                className="text-xs font-medium text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              >
                View all {post.comments} comments
              </button>
            )}
          </div>
        </div>

        {/* Comments section */}
        {openCommentsPostId === post.id && (
          <div className="mt-4 space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            {/* Comment input */}
            <div className="flex items-start gap-2">
              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-slate-800">
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
                  value={commentInput}
                  onChange={(e) => onCommentInputChange(post.id, e.target.value)}
                  placeholder="Add a comment..."
                  rows={2}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500 dark:focus:ring-slate-700"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      onSubmitComment(post.id);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => onSubmitComment(post.id)}
                  disabled={!commentInput.trim() || isSubmittingComment}
                  className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
                >
                  {isSubmittingComment ? "Posting..." : "Comment"}
                </button>
              </div>
            </div>

            {/* Comments list */}
            {isLoadingComments ? (
              <div className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">
                Loading comments...
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-2">
                    <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-slate-800">
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
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          @{comment.users.username}
                        </p>
                        <p className="mt-1 text-xs text-slate-700 dark:text-slate-200">
                          {comment.content}
                        </p>
                      </div>
                      <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">
                No comments yet. Be the first to comment!
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

export default PostCard;
