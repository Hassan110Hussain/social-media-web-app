import Settings from '@/components/dashboard/Settings';
import Sidebar from '@/components/dashboard/sidebar';

export const dynamic = 'force-dynamic';

export default function DashboardSettingsPage() {
  return (
    <div className="flex min-h-screen bg-slate-50/70 text-slate-900 transition-colors dark:bg-slate-950 dark:text-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Settings />
      </main>
    </div>
  );
}
