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
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>
      {/* User Info & Subscription */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Account</h3>
          <p className="text-sm text-muted-foreground mb-1">
            {user?.name || "No name set"}
          </p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Subscription</h3>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Plan:</span>
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

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Usage This Month</h3>
          <p className="text-2xl font-bold mb-1">
            {currentMonthUsage.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">
            Tokens used · ${currentMonthCost.toFixed(4)} cost
          </p>
        </div>
      </div>

      {/* AI Tools */}
      <div>
        <h2 className="text-2xl font-bold mb-4">AI Tools</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-2">AI Writer</h3>
            <p className="text-muted-foreground mb-4">
              Generate high-quality content with AI
            </p>
            <Link
              href="/tools/ai-writer"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Open Tool
            </Link>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-2">AI Analytics</h3>
            <p className="text-muted-foreground mb-4">
              Analyze data and get insights with AI
            </p>
            <Link
              href="/tools/ai-analytics"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Coming Soon
            </Link>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-2">All Tools</h3>
            <p className="text-muted-foreground mb-4">
              Browse all available AI tools
            </p>
            <Link
              href="/tools"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
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
          <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {user.projects.map((project) => (
                  <tr key={project.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {project.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {project.description || "No description"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-8 shadow-sm text-center">
            <p className="text-muted-foreground mb-4">
              No projects yet. Start by using one of the AI tools above!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
