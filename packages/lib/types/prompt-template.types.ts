/**
 * Prompt Template Types
 * Types for AI customization and prompt management
 */

export interface PromptVariable {
  name: string;
  type: "string" | "number" | "boolean" | "array";
  description: string;
  required?: boolean;
  default?: any;
}

export interface AIParameters {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
}

export interface PromptTemplateData {
  id: string;
  userId?: string | null;
  name: string;
  description?: string | null;
  template: string;
  category?: string | null;
  tags: string[];
  isPublic: boolean;
  isFeatured: boolean;
  variables?: PromptVariable[] | null;

  // AI parameters
  model?: string | null;
  temperature?: number | null;
  maxTokens?: number | null;
  topP?: number | null;

  // A/B testing
  version: number;
  isActive: boolean;

  // Usage statistics
  usageCount: number;
  rating?: number | null;
  ratingCount: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePromptTemplateInput {
  name: string;
  description?: string;
  template: string;
  category?: string;
  tags?: string[];
  isPublic?: boolean;
  variables?: PromptVariable[];

  // AI parameters
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface UpdatePromptTemplateInput
  extends Partial<CreatePromptTemplateInput> {
  id: string;
}

export interface PromptTemplateFilter {
  userId?: string;
  category?: string;
  tags?: string[];
  isPublic?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  searchQuery?: string;
}

// AI Persona for character-based generation
export interface AIPersona {
  name: string;
  description: string;
  systemPrompt: string;
  tone: string;
  style: string;
  personality: string[];
  expertise: string[];
  examples?: string[];
}

// A/B Testing for prompts
export interface PromptABTest {
  id: string;
  name: string;
  description?: string;
  variantA: {
    templateId: string;
    weight: number; // 0-100
  };
  variantB: {
    templateId: string;
    weight: number; // 0-100
  };
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
  results?: {
    variantA: {
      totalUsage: number;
      successRate: number;
      avgRating: number;
    };
    variantB: {
      totalUsage: number;
      successRate: number;
      avgRating: number;
    };
  };
}

export interface PromptExecutionOptions extends AIParameters {
  variables?: Record<string, any>;
  userId?: string;
  trackUsage?: boolean;
}
