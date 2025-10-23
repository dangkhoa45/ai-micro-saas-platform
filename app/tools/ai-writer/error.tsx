"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/ui/button";

export default function AIWriterError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("AI Writer error:", error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3">
            <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">AI Writer Error</h2>
          <p className="text-muted-foreground">
            We encountered an error loading the AI Writer. This might be a
            temporary issue.
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Button onClick={reset} variant="default">
            Try again
          </Button>
          <Button
            onClick={() => (window.location.href = "/tools")}
            variant="outline"
          >
            Back to tools
          </Button>
        </div>
      </div>
    </div>
  );
}
