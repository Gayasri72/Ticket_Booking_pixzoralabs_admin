export function DashboardHeader() {
  return (
    <div className="border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
            Admin Dashboard
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Welcome back! Here's what's happening with your ticket system today.
          </p>
        </div>
      </div>
    </div>
  );
}
