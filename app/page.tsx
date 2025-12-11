import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation Bar */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-linear-to-br from-blue-500 to-purple-600"></div>
            <span className="text-xl font-bold text-white">TicketAdmin</span>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/signin">
              <Button
                variant="ghost"
                className="text-slate-300 hover:text-white"
              >
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-32">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-white">
              Admin Management
              <span className="block bg-linear-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                for Ticket Booking
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-slate-400">
              Manage your events, bookings, and customers with a powerful and
              intuitive admin dashboard. Track sales, monitor user activity, and
              optimize your ticket booking platform.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/admin/signup">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Sign Up
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="text-center text-3xl font-bold text-white mb-12">
          Key Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1 */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 hover:border-slate-600 transition">
            <div className="h-12 w-12 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Analytics</h3>
            <p className="text-sm text-slate-400">
              Real-time analytics and detailed insights about your ticket sales
              and customer behavior.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 hover:border-slate-600 transition">
            <div className="h-12 w-12 rounded-lg bg-linear-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.585l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Event Management
            </h3>
            <p className="text-sm text-slate-400">
              Create, edit, and manage events with ease. Control pricing,
              capacity, and availability.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 hover:border-slate-600 transition">
            <div className="h-12 w-12 rounded-lg bg-linear-to-br from-green-500 to-green-600 flex items-center justify-center mb-4">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM16 16a5 5 0 1110 0H16z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              User Management
            </h3>
            <p className="text-sm text-slate-400">
              View customer profiles, manage bookings, and handle user support
              issues efficiently.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 hover:border-slate-600 transition">
            <div className="h-12 w-12 rounded-lg bg-linear-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-4">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Revenue Tracking
            </h3>
            <p className="text-sm text-slate-400">
              Monitor revenue streams, view detailed financial reports, and
              track payments.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mx-auto max-w-7xl px-6 py-16 border-t border-slate-700">
        <h2 className="text-center text-3xl font-bold text-white mb-12">
          Quick Stats
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-4xl font-bold text-blue-400 mb-2">1,234</p>
            <p className="text-slate-400">Total Bookings</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-purple-400 mb-2">573</p>
            <p className="text-slate-400">Active Users</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-green-400 mb-2">$45K</p>
            <p className="text-slate-400">This Month Revenue</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-orange-400 mb-2">24</p>
            <p className="text-slate-400">Active Events</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-lg border border-slate-700 bg-linear-to-r from-slate-800 to-slate-700 p-12 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            Ready to manage your events?
          </h3>
          <p className="text-slate-400 mb-8">
            Access the admin dashboard to monitor all your ticket bookings and
            business metrics in real-time.
          </p>
          <Link href="/admin/dashboard">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Open Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900/50 py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-slate-400">
          <p>
            &copy; 2025 Pixzora Labs. Ticket Booking Admin Portal. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
