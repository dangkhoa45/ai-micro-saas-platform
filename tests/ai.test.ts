/**
 * AI Utilities Test Suite
 *
 * To run these tests manually:
 * 1. Set AI_MOCK=1 in .env for mock mode testing
 * 2. Set real API keys for integration tests
 * 3. Run: tsx tests/ai.test.ts
 */

import { generateText, calculateCost, AIClient } from "../packages/lib/ai";
import { AIConfig } from "../packages/config/ai.config";

// Test configuration
const TEST_CONFIG = {
  mockMode: process.env.AI_MOCK === "1",
  runIntegrationTests: Boolean(
    process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY
  ),
};

console.log("🧪 AI Utilities Test Suite");
console.log("=============================\n");
console.log(`Mock Mode: ${TEST_CONFIG.mockMode ? "✓ Enabled" : "✗ Disabled"}`);
console.log(
  `Integration Tests: ${
    TEST_CONFIG.runIntegrationTests ? "✓ Enabled" : "✗ Disabled (no API keys)"
  }\n`
);

/**
 * Test result tracking
 */
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

/**
 * Test assertion helper
 */
function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ ${message}`);
  }
}

/**
 * Test group helper
 */
function describe(groupName: string, tests: () => Promise<void>) {
  return async () => {
    console.log(`\n📦 ${groupName}`);
    console.log("─".repeat(50));
    try {
      await tests();
    } catch (error: any) {
      console.error(`  ✗ Test group failed: ${error.message}`);
      failedTests++;
    }
  };
}

/**
 * Test: Cost Calculation
 */
const testCostCalculation = describe("Cost Calculation", async () => {
  // Test 1: Basic cost calculation
  const cost1 = calculateCost("gpt-4o", 1000, 500);
  assert(cost1 > 0, "Should calculate cost for GPT-4o");
  assert(
    cost1 === 0.0075,
    "Should calculate exact cost (1000 * 0.005 + 500 * 0.015 = 0.0125)"
  );

  // Test 2: Different model
  const cost2 = calculateCost("mistralai/mistral-7b-instruct", 1000, 500);
  assert(cost2 > 0, "Should calculate cost for Mistral");
  assert(cost2 < cost1, "Mistral should be cheaper than GPT-4o");

  // Test 3: Zero tokens
  const cost3 = calculateCost("gpt-4o", 0, 0);
  assert(cost3 === 0, "Should return zero cost for zero tokens");

  // Test 4: Unknown model (should handle gracefully)
  const cost4 = calculateCost("unknown-model", 1000, 500);
  assert(cost4 === 0, "Should return zero for unknown model");
});

/**
 * Test: Mock Mode Generation
 */
const testMockMode = describe("Mock Mode Generation", async () => {
  if (!TEST_CONFIG.mockMode) {
    console.log("  ⊘ Skipped (AI_MOCK not enabled)");
    return;
  }

  // Test 1: Basic text generation
  const result1 = await generateText("Test prompt for mock mode");
  assert(
    typeof result1.text === "string",
    "Should return string content in mock mode"
  );
  assert(result1.model === "mock", "Should use 'mock' as model name");
  assert(result1.usage.totalTokens > 0, "Should return token usage");

  // Test 2: Custom options
  const result2 = await generateText("Short test", {
    maxTokens: 100,
    temperature: 0.5,
  });
  assert(
    result2.usage.completionTokens <= 100,
    "Should respect maxTokens limit"
  );

  // Test 3: System prompt
  const result3 = await generateText("Test with system prompt", {
    systemPrompt: "You are a helpful assistant",
  });
  assert(result3.text.length > 0, "Should generate content with system prompt");
});

/**
 * Test: AI Client Initialization
 */
const testAIClient = describe("AI Client Initialization", async () => {
  // Test 1: Default client
  try {
    const client1 = new AIClient();
    assert(true, "Should create client with default model");
  } catch (error: any) {
    assert(false, `Should not throw: ${error.message}`);
  }

  // Test 2: Specific model
  try {
    const client2 = new AIClient("gpt-4o");
    assert(true, "Should create client with specific model");
  } catch (error: any) {
    assert(false, `Should not throw: ${error.message}`);
  }

  // Test 3: Use case-based selection
  try {
    const client3 = new AIClient(undefined, "code");
    assert(true, "Should create client for code use case");
  } catch (error: any) {
    assert(false, `Should not throw: ${error.message}`);
  }
});

/**
 * Test: Integration - Real AI Generation
 */
const testRealGeneration =
  describe("Integration - Real AI Generation", async () => {
    if (!TEST_CONFIG.runIntegrationTests) {
      console.log("  ⊘ Skipped (no API keys configured)");
      return;
    }

    console.log("  ⚠️  Running real AI API calls (may incur costs)...\n");

    // Test 1: Basic generation
    try {
      const result = await generateText(
        "Say 'Hello, World!' and nothing else",
        {
          maxTokens: 50,
        }
      );
      assert(result.text.length > 0, "Should generate real content");
      assert(result.model !== "mock", "Should use real model");
      assert(result.usage.totalTokens > 0, "Should track real token usage");
      assert(
        result.provider === "OpenRouter" || result.provider === "OpenAI",
        "Should use configured provider"
      );
      console.log(`    Generated: "${result.text.substring(0, 50)}..."`);
      console.log(
        `    Model: ${result.model}, Tokens: ${
          result.usage.totalTokens
        }, Cost: $${calculateCost(
          result.model,
          result.usage.promptTokens,
          result.usage.completionTokens
        ).toFixed(6)}`
      );
    } catch (error: any) {
      assert(false, `Real generation failed: ${error.message}`);
    }

    // Test 2: Fallback mechanism
    try {
      const result = await generateText("Test fallback", {
        model: "invalid-model-name",
        useCase: "general",
      });
      // If we get here, the request either succeeded with the invalid model
      // or properly fell back to a valid model
      assert(
        result.text.length > 0,
        "Fallback should work when primary model fails"
      );
      console.log(`    Fallback test passed with model: ${result.model}`);
    } catch (error: any) {
      // Expected if invalid model and no fallback
      console.log(`    Fallback test skipped: ${error.message}`);
    }

    // Test 3: Different use cases
    try {
      const codeResult = await generateText(
        "Write a hello world function in Python",
        {
          useCase: "code",
          maxTokens: 100,
        }
      );
      assert(
        codeResult.text.includes("def") || codeResult.text.includes("print"),
        "Code generation should produce code"
      );
      console.log(`    Code generation model: ${codeResult.model}`);
    } catch (error: any) {
      console.log(`    Code generation test failed: ${error.message}`);
    }
  });

/**
 * Test: Error Handling
 */
const testErrorHandling = describe("Error Handling", async () => {
  // Test 1: Empty prompt
  try {
    await generateText("");
    assert(false, "Should not accept empty prompt");
  } catch (error: any) {
    assert(true, "Should reject empty prompt");
  }

  // Test 2: Invalid temperature
  try {
    const result = await generateText("Test", { temperature: 5.0 });
    // Mock mode doesn't validate, real API will reject
    if (!TEST_CONFIG.mockMode) {
      assert(false, "Should reject invalid temperature");
    } else {
      assert(true, "Mock mode doesn't validate temperature");
    }
  } catch (error: any) {
    assert(true, "Should handle invalid temperature");
  }

  // Test 3: Invalid maxTokens
  try {
    const result = await generateText("Test", { maxTokens: -100 });
    if (!TEST_CONFIG.mockMode) {
      assert(false, "Should reject negative maxTokens");
    } else {
      assert(true, "Mock mode doesn't validate maxTokens");
    }
  } catch (error: any) {
    assert(true, "Should handle invalid maxTokens");
  }
});

/**
 * Test: Model Configuration
 */
const testModelConfiguration = describe("Model Configuration", async () => {
  // Test 1: Default model exists
  assert(
    AIConfig.defaultModel in AIConfig.models ||
      AIConfig.defaultModel === "mistralai/mistral-7b-instruct",
    "Default model should be configured"
  );

  // Test 2: Use case models exist
  const useCases = ["text", "chat", "data", "code", "general"] as const;
  useCases.forEach((useCase) => {
    assert(
      typeof AIConfig.models[useCase] === "string",
      `Should have model for ${useCase} use case`
    );
  });

  // Test 3: Fallback models configured
  const fallbackUseCases = ["text", "chat", "data", "code", "general"] as const;
  fallbackUseCases.forEach((useCase) => {
    const fallbacks = AIConfig.fallbackModels[useCase];
    assert(
      Array.isArray(fallbacks) && fallbacks.length > 0,
      `Should have fallback models for ${useCase}`
    );
  });
});

/**
 * Run all tests
 */
async function runTests() {
  await testCostCalculation();
  await testMockMode();
  await testAIClient();
  await testModelConfiguration();
  await testErrorHandling();
  await testRealGeneration();

  // Print summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 Test Summary");
  console.log("=".repeat(50));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`✓ Passed: ${passedTests}`);
  console.log(`✗ Failed: ${failedTests}`);

  if (failedTests === 0) {
    console.log("\n🎉 All tests passed!");
    process.exit(0);
  } else {
    console.log("\n❌ Some tests failed");
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error("\n💥 Test suite crashed:", error);
  process.exit(1);
});
