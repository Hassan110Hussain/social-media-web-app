"use client";

import { useState } from "react";
import General from "./General";
import Security from "./Security";

const Settings = () => {
  const [activeTab, setActiveTab] = useState<"general" | "security">("general");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  return (
    <div className="min-h-screen px-3 py-4 text-slate-900 transition-colors dark:text-white sm:px-4 sm:py-6 md:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-4 sm:space-y-5">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Settings</p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">Account Settings</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage your account settings and preferences.</p>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white/90 p-1 shadow-sm shadow-slate-200 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === "general"
                ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-950"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            General
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === "security"
                ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-950"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            Security
          </button>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200"
                : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* General Tab */}
        {activeTab === "general" && <General onMessage={setMessage} />}

        {/* Security Tab */}
        {activeTab === "security" && <Security onMessage={setMessage} />}
      </div>
    </div>
  );
};

export default Settings;
