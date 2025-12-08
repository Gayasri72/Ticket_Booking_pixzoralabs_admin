"use client";

import { DashboardHeader } from "@/components/pages/dashboard/dashboard-header";
import { StatsGrid } from "@/components/pages/dashboard/stats-grid";
import { RecentActivity } from "@/components/pages/dashboard/recent-activity";
import { TopEvents } from "@/components/pages/dashboard/top-events";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <DashboardHeader />
      <div className="space-y-6 p-6">
        <StatsGrid />
        <div className="grid gap-6 md:grid-cols-3">
          <RecentActivity />
          <TopEvents />
        </div>
      </div>
    </div>
  );
}
