import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/ui/dashboard-nav";
import { Breadcrumbs } from "@/ui/breadcrumbs";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav user={session.user} />

      {/* Desktop: Add left padding for sidebar */}
      {/* Mobile: Content takes full width */}
      <main className="lg:pl-64">
        <div className="p-8 pt-6">
          <Breadcrumbs />
          {children}
        </div>
      </main>
    </div>
  );
}
