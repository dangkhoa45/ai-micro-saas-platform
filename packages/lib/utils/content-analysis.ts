/**
 * Content Analysis Utilities
 * SEO optimization, readability scoring, and content analysis tools
 */

export interface ReadabilityScore {
  score: number; // 0-100
  grade: string; // e.g., "8th Grade", "College"
  interpretation: string;
  suggestions: string[];
}

export interface SEOAnalysis {
  keywordDensity: { [keyword: string]: number };
  titleAnalysis: {
    length: number;
    optimal: boolean;
    suggestions: string[];
  };
  contentStructure: {
    hasHeadings: boolean;
    paragraphCount: number;
    averageParagraphLength: number;
    suggestions: string[];
  };
  overallScore: number; // 0-100
}

export interface KeywordAnalysis {
  keyword: string;
  count: number;
  density: number; // percentage
  positions: number[]; // positions in text
}

/**
 * Calculate Flesch-Kincaid Reading Ease Score
 * Score: 0-100 (higher = easier to read)
 * Formula: 206.835 - 1.015(total words/total sentences) - 84.6(total syllables/total words)
 */
export function calculateReadabilityScore(text: string): ReadabilityScore {
  // Clean the text
  const cleanText = text.trim().replace(/\s+/g, " ");

  if (cleanText.length === 0) {
    return {
      score: 0,
      grade: "N/A",
      interpretation: "No content to analyze",
      suggestions: ["Add content to analyze readability"],
    };
  }

  // Count sentences (approximate)
  const sentences = cleanText
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 0);
  const sentenceCount = Math.max(sentences.length, 1);

  // Count words
  const words = cleanText.split(/\s+/).filter((w) => w.length > 0);
  const wordCount = Math.max(words.length, 1);

  // Count syllables (approximate)
  const syllableCount = words.reduce((total, word) => {
    return total + countSyllables(word);
  }, 0);

  // Calculate Flesch Reading Ease
  const score = Math.max(
    0,
    Math.min(
      100,
      206.835 -
        1.015 * (wordCount / sentenceCount) -
        84.6 * (syllableCount / wordCount)
    )
  );

  // Determine grade level and interpretation
  let grade: string;
  let interpretation: string;

  if (score >= 90) {
    grade = "5th Grade";
    interpretation = "Very Easy - Understood by an average 11-year-old student";
  } else if (score >= 80) {
    grade = "6th Grade";
    interpretation = "Easy - Conversational English for consumers";
  } else if (score >= 70) {
    grade = "7th Grade";
    interpretation = "Fairly Easy - Understood by 13-year-old students";
  } else if (score >= 60) {
    grade = "8-9th Grade";
    interpretation = "Standard - Plain English for general audience";
  } else if (score >= 50) {
    grade = "10-12th Grade";
    interpretation = "Fairly Difficult - High school level";
  } else if (score >= 30) {
    grade = "College";
    interpretation = "Difficult - College graduate level";
  } else {
    grade = "College Graduate";
    interpretation = "Very Difficult - Professional/Academic level";
  }

  // Generate suggestions
  const suggestions: string[] = [];
  const avgWordsPerSentence = wordCount / sentenceCount;
  const avgSyllablesPerWord = syllableCount / wordCount;

  if (avgWordsPerSentence > 25) {
    suggestions.push(
      "Consider breaking up long sentences (avg: " +
        Math.round(avgWordsPerSentence) +
        " words/sentence)"
    );
  }

  if (avgSyllablesPerWord > 2) {
    suggestions.push("Try using simpler words with fewer syllables");
  }

  if (score < 60) {
    suggestions.push("Content may be too complex for general audience");
    suggestions.push("Use shorter sentences and simpler vocabulary");
  }

  if (suggestions.length === 0) {
    suggestions.push("Readability is good for the target audience");
  }

  return {
    score: Math.round(score * 10) / 10,
    grade,
    interpretation,
    suggestions,
  };
}

/**
 * Approximate syllable count for a word
 */
