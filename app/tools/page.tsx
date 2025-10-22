import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function ToolsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  // Get all enabled apps
  const apps = await prisma.app.findMany({
    where: { enabled: true },
    orderBy: { name: "asc" },
  });

  // Get user's subscription to check limits
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      subscriptions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const subscription = user?.subscriptions[0];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="border-b bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">AI Tools</h1>
          <Link
            href="/dashboard"
            className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Available AI Tools</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Choose from our collection of AI-powered tools to boost your
            productivity
          </p>
        </div>

        {apps.length === 0 ? (
          <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No AI tools available yet. Please contact the administrator.
            </p>
            <p className="text-sm text-gray-500">
              In development mode, you can seed the database by running:
            </p>
            <code className="block mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm">
              POST /api/apps (to seed initial apps)
            </code>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apps.map((app) => (
              <div
                key={app.id}
                className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{app.icon}</div>
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded text-xs font-medium">
                    Active
                  </span>
                </div>

                <h3 className="text-xl font-semibold mb-2">{app.name}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 min-h-[60px]">
                  {app.description}
                </p>

                <Link
                  href={`/tools/${app.slug}`}
                  className="inline-block w-full text-center px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90"
                >
                  Open Tool
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Subscription info */}
        <div className="mt-12 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Your Current Plan:{" "}
                <span className="text-primary capitalize">
                  {subscription?.plan || "Free"}
                </span>
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {subscription?.plan === "free"
                  ? "Upgrade to unlock more features and higher usage limits"
                  : "Thank you for being a premium member!"}
              </p>
            </div>
            <Link
              href="/dashboard/subscription"
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90"
            >
              {subscription?.plan === "free"
                ? "Upgrade Plan"
                : "Manage Subscription"}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
