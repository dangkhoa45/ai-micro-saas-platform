"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutDashboard,
  Wrench,
  CreditCard,
  User,
  Menu,
  LogOut,
  Sparkles,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/ui/sheet";
import { Button } from "@/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "AI Tools",
    href: "/tools",
    icon: Wrench,
  },
  {
    title: "AI Writer",
    href: "/tools/ai-writer",
    icon: Sparkles,
  },
  {
    title: "Subscription",
    href: "/dashboard/subscription",
    icon: CreditCard,
  },
  {
    title: "Profile",
    href: "/dashboard/profile",
    icon: User,
  },
];

interface DashboardNavProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function DashboardNav({ user }: DashboardNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r bg-card">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Home className="h-6 w-6" />
              <span className="font-bold text-lg">AI Platform</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.title}
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="border-t p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <Link href="/api/auth/signout">
              <Button variant="outline" className="w-full" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 border-b bg-card">
        <div className="flex items-center justify-between h-full px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Home className="h-6 w-6" />
            <span className="font-bold text-lg">AI Platform</span>
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex flex-col h-full">
                {/* Mobile Logo */}
                <div className="flex items-center h-16 px-6 border-b">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2"
                    onClick={() => setOpen(false)}
                  >
                    <Home className="h-6 w-6" />
                    <span className="font-bold text-lg">AI Platform</span>
                  </Link>
                </div>

                {/* Mobile Navigation */}
                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {item.title}
                      </Link>
                    );
                  })}
                </nav>

                {/* Mobile User Info */}
                <div className="border-t p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user?.name || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <Link href="/api/auth/signout">
                    <Button variant="outline" className="w-full" size="sm">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Mobile spacer */}
      <div className="lg:hidden h-16" />
    </>
  );
}