function countSyllables(word: string): number {
  word = word.toLowerCase().trim();
  if (word.length <= 3) return 1;

  // Remove silent 'e' at the end
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");

  // Count vowel groups
  const syllables = word.match(/[aeiouy]{1,2}/g);
  return syllables ? Math.max(1, syllables.length) : 1;
}

/**
 * Analyze SEO factors
 */
export function analyzeSEO(
  text: string,
  targetKeywords: string[] = [],
  title: string = ""
): SEOAnalysis {
  const cleanText = text.toLowerCase().trim();
  const words = cleanText.split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;

  // Keyword density analysis
  const keywordDensity: { [keyword: string]: number } = {};

  targetKeywords.forEach((keyword) => {
    const keywordLower = keyword.toLowerCase();
    const regex = new RegExp(`\\b${keywordLower}\\b`, "gi");
    const matches = text.match(regex);
    const count = matches ? matches.length : 0;
    const density = wordCount > 0 ? (count / wordCount) * 100 : 0;
    keywordDensity[keyword] = Math.round(density * 100) / 100;
  });

  // Title analysis
  const titleLength = title.length;
  const titleOptimal = titleLength >= 30 && titleLength <= 60;
  const titleSuggestions: string[] = [];

  if (titleLength === 0) {
    titleSuggestions.push("Add a title for better SEO");
  } else if (titleLength < 30) {
    titleSuggestions.push(
      `Title is too short (${titleLength} chars). Aim for 30-60 characters.`
    );
  } else if (titleLength > 60) {
    titleSuggestions.push(
      `Title is too long (${titleLength} chars). Aim for 30-60 characters.`
    );
  } else {
    titleSuggestions.push("Title length is optimal for SEO");
  }

  // Check if title contains keywords
  const titleLower = title.toLowerCase();
  const titleHasKeywords = targetKeywords.some((kw) =>
    titleLower.includes(kw.toLowerCase())
  );

  if (targetKeywords.length > 0 && !titleHasKeywords) {
    titleSuggestions.push("Consider including target keywords in the title");
  }

  // Content structure analysis
  const hasH1 = /<h1>|^#\s/im.test(text);
  const hasH2 = /<h2>|^##\s/im.test(text);
  const hasHeadings = hasH1 || hasH2;

  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);
  const paragraphCount = paragraphs.length;

  const avgParagraphLength =
    paragraphCount > 0
      ? Math.round(
          paragraphs.reduce((sum, p) => sum + p.split(/\s+/).length, 0) /
            paragraphCount
        )
      : 0;

  const structureSuggestions: string[] = [];

  if (!hasHeadings) {
    structureSuggestions.push(
      "Add headings (H1, H2) to structure your content"
    );
  }

  if (paragraphCount < 3 && wordCount > 200) {
    structureSuggestions.push(
      "Break content into more paragraphs for readability"
    );
  }

  if (avgParagraphLength > 100) {
    structureSuggestions.push(
      `Paragraphs are too long (avg: ${avgParagraphLength} words). Aim for 50-80 words.`
    );
  }

  if (wordCount < 300) {
    structureSuggestions.push(
      "Content is too short for good SEO (aim for 300+ words)"
    );
  }

  // Calculate overall SEO score
  let overallScore = 0;

  // Title score (20 points)
  if (titleOptimal) overallScore += 20;
  else if (titleLength > 0) overallScore += 10;

  // Keyword density score (30 points)
  const goodKeywords = Object.values(keywordDensity).filter(
    (density) => density >= 1 && density <= 3
  ).length;
  if (targetKeywords.length > 0) {
    overallScore += (goodKeywords / targetKeywords.length) * 30;
  } else {
    overallScore += 15; // Partial credit if no keywords specified
  }

  // Structure score (30 points)
  if (hasHeadings) overallScore += 10;
  if (paragraphCount >= 3) overallScore += 10;
  if (avgParagraphLength <= 100) overallScore += 10;

  // Content length score (20 points)
  if (wordCount >= 1000) overallScore += 20;
  else if (wordCount >= 500) overallScore += 15;
  else if (wordCount >= 300) overallScore += 10;
  else if (wordCount >= 150) overallScore += 5;

  return {
    keywordDensity,
    titleAnalysis: {
      length: titleLength,
      optimal: titleOptimal,
      suggestions: titleSuggestions,
    },
    contentStructure: {
      hasHeadings,
      paragraphCount,
      averageParagraphLength: avgParagraphLength,
      suggestions: structureSuggestions,
    },
    overallScore: Math.round(overallScore),
  };
}

