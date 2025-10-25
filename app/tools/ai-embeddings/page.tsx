"use client";

import { useState, FormEvent } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/button";
import { useToast } from "@/ui/toast";

interface EmbeddingModel {
  id: string;
  name: string;
  description: string;
  dimensions: number;
  maxTokens: number;
  pricing: {
    per1KTokens: number;
  };
}

interface EmbeddingResponse {
  success: boolean;
  embedding: number[];
  model: string;
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
  cost: number;
  metadata: {
    textLength: number;
    embeddingDimensions: number;
    duration: number;
  };
}

export default function AIEmbeddingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showToast } = useToast();

  const [text, setText] = useState("");
  const [model, setModel] = useState("text-embedding-3-small");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EmbeddingResponse | null>(null);
  const [error, setError] = useState("");

  // Model configurations
  const models: EmbeddingModel[] = [
    {
      id: "text-embedding-ada-002",
      name: "Ada v2",
      description: "Most popular and balanced",
      dimensions: 1536,
      maxTokens: 8191,
      pricing: { per1KTokens: 0.0001 },
    },
    {
      id: "text-embedding-3-small",
      name: "Embedding v3 Small",
      description: "Latest small model - Best value",
      dimensions: 1536,
      maxTokens: 8191,
      pricing: { per1KTokens: 0.00002 },
    },
    {
      id: "text-embedding-3-large",
      name: "Embedding v3 Large",
      description: "Highest quality embeddings",
      dimensions: 3072,
      maxTokens: 8191,
      pricing: { per1KTokens: 0.00013 },
    },
  ];

  const selectedModel = models.find((m) => m.id === model);

  // Redirect if not authenticated
  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/embedding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, model }),
      });

      const data: EmbeddingResponse = await res.json();

      if (!res.ok) {
        throw new Error(
          (data as unknown as { error: string }).error ||
            "Failed to generate embedding"
        );
      }

      setResult(data);
      showToast(
        `Generated embedding with ${
          data.metadata.embeddingDimensions
        } dimensions. Cost: $${data.cost.toFixed(6)}`,
        "success"
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyEmbedding = () => {
    if (result?.embedding) {
      navigator.clipboard.writeText(JSON.stringify(result.embedding));
      showToast("Embedding vector copied to clipboard", "success");
    }
  };

  const handleDownloadJSON = () => {
    if (result) {
      const dataStr = JSON.stringify(result, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
      const exportFileDefaultName = `embedding-${Date.now()}.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();
    }
  };

  const calculateSimilarity = (vec1: number[], vec2: number[]): number => {
    if (vec1.length !== vec2.length) return 0;
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      mag1 += vec1[i] * vec1[i];
      mag2 += vec2[i] * vec2[i];
    }
    return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Embeddings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Generate vector embeddings for semantic search, text similarity, and
          AI applications
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 sticky top-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Text Input */}
              <div>
                <label
                  htmlFor="text"
                  className="block text-sm font-medium mb-2"
                >
                  Text to Embed *
                </label>
                <textarea
                  id="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter text to generate embeddings..."
                  required
                  maxLength={8000}
                  rows={6}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {text.length} / 8000 characters
                </p>
              </div>

              {/* Model Selection */}
              <div>
                <label
                  htmlFor="model"
                  className="block text-sm font-medium mb-2"
                >
                  Embedding Model
                </label>
                <select
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} - {m.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Model Info */}
              {selectedModel && (
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-md space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Dimensions:
                    </span>
                    <span className="font-medium">
                      {selectedModel.dimensions}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Max Tokens:
                    </span>
                    <span className="font-medium">
                      {selectedModel.maxTokens}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Cost per 1K tokens:
                    </span>
                    <span className="font-medium">
                      ${selectedModel.pricing.per1KTokens.toFixed(6)}
                    </span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || !text.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  "Generate Embedding"
                )}
              </Button>
            </form>

            {/* Use Cases */}
            <div className="mt-6 pt-6 border-t dark:border-gray-700">
              <h3 className="text-sm font-semibold mb-3">Common Use Cases</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  Semantic search
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  Text similarity
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  Content classification
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  Recommendation systems
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  Question answering
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-red-800 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {result ? (
            <div className="space-y-6">
              {/* Summary Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Embedding Generated</h2>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCopyEmbedding}
                      variant="outline"
                      size="sm"
                    >
                      Copy Vector
                    </Button>
                    <Button
                      onClick={handleDownloadJSON}
                      variant="outline"
                      size="sm"
                    >
                      Download JSON
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Dimensions
                    </p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {result.metadata.embeddingDimensions}
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Tokens Used
                    </p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {result.usage.totalTokens}
                    </p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Cost
                    </p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      ${result.cost.toFixed(6)}
                    </p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Duration
                    </p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {result.metadata.duration}ms
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <strong>Model:</strong> {result.model}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Text Length:</strong> {result.metadata.textLength}{" "}
                    characters
                  </p>
                </div>
              </div>

              {/* Vector Preview */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Embedding Vector Preview
                </h3>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto">
                  <code className="text-xs text-gray-700 dark:text-gray-300 break-all">
                    [{result.embedding.slice(0, 10).join(", ")}, ...{" "}
                    {result.embedding.length} dimensions total]
                  </code>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Showing first 10 dimensions. Use &quot;Copy Vector&quot; or
                  &quot;Download JSON&quot; to get the full embedding.
                </p>
              </div>

              {/* Vector Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Vector Statistics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-1">
                      Min Value
                    </p>
                    <p className="font-mono font-semibold">
                      {Math.min(...result.embedding).toFixed(6)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-1">
                      Max Value
                    </p>
                    <p className="font-mono font-semibold">
                      {Math.max(...result.embedding).toFixed(6)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-1">
                      Mean
                    </p>
                    <p className="font-mono font-semibold">
                      {(
                        result.embedding.reduce((a, b) => a + b, 0) /
                        result.embedding.length
                      ).toFixed(6)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-1">
                      Magnitude
                    </p>
                    <p className="font-mono font-semibold">
                      {Math.sqrt(
                        result.embedding.reduce(
                          (sum, val) => sum + val * val,
                          0
                        )
                      ).toFixed(6)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-gray-50 dark:bg-gray-800 rounded-lg">
              <svg
                className="w-24 h-24 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 text-center">
                Enter text and click &quot;Generate Embedding&quot; to create
                vector embeddings
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
