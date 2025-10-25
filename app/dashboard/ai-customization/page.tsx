/**
 * AI Customization Dashboard Page
 * Manage prompt templates, AI parameters, and personas
 */

import { Metadata } from "next";
import { PromptTemplateManager } from "@/packages/ui/prompt-template-manager";

export const metadata: Metadata = {
  title: "AI Customization | AI Micro-SaaS Platform",
  description:
    "Customize AI parameters, manage prompt templates, and create AI personas",
};

export default function AICustomizationPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Customization</h1>
        <p className="text-gray-600">
          Create and manage custom prompt templates, adjust AI parameters, and
          build AI personas for your specific use cases.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Prompt Templates Section */}
        <section>
          <PromptTemplateManager />
        </section>

        {/* Quick Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border rounded-lg p-6">
            <div className="text-sm text-gray-600 mb-1">Your Templates</div>
            <div className="text-3xl font-bold">0</div>
          </div>
          <div className="bg-white border rounded-lg p-6">
            <div className="text-sm text-gray-600 mb-1">Total Uses</div>
            <div className="text-3xl font-bold">0</div>
          </div>
          <div className="bg-white border rounded-lg p-6">
            <div className="text-sm text-gray-600 mb-1">Avg Rating</div>
            <div className="text-3xl font-bold">-</div>
          </div>
        </section>

        {/* AI Parameters Guide */}
        <section className="bg-gradient-to-r from-blue-50 to-purple-50 border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">
            Understanding AI Parameters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Temperature (0-2)</h3>
              <p className="text-sm text-gray-600">
                Controls randomness. Lower values make output more focused and
                deterministic. Higher values increase creativity and variety.
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>• 0.0-0.3: Precise, factual responses</li>
                <li>• 0.7-1.0: Balanced creativity</li>
                <li>• 1.5-2.0: Highly creative, unpredictable</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Max Tokens</h3>
              <p className="text-sm text-gray-600">
                Maximum length of the generated response. One token ≈ 4
                characters or 0.75 words.
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>• 100-500: Short responses</li>
                <li>• 500-2000: Medium articles</li>
                <li>• 2000+: Long-form content</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
