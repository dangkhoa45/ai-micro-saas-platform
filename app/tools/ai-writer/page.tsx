"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/ui/toast";
import {
  PROMPT_TEMPLATES,
  TEMPLATE_CATEGORIES,
  type PromptTemplate,
} from "@/config/prompts.config";

export default function AIWriterEnhancedPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { showToast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Form state
  const [prompt, setPrompt] = useState("");
  const [type, setType] = useState<string>("general");
  const [tone, setTone] = useState<string>("professional");
  const [style, setStyle] = useState<string>("standard");
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");
  const [language, setLanguage] = useState<string>("english");
  const [audience, setAudience] = useState<string>("general");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [settingsCollapsed, setSettingsCollapsed] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

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

  // History state (for undo/redo)
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

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
    };

    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [prompt, history, historyIndex]);

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
        throw new Error(data.error || data.message || "Failed to generate content");
      }

      setResult(data);
      
      // Add to history
      setHistory((prev) => [...prev.slice(0, historyIndex + 1), data.content]);
      setHistoryIndex((prev) => prev + 1);

      showToast("Content generated successfully!", "success");
      setLoading(false);
    } catch (err: any) {
      console.error("Generation error:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
      showToast(err.message || "Failed to generate content", "error");
      setLoading(false);
    }
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

  const handleCopy = () => {
    if (result?.content) {
      navigator.clipboard.writeText(result.content);
      showToast("Content copied to clipboard!", "success");
    }
  };

  const handleExportMarkdown = () => {
    if (result?.content) {
      const blob = new Blob([result.content], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-content-${Date.now()}.md`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Exported as Markdown!", "success");
    }
  };

  const handleExportHTML = () => {
    if (result?.content) {
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>AI Generated Content</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; line-height: 1.6; }
    h1, h2, h3 { color: #333; }
  </style>
</head>
<body>
  ${result.content.replace(/\n/g, "<br>")}
</body>
</html>`;
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-content-${Date.now()}.html`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Exported as HTML!", "success");
    }
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="border-b bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-10"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              ✍️ AI Writer <span className="text-sm font-normal px-2 py-1 bg-primary/10 text-primary rounded">Pro</span>
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Advanced AI-powered content generation with personalization
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              📚 Templates
            </button>
            <Link
              href="/tools"
              className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              ← Back
            </Link>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Settings Panel */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={`lg:col-span-3 ${settingsCollapsed ? "hidden lg:block" : ""}`}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">⚙️ Settings</h2>
                <button
                  onClick={() => setSettingsCollapsed(!settingsCollapsed)}
                  className="lg:hidden text-gray-500 hover:text-gray-700"
                >
                  {settingsCollapsed ? "→" : "←"}
                </button>
              </div>

              <div className="space-y-4">
                {/* Content Type */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    📝 Content Type
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
                  <label className="block text-sm font-medium mb-2">
                    🎭 Tone
                  </label>
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
                    🎨 Writing Style
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
                    📏 Length
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
                    🌍 Language
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
                    👥 Target Audience
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
              </div>

              {/* Keyboard Shortcuts */}
              <div className="mt-6 pt-6 border-t text-xs text-gray-500">
                <p className="font-semibold mb-2">⌨️ Shortcuts:</p>
                <ul className="space-y-1">
                  <li>Ctrl/Cmd + Enter: Generate</li>
                  <li>Ctrl/Cmd + K: Focus prompt</li>
                  <li>Ctrl/Cmd + Z: Undo</li>
                  <li>Ctrl/Cmd + Shift + Z: Redo</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Main Content Area */}
          <div className="lg:col-span-9 space-y-6">
            {/* Prompt Input */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            >
              <h3 className="text-lg font-semibold mb-4">💭 Your Prompt</h3>
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to write about... (Tip: Be specific for better results)"
                rows={6}
                className="w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 resize-none focus:ring-2 focus:ring-primary transition-all"
              />
              <div className="flex items-center justify-between mt-2">
                <div className="text-xs text-gray-500">
                  <span className="font-medium">{wordCount}</span> words • 
                  <span className="font-medium ml-1">{charCount}</span> characters
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={loading || !prompt.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-all transform hover:scale-105 disabled:hover:scale-100"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generating...
                    </span>
                  ) : (
                    "✨ Generate Content"
                  )}
                </button>
              </div>
            </motion.div>

            {/* Output Area */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 min-h-[500px]"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  📄 Generated Content
                  {history.length > 0 && (
                    <span className="text-xs text-gray-500">
                      (Version {historyIndex + 1}/{history.length})
                    </span>
                  )}
                </h2>
                {result && (
                  <div className="flex gap-2">
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
                      onClick={handleCopy}
                      className="px-3 py-2 border rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                    >
                      📋 Copy
                    </button>
                    <button
                      onClick={handleExportMarkdown}
                      className="px-3 py-2 border rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                    >
                      ⬇ Markdown
                    </button>
                    <button
                      onClick={handleExportHTML}
                      className="px-3 py-2 border rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                    >
                      ⬇ HTML
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg mb-4"
                >
                  {error}
                </motion.div>
              )}

              <AnimatePresence mode="wait">
                {loading && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-96"
                  >
                    <div className="relative">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
                      <div className="absolute top-0 left-0 animate-ping rounded-full h-16 w-16 border-4 border-primary opacity-20"></div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mt-6 font-medium">
                      Crafting your content...
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      This may take a few moments
                    </p>
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
                        {result.content}
                      </div>
                    </div>

                    <div className="pt-6 border-t">
                      <h3 className="text-sm font-semibold mb-3">📊 Usage Statistics</h3>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Tokens Used</p>
                          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {result.usage.totalTokens.toLocaleString()}
                          </p>
                        </div>
                        <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Cost</p>
                          <p className="text-lg font-bold text-green-600 dark:text-green-400">
                            ${result.cost.toFixed(4)}
                          </p>
                        </div>
                        <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Remaining</p>
                          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                            {result.remainingTokens.toLocaleString()}
                          </p>
                        </div>
                        <div className="p-3 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Words</p>
                          <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                            {result.content.split(/\s+/).length}
                          </p>
                        </div>
                        <div className="p-3 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-lg">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Characters</p>
                          <p className="text-lg font-bold text-pink-600 dark:text-pink-400">
                            {result.content.length}
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
                    <div className="text-6xl mb-4">✍️</div>
                    <p className="text-gray-600 dark:text-gray-400 mb-2 text-lg font-medium">
                      Ready to create amazing content?
                    </p>
                    <p className="text-sm text-gray-500">
                      Enter your prompt above and click Generate Content to start
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
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
                  <h2 className="text-2xl font-bold">📚 Prompt Templates</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Choose a template to get started quickly
                  </p>
                </div>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
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
                      className="p-4 border-2 rounded-xl hover:border-primary hover:shadow-lg transition-all text-left"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{template.icon}</span>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{template.name}</h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                            {template.description}
                          </p>
                          <div className="flex gap-1 mt-2">
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
    </div>
  );
}
