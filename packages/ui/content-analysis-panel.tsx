/**
 * Content Analysis Panel Component
 * Displays SEO metrics and readability scores
 */

"use client";

import { motion } from "framer-motion";
import type {
  ReadabilityScore,
  SEOAnalysis,
} from "@/lib/utils/content-analysis";

interface ContentAnalysisPanelProps {
  readability: ReadabilityScore | null;
  seoAnalysis: SEOAnalysis | null;
  keywordDensity?: any;
}

export function ContentAnalysisPanel({
  readability,
  seoAnalysis,
  keywordDensity,
}: ContentAnalysisPanelProps) {
  if (!readability && !seoAnalysis) {
    return null;
  }

  const seo = seoAnalysis; // For backwards compatibility with code below

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Readability Score */}
      {readability && (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            📖 Readability Score
          </h3>

          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(readability.score / 100) * 251.2} 251.2`}
                  className={`transition-all duration-1000 ${
                    readability.score >= 70
                      ? "text-green-500"
                      : readability.score >= 50
                      ? "text-yellow-500"
                      : "text-red-500"
                  }`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{readability.score}</span>
              </div>
            </div>

            <div className="flex-1">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Grade Level
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {readability.grade}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {readability.interpretation}
              </div>
            </div>
          </div>

          {readability.suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Suggestions:
              </p>
              <ul className="space-y-1">
                {readability.suggestions.map((suggestion, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2"
                  >
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* SEO Score */}
      {seo && (
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            🎯 SEO Score
          </h3>

          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(seo.overallScore / 100) * 251.2} 251.2`}
                  className={`transition-all duration-1000 ${
                    seo.overallScore >= 80
                      ? "text-green-500"
                      : seo.overallScore >= 60
                      ? "text-yellow-500"
                      : "text-red-500"
                  }`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{seo.overallScore}</span>
              </div>
            </div>

            <div className="flex-1">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Overall SEO Quality
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {seo.overallScore >= 80
                  ? "Excellent"
                  : seo.overallScore >= 60
                  ? "Good"
                  : seo.overallScore >= 40
                  ? "Fair"
                  : "Needs Work"}
              </div>
            </div>
          </div>

          {/* Title Analysis */}
          <div className="mb-4 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Title Length</span>
              <span
                className={`text-sm font-bold ${
                  seo.titleAnalysis.optimal
                    ? "text-green-600 dark:text-green-400"
                    : "text-yellow-600 dark:text-yellow-400"
                }`}
              >
                {seo.titleAnalysis.length} chars
              </span>
            </div>
            {seo.titleAnalysis.suggestions.map((suggestion, idx) => (
              <p key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                {suggestion}
              </p>
            ))}
          </div>

          {/* Content Structure */}
          <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-sm font-medium mb-2">Content Structure</div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    seo.contentStructure.hasHeadings
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Headings
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    seo.contentStructure.paragraphCount >= 3
                      ? "bg-green-500"
                      : "bg-yellow-500"
                  }`}
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {seo.contentStructure.paragraphCount} Paragraphs
                </span>
              </div>
            </div>
            {seo.contentStructure.suggestions.map((suggestion, idx) => (
              <p
                key={idx}
                className="text-xs text-gray-600 dark:text-gray-400 mt-1"
              >
                • {suggestion}
              </p>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
