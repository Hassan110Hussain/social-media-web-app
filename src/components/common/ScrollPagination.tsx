"use client";

import { useEffect, useRef, useCallback } from "react";

interface ScrollPaginationProps {
  /**
   * Callback function called when user scrolls near the bottom
   * Should return a promise that resolves when loading is complete
   */
  onLoadMore: () => Promise<void>;
  /**
   * Whether more data is available to load
   */
  hasMore: boolean;
  /**
   * Whether data is currently being loaded
   */
  isLoading: boolean;
  /**
   * Optional: Distance from bottom (in pixels) to trigger load more
   * Default: 200px
   */
  threshold?: number;
  /**
   * Optional: Root element to observe (defaults to window)
   */
  root?: HTMLElement | null;
}

/**
 * ScrollPagination hook for infinite scroll pagination
 * Triggers onLoadMore when user scrolls near the bottom of the page
 */
export function useScrollPagination({
  onLoadMore,
  hasMore,
  isLoading,
  threshold = 200,
  root = null,
}: ScrollPaginationProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    try {
      await onLoadMore();
    } catch (error) {
      console.error("Error loading more posts:", error);
    }
  }, [onLoadMore, hasMore, isLoading]);

  useEffect(() => {
    if (!hasMore || isLoading) {
      // Clean up observer if no more data or currently loading
      if (observerRef.current && sentinelRef.current) {
        observerRef.current.unobserve(sentinelRef.current);
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      return;
    }

    if (!sentinelRef.current) return;

    // Create intersection observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading) {
          void loadMore();
        }
      },
      {
        root: root || null,
        rootMargin: `${threshold}px`,
        threshold: 0.1,
      }
    );

    observerRef.current.observe(sentinelRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [hasMore, isLoading, loadMore, threshold, root]);

  return {
    sentinelRef,
  };
}

/**
 * Sentinel element component for scroll pagination
 * Place this at the bottom of your list to trigger infinite scroll
 */
export function ScrollPaginationSentinel({
  onLoadMore,
  hasMore,
  isLoading,
  threshold = 200,
  root = null,
}: ScrollPaginationProps) {
  const { sentinelRef } = useScrollPagination({
    onLoadMore,
    hasMore,
    isLoading,
    threshold,
    root,
  });

  if (!hasMore) {
    return (
      <div className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
        <p>No more posts to load</p>
      </div>
    );
  }

  return (
    <div
      ref={sentinelRef}
      className="py-6 text-center text-sm text-slate-500 dark:text-slate-400"
    >
      {isLoading && <p>Loading more posts...</p>}
    </div>
  );
}

export default ScrollPaginationSentinel;
