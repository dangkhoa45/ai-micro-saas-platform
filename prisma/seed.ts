import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Seed Apps
  const apps = [
    {
      slug: "ai-writer",
      name: "AI Writer",
      description: "Generate high-quality content with AI",
      icon: "✍️",
      enabled: true,
    },
    {
      slug: "ai-analytics",
      name: "AI Analytics",
      description: "Analyze data and get insights with AI",
      icon: "📊",
      enabled: true,
    },
    {
      slug: "ai-image-generator",
      name: "AI Image Generator",
      description: "Create stunning images with AI",
      icon: "🎨",
      enabled: true,
    },
    {
      slug: "ai-code-assistant",
      name: "AI Code Assistant",
      description: "Get coding help and generate code",
      icon: "💻",
      enabled: true,
    },
  ];

  for (const app of apps) {
    const existingApp = await prisma.app.findUnique({
      where: { slug: app.slug },
    });

    if (!existingApp) {
      await prisma.app.create({
        data: app,
      });
      console.log(`✅ Created app: ${app.name}`);
    } else {
      console.log(`⏭️  App already exists: ${app.name}`);
    }
  }

  console.log("✨ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
