import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="border-b bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {session.user?.email}
            </span>
            <a
              href="/api/auth/signout"
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md text-sm"
            >
              Sign Out
            </a>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">AI Writer</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Generate content with AI
            </p>
            <a
              href="/apps/ai-writer"
              className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Open App
            </a>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">AI Analytics</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Analyze data with AI
            </p>
            <a
              href="/apps/ai-analytics"
              className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Open App
            </a>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Usage</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Track your AI usage and costs
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