/**
 * Extract and analyze keywords from text
 */
export function analyzeKeywords(
  text: string,
  minLength: number = 3
): KeywordAnalysis[] {
  const cleanText = text.toLowerCase().trim();
  const words = cleanText
    .split(/\s+/)
    .filter((w) => w.length >= minLength && !/^\d+$/.test(w));

  // Count word frequency
  const wordFreq: { [word: string]: { count: number; positions: number[] } } =
    {};

  words.forEach((word, index) => {
    // Remove punctuation
    const cleanWord = word.replace(/[^\w]/g, "");
    if (cleanWord.length >= minLength) {
      if (!wordFreq[cleanWord]) {
        wordFreq[cleanWord] = { count: 0, positions: [] };
      }
      wordFreq[cleanWord].count++;
      wordFreq[cleanWord].positions.push(index);
    }
  });

  // Convert to array and sort by frequency
  const totalWords = words.length;
  const analysis: KeywordAnalysis[] = Object.entries(wordFreq)
    .map(([keyword, data]) => ({
      keyword,
      count: data.count,
      density: (data.count / totalWords) * 100,
      positions: data.positions,
    }))
    .sort((a, b) => b.count - a.count);

  // Return top keywords (limit to avoid noise)
  return analysis.slice(0, 50);
}

/**
 * Calculate keyword density for specific keywords
 */
export function calculateKeywordDensity(
  text: string,
  keywords: string[]
): { [keyword: string]: number } {
  const cleanText = text.toLowerCase();
  const words = cleanText.split(/\s+/).filter((w) => w.length > 0);
  const totalWords = words.length;

  const density: { [keyword: string]: number } = {};

  keywords.forEach((keyword) => {
    const keywordLower = keyword.toLowerCase();
    const regex = new RegExp(`\\b${keywordLower}\\b`, "gi");
    const matches = text.match(regex);
    const count = matches ? matches.length : 0;
    density[keyword] = totalWords > 0 ? (count / totalWords) * 100 : 0;
  });

  return density;
}

/**
 * Generate content improvement suggestions
 */
export function generateContentSuggestions(
  text: string,
  targetKeywords: string[] = []
): string[] {
  const suggestions: string[] = [];
  const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;

  // Length suggestions
  if (wordCount < 300) {
    suggestions.push("📏 Expand content to at least 300 words for better SEO");
  }

  // Keyword suggestions
  if (targetKeywords.length > 0) {
    const density = calculateKeywordDensity(text, targetKeywords);
    targetKeywords.forEach((keyword) => {
      const kDensity = density[keyword];
      if (kDensity === 0) {
        suggestions.push(`🎯 Add target keyword: "${keyword}"`);
      } else if (kDensity < 1) {
        suggestions.push(
          `🎯 Increase usage of keyword: "${keyword}" (currently ${kDensity.toFixed(
            2
          )}%)`
        );
      } else if (kDensity > 3) {
        suggestions.push(
          `⚠️ Reduce keyword stuffing: "${keyword}" (${kDensity.toFixed(
            2
          )}% - aim for 1-3%)`
        );
      }
    });
  }

  // Structure suggestions
  const hasHeadings = /<h[1-6]>|^#{1,6}\s/im.test(text);
  if (!hasHeadings && wordCount > 200) {
    suggestions.push("📑 Add headings to improve structure and scannability");
  }

  // Readability
  const readability = calculateReadabilityScore(text);
  if (readability.score < 50) {
    suggestions.push("📖 Simplify language for better readability");
  }

  return suggestions;
}
