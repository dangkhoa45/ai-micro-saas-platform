/**
 * Test the AI Writer API endpoint directly
 */

const API_URL = "http://localhost:3001";

async function testAPIEndpoint() {
  console.log("\n🧪 Testing AI Writer API Endpoint\n");
  console.log("=".repeat(60));

  // Test 1: Unauthorized request (no session)
  console.log("\n📝 Test 1: Unauthorized Request (no auth)");
  console.log("-".repeat(60));

  try {
    const response = await fetch(`${API_URL}/api/ai/writer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: "Write a blog post about AI",
      }),
    });

    const data = await response.json();

    if (response.status === 401) {
      console.log("✅ Correctly returns 401 Unauthorized");
      console.log(`   Response: ${JSON.stringify(data)}`);
    } else {
      console.log("❌ Expected 401, got:", response.status);
      console.log(`   Response: ${JSON.stringify(data)}`);
    }
  } catch (error: any) {
    console.log("❌ Request failed:", error.message);
  }

  // Test 2: Invalid input validation
  console.log("\n📝 Test 2: Validation - Prompt too short");
  console.log("-".repeat(60));

  try {
    const response = await fetch(`${API_URL}/api/ai/writer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: "short",
      }),
    });

    const data = await response.json();

    // This will likely return 401 since we're not authenticated
    // but in a real test with auth, it should return 400
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
  } catch (error: any) {
    console.log("❌ Request failed:", error.message);
  }

  // Test 3: Check API route exists
  console.log("\n📝 Test 3: API Route Availability");
  console.log("-".repeat(60));

  try {
    const response = await fetch(`${API_URL}/api/ai/writer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: "Test prompt for checking API availability",
      }),
    });

    if (response.status === 401) {
      console.log("✅ API route exists and responds (requires auth)");
    } else if (response.status === 404) {
      console.log("❌ API route not found (404)");
    } else {
      console.log(`✅ API route responds with status: ${response.status}`);
    }
  } catch (error: any) {
    console.log("❌ API route test failed:", error.message);
  }

  // Test 4: Test OPTIONS (CORS preflight)
  console.log("\n📝 Test 4: CORS & OPTIONS");
  console.log("-".repeat(60));

  try {
    const response = await fetch(`${API_URL}/api/ai/writer`, {
      method: "OPTIONS",
    });

    console.log(`   Status: ${response.status}`);
    console.log(
      `   Allowed Methods: ${response.headers.get("allow") || "N/A"}`
    );
  } catch (error: any) {
    console.log("   CORS test:", error.message);
  }

  console.log("\n" + "=".repeat(60));
  console.log("\n✅ API Endpoint Tests Complete\n");
  console.log("📌 Next Steps:");
  console.log("   1. Open http://localhost:3001/tools/ai-writer in browser");
  console.log("   2. Sign up or sign in to test with authentication");
  console.log("   3. Try generating content with different settings");
  console.log("   4. Check browser console for any errors");
  console.log("   5. Verify usage logs in database\n");
}

testAPIEndpoint().catch(console.error);
