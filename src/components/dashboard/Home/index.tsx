"use client";

import { useEffect, useRef, useState } from "react";
import type { FeedFilter, Post, SuggestedProfile } from "@/types/api";
import { createPost, fetchForYouPosts, fetchFollowingPosts, uploadPostImage, toggleLikePost, toggleSharePost, toggleSavePost, deletePost, createComment, fetchComments } from "@/lib/posts";
import type { Comment } from "@/types/api";
import { supabase } from "@/lib/supabase";
import DeleteModal from "@/components/common/DeleteModal";
import ICONS from "@/components/assets/icons";
import PostComposer from "./PostComposer";
import FeedTabs from "./FeedTabs";
import PostCard from "./PostCard";
import SuggestedProfiles from "./SuggestedProfiles";

const Home = () => {
  const [feedFilter, setFeedFilter] = useState<FeedFilter>("for-you");
  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<SuggestedProfile[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState<boolean>(false);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [composerContent, setComposerContent] = useState<string>("");
  const [isCreatingPost, setIsCreatingPost] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string>(ICONS.land);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [isLoadingComments, setIsLoadingComments] = useState<Record<string, boolean>>({});
  const [isSubmittingComment, setIsSubmittingComment] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setIsLoadingPosts(true);
        setPostsError(null);

        // Fetch posts based on selected filter
        let feedPosts: Post[];
        if (feedFilter === "following") {
          feedPosts = await fetchFollowingPosts();
        } else {
          // "for-you" tab
          feedPosts = await fetchForYouPosts();
        }
        
        setPosts(feedPosts);
      } catch (error) {
        console.error("Failed to load posts:", error);
        setPostsError("Unable to load posts right now. Please try again.");
        setPosts([]);
      } finally {
        setIsLoadingPosts(false);
      }
    };

    const loadCurrentUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          const { data: profile } = await supabase
            .from("users")
            .select("avatar_url")
            .eq("id", user.id)
            .maybeSingle();
          
          if (profile?.avatar_url) {
            setCurrentUserAvatar(profile.avatar_url);
          }
        }
      } catch (error) {
        console.error("Failed to load current user profile:", error);
      }
    };

    void loadPosts();
    void loadCurrentUserProfile();
  }, [feedFilter]);

  // Posts are already filtered by the fetch functions, so we can use them directly
  const visiblePosts = posts;

  const toggleLike = async (postId: string) => {
    // Optimistic update
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
      // Refresh posts to get accurate like count and status
      const updatedPosts = feedFilter === "following" 
        ? await fetchFollowingPosts() 
        : await fetchForYouPosts();
      setPosts(updatedPosts);
    } catch (error) {
      console.error("Failed to toggle like:", error);
      // Revert optimistic update on error
      setPosts(previousPosts);
    }
  };

  const toggleShare = async (postId: string) => {
    // Optimistic update
    const previousPosts = [...posts];
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              shared: !post.shared,
              shares: post.shared ? post.shares - 1 : post.shares + 1,
            }
          : post
      )
    );

    try {
      await toggleSharePost(postId);
      // Refresh posts to get accurate share count and status
      const updatedPosts = feedFilter === "following" 
        ? await fetchFollowingPosts() 
        : await fetchForYouPosts();
      setPosts(updatedPosts);
    } catch (error) {
      console.error("Failed to toggle share:", error);
      // Revert optimistic update on error
      setPosts(previousPosts);
    }
  };

  const toggleSave = async (postId: string) => {
    // Optimistic update
    const previousPosts = [...posts];
    setPosts((current) =>
      current.map((post) =>
        post.id === postId ? { ...post, saved: !post.saved } : post
      )
    );

    try {
      await toggleSavePost(postId);
      // Refresh posts to get accurate saved status
      const updatedPosts = feedFilter === "following" 
        ? await fetchFollowingPosts() 
        : await fetchForYouPosts();
      setPosts(updatedPosts);
    } catch (error) {
      console.error("Failed to toggle save:", error);
      // Revert optimistic update on error
      setPosts(previousPosts);
    }
  };

  const toggleFollowProfile = (profileId: string) => {
    setProfiles((current) =>
      current.map((profile) =>
        profile.id === profileId
          ? { ...profile, isFollowing: !profile.isFollowing }
          : profile
      )
    );
  };

  const handleCreatePost = async () => {
    const trimmed = composerContent.trim();
    if (!trimmed || isCreatingPost) return;

    try {
      setIsCreatingPost(true);
      setCreateError(null);

      let imageUrl: string | null = null;

      if (selectedFile) {
        imageUrl = await uploadPostImage(selectedFile);
      }

      await createPost({ content: trimmed, imageUrl });

      // Refresh feed so the new post appears at the top
      const updatedPosts = feedFilter === "following" 
        ? await fetchFollowingPosts() 
        : await fetchForYouPosts();
      setPosts(updatedPosts);

      setComposerContent("");
      setSelectedFile(null);
    } catch (error) {
      console.error("Failed to create post:", error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Could not publish your post. Please try again.";

      if (
        message.includes("posts_user_id_fkey") ||
        message.toLowerCase().includes("foreign key")
      ) {
        setCreateError(
          "Your account profile isn't fully set up in the database yet (FK constraint). Please sign out/in and try again."
        );
      } else if (message.toLowerCase().includes("not authenticated")) {
        setCreateError("You need to be signed in to post.");
      } else {
        setCreateError(message);
      }
    } finally {
      setIsCreatingPost(false);
    }
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    
    try {
      await deletePost(postToDelete.id);
      // Remove the deleted post from the list
      setPosts((current) => current.filter((post) => post.id !== postToDelete.id));
      setPostToDelete(null);
      setDeleteModalOpen(false);
    } catch (error) {
      console.error("Failed to delete post:", error);
      // Error is handled in the modal
      throw error;
    }
  };

  const openDeleteModal = (post: Post) => {
    setPostToDelete(post);
    setDeleteModalOpen(true);
    setOpenMenuId(null);
  };

  const toggleComments = async (postId: string) => {
    if (openCommentsPostId === postId) {
      setOpenCommentsPostId(null);
    } else {
      setOpenCommentsPostId(postId);
      // Load comments if not already loaded
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
      
      // Clear input
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      
      // Refresh comments
      const updatedComments = await fetchComments(postId);
      setComments((prev) => ({ ...prev, [postId]: updatedComments }));
      
      // Refresh posts to update comment count
      const updatedPosts = feedFilter === "following" 
        ? await fetchFollowingPosts() 
        : await fetchForYouPosts();
      setPosts(updatedPosts);
    } catch (error) {
      console.error("Failed to submit comment:", error);
    } finally {
      setIsSubmittingComment((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleCommentInputChange = (postId: string, value: string) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: value }));
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside any menu (not on a menu button or menu dropdown)
      if (
        openMenuId &&
        !target.closest('[data-menu-button]') &&
        !target.closest('[data-menu-dropdown]')
      ) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

  return (
    <div className="min-h-screen px-3 py-4 text-slate-900 transition-colors dark:text-white sm:px-4 sm:py-5 md:px-6 lg:px-8 lg:py-6">
      <div className="mx-auto flex max-w-7xl gap-3 sm:gap-4 md:gap-5 lg:gap-6">
        {/* Main feed */}
        <main className="min-w-0 flex-1 space-y-3 sm:space-y-4">
          {/* Composer */}
          <PostComposer
            composerContent={composerContent}
            setComposerContent={setComposerContent}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            currentUserAvatar={currentUserAvatar}
            isCreatingPost={isCreatingPost}
            createError={createError}
            onCreatePost={handleCreatePost}
          />

          {/* Feed controls */}
          <FeedTabs feedFilter={feedFilter} onFilterChange={setFeedFilter} />

          {/* Posts feed */}
          <section className="grid grid-cols-1 gap-4 sm:gap-5 lg:gap-6">
            {isLoadingPosts ? (
              <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-6 text-center text-sm text-slate-500 shadow-sm shadow-slate-200 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
                Loading your feed...
              </div>
            ) : postsError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-4 text-center text-xs text-rose-700 shadow-sm shadow-rose-100 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-200">
                {postsError}
              </div>
            ) : visiblePosts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-4 py-10 text-center text-sm text-slate-500 shadow-sm shadow-slate-200 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
                <p className="font-medium">No posts yet in this view</p>
                <p className="mt-1 text-xs">
                  Start following more pages and creators to see their latest
                  posts here.
                </p>
              </div>
            ) : (
              visiblePosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={currentUserId}
                  currentUserAvatar={currentUserAvatar}
                  openMenuId={openMenuId}
                  setOpenMenuId={setOpenMenuId}
                  openCommentsPostId={openCommentsPostId}
                  comments={comments[post.id] || []}
                  commentInput={commentInputs[post.id] || ""}
                  isLoadingComments={isLoadingComments[post.id] || false}
                  isSubmittingComment={isSubmittingComment[post.id] || false}
                  onDelete={openDeleteModal}
                  onLike={toggleLike}
                  onShare={toggleShare}
                  onSave={toggleSave}
                  onToggleComments={toggleComments}
                  onCommentInputChange={handleCommentInputChange}
                  onSubmitComment={handleSubmitComment}
                />
              ))
            )}
          </section>
        </main>

        {/* Right sidebar */}
        <SuggestedProfiles
          profiles={profiles}
          onToggleFollow={toggleFollowProfile}
        />
      </div>
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setPostToDelete(null);
        }}
        onConfirm={handleDeletePost}
        postAuthor={postToDelete?.author}
      />
    </div>
  );
};

export default Home;
