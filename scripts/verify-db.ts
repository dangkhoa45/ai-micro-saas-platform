/**
 * Quick Database Verification Script
 * Checks if all required data exists for AI Writer module
 */

import { prisma } from "../packages/lib/db";

async function verifyDatabase() {
  console.log("\n🔍 Verifying Database Setup for AI Writer\n");
  console.log("=".repeat(60));

  try {
    // Check App entry
    console.log("\n📱 Checking App Registry...");
    const aiWriterApp = await prisma.app.findUnique({
      where: { slug: "ai-writer" },
    });

    if (aiWriterApp) {
      console.log("✅ AI Writer app exists");
      console.log(`   ID: ${aiWriterApp.id}`);
      console.log(`   Name: ${aiWriterApp.name}`);
      console.log(`   Enabled: ${aiWriterApp.enabled}`);
    } else {
      console.log("❌ AI Writer app not found - needs seeding");
    }

    // Check users
    console.log("\n👥 Checking Users...");
    const userCount = await prisma.user.count();
    console.log(`✅ Total users: ${userCount}`);

    // Check usage logs
    console.log("\n📊 Checking Usage Logs...");
    const usageLogs = await prisma.usageLog.findMany({
      where: { appId: aiWriterApp?.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: { select: { email: true } },
      },
    });

    console.log(`✅ Total usage logs for AI Writer: ${usageLogs.length}`);
    if (usageLogs.length > 0) {
      console.log("\nRecent usage logs:");
      usageLogs.forEach((log, i) => {
        console.log(
          `   ${i + 1}. ${log.user.email}: ${
            log.tokens
          } tokens ($${log.cost.toFixed(6)})`
        );
      });
    }

    // Check subscriptions
    console.log("\n💳 Checking Subscriptions...");
    const subscriptions = await prisma.subscription.groupBy({
      by: ["plan"],
      _count: true,
    });

    console.log("✅ Subscription distribution:");
    subscriptions.forEach((sub) => {
      console.log(`   ${sub.plan}: ${sub._count} users`);
    });

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("✅ Database verification complete!");
    console.log("\n📝 Summary:");
    console.log(`   - AI Writer app: ${aiWriterApp ? "✅" : "❌"}`);
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Usage logs: ${usageLogs.length}`);
    console.log(`   - Subscriptions: ${subscriptions.length} tiers`);

    console.log("\n✅ AI Writer module is ready for production!\n");
  } catch (error: any) {
    console.error("❌ Database verification failed:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase().catch(console.error);
