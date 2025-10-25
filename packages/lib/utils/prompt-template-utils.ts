/**
 * Prompt Template Utilities
 * Functions for managing and executing prompt templates
 */

import { prisma } from "../db";
import type {
  PromptTemplateData,
  CreatePromptTemplateInput,
  UpdatePromptTemplateInput,
  PromptTemplateFilter,
  PromptVariable,
  PromptExecutionOptions,
} from "../types/prompt-template.types";

/**
 * Create a new prompt template
 */
export async function createPromptTemplate(
  userId: string,
  input: CreatePromptTemplateInput
): Promise<PromptTemplateData> {
  const template = await prisma.promptTemplate.create({
    data: {
      userId,
      name: input.name,
      description: input.description,
      template: input.template,
      category: input.category,
      tags: input.tags || [],
      isPublic: input.isPublic || false,
      variables: (input.variables || []) as any,
      model: input.model,
      temperature: input.temperature,
      maxTokens: input.maxTokens,
      topP: input.topP,
    },
  });

  return template as PromptTemplateData;
}

/**
 * Get prompt template by ID
 */
export async function getPromptTemplate(
  id: string,
  userId?: string
): Promise<PromptTemplateData | null> {
  const template = await prisma.promptTemplate.findFirst({
    where: {
      id,
      OR: [
        { userId },
        { isPublic: true },
        { userId: null }, // System templates
      ],
    },
  });

  return template as PromptTemplateData | null;
}

/**
 * List prompt templates with filtering
 */
export async function listPromptTemplates(
  filter: PromptTemplateFilter = {}
): Promise<PromptTemplateData[]> {
  const where: any = {
    isActive: filter.isActive !== undefined ? filter.isActive : true,
  };

  if (filter.userId) {
    where.OR = [
      { userId: filter.userId },
      { isPublic: true },
      { userId: null }, // System templates
    ];
  } else if (filter.isPublic !== undefined) {
    where.isPublic = filter.isPublic;
  }

  if (filter.category) {
    where.category = filter.category;
  }

  if (filter.isFeatured !== undefined) {
    where.isFeatured = filter.isFeatured;
  }

  if (filter.tags && filter.tags.length > 0) {
    where.tags = {
      hasSome: filter.tags,
    };
  }

  if (filter.searchQuery) {
    where.OR = [
      { name: { contains: filter.searchQuery, mode: "insensitive" } },
      { description: { contains: filter.searchQuery, mode: "insensitive" } },
    ];
  }

  const templates = await prisma.promptTemplate.findMany({
    where,
    orderBy: [
      { isFeatured: "desc" },
      { usageCount: "desc" },
      { createdAt: "desc" },
    ],
  });

  return templates as PromptTemplateData[];
}

/**
 * Update prompt template
 */
export async function updatePromptTemplate(
  input: UpdatePromptTemplateInput,
  userId: string
): Promise<PromptTemplateData> {
  const { id, ...data } = input;

  const template = await prisma.promptTemplate.update({
    where: {
      id,
      userId, // Ensure user owns the template
    },
    data: {
      ...data,
      variables: data.variables ? (data.variables as any) : undefined,
      updatedAt: new Date(),
    },
  });

  return template as PromptTemplateData;
}

/**
 * Delete prompt template
 */
export async function deletePromptTemplate(
  id: string,
  userId: string
): Promise<void> {
  await prisma.promptTemplate.delete({
    where: {
      id,
      userId,
    },
  });
}

/**
 * Increment template usage count
 */
export async function incrementTemplateUsage(id: string): Promise<void> {
  await prisma.promptTemplate.update({
    where: { id },
    data: {
      usageCount: {
        increment: 1,
      },
    },
  });
}

/**
 * Rate a template
 */
export async function rateTemplate(id: string, rating: number): Promise<void> {
  const template = await prisma.promptTemplate.findUnique({
    where: { id },
    select: { rating: true, ratingCount: true },
  });

  if (!template) {
    throw new Error("Template not found");
  }

  const currentTotal = (template.rating || 0) * template.ratingCount;
  const newCount = template.ratingCount + 1;
  const newAvg = (currentTotal + rating) / newCount;

  await prisma.promptTemplate.update({
    where: { id },
    data: {
      rating: newAvg,
      ratingCount: newCount,
    },
  });
}

/**
 * Interpolate variables in template
 */
export function interpolateTemplate(
  template: string,
  variables: Record<string, any>
): string {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    result = result.replace(regex, String(value));
  }

  return result;
}

/**
 * Validate template variables
 */
export function validateTemplateVariables(
  templateVariables: PromptVariable[],
  providedVariables: Record<string, any>
): { valid: boolean; missing: string[]; errors: string[] } {
  const missing: string[] = [];
  const errors: string[] = [];

  for (const variable of templateVariables) {
    const value = providedVariables[variable.name];

    // Check required variables
    if (variable.required && (value === undefined || value === null)) {
      missing.push(variable.name);
      continue;
    }

    // Type validation
    if (value !== undefined && value !== null) {
      const actualType = Array.isArray(value) ? "array" : typeof value;
      if (actualType !== variable.type) {
        errors.push(
          `Variable "${variable.name}" expected type "${variable.type}" but got "${actualType}"`
        );
      }
    }
  }

  return {
    valid: missing.length === 0 && errors.length === 0,
    missing,
    errors,
  };
}

/**
 * Execute prompt template with variables
 */
export async function executePromptTemplate(
  templateId: string,
  options: PromptExecutionOptions
): Promise<string> {
  const template = await getPromptTemplate(templateId, options.userId);

  if (!template) {
    throw new Error("Template not found or access denied");
  }

  // Validate variables
  const templateVars = (template.variables || []) as PromptVariable[];
  const validation = validateTemplateVariables(
    templateVars,
    options.variables || {}
  );

  if (!validation.valid) {
    throw new Error(
      `Template validation failed: ${
        validation.missing.length > 0
          ? `Missing variables: ${validation.missing.join(", ")}`
          : ""
      } ${validation.errors.join("; ")}`
    );
  }

  // Interpolate template
  const prompt = interpolateTemplate(
    template.template,
    options.variables || {}
  );

  // Track usage
  if (options.trackUsage !== false) {
    await incrementTemplateUsage(templateId);
  }

  return prompt;
}

/**
 * Get featured templates
 */
export async function getFeaturedTemplates(
  limit: number = 10
): Promise<PromptTemplateData[]> {
  const templates = await prisma.promptTemplate.findMany({
    where: {
      isFeatured: true,
      isActive: true,
    },
    orderBy: [{ usageCount: "desc" }, { rating: "desc" }],
    take: limit,
  });

  return templates as PromptTemplateData[];
}

/**
 * Get popular templates
 */
export async function getPopularTemplates(
  limit: number = 10,
  category?: string
): Promise<PromptTemplateData[]> {
  const where: any = {
    isPublic: true,
    isActive: true,
  };

  if (category) {
    where.category = category;
  }

  const templates = await prisma.promptTemplate.findMany({
    where,
    orderBy: [{ usageCount: "desc" }, { rating: "desc" }],
    take: limit,
  });

  return templates as PromptTemplateData[];
}

/**
 * Get template categories
 */
export async function getTemplateCategories(): Promise<
  { category: string; count: number }[]
> {
  const templates = await prisma.promptTemplate.groupBy({
    by: ["category"],
    where: {
      isActive: true,
      isPublic: true,
      category: {
        not: null,
      },
    },
    _count: {
      id: true,
    },
  });

  return templates.map((t) => ({
    category: t.category || "Uncategorized",
    count: t._count.id,
  }));
}
