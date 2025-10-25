/**
 * SEO Analysis Utilities
 * Provides functions for SEO scoring, keyword analysis, and optimization suggestions
 */

export interface SEOAnalysis {
  score: number; // 0-100
  keywords: KeywordAnalysis[];
  metaTags: MetaTagSuggestions;
  readability: ReadabilityScore;
  suggestions: string[];
}

export interface KeywordAnalysis {
  keyword: string;
  count: number;
  density: number; // percentage
  prominence: number; // 0-10, how early it appears
}

export interface MetaTagSuggestions {
  title: string;
  description: string;
  keywords: string[];
  titleLength: number;
  descriptionLength: number;
  isOptimal: boolean;
}

export interface ReadabilityScore {
  score: number; // 0-100
  grade: string; // e.g., "8th grade", "College"
  avgWordsPerSentence: number;
  avgSyllablesPerWord: number;
  complexWords: number;
  suggestions: string[];
}

/**
 * Calculate SEO score for content
 */
export function calculateSEOScore(content: string): SEOAnalysis {
  const keywords = analyzeKeywords(content);
  const metaTags = generateMetaTags(content);
  const readability = calculateReadability(content);

  // Calculate overall score based on various factors
  let score = 0;
  const suggestions: string[] = [];

  // Content length (20 points)
  const wordCount = content.split(/\s+/).length;
  if (wordCount >= 300 && wordCount <= 2500) {
    score += 20;
  } else if (wordCount < 300) {
    score += (wordCount / 300) * 20;
    suggestions.push(
      `Add more content. Current: ${wordCount} words. Recommended: 300-2500 words.`
    );
  } else {
    score += 15;
    suggestions.push(
      `Content is quite long (${wordCount} words). Consider splitting into multiple articles.`
    );
  }

  // Keyword density (20 points)
  const topKeywords = keywords.slice(0, 3);
  if (
    topKeywords.length > 0 &&
    topKeywords[0].density >= 1 &&
    topKeywords[0].density <= 3
  ) {
    score += 20;
  } else if (topKeywords.length > 0) {
    score += 10;
    if (topKeywords[0].density < 1) {
      suggestions.push(
        `Keyword "${
          topKeywords[0].keyword
        }" appears too rarely (${topKeywords[0].density.toFixed(
          2
        )}%). Aim for 1-3% density.`
      );
    } else {
      suggestions.push(
        `Keyword "${
          topKeywords[0].keyword
        }" appears too frequently (${topKeywords[0].density.toFixed(
          2
        )}%). Reduce to 1-3% to avoid keyword stuffing.`
      );
    }
  }

  // Meta tags optimization (20 points)
  if (metaTags.isOptimal) {
    score += 20;
  } else {
    score += 10;
    if (metaTags.titleLength < 30) {
      suggestions.push(
        `Title is too short (${metaTags.titleLength} chars). Aim for 50-60 characters.`
      );
    } else if (metaTags.titleLength > 70) {
      suggestions.push(
        `Title is too long (${metaTags.titleLength} chars). Keep it under 60 characters.`
      );
    }
    if (metaTags.descriptionLength < 120) {
      suggestions.push(
        `Meta description is too short (${metaTags.descriptionLength} chars). Aim for 150-160 characters.`
      );
    } else if (metaTags.descriptionLength > 170) {
      suggestions.push(
        `Meta description is too long (${metaTags.descriptionLength} chars). Keep it under 160 characters.`
      );
    }
  }

  // Readability (20 points)
  if (readability.score >= 60 && readability.score <= 80) {
    score += 20;
  } else {
    score += (readability.score / 100) * 20;
    suggestions.push(...readability.suggestions);
  }

  // Content structure (20 points)
  const hasHeadings = /#+ /.test(content);
  const hasList = /^[-*+]\s/m.test(content);
  const paragraphCount = content.split(/\n\s*\n/).length;

  let structureScore = 0;
  if (hasHeadings) structureScore += 7;
  else suggestions.push("Add headings (H2, H3) to improve structure and SEO.");

  if (hasList) structureScore += 7;
  else
    suggestions.push(
      "Add bullet points or numbered lists to improve readability."
    );

  if (paragraphCount >= 3) structureScore += 6;
  else
    suggestions.push(
      "Break content into more paragraphs for better readability."
    );

  score += structureScore;

  return {
    score: Math.round(score),
    keywords,
    metaTags,
    readability,
    suggestions,
  };
}

/**
 * Analyze keywords in content
 */
