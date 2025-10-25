"use client";

import { useEffect, useState } from "react";
import {
  calculateSEOScore,
  analyzeTone,
  type SEOAnalysis,
  type ToneAnalysis,
} from "@/lib/utils/seo-analysis";

interface SEOAnalysisPanelProps {
  content: string;
}

export function SEOAnalysisPanel({ content }: SEOAnalysisPanelProps) {
  const [seoAnalysis, setSeoAnalysis] = useState<SEOAnalysis | null>(null);
  const [toneAnalysis, setToneAnalysis] = useState<ToneAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!content || content.length < 50) {
      setSeoAnalysis(null);
      setToneAnalysis(null);
      return;
    }

    setIsAnalyzing(true);
    // Debounce analysis
    const timer = setTimeout(() => {
      try {
        const seo = calculateSEOScore(content);
        const tone = analyzeTone(content);
        setSeoAnalysis(seo);
        setToneAnalysis(tone);
      } catch (error) {
        console.error("Analysis error:", error);
      } finally {
        setIsAnalyzing(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [content]);

  if (!content || content.length < 50) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        <p className="text-sm">
          Write at least 50 characters to see SEO analysis
        </p>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Analyzing...
        </p>
      </div>
    );
  }

  if (!seoAnalysis || !toneAnalysis) {
    return null;
  }

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 80) return "bg-green-50 dark:bg-green-900/20";
    if (score >= 60) return "bg-yellow-50 dark:bg-yellow-900/20";
    return "bg-red-50 dark:bg-red-900/20";
  };

  return (
    <div className="space-y-6">
      {/* SEO Score Overview */}
      <div className={`rounded-lg p-6 ${getScoreBgColor(seoAnalysis.score)}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">SEO Score</h3>
          <span
            className={`text-4xl font-bold ${getScoreColor(seoAnalysis.score)}`}
          >
            {seoAnalysis.score}/100
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              seoAnalysis.score >= 80
                ? "bg-green-600"
                : seoAnalysis.score >= 60
                ? "bg-yellow-600"
                : "bg-red-600"
            }`}
            style={{ width: `${seoAnalysis.score}%` }}
          />
        </div>
      </div>

      {/* Readability */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Readability</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Reading Ease Score
            </span>
            <span
              className={`font-semibold ${getScoreColor(
                seoAnalysis.readability.score
              )}`}
            >
              {seoAnalysis.readability.score}/100
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Grade Level
            </span>
            <span className="font-medium">{seoAnalysis.readability.grade}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Avg. Words/Sentence
            </span>
            <span className="font-medium">
              {seoAnalysis.readability.avgWordsPerSentence}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Complex Words
            </span>
            <span className="font-medium">
              {seoAnalysis.readability.complexWords}
            </span>
          </div>
        </div>
      </div>

      {/* Top Keywords */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Top Keywords</h3>
        <div className="space-y-3">
          {seoAnalysis.keywords.slice(0, 5).map((keyword, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{keyword.keyword}</span>
                <span className="text-xs text-gray-500">
                  {keyword.count} times ({keyword.density.toFixed(2)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-blue-600"
                  style={{ width: `${Math.min(keyword.density * 10, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Optimal keyword density: 1-3%
        </p>
      </div>

      {/* Meta Tags */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Meta Tags Suggestions</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
              Title ({seoAnalysis.metaTags.titleLength} chars)
            </label>
            <p className="mt-1 text-sm p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
              {seoAnalysis.metaTags.title}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Recommended: 50-60 characters
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
              Description ({seoAnalysis.metaTags.descriptionLength} chars)
            </label>
            <p className="mt-1 text-sm p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
              {seoAnalysis.metaTags.description}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Recommended: 150-160 characters
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
              Keywords
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {seoAnalysis.metaTags.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tone Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Tone Analysis</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Detected Tone
            </span>
            <span className="font-semibold text-purple-600 dark:text-purple-400">
              {toneAnalysis.tone}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Confidence
            </span>
            <span className="font-medium">
              {(toneAnalysis.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <div className="pt-3 border-t dark:border-gray-700">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              SENTIMENT INDICATORS
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Positive:
                </span>
                <span className="font-medium">
                  {toneAnalysis.emotions.positive}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Negative:
                </span>
                <span className="font-medium">
                  {toneAnalysis.emotions.negative}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Formal:
                </span>
                <span className="font-medium">
                  {toneAnalysis.emotions.formal}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Casual:
                </span>
                <span className="font-medium">
                  {toneAnalysis.emotions.casual}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Suggestions */}
      {(seoAnalysis.suggestions.length > 0 ||
        toneAnalysis.suggestions.length > 0) && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-blue-900 dark:text-blue-300">
            Optimization Suggestions
          </h3>
          <ul className="space-y-2">
            {[...seoAnalysis.suggestions, ...toneAnalysis.suggestions].map(
              (suggestion, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-blue-800 dark:text-blue-300"
                >
                  <span className="text-blue-600 dark:text-blue-400 mt-0.5">
                    •
                  </span>
                  <span>{suggestion}</span>
                </li>
              )
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
