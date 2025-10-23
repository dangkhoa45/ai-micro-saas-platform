export default function ToolsLoading() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>

      {/* Tools grid skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-lg border bg-card p-6 space-y-4 animate-pulse"
          >
            <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="space-y-2">
              <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            <div className="h-9 w-full bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
