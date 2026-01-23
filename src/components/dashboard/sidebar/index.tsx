"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/app/theme-toggle';
import { useSignOut } from '@/contexts/SignOutContext';

const navItems = [
  {
    href: '/home',
    label: 'Home',
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M3 10.5 12 4l9 6.5M5 9.5V20h5v-5h4v5h5V9.5"
        />
      </svg>
    ),
  },
  {
    href: '/explore',
    label: 'Explore',
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="m4 4 16 6-6 2-2 6L4 4Z"
        />
      </svg>
    ),
  },
  {
    href: '/saved',
    label: 'Saved',
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="m6 4 6 4 6-4v16l-6-4-6 4V4Z"
        />
      </svg>
    ),
  },
  {
    href: '/messages',
    label: 'Messages',
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M4 6h16v10H7l-3 3V6Z"
        />
      </svg>
    ),
  },
  {
    href: '/notifications',
    label: 'Notifications',
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
        />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.592c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.43.992a6.759 6.759 0 0 1 0 .255c-.008.378.137.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.592c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        />
      </svg>
    ),
  },
];

const Sidebar = () => {
  const pathname = usePathname();
  const { openModal } = useSignOut();

  return (
    <aside className="hidden h-screen w-20 shrink-0 flex-col overflow-hidden border-r border-slate-200/80 bg-white/95 px-3 py-6 shadow-sm shadow-slate-200 backdrop-blur-lg dark:border-slate-800/70 dark:bg-slate-950/80 dark:shadow-none lg:flex sticky top-0">
      {/* Logo */}
      <div className="mb-8 flex items-center justify-center px-1">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-tr from-pink-500 via-fuchsia-500 to-amber-400 text-lg font-bold text-white shadow-sm shadow-fuchsia-400/40">
          S
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto pb-4 [&::-webkit-scrollbar]:w-0">
        {navItems.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-center gap-3 rounded-2xl px-2 py-2 text-sm font-medium transition ${
                active
                  ? 'bg-slate-900 text-white shadow-sm shadow-slate-800/40 ring-2 ring-slate-900/80 dark:bg-white dark:text-slate-950 dark:ring-white/80'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900/80 dark:hover:text-white'
              }`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-inner shadow-slate-200/60 transition dark:bg-slate-900 dark:text-slate-200">
                {item.icon}
              </span>
              <span className="sr-only">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Profile / footer */}
      <div className="mt-auto space-y-3 border-t border-slate-200/70 pt-3 text-xs text-slate-400 dark:border-slate-800/80 dark:text-slate-500">
        
        <div className="flex flex-col items-center gap-2">
          <div className="shrink-0">
            <ThemeToggle />
          </div>
          <Link
            href="/profile"
            className={`flex items-center justify-center rounded-xl border border-slate-300 bg-white px-2 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 ${
              pathname?.startsWith('/profile')
                ? 'bg-slate-900 text-white shadow-sm shadow-slate-800/40 ring-2 ring-slate-900/80 dark:bg-white dark:text-slate-950 dark:ring-white/80 border-slate-900 dark:border-white'
                : ''
            }`}
          >
            <span className="sr-only">Profile</span>
            <svg
              className="mx-auto h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              />
            </svg>
          </Link>
          <button
            type="button"
            onClick={openModal}
            className="flex-1 rounded-xl border border-slate-300 bg-white px-2 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <span className="sr-only">Sign out</span>
            <svg
              className="mx-auto h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M15 12H3m12 0-3.5-3.5M15 12l-3.5 3.5M18 20h1a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1"
              />
            </svg>
          </button>
        </div>
        
        <p className="text-center text-[11px] leading-snug text-slate-400 dark:text-slate-500">
          Pins mode
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;

