"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save,
  FileText,
  Download,
  Copy,
  Star,
  Settings,
  Sparkles,
  BookOpen,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  FileDown,
  Loader2,
} from "lucide-react";
import { useToast } from "@/ui/toast";
import {
  ContentAnalysisPanel,
  SectionEditor,
  TypingAnimation,
  ContentSkeleton,
  type ContentSection,
} from "@/ui/index";
import {
  PROMPT_TEMPLATES,
  TEMPLATE_CATEGORIES,
  type PromptTemplate,
} from "@/config/prompts.config";
import {
  analyzeSEO,
  calculateReadabilityScore,
  analyzeKeywords,
  type SEOAnalysis,
  type ReadabilityScore,
} from "@/lib/utils/content-analysis";
import {
  exportToPDF,
  exportToMarkdown,
  exportToText,
  copyToClipboard,
  getWordCount,
  getCharCount,
  getReadingTime,
} from "@/lib/utils/export-utils";

type EditorMode = "simple" | "sections";

export default function AIWriterEnhancedPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { showToast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Editor mode
  const [editorMode, setEditorMode] = useState<EditorMode>("simple");

  // Form state
  const [prompt, setPrompt] = useState("");
  const [type, setType] = useState<string>("general");
  const [tone, setTone] = useState<string>("professional");
  const [style, setStyle] = useState<string>("standard");
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");
  const [language, setLanguage] = useState<string>("english");
  const [audience, setAudience] = useState<string>("general");
  const [keywords, setKeywords] = useState<string>("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [settingsCollapsed, setSettingsCollapsed] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showPromptLibrary, setShowPromptLibrary] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [showTypingEffect, setShowTypingEffect] = useState(true);

  // Result state
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

  // Analysis state
  const [seoAnalysis, setSeoAnalysis] = useState<SEOAnalysis | null>(null);
  const [readability, setReadability] = useState<ReadabilityScore | null>(null);
  const [keywordDensity, setKeywordDensity] = useState<any>(null);

  // Sections state
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [generatingSectionId, setGeneratingSectionId] = useState<string | null>(
    null
  );

  // History state (for undo/redo)
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Draft state
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");

  // Favorite prompts
  const [favoritePrompts, setFavoritePrompts] = useState<any[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    const words = prompt.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
    setCharCount(prompt.length);
  }, [prompt]);

  // Load favorite prompts
  useEffect(() => {
    if (session?.user) {
      loadFavoritePrompts();
    }
  }, [session]);

  // Analyze content when result changes
  useEffect(() => {
    if (result?.content) {
      analyzeContent(result.content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, keywords]);

  const loadFavoritePrompts = async () => {
    try {
      const response = await fetch("/api/content/prompts");
      if (response.ok) {
        const data = await response.json();
        setFavoritePrompts(data.prompts || []);
      }
    } catch (error) {
      console.error("Error loading favorite prompts:", error);
    }
  };

  const analyzeContent = (content: string) => {
    const keywordList = keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    // SEO Analysis (includes keyword density)
    const seo = analyzeSEO(content, keywordList);
    setSeoAnalysis(seo);

    // Readability
    const read = calculateReadabilityScore(content);
    setReadability(read);

    // Extract additional keyword analysis if needed
    if (keywordList.length > 0) {
      const keywordData = analyzeKeywords(content, 3);
      setKeywordDensity(keywordData);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to generate
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleGenerate();
      }
      // Ctrl/Cmd + Z to undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl/Cmd + Shift + Z to redo
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z") {
        e.preventDefault();
        handleRedo();
      }
      // Ctrl/Cmd + K to focus prompt
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        textareaRef.current?.focus();
      }
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (result) handleSaveDraft();
      }
    };

    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt, history, historyIndex, result]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showToast("Please enter a prompt", "warning");
      return;
    }

    if (prompt.length < 10) {
      showToast("Prompt must be at least 10 characters", "warning");
      return;
    }

    setError("");
    setLoading(true);
    setResult(null);
    setSeoAnalysis(null);
    setReadability(null);
    setKeywordDensity(null);

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
          style,
          length,
          language,
          audience,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Failed to generate content"
        );
      }

      setResult(data);

      // Add to history
      setHistory((prev) => [...prev.slice(0, historyIndex + 1), data.content]);
      setHistoryIndex((prev) => prev + 1);

      showToast("Content generated successfully!", "success");
      setLoading(false);
    } catch (err: any) {
      console.error("Generation error:", err);
      setError(
        err.message || "An unexpected error occurred. Please try again."
      );
      showToast(err.message || "Failed to generate content", "error");
      setLoading(false);
    }
  };

  const handleGenerateSection = async (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    setGeneratingSectionId(sectionId);

    try {
      const response = await fetch("/api/ai/writer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: section.prompt || section.title,
          type: section.type,
          tone: section.tone || tone,
          style,
          length: "short",
          language,
          audience,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate section");
      }

      // Update section with generated content
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId ? { ...s, content: data.content } : s
        )
      );

      showToast("Section generated successfully!", "success");
    } catch (err: any) {
      console.error("Section generation error:", err);
      showToast(err.message || "Failed to generate section", "error");
    } finally {
      setGeneratingSectionId(null);
    }
  };

  const handleCombineSections = () => {
    const combined = sections
      .map((s) => s.content)
      .filter(Boolean)
      .join("\n\n");
    setResult((prev) => (prev ? { ...prev, content: combined } : null));
    showToast("Sections combined successfully!", "success");
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setResult((prev) =>
        prev ? { ...prev, content: history[historyIndex - 1] } : null
      );
      showToast("Undo successful", "info");
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setResult((prev) =>
        prev ? { ...prev, content: history[historyIndex + 1] } : null
      );
      showToast("Redo successful", "info");
    }
  };

  const handleCopy = async () => {
    if (result?.content) {
      try {
        await copyToClipboard(result.content);
        showToast("Content copied to clipboard!", "success");
      } catch (error) {
        showToast("Failed to copy content", "error");
      }
    }
  };

  const handleExportPDF = async () => {
    if (result?.content) {
      try {
        await exportToPDF(result.content, {
          title: draftTitle || "AI Generated Content",
          author: session?.user?.name || "AI Writer",
          keywords: keywords,
        });
        showToast("Exported as PDF!", "success");
      } catch (error) {
        showToast("Failed to export PDF", "error");
      }
    }
  };

  const handleExportMarkdown = () => {
    if (result?.content) {
      try {
        const fileName = draftTitle
          ? `${draftTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.md`
          : "document.md";
        exportToMarkdown(result.content, fileName);
        showToast("Exported as Markdown!", "success");
      } catch (error) {
        showToast("Failed to export Markdown", "error");
      }
    }
  };

  const handleExportText = () => {
    if (result?.content) {
      try {
        const fileName = draftTitle
          ? `${draftTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.txt`
          : "document.txt";
        exportToText(result.content, fileName);
        showToast("Exported as Text!", "success");
      } catch (error) {
        showToast("Failed to export Text", "error");
      }
    }
  };

  const handleSaveDraft = async () => {
    if (!result?.content) return;

    const title = draftTitle || `Draft ${new Date().toLocaleString()}`;

    setIsSaving(true);
    try {
      const keywordList = keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

      const payload = {
        ...(currentDraftId && { id: currentDraftId }),
        title,
        content: result.content,
        sections: editorMode === "sections" ? sections : undefined,
        settings: { type, tone, style, length, language, audience },
        keywords: keywords || undefined,
        metadata: {
          seoAnalysis,
          readability,
          keywordDensity,
          wordCount: getWordCount(result.content),
          charCount: getCharCount(result.content),
          readingTime: getReadingTime(result.content),
        },
      };

      const response = await fetch("/api/content/drafts", {
        method: currentDraftId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save draft");
      }

      const data = await response.json();
      setCurrentDraftId(data.draft.id);
      showToast("Draft saved successfully!", "success");
    } catch (error) {
      console.error("Error saving draft:", error);
      showToast("Failed to save draft", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAsPrompt = async () => {
    if (!prompt) return;

    try {
      const response = await fetch("/api/content/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draftTitle || "Custom Prompt",
          prompt,
          category: type,
          tone,
          length,
          language,
          tags: keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save prompt");
      }

      await loadFavoritePrompts();
      showToast("Prompt saved to favorites!", "success");
    } catch (error) {
      console.error("Error saving prompt:", error);
      showToast("Failed to save prompt", "error");
    }
  };

  const handleUsePrompt = async (promptData: any) => {
    setPrompt(promptData.prompt);
    if (promptData.tone) setTone(promptData.tone);
    if (promptData.length) setLength(promptData.length);
    if (promptData.language) setLanguage(promptData.language);
    if (promptData.category) setType(promptData.category);
    setShowPromptLibrary(false);
    textareaRef.current?.focus();

    // Increment usage count
    try {
      await fetch(`/api/content/prompts/${promptData.id}/use`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error updating prompt usage:", error);
    }

    showToast(`Using "${promptData.title}"`, "success");
  };

  const handleTemplateSelect = (template: PromptTemplate) => {
    setPrompt(template.prompt);
    if (template.suggestedTone) setTone(template.suggestedTone);
    if (template.suggestedLength) setLength(template.suggestedLength as any);
    setShowTemplates(false);
    showToast(`Template "${template.name}" applied`, "success");
    textareaRef.current?.focus();
  };

  const filteredTemplates =
    selectedCategory === "all"
      ? PROMPT_TEMPLATES
      : PROMPT_TEMPLATES.filter((t) => t.category === selectedCategory);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="border-b bg-white/90 dark:bg-gray-800/90 backdrop-blur-md sticky top-0 z-30 shadow-sm"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                AI Writer
                <span className="text-sm font-normal px-2 py-1 bg-gradient-to-r from-primary/10 to-primary/20 text-primary rounded-full">
                  Pro
                </span>
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Advanced AI-powered content generation with SEO optimization
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPromptLibrary(!showPromptLibrary)}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
              >
                <Star className="w-4 h-4" />
                My Prompts
              </button>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Templates
              </button>
              <Link
                href="/tools"
                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                ← Back
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Settings Panel */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={`lg:col-span-3 ${
              settingsCollapsed ? "hidden lg:block" : ""
            }`}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Settings
                </h2>
                <button
                  onClick={() => setSettingsCollapsed(!settingsCollapsed)}
                  className="lg:hidden text-gray-500 hover:text-gray-700"
                >
                  {settingsCollapsed ? "→" : "←"}
                </button>
              </div>

              <div className="space-y-4">
                {/* Editor Mode */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Editor Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setEditorMode("simple")}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        editorMode === "simple"
                          ? "bg-primary text-white"
                          : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      Simple
                    </button>
                    <button
                      onClick={() => setEditorMode("sections")}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        editorMode === "sections"
                          ? "bg-primary text-white"
                          : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      Sections
                    </button>
                  </div>
                </div>

                {/* Content Type */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Content Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary transition-all"
                  >
                    <option value="general">General</option>
                    <option value="blog">Blog Post</option>
                    <option value="article">Article</option>
                    <option value="email">Email</option>
                    <option value="social">Social Media</option>
                    <option value="technical">Technical</option>
                    <option value="creative">Creative Writing</option>
                  </select>
                </div>

                {/* Tone */}
                <div>
                  <label className="block text-sm font-medium mb-2">Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary transition-all"
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="friendly">Friendly</option>
                    <option value="formal">Formal</option>
                    <option value="persuasive">Persuasive</option>
                    <option value="technical">Technical</option>
                    <option value="creative">Creative</option>
                    <option value="humorous">Humorous</option>
                  </select>
                </div>

                {/* Style */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Writing Style
                  </label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary transition-all"
                  >
                    <option value="standard">Standard</option>
                    <option value="descriptive">Descriptive</option>
                    <option value="narrative">Narrative</option>
                    <option value="expository">Expository</option>
                    <option value="persuasive">Persuasive</option>
                    <option value="conversational">Conversational</option>
                  </select>
                </div>

                {/* Length */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Length
                  </label>
                  <select
                    value={length}
                    onChange={(e) => setLength(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary transition-all"
                  >
                    <option value="short">Short (150-250 words)</option>
                    <option value="medium">Medium (400-600 words)</option>
                    <option value="long">Long (800-1200 words)</option>
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary transition-all"
                  >
                    <option value="english">English</option>
                    <option value="spanish">Spanish</option>
                    <option value="french">French</option>
                    <option value="german">German</option>
                    <option value="italian">Italian</option>
                    <option value="portuguese">Portuguese</option>
                    <option value="chinese">Chinese</option>
                    <option value="japanese">Japanese</option>
                  </select>
                </div>

                {/* Audience */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Target Audience
                  </label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary transition-all"
                  >
                    <option value="general">General Public</option>
                    <option value="expert">Industry Experts</option>
                    <option value="beginner">Beginners</option>
                    <option value="students">Students</option>
                    <option value="professionals">Professionals</option>
                    <option value="executives">Executives</option>
                  </select>
                </div>

                {/* SEO Keywords */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    SEO Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="ai, content, writing"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              {/* Keyboard Shortcuts */}
              <div className="mt-6 pt-6 border-t text-xs text-gray-500 dark:text-gray-400">
                <p className="font-semibold mb-2">⌨️ Shortcuts:</p>
                <ul className="space-y-1">
                  <li>Ctrl/Cmd + Enter: Generate</li>
                  <li>Ctrl/Cmd + K: Focus prompt</li>
                  <li>Ctrl/Cmd + S: Save draft</li>
                  <li>Ctrl/Cmd + Z: Undo</li>
                  <li>Ctrl/Cmd + Shift + Z: Redo</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Main Content Area */}
          <div className="lg:col-span-9 space-y-6">
            {/* Draft Title */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4"
            >
              <input
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="Document title (optional)..."
                className="w-full px-4 py-2 text-lg font-medium bg-transparent border-none focus:outline-none focus:ring-0"
              />
            </motion.div>

            {/* Prompt Input or Section Editor */}
            {editorMode === "simple" ? (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">💭 Your Prompt</h3>
                  <button
                    onClick={handleSaveAsPrompt}
                    disabled={!prompt}
                    className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    <Star className="w-4 h-4" />
                    Save as Template
                  </button>
                </div>
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you want to write about... (Tip: Be specific for better results)"
                  rows={6}
                  className="w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 resize-none focus:ring-2 focus:ring-primary transition-all"
                />
                <div className="flex items-center justify-between mt-3">
                  <div className="text-xs text-gray-500">
                    <span className="font-medium">{wordCount}</span> words •{" "}
                    <span className="font-medium">{charCount}</span> characters
                  </div>
                  <button
                    onClick={handleGenerate}
                    disabled={loading || !prompt.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-all transform hover:scale-105 disabled:hover:scale-100 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Content
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">📝 Section Editor</h3>
                  {sections.length > 0 && (
                    <button
                      onClick={handleCombineSections}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-all flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Combine Sections
                    </button>
                  )}
                </div>
                <SectionEditor
                  sections={sections}
                  onSectionsChange={setSections}
                  onGenerateSection={handleGenerateSection}
                  generatingSectionId={generatingSectionId}
                />
              </motion.div>
            )}

            {/* Output Area */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 min-h-[500px]"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Generated Content
                  {history.length > 0 && (
                    <span className="text-xs text-gray-500">
                      (Version {historyIndex + 1}/{history.length})
                    </span>
                  )}
                </h2>
                {result && (
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={handleUndo}
                      disabled={historyIndex <= 0}
                      className="p-2 border rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 transition-all"
                      title="Undo (Ctrl+Z)"
                    >
                      ↶
                    </button>
                    <button
                      onClick={handleRedo}
                      disabled={historyIndex >= history.length - 1}
                      className="p-2 border rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 transition-all"
                      title="Redo (Ctrl+Shift+Z)"
                    >
                      ↷
                    </button>
                    <button
                      onClick={handleSaveDraft}
                      disabled={isSaving}
                      className="px-3 py-2 border rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
                      title="Save Draft (Ctrl+S)"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save
                    </button>
                    <button
                      onClick={handleCopy}
                      className="px-3 py-2 border rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="px-3 py-2 border rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
                    >
                      <FileDown className="w-4 h-4" />
                      PDF
                    </button>
                    <button
                      onClick={handleExportMarkdown}
                      className="px-3 py-2 border rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      MD
                    </button>
                    <button
                      onClick={handleExportText}
                      className="px-3 py-2 border rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      TXT
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-lg mb-4 flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              <div ref={resultRef}>
                <AnimatePresence mode="wait">
                  {loading && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <ContentSkeleton />
                    </motion.div>
                  )}

                  {result && !loading && (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <div className="prose dark:prose-invert max-w-none mb-6">
                        <div className="whitespace-pre-wrap leading-relaxed">
                          {showTypingEffect &&
                          historyIndex === history.length - 1 ? (
                            <TypingAnimation
                              text={result.content}
                              speed={100}
                              onComplete={() => setShowTypingEffect(false)}
                            />
                          ) : (
                            result.content
                          )}
                        </div>
                      </div>

                      {/* Analysis Panel */}
                      {(seoAnalysis || readability) && (
                        <ContentAnalysisPanel
                          seoAnalysis={seoAnalysis}
                          readability={readability}
                          keywordDensity={keywordDensity}
                        />
                      )}

                      {/* Usage Statistics */}
                      <div className="pt-6 border-t mt-6">
                        <h3 className="text-sm font-semibold mb-3">
                          📊 Usage Statistics
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Tokens Used
                            </p>
                            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              {result.usage.totalTokens.toLocaleString()}
                            </p>
                          </div>
                          <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Cost
                            </p>
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">
                              ${result.cost.toFixed(4)}
                            </p>
                          </div>
                          <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Remaining
                            </p>
                            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                              {result.remainingTokens.toLocaleString()}
                            </p>
                          </div>
                          <div className="p-3 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Words
                            </p>
                            <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                              {getWordCount(result.content)}
                            </p>
                          </div>
                          <div className="p-3 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-lg">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Read Time
                            </p>
                            <p className="text-lg font-bold text-pink-600 dark:text-pink-400">
                              {getReadingTime(result.content)} min
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {!result && !loading && !error && (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center h-96 text-center"
                    >
                      <Sparkles className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                      <p className="text-gray-600 dark:text-gray-400 mb-2 text-lg font-medium">
                        Ready to create amazing content?
                      </p>
                      <p className="text-sm text-gray-500">
                        {editorMode === "simple"
                          ? "Enter your prompt above and click Generate Content to start"
                          : "Add sections and generate content for each one"}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Template Modal */}
      <AnimatePresence>
        {showTemplates && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTemplates(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-4 md:inset-10 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <BookOpen className="w-6 h-6" />
                    Prompt Templates
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Choose a template to get started quickly
                  </p>
                </div>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  ×
                </button>
              </div>

              {/* Category Filter */}
              <div className="p-4 border-b overflow-x-auto">
                <div className="flex gap-2 min-w-max">
                  {TEMPLATE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedCategory === cat.id
                          ? "bg-primary text-white"
                          : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {cat.icon} {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Templates Grid */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => (
                    <motion.button
                      key={template.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleTemplateSelect(template)}
                      className="p-4 border-2 rounded-xl hover:border-primary hover:shadow-lg transition-all text-left group"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{template.icon}</span>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                            {template.name}
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                            {template.description}
                          </p>
                          <div className="flex gap-1 flex-wrap">
                            {template.suggestedTone && (
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                                {template.suggestedTone}
                              </span>
                            )}
                            {template.suggestedLength && (
                              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded">
                                {template.suggestedLength}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Prompt Library Modal */}
      <AnimatePresence>
        {showPromptLibrary && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPromptLibrary(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-4 md:inset-10 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Star className="w-6 h-6 text-yellow-500" />
                    My Favorite Prompts
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your saved prompt templates
                  </p>
                </div>
                <button
                  onClick={() => setShowPromptLibrary(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {favoritePrompts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Star className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      No favorite prompts yet
                    </p>
                    <p className="text-sm text-gray-500">
                      Save prompts you use frequently for quick access
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favoritePrompts.map((promptData) => (
                      <motion.button
                        key={promptData.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleUsePrompt(promptData)}
                        className="p-4 border-2 rounded-xl hover:border-primary hover:shadow-lg transition-all text-left group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold group-hover:text-primary transition-colors flex-1">
                            {promptData.title}
                          </h3>
                          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 mb-2">
                          {promptData.prompt}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex gap-1 flex-wrap">
                            {promptData.category && (
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                                {promptData.category}
                              </span>
                            )}
                            {promptData.tone && (
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                {promptData.tone}
                              </span>
                            )}
                          </div>
                          {promptData.usageCount > 0 && (
                            <span className="text-gray-400">
                              Used {promptData.usageCount}×
                            </span>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
