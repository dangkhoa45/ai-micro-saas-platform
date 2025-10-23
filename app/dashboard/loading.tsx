export default function DashboardLoading() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between space-y-2">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-lg border bg-card p-6 space-y-3 animate-pulse"
          >
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 rounded-lg border bg-card p-6 space-y-4 animate-pulse">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-16 bg-gray-200 dark:bg-gray-700 rounded"
              />
            ))}
          </div>
        </div>
        <div className="col-span-3 rounded-lg border bg-card p-6 space-y-4 animate-pulse">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 bg-gray-200 dark:bg-gray-700 rounded"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
