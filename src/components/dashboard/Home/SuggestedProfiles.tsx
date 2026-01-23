"use client";

import Image from "next/image";
import type { SuggestedProfile } from "@/types/api";
import ICONS from "@/components/assets/icons";

interface SuggestedProfilesProps {
  profiles: SuggestedProfile[];
  onToggleFollow: (profileId: string) => void;
}

const SuggestedProfiles = ({ profiles, onToggleFollow }: SuggestedProfilesProps) => {
  return (
    <aside className="hidden shrink-0 space-y-3 lg:block lg:w-72">
      <section className="rounded-xl border border-slate-200 bg-white/90 p-3 text-xs shadow-sm shadow-slate-200 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none sm:rounded-2xl sm:p-4 sm:text-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Suggested for you
          </h2>
          <button
            type="button"
            className="text-xs font-semibold text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
          >
            See all
          </button>
        </div>

        <div className="space-y-3">
          {profiles.length > 0 ? (
            profiles.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-slate-800">
                    <Image
                      src={ICONS.view}
                      alt={profile.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {profile.name}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {profile.handle}
                    </p>
                    <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">
                      {profile.reason}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleFollow(profile.id)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
                    profile.isFollowing
                      ? "border border-slate-200 bg-white text-slate-800 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      : "bg-blue-600 text-white shadow-sm hover:bg-blue-500"
                  }`}
                >
                  {profile.isFollowing ? "Following" : "Follow"}
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              No suggested profiles at the moment.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white/90 p-3 text-xs text-slate-400 shadow-sm shadow-slate-200 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-500 dark:shadow-none sm:rounded-2xl sm:p-4">
        <p className="mb-2 font-semibold text-slate-500 dark:text-slate-400">
          Your space for creators
        </p>
        <p>
          Follow pages and profiles you care about to build a personalized
          feed of design, dev, and product content.
        </p>
      </section>
    </aside>
  );
};

export default SuggestedProfiles;
