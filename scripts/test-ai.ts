/**
 * AI Integration Test Script
 * Tests the unified AI client with OpenRouter and fallback support
 * 
 * Run with: npx tsx scripts/test-ai.ts
 */

import {
  generateText,
  generateChat,
  streamText,
  calculateCost,
  AIClient,
} from "../packages/lib/ai";
import { validateAIConfig } from "../packages/config/ai.config";

async function runTests() {
  console.log("🧪 AI Integration Test Suite\n");
  console.log("=" .repeat(60));

  // Test 1: Validate Configuration
  console.log("\n📋 Test 1: Validating AI Configuration...");
  const validation = validateAIConfig();
  
  if (!validation.valid) {
    console.error("❌ Configuration validation failed:");
    validation.errors.forEach((error) => console.error(`   - ${error}`));
    console.log("\n⚠️  Please set at least OPENAI_API_KEY in your .env file to continue.");
    return;
  }
  console.log("✅ Configuration is valid");

  // Test 2: Generate Text (with use case)
  console.log("\n📝 Test 2: Generating text with 'text' use case...");
  try {
    const result = await generateText(
      "Write a short tagline for an AI-powered SaaS platform in 10 words or less.",
      {
        useCase: "text",
        maxTokens: 50,
      }
    );
    console.log("✅ Text generation successful!");
    console.log(`   Model: ${result.model}`);
    console.log(`   Provider: ${result.provider}`);
    console.log(`   Tokens: ${result.usage.totalTokens}`);
    console.log(`   Cost: $${calculateCost(result.model, result.usage.promptTokens, result.usage.completionTokens).toFixed(6)}`);
    console.log(`   Response: "${result.text.trim()}"`);
  } catch (error: any) {
    console.error("❌ Text generation failed:", error.message);
  }

  // Test 3: Generate Chat
  console.log("\n💬 Test 3: Generating chat response...");
  try {
    const result = await generateChat(
      [
        { role: "system", content: "You are a helpful AI assistant." },
        { role: "user", content: "What are the benefits of using TypeScript?" },
      ],
      {
        useCase: "chat",
        maxTokens: 100,
      }
    );
    console.log("✅ Chat generation successful!");
    console.log(`   Model: ${result.model}`);
    console.log(`   Provider: ${result.provider}`);
    console.log(`   Tokens: ${result.usage.totalTokens}`);
    console.log(`   Response preview: "${result.text.substring(0, 100)}..."`);
  } catch (error: any) {
    console.error("❌ Chat generation failed:", error.message);
  }

  // Test 4: Stream Text
  console.log("\n🌊 Test 4: Streaming text generation...");
  try {
    let streamedText = "";
    let chunkCount = 0;
    
    process.stdout.write("   Streaming: ");
    
    for await (const chunk of streamText(
      "Count from 1 to 5 slowly.",
      {
        useCase: "chat",
        maxTokens: 50,
      }
    )) {
      streamedText += chunk;
      chunkCount++;
      process.stdout.write(".");
    }
    
    console.log("\n✅ Streaming successful!");
    console.log(`   Chunks received: ${chunkCount}`);
    console.log(`   Streamed text: "${streamedText.trim()}"`);
  } catch (error: any) {
    console.error("\n❌ Streaming failed:", error.message);
  }

  // Test 5: Direct AIClient Usage
  console.log("\n🤖 Test 5: Testing AIClient directly...");
  try {
    const client = new AIClient("gpt-4o-mini");
    const result = await client.generate("Say 'Hello, World!' in a creative way.");
    console.log("✅ AIClient test successful!");
    console.log(`   Response: "${result.text.trim()}"`);
  } catch (error: any) {
    console.error("❌ AIClient test failed:", error.message);
  }

  // Test 6: Fallback Mechanism (if OpenRouter is not configured)
  console.log("\n🔄 Test 6: Testing fallback mechanism...");
  if (!process.env.OPENROUTER_API_KEY) {
    console.log("   OpenRouter not configured - will use OpenAI fallback automatically");
    try {
      const result = await generateText("Test fallback", {
        useCase: "general",
        maxTokens: 20,
      });
      console.log("✅ Fallback working correctly!");
      console.log(`   Provider used: ${result.provider}`);
    } catch (error: any) {
      console.error("❌ Fallback test failed:", error.message);
    }
  } else {
    console.log("   ℹ️  OpenRouter is configured - fallback will only trigger on errors");
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ AI Integration Tests Complete!\n");
}

// Run tests
runTests().catch((error) => {
  console.error("\n❌ Test suite failed:", error);
  process.exit(1);
});
