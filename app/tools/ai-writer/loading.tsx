export default function AIWriterLoading() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>

      {/* Main content skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input section skeleton */}
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-6 space-y-4 animate-pulse">
            <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />

            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              <div>
                <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              <div>
                <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>

            <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>

        {/* Output section skeleton */}
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-6 space-y-4 animate-pulse">
            <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
