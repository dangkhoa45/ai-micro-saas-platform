/**
 * Prompt Templates Configuration
 * Pre-built templates for common writing tasks
 */

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: "blog" | "marketing" | "email" | "social" | "business" | "creative";
  icon: string;
  prompt: string;
  suggestedTone?: string;
  suggestedLength?: string;
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  // Blog Templates
  {
    id: "blog-howto",
    name: "How-To Blog Post",
    description: "Step-by-step guide on a specific topic",
    category: "blog",
    icon: "📝",
    prompt:
      "Write a comprehensive how-to guide about [TOPIC]. Include an introduction, step-by-step instructions, tips, common mistakes to avoid, and a conclusion.",
    suggestedTone: "friendly",
    suggestedLength: "long",
  },
  {
    id: "blog-listicle",
    name: "Listicle Blog Post",
    description: "List-based article (e.g., Top 10...)",
    category: "blog",
    icon: "📋",
    prompt:
      "Write a listicle blog post about '[TOPIC]'. Create an engaging title, brief introduction, [NUMBER] well-explained points with examples, and a conclusion.",
    suggestedTone: "casual",
    suggestedLength: "medium",
  },
  {
    id: "blog-tutorial",
    name: "Technical Tutorial",
    description: "In-depth technical guide with code examples",
    category: "blog",
    icon: "💻",
    prompt:
      "Write a technical tutorial about [TOPIC]. Include prerequisites, detailed explanations, code examples, best practices, and troubleshooting tips.",
    suggestedTone: "technical",
    suggestedLength: "long",
  },

  // Marketing Templates
  {
    id: "marketing-landing",
    name: "Landing Page Copy",
    description: "Persuasive landing page content",
    category: "marketing",
    icon: "🎯",
    prompt:
      "Write compelling landing page copy for [PRODUCT/SERVICE]. Include a powerful headline, benefits (not features), social proof section, clear call-to-action, and urgency element.",
    suggestedTone: "persuasive",
    suggestedLength: "medium",
  },
  {
    id: "marketing-adcopy",
    name: "Ad Copy",
    description: "Short, punchy advertising copy",
    category: "marketing",
    icon: "📢",
    prompt:
      "Write 5 variations of ad copy for [PRODUCT/SERVICE]. Each should be 2-3 sentences, highlight a unique benefit, and include a strong call-to-action.",
    suggestedTone: "persuasive",
    suggestedLength: "short",
  },
  {
    id: "marketing-product",
    name: "Product Description",
    description: "SEO-optimized product description",
    category: "marketing",
    icon: "🛍️",
    prompt:
      "Write an SEO-optimized product description for [PRODUCT]. Include key features, benefits, use cases, specifications, and a compelling reason to buy now.",
    suggestedTone: "professional",
    suggestedLength: "medium",
  },

  // Email Templates
  {
    id: "email-newsletter",
    name: "Newsletter Email",
    description: "Engaging newsletter content",
    category: "email",
    icon: "📧",
    prompt:
      "Write a newsletter email about [TOPIC]. Include a catchy subject line, personal greeting, main content with 3 key updates or stories, and a clear call-to-action.",
    suggestedTone: "friendly",
    suggestedLength: "medium",
  },
  {
    id: "email-welcome",
    name: "Welcome Email",
    description: "Warm welcome message for new users",
    category: "email",
    icon: "👋",
    prompt:
      "Write a welcome email for new [PRODUCT/SERVICE] users. Include a warm greeting, brief explanation of what to expect, 3 quick tips to get started, and support information.",
    suggestedTone: "friendly",
    suggestedLength: "short",
  },
  {
    id: "email-cold",
    name: "Cold Outreach Email",
    description: "Professional cold email for leads",
    category: "email",
    icon: "🎭",
    prompt:
      "Write a cold outreach email to [TARGET AUDIENCE] about [OFFER/SOLUTION]. Keep it personal, focus on their pain points, show value, and include a soft call-to-action.",
    suggestedTone: "professional",
    suggestedLength: "short",
  },

  // Social Media Templates
  {
    id: "social-linkedin",
    name: "LinkedIn Post",
    description: "Professional LinkedIn content",
    category: "social",
    icon: "💼",
    prompt:
      "Write a LinkedIn post about [TOPIC]. Start with a hook, share valuable insights or lessons, include a personal story or example, and end with a thought-provoking question.",
    suggestedTone: "professional",
    suggestedLength: "short",
  },
  {
    id: "social-twitter",
    name: "Twitter Thread",
    description: "Engaging Twitter thread",
    category: "social",
    icon: "🐦",
    prompt:
      "Write a Twitter thread (5-7 tweets) about [TOPIC]. Start with a hook tweet, break down the topic into digestible points, include examples, and end with a call-to-action.",
    suggestedTone: "casual",
    suggestedLength: "short",
  },
  {
    id: "social-instagram",
    name: "Instagram Caption",
    description: "Engaging Instagram caption with hashtags",
    category: "social",
    icon: "📸",
    prompt:
      "Write an Instagram caption about [TOPIC]. Include an attention-grabbing first line, storytelling element, call-to-action, and 10-15 relevant hashtags.",
    suggestedTone: "casual",
    suggestedLength: "short",
  },

  // Business Templates
  {
    id: "business-proposal",
    name: "Business Proposal",
    description: "Professional business proposal",
    category: "business",
    icon: "📊",
    prompt:
      "Write a business proposal for [PROJECT/SERVICE]. Include executive summary, problem statement, proposed solution, timeline, deliverables, pricing, and next steps.",
    suggestedTone: "formal",
    suggestedLength: "long",
  },
  {
    id: "business-report",
    name: "Business Report",
    description: "Detailed business analysis report",
    category: "business",
    icon: "📈",
    prompt:
      "Write a business report analyzing [TOPIC]. Include executive summary, methodology, key findings with data, insights, recommendations, and conclusion.",
    suggestedTone: "formal",
    suggestedLength: "long",
  },
  {
    id: "business-memo",
    name: "Internal Memo",
    description: "Professional internal communication",
    category: "business",
    icon: "📝",
    prompt:
      "Write an internal memo about [TOPIC]. Include clear subject line, context/background, main message or announcement, action items if any, and deadline or next steps.",
    suggestedTone: "professional",
    suggestedLength: "short",
  },

  // Creative Templates
  {
    id: "creative-story",
    name: "Short Story",
    description: "Creative short story",
    category: "creative",
    icon: "📖",
    prompt:
      "Write a short story about [THEME/CONCEPT]. Include compelling characters, vivid setting, clear plot with beginning/middle/end, and an emotional or thought-provoking ending.",
    suggestedTone: "creative",
    suggestedLength: "long",
  },
  {
    id: "creative-poem",
    name: "Poem",
    description: "Artistic poem with rhythm",
    category: "creative",
    icon: "✨",
    prompt:
      "Write a poem about [THEME]. Use vivid imagery, metaphors, and rhythm. Choose an appropriate style (haiku, sonnet, free verse, etc.) that fits the theme.",
    suggestedTone: "creative",
    suggestedLength: "short",
  },
  {
    id: "creative-script",
    name: "Video Script",
    description: "Engaging video script",
    category: "creative",
    icon: "🎬",
    prompt:
      "Write a video script about [TOPIC] for [DURATION] minutes. Include hook, introduction, main content with scene descriptions, transitions, and call-to-action. Format with [VISUAL] and [AUDIO] cues.",
    suggestedTone: "casual",
    suggestedLength: "medium",
  },
];

export const TEMPLATE_CATEGORIES = [
  { id: "all", name: "All Templates", icon: "📚" },
  { id: "blog", name: "Blog Posts", icon: "📝" },
  { id: "marketing", name: "Marketing", icon: "📢" },
  { id: "email", name: "Emails", icon: "📧" },
  { id: "social", name: "Social Media", icon: "🐦" },
  { id: "business", name: "Business", icon: "💼" },
  { id: "creative", name: "Creative", icon: "✨" },
] as const;
