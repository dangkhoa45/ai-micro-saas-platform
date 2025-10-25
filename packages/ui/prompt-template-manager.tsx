/**
 * Prompt Template Manager Component
 * Manages custom AI prompt templates
 */

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/packages/ui/button";
import { Plus, Search, Star, Trash2, Edit, Play } from "lucide-react";
import type { PromptTemplateData } from "@/packages/lib/types/prompt-template.types";

interface PromptTemplateManagerProps {
  onExecute?: (template: PromptTemplateData) => void;
}

export function PromptTemplateManager({
  onExecute,
}: PromptTemplateManagerProps) {
  const { data: session } = useSession();
  const [templates, setTemplates] = useState<PromptTemplateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory) params.set("category", selectedCategory);
      if (searchQuery) params.set("search", searchQuery);

      const response = await fetch(`/api/ai/templates?${params}`);
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, searchQuery]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const response = await fetch(`/api/ai/templates?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadTemplates();
      }
    } catch (error) {
      console.error("Error deleting template:", error);
    }
  };

  const categories = [
    "All",
    "Content",
    "Code",
    "Analysis",
    "Email",
    "Social Media",
    "Marketing",
  ];

  if (!session) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">
          Please sign in to manage prompt templates
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Prompt Templates</h2>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() =>
                setSelectedCategory(
                  category === "All" ? null : category.toLowerCase()
                )
              }
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                (category === "All" && !selectedCategory) ||
                selectedCategory === category.toLowerCase()
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Template List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 bg-gray-100 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No templates found</p>
          <Button className="mt-4">Create Your First Template</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onDelete={handleDelete}
              onExecute={onExecute}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface TemplateCardProps {
  template: PromptTemplateData;
  onDelete: (id: string) => void;
  onExecute?: (template: PromptTemplateData) => void;
}

function TemplateCard({ template, onDelete, onExecute }: TemplateCardProps) {
  return (
    <div className="bg-white border rounded-lg p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{template.name}</h3>
          {template.category && (
            <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded mt-1">
              {template.category}
            </span>
          )}
        </div>
        {template.isFeatured && (
          <Star className="w-5 h-5 text-yellow-500 fill-current" />
        )}
      </div>

      {template.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {template.description}
        </p>
      )}

      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
        <span>{template.usageCount} uses</span>
        {template.rating && (
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" />
            {template.rating.toFixed(1)}
          </span>
        )}
      </div>

      {template.tags && template.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {template.tags.slice(0, 3).map((tag, idx) => (
            <span key={idx} className="px-2 py-0.5 text-xs bg-gray-100 rounded">
              #{tag}
            </span>
          ))}
          {template.tags.length > 3 && (
            <span className="px-2 py-0.5 text-xs text-gray-500">
              +{template.tags.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {onExecute && (
          <Button
            onClick={() => onExecute(template)}
            className="flex-1"
            size="sm"
          >
            <Play className="w-4 h-4 mr-1" />
            Execute
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => {}}>
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(template.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