export function analyzeKeywords(content: string): KeywordAnalysis[] {
  // Remove markdown syntax and special characters
  const cleanContent = content
    .replace(/[#*_`\[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();

  const words = cleanContent.split(/\s+/).filter((word) => word.length > 3);
  const totalWords = words.length;

  // Count word frequency
  const wordFreq: { [key: string]: number } = {};
  const wordPositions: { [key: string]: number[] } = {};

  words.forEach((word, index) => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
    if (!wordPositions[word]) {
      wordPositions[word] = [];
    }
    wordPositions[word].push(index);
  });

  // Convert to array and sort by frequency
  const keywords = Object.entries(wordFreq)
    .map(([keyword, count]) => {
      const density = (count / totalWords) * 100;
      const firstPosition = wordPositions[keyword][0];
      const prominence = Math.max(0, 10 - (firstPosition / totalWords) * 10);

      return {
        keyword,
        count,
        density,
        prominence,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 keywords

  return keywords;
}

/**
 * Generate meta tag suggestions
 */
export function generateMetaTags(content: string): MetaTagSuggestions {
  // Extract first paragraph or first 160 chars for description
  const firstParagraph = content.split(/\n\s*\n/)[0] || content;
  const cleanFirstPara = firstParagraph.replace(/[#*_`\[\]()]/g, "").trim();

  // Generate title from first heading or first sentence
  const headingMatch = content.match(/^#+\s+(.+)$/m);
  const firstSentence = cleanFirstPara.split(/[.!?]/)[0];
  const title = headingMatch?.[1] || firstSentence || "Untitled";

  // Generate description
  const description = cleanFirstPara.substring(0, 160);

  // Extract keywords
  const keywordAnalysis = analyzeKeywords(content);
  const keywords = keywordAnalysis.slice(0, 5).map((k) => k.keyword);

  const titleLength = title.length;
  const descriptionLength = description.length;
  const isOptimal =
    titleLength >= 30 &&
    titleLength <= 60 &&
    descriptionLength >= 120 &&
    descriptionLength <= 160;

  return {
    title,
    description,
    keywords,
    titleLength,
    descriptionLength,
    isOptimal,
  };
}

/**
 * Calculate readability score (Flesch Reading Ease)
 */
export function calculateReadability(content: string): ReadabilityScore {
  const cleanContent = content.replace(/[#*_`\[\]()]/g, " ");
  const sentences = cleanContent
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 0);
  const words = cleanContent.split(/\s+/).filter((w) => w.length > 0);
  const totalWords = words.length;
  const totalSentences = sentences.length || 1;

  // Count syllables (simple approximation)
  let totalSyllables = 0;
  let complexWords = 0;

  words.forEach((word) => {
    const syllables = countSyllables(word);
    totalSyllables += syllables;
    if (syllables >= 3) {
      complexWords++;
    }
  });

  const avgWordsPerSentence = totalWords / totalSentences;
  const avgSyllablesPerWord = totalSyllables / totalWords;

  // Flesch Reading Ease formula
  const score = Math.max(
    0,
    Math.min(
      100,
      206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord
    )
  );

  // Determine grade level
  let grade = "";
  if (score >= 90) grade = "5th grade";
  else if (score >= 80) grade = "6th grade";
  else if (score >= 70) grade = "7th grade";
  else if (score >= 60) grade = "8th-9th grade";
  else if (score >= 50) grade = "10th-12th grade";
  else if (score >= 30) grade = "College";
  else grade = "College graduate";

  const suggestions: string[] = [];

  if (score < 60) {
    suggestions.push(
      "Content is difficult to read. Use shorter sentences and simpler words."
    );
  }
  if (avgWordsPerSentence > 25) {
    suggestions.push(
      `Average sentence length is high (${avgWordsPerSentence.toFixed(
        1
      )} words). Aim for 15-20 words per sentence.`
    );
  }
  if (complexWords / totalWords > 0.2) {
    suggestions.push(
      `Too many complex words (${complexWords}). Use simpler alternatives where possible.`
    );
  }

  return {
    score: Math.round(score),
    grade,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
    avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100,
    complexWords,
    suggestions,
  };
}

/**
 * Count syllables in a word (simple approximation)
 */
function countSyllables(word: string): number {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;

  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  word = word.replace(/^y/, "");
  const syllables = word.match(/[aeiouy]{1,2}/g);

  return syllables ? syllables.length : 1;
}

/**
 * Analyze content tone
 */
export interface ToneAnalysis {
  tone: string;
  confidence: number;
  emotions: { [key: string]: number };
  suggestions: string[];
}

export function analyzeTone(content: string): ToneAnalysis {
  const cleanContent = content.toLowerCase();

  // Simple sentiment word lists
  const positiveWords = [
    "good",
    "great",
    "excellent",
    "amazing",
    "wonderful",
    "fantastic",
    "love",
    "happy",
    "best",
    "perfect",
    "beautiful",
    "awesome",
  ];
  const negativeWords = [
    "bad",
    "terrible",
    "awful",
    "horrible",
    "worst",
    "hate",
    "sad",
    "poor",
    "disappointing",
    "ugly",
    "difficult",
  ];
  const formalWords = [
    "therefore",
    "furthermore",
    "consequently",
    "moreover",
    "thus",
    "hence",
    "wherein",
    "whereby",
  ];
  const casualWords = [
    "yeah",
    "okay",
    "cool",
    "awesome",
    "stuff",
    "things",
    "gonna",
    "wanna",
    "kinda",
  ];

  let positiveCount = 0;
  let negativeCount = 0;
  let formalCount = 0;
  let casualCount = 0;

  positiveWords.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "g");
    positiveCount += (cleanContent.match(regex) || []).length;
  });

  negativeWords.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "g");
    negativeCount += (cleanContent.match(regex) || []).length;
  });

  formalWords.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "g");
    formalCount += (cleanContent.match(regex) || []).length;
  });

  casualWords.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "g");
    casualCount += (cleanContent.match(regex) || []).length;
  });

  // Determine overall tone
  let tone = "Neutral";
  let confidence = 0.5;
  const suggestions: string[] = [];

  const sentiment = positiveCount - negativeCount;
  const formality = formalCount - casualCount;

  if (sentiment > 3) {
    tone = "Positive";
    confidence = Math.min(0.9, 0.5 + sentiment * 0.05);
  } else if (sentiment < -3) {
    tone = "Negative";
    confidence = Math.min(0.9, 0.5 + Math.abs(sentiment) * 0.05);
  }

  if (formality > 2) {
    tone += " and Formal";
    suggestions.push("Content is formal. Consider your target audience.");
  } else if (formality < -2) {
    tone += " and Casual";
    suggestions.push("Content is casual. Ensure it matches your brand voice.");
  }

  return {
    tone,
    confidence,
    emotions: {
      positive: positiveCount,
      negative: negativeCount,
      formal: formalCount,
      casual: casualCount,
    },
    suggestions,
  };
}
