"use client";

import { useState, FormEvent } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/ui/button";
import { useToast } from "@/ui/toast";

interface ImageModel {
  id: string;
  name: string;
  description: string;
  sizes: string[];
  qualities?: string[];
  maxImages: number;
  pricing: Record<string, number>;
}

interface GeneratedImage {
  url?: string;
  b64_json?: string;
  revised_prompt?: string;
}

interface ImageResponse {
  success: boolean;
  images: GeneratedImage[];
  model: string;
  cost: number;
  metadata: {
    prompt: string;
    size: string;
    quality: string;
    n: number;
    duration: number;
  };
  error?: string;
  message?: string;
}

export default function AIImageGeneratorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showToast } = useToast();

  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("dall-e-3");
  const [size, setSize] = useState("1024x1024");
  const [quality, setQuality] = useState("standard");
  const [numImages, setNumImages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState("");
  const [cost, setCost] = useState(0);

  // Model configurations
  const models: ImageModel[] = [
    {
      id: "dall-e-2",
      name: "DALL-E 2",
      description: "Fast and cost-effective",
      sizes: ["256x256", "512x512", "1024x1024"],
      maxImages: 10,
      pricing: {
        "256x256": 0.016,
        "512x512": 0.018,
        "1024x1024": 0.02,
      },
    },
    {
      id: "dall-e-3",
      name: "DALL-E 3",
      description: "High quality with better prompt understanding",
      sizes: ["1024x1024", "1792x1024", "1024x1792"],
      qualities: ["standard", "hd"],
      maxImages: 1,
      pricing: {
        "1024x1024-standard": 0.04,
        "1024x1024-hd": 0.08,
        "1792x1024-standard": 0.08,
        "1792x1024-hd": 0.12,
        "1024x1792-standard": 0.08,
        "1024x1792-hd": 0.12,
      },
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
    setGeneratedImages([]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model,
          size,
          quality: model === "dall-e-3" ? quality : undefined,
          n: numImages,
        }),
      });

      const data: ImageResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate images");
      }

      setGeneratedImages(data.images);
      setCost(data.cost);
      showToast(
        `Generated ${data.images.length} image(s). Cost: $${data.cost.toFixed(
          4
        )}`,
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

  const handleDownload = (imageUrl: string, index: number) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `ai-generated-image-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Image Generator</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Create stunning images from text descriptions using DALL-E
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 sticky top-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Prompt Input */}
              <div>
                <label
                  htmlFor="prompt"
                  className="block text-sm font-medium mb-2"
                >
                  Prompt *
                </label>
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A futuristic city with flying cars at sunset..."
                  required
                  minLength={10}
                  maxLength={4000}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {prompt.length} / 4000 characters
                </p>
              </div>

              {/* Model Selection */}
              <div>
                <label
                  htmlFor="model"
                  className="block text-sm font-medium mb-2"
                >
                  Model
                </label>
                <select
                  id="model"
                  value={model}
                  onChange={(e) => {
                    setModel(e.target.value);
                    // Reset size to first available size for new model
                    const newModel = models.find(
                      (m) => m.id === e.target.value
                    );
                    if (newModel) {
                      setSize(newModel.sizes[0]);
                      setNumImages(1);
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} - {m.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Size Selection */}
              <div>
                <label
                  htmlFor="size"
                  className="block text-sm font-medium mb-2"
                >
                  Size
                </label>
                <select
                  id="size"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                >
                  {selectedModel?.sizes.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quality Selection (DALL-E 3 only) */}
              {model === "dall-e-3" && (
                <div>
                  <label
                    htmlFor="quality"
                    className="block text-sm font-medium mb-2"
                  >
                    Quality
                  </label>
                  <select
                    id="quality"
                    value={quality}
                    onChange={(e) => setQuality(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="standard">Standard</option>
                    <option value="hd">HD (Higher cost)</option>
                  </select>
                </div>
              )}

              {/* Number of Images */}
              <div>
                <label
                  htmlFor="numImages"
                  className="block text-sm font-medium mb-2"
                >
                  Number of Images
                </label>
                <input
                  id="numImages"
                  type="number"
                  value={numImages}
                  onChange={(e) =>
                    setNumImages(
                      Math.max(
                        1,
                        Math.min(
                          selectedModel?.maxImages || 1,
                          parseInt(e.target.value) || 1
                        )
                      )
                    )
                  }
                  min={1}
                  max={selectedModel?.maxImages}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Max: {selectedModel?.maxImages}
                </p>
              </div>

              {/* Estimated Cost */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
                <p className="text-sm font-medium mb-1">Estimated Cost</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  $
                  {(() => {
                    if (!selectedModel) return "0.00";
                    const key =
                      model === "dall-e-3" ? `${size}-${quality}` : size;
                    const pricePerImage = selectedModel.pricing[key] || 0;
                    return (pricePerImage * numImages).toFixed(4);
                  })()}
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || !prompt.trim() || prompt.length < 10}
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
                  "Generate Images"
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-red-800 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {generatedImages.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Generated Images</h2>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Cost:{" "}
                  <span className="font-bold">${cost.toFixed(4)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {generatedImages.map((image, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
                  >
                    {image.url && (
                      <div className="relative aspect-square">
                        <Image
                          src={image.url}
                          alt={`Generated image ${index + 1}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                    <div className="p-4">
                      {image.revised_prompt && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          <strong>Revised Prompt:</strong>{" "}
                          {image.revised_prompt}
                        </p>
                      )}
                      <Button
                        onClick={() =>
                          image.url && handleDownload(image.url, index)
                        }
                        variant="outline"
                        className="w-full"
                      >
                        Download Image
                      </Button>
                    </div>
                  </div>
                ))}
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
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 text-center">
                Enter a prompt and click &quot;Generate Images&quot; to create
                AI-powered images
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
