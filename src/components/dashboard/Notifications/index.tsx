"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Notification, NotificationType } from "@/types/api";
import ICONS from "@/components/assets/icons";
import { supabase } from "@/lib/supabase";

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("Please sign in to view notifications");
          return;
        }

        // Fetch notifications from database
        // For now, we'll create mock notifications as the database structure may not exist yet
        // In a real app, you'd query a notifications table
        const mockNotifications: Notification[] = [
          {
            id: "1",
            type: "like",
            userId: "user1",
            userAvatar: ICONS.land,
            userName: "Alex Johnson",
            userHandle: "alexj",
            postId: "post1",
            timeAgo: "2m",
            read: false,
          },
          {
            id: "2",
            type: "comment",
            userId: "user2",
            userAvatar: ICONS.land,
            userName: "Sarah Chen",
            userHandle: "sarahc",
            postId: "post1",
            commentContent: "Great post!",
            timeAgo: "15m",
            read: false,
          },
          {
            id: "3",
            type: "follow",
            userId: "user3",
            userAvatar: ICONS.land,
            userName: "Mike Davis",
            userHandle: "miked",
            timeAgo: "1h",
            read: true,
          },
          {
            id: "4",
            type: "share",
            userId: "user4",
            userAvatar: ICONS.land,
            userName: "Emma Wilson",
            userHandle: "emmaw",
            postId: "post2",
            timeAgo: "3h",
            read: true,
          },
        ];

        setNotifications(mockNotifications);
      } catch (err) {
        console.error("Failed to load notifications:", err);
        setError("Unable to load notifications right now. Please try again.");
        setNotifications([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadNotifications();
  }, []);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "like":
        return "♥";
      case "comment":
        return "💬";
      case "follow":
        return "👤";
      case "share":
        return "📤";
      default:
        return "🔔";
    }
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case "like":
        return "liked your post";
      case "comment":
        return "commented on your post";
      case "follow":
        return "started following you";
      case "share":
        return "shared your post";
      default:
        return "interacted with your post";
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case "like":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400";
      case "comment":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case "follow":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
      case "share":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
      default:
        return "bg-slate-500/10 text-slate-600 dark:text-slate-400";
    }
  };

  const markAsRead = async (notificationId: string) => {
    setNotifications((current) =>
      current.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    // In a real app, you'd update the database here
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen px-3 py-4 text-slate-900 transition-colors dark:text-white sm:px-4 sm:py-6 md:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-4 sm:space-y-5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Activity
            </p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              Notifications
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                : "All caught up!"}
            </p>
          </div>
        </header>

        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-6 text-center text-sm text-slate-500 shadow-sm shadow-slate-200 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
            Loading notifications...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-4 text-center text-xs text-rose-700 shadow-sm shadow-rose-100 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-200">
            {error}
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-4 py-10 text-center text-sm text-slate-500 shadow-sm shadow-slate-200 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
            <p className="font-medium">No notifications yet</p>
            <p className="mt-1 text-xs">
              When people interact with your posts, you'll see it here.
            </p>
          </div>
        ) : (
          <section className="space-y-2">
            {notifications.map((notification) => (
              <Link
                key={notification.id}
                href={notification.postId ? `/home#post-${notification.postId}` : `/profile/${notification.userHandle}`}
                onClick={() => markAsRead(notification.id)}
                className={`group flex items-start gap-3 rounded-xl border px-4 py-3 transition hover:shadow-sm sm:px-5 sm:py-4 ${
                  notification.read
                    ? "border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-900/40"
                    : "border-blue-200 bg-blue-50/50 shadow-sm shadow-blue-100/50 dark:border-blue-800/60 dark:bg-blue-950/30 dark:shadow-blue-900/20"
                }`}
              >
                {/* Icon */}
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg transition ${
                    notification.read
                      ? "bg-slate-100 dark:bg-slate-800"
                      : getNotificationColor(notification.type)
                  }`}
                >
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-slate-800">
                          <Image
                            src={notification.userAvatar || ICONS.land}
                            alt={notification.userName}
                            fill
                            className="object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = ICONS.land;
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {notification.userName}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            @{notification.userHandle}
                          </p>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                        <span className="font-semibold">{notification.userName}</span>{" "}
                        {getNotificationText(notification)}
                      </p>
                      {notification.commentContent && (
                        <div className="mt-2 rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-800">
                          <p className="text-xs text-slate-700 dark:text-slate-200">
                            "{notification.commentContent}"
                          </p>
                        </div>
                      )}
                      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                        {notification.timeAgo}
                      </p>
                    </div>

                    {/* Post preview image */}
                    {notification.postImageUrl && (
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-800">
                        <Image
                          src={notification.postImageUrl}
                          alt="Post preview"
                          fill
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = ICONS.solid;
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Unread indicator */}
                {!notification.read && (
                  <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                )}
              </Link>
            ))}
          </section>
        )}
      </div>
    </div>
  );
};

export default Notifications;
