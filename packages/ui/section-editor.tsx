"use client";

import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "./button";
import { GripVertical, Trash2, Plus, Sparkles } from "lucide-react";

export interface ContentSection {
  id: string;
  type: "intro" | "body" | "conclusion" | "custom";
  title: string;
  content: string;
  tone?: string;
  prompt?: string;
}

interface SectionItemProps {
  section: ContentSection;
  onUpdate: (id: string, updates: Partial<ContentSection>) => void;
  onDelete: (id: string) => void;
  onGenerate: (id: string) => void;
  isGenerating: boolean;
}

function SortableSection({
  section,
  onUpdate,
  onDelete,
  onGenerate,
  isGenerating,
}: SectionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const toneOptions = [
    "professional",
    "casual",
    "friendly",
    "formal",
    "persuasive",
    "informative",
  ];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4 shadow-sm"
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <button
          className="mt-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-5 h-5" />
        </button>

        <div className="flex-1 space-y-3">
          {/* Section Header */}
          <div className="flex items-center justify-between gap-3">
            <input
              type="text"
              value={section.title}
              onChange={(e) => onUpdate(section.id, { title: e.target.value })}
              className="flex-1 px-3 py-2 text-sm font-medium bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Section title..."
            />

            <select
              value={section.tone || "professional"}
              onChange={(e) => onUpdate(section.id, { tone: e.target.value })}
              className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {toneOptions.map((tone) => (
                <option key={tone} value={tone}>
                  {tone.charAt(0).toUpperCase() + tone.slice(1)}
                </option>
              ))}
            </select>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(section.id)}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Section Prompt */}
          <textarea
            value={section.prompt || ""}
            onChange={(e) => onUpdate(section.id, { prompt: e.target.value })}
            placeholder="What should this section be about? (optional)"
            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={2}
          />

          {/* Section Content */}
          <textarea
            value={section.content}
            onChange={(e) => onUpdate(section.id, { content: e.target.value })}
            placeholder="Section content will appear here..."
            className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[120px]"
            rows={6}
          />

          {/* Generate Button */}
          <Button
            size="sm"
            onClick={() => onGenerate(section.id)}
            disabled={isGenerating}
            className="w-full"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isGenerating ? "Generating..." : "Generate Section"}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface SectionEditorProps {
  sections: ContentSection[];
  onSectionsChange: (sections: ContentSection[]) => void;
  onGenerateSection: (sectionId: string) => Promise<void>;
  generatingSectionId: string | null;
}

export function SectionEditor({
  sections,
  onSectionsChange,
  onGenerateSection,
  generatingSectionId,
}: SectionEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      onSectionsChange(arrayMove(sections, oldIndex, newIndex));
    }
  };

  const addSection = (type: ContentSection["type"]) => {
    const templates: Record<
      ContentSection["type"],
      Omit<ContentSection, "id" | "type">
    > = {
      intro: {
        title: "Introduction",
        prompt: "Write an engaging introduction that hooks the reader",
        tone: "friendly",
        content: "",
      },
      body: {
        title: "Main Content",
        prompt: "Write the main body with detailed information",
        tone: "professional",
        content: "",
      },
      conclusion: {
        title: "Conclusion",
        prompt: "Write a compelling conclusion that summarizes key points",
        tone: "professional",
        content: "",
      },
      custom: {
        title: "Custom Section",
        prompt: "",
        tone: "professional",
        content: "",
      },
    };

    const newSection: ContentSection = {
      id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      ...templates[type],
    };

    onSectionsChange([...sections, newSection]);
  };

  const updateSection = (id: string, updates: Partial<ContentSection>) => {
    onSectionsChange(
      sections.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const deleteSection = (id: string) => {
    onSectionsChange(sections.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Add Section Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => addSection("intro")}
          className="flex-1 min-w-[120px]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Introduction
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => addSection("body")}
          className="flex-1 min-w-[120px]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Body
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => addSection("conclusion")}
          className="flex-1 min-w-[120px]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Conclusion
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => addSection("custom")}
          className="flex-1 min-w-[120px]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Custom
        </Button>
      </div>

      {/* Sections List */}
      {sections.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 mb-3">
            No sections yet. Add a section to get started!
          </p>
          <Button onClick={() => addSection("intro")} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add First Section
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {sections.map((section) => (
              <SortableSection
                key={section.id}
                section={section}
                onUpdate={updateSection}
                onDelete={deleteSection}
                onGenerate={onGenerateSection}
                isGenerating={generatingSectionId === section.id}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      {/* Section Count */}
      {sections.length > 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          {sections.length} section{sections.length !== 1 ? "s" : ""} • Drag to
          reorder
        </p>
      )}
    </div>
  );
}
