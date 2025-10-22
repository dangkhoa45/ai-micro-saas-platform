import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  // Fetch user data with subscription and usage
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      subscriptions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      usageLogs: {
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      },
      projects: {
        orderBy: { updatedAt: "desc" },
        take: 5,
      },
    },
  });

  const subscription = user?.subscriptions[0];
  const currentMonthUsage =
    user?.usageLogs.reduce((acc, log) => acc + log.tokens, 0) || 0;
  const currentMonthCost =
    user?.usageLogs.reduce((acc, log) => acc + log.cost, 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="border-b bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {session.user?.email}
            </span>
            <Link
              href="/dashboard/profile"
              className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Profile
            </Link>
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
        {/* User Info & Subscription */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Account</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {user?.name || "No name set"}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {user?.email}
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Subscription</h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Plan:
              </span>
              <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm font-medium capitalize">
                {subscription?.plan || "Free"}
              </span>
            </div>
            <Link
              href="/dashboard/subscription"
              className="text-sm text-primary hover:underline"
            >
              Manage subscription →
            </Link>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Usage This Month</h3>
            <p className="text-2xl font-bold mb-1">
              {currentMonthUsage.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tokens used · ${currentMonthCost.toFixed(4)} cost
            </p>
          </div>
        </div>

        {/* AI Tools */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">AI Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2">AI Writer</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Generate high-quality content with AI
              </p>
              <Link
                href="/tools/ai-writer"
                className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
              >
                Open Tool
              </Link>
            </div>

            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2">AI Analytics</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Analyze data and get insights with AI
              </p>
              <Link
                href="/tools/ai-analytics"
                className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
              >
                Open Tool
              </Link>
            </div>

            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2">All Tools</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Browse all available AI tools
              </p>
              <Link
                href="/tools"
                className="inline-block px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                View All
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Projects */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Recent Projects</h2>
          {user && user.projects.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Last Updated
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {user.projects.map((project) => (
                    <tr key={project.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {project.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {project.description || "No description"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No projects yet. Start by using one of the AI tools above!
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
