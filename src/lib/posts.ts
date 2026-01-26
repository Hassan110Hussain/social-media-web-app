// Re-export all functions from dataForPosts for backward compatibility
export { getCurrentUser, ensureUserRowExists } from "@/data/dataForPosts/currentUser";
export { hasPostAuthorData, mapSupabasePostToUi } from "@/data/dataForPosts/utils";
export { uploadPostImage, createPost } from "@/data/dataForPosts/create";
export { deletePost } from "@/data/dataForPosts/delete";
export {
  fetchFeedPosts,
  fetchForYouPosts,
  fetchFollowingPosts,
  fetchExplorePosts,
  fetchMyPosts,
  fetchUserPosts,
} from "@/data/dataForPosts/fetch";

// Re-export like functions for backward compatibility
export { likePost, unlikePost, toggleLikePost } from "@/data/dataForPosts/likes";

// Re-export share functions for backward compatibility
export { sharePost, unsharePost, toggleSharePost } from "@/data/dataForPosts/shares";

// Re-export comment functions for backward compatibility
export { createComment, fetchComments } from "@/data/dataForPosts/comments";

// Re-export save functions for backward compatibility
export { savePost, unsavePost, toggleSavePost, fetchSavedPosts } from "@/data/dataForPosts/saves";
