"use client";

import type { FeedFilter } from "@/types/api";

interface FeedTabsProps {
  feedFilter: FeedFilter;
  onFilterChange: (filter: FeedFilter) => void;
}

const FeedTabs = ({ feedFilter, onFilterChange }: FeedTabsProps) => {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <div className="inline-flex rounded-full border border-slate-200 bg-white/80 p-1 text-xs shadow-sm shadow-slate-200 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-none sm:text-sm">
        <button
          type="button"
          onClick={() => onFilterChange("my-feed")}
          className={`rounded-full px-3 py-1.5 font-medium transition ${
            feedFilter === "my-feed"
              ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-950"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          My Feed
        </button>
        <button
          type="button"
          onClick={() => onFilterChange("for-you")}
          className={`rounded-full px-3 py-1.5 font-medium transition ${
            feedFilter === "for-you"
              ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-950"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          For you
        </button>
        <button
          type="button"
          onClick={() => onFilterChange("following")}
          className={`rounded-full px-3 py-1.5 font-medium transition ${
            feedFilter === "following"
              ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-950"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          Following
        </button>
      </div>
    </div>
  );
};

export default FeedTabs;
