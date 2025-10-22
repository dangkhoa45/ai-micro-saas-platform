import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
            AI Micro-SaaS Platform
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Build, deploy, and monetize AI-powered applications with ease
          </p>

          <div className="flex gap-4 justify-center pt-8">
            <Link
              href="/auth/signin"
              className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Get Started
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Dashboard
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2">AI Writer</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Generate high-quality content with advanced AI models
              </p>
            </div>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2">AI Analytics</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Analyze data and get insights powered by AI
              </p>
            </div>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2">More Coming</h3>
              <p className="text-gray-600 dark:text-gray-400">
                New AI tools added regularly
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
