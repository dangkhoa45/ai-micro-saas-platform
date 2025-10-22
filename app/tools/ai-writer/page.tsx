"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AIWriterPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [prompt, setPrompt] = useState("");
  const [type, setType] = useState<
    "blog" | "article" | "email" | "social" | "general"
  >("general");
  const [tone, setTone] = useState<
    "professional" | "casual" | "friendly" | "formal"
  >("professional");
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    content: string;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    cost: number;
    remainingTokens: number;
  } | null>(null);

  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    if (prompt.length < 10) {
      setError("Prompt must be at least 10 characters");
      return;
    }

    setError("");
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/ai/writer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          type,
          tone,
          length,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || data.message || "Failed to generate content");
        setLoading(false);
        return;
      }

      setResult(data);
      setLoading(false);
    } catch (err) {
      console.error("Generation error:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result?.content) {
      navigator.clipboard.writeText(result.content);
      alert("Content copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="border-b bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">✍️ AI Writer</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Generate high-quality content with AI
            </p>
          </div>
          <Link
            href="/tools"
            className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            ← Back to Tools
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Settings</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Content Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="general">General</option>
                    <option value="blog">Blog Post</option>
                    <option value="article">Article</option>
                    <option value="email">Email</option>
                    <option value="social">Social Media</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="friendly">Friendly</option>
                    <option value="formal">Formal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Length
                  </label>
                  <select
                    value={length}
                    onChange={(e) => setLength(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="short">Short (150-250 words)</option>
                    <option value="medium">Medium (400-600 words)</option>
                    <option value="long">Long (800-1200 words)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Your Prompt</h3>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to write about..."
                rows={8}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                {prompt.length} characters
              </p>

              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="w-full mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Generating..." : "Generate Content"}
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 min-h-[600px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Generated Content</h2>
                {result && (
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    📋 Copy
                  </button>
                )}
              </div>

              {error && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-md mb-4">
                  {error}
                </div>
              )}

              {loading && (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Generating your content...
                    </p>
                  </div>
                </div>
              )}

              {result && !loading && (
                <div>
                  <div className="prose dark:prose-invert max-w-none mb-6">
                    <div className="whitespace-pre-wrap">{result.content}</div>
                  </div>

                  <div className="pt-6 border-t">
                    <h3 className="text-sm font-semibold mb-3">Usage Stats</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Tokens Used
                        </p>
                        <p className="text-lg font-semibold">
                          {result.usage.totalTokens.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Cost
                        </p>
                        <p className="text-lg font-semibold">
                          ${result.cost.toFixed(4)}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Remaining
                        </p>
                        <p className="text-lg font-semibold">
                          {result.remainingTokens.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Words
                        </p>
                        <p className="text-lg font-semibold">
                          {result.content.split(/\s+/).length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!result && !loading && !error && (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      No content generated yet
                    </p>
                    <p className="text-sm text-gray-500">
                      Enter a prompt and click Generate Content to start
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
