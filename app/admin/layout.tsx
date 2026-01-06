// ============================================================================
// Admin Layout - Shared layout for all admin pages
// ============================================================================

import { requireAdmin } from '@/lib/admin';
import Link from 'next/link';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Protect all admin routes - redirects non-admins
  await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex space-x-8 items-center">
              <Link
                href="/admin"
                className="text-lg font-bold text-gray-900 hover:text-gray-700"
              >
                Admin Panel
              </Link>
              <Link
                href="/admin/contests/new"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                New Contest
              </Link>
              <Link
                href="/"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Back to Site
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main>{children}</main>
    </div>
  );
}
