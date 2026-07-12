import { prisma } from "../src/lib/prisma.js";

const defaultCategories = [
  { name: "Food & Dining",  icon: "restaurant",       color: "#FF6B6B" },
  { name: "Transport",      icon: "directions_car",   color: "#4ECDC4" },
  { name: "Shopping",       icon: "shopping_bag",     color: "#FFB347" },
  { name: "Entertainment",  icon: "movie",            color: "#A29BFE" },
  { name: "Utilities",      icon: "bolt",             color: "#F9CA24" },
  { name: "Health",         icon: "local_hospital",   color: "#FF7979" },
  { name: "Education",      icon: "school",           color: "#7ED6DF" },
  { name: "Salary",         icon: "account_balance",  color: "#6BCB77" },
  { name: "Freelance",      icon: "laptop",           color: "#4D96FF" },
  { name: "Other",          icon: "category",         color: "#95A5A6" },
];

async function seed() {
  console.log("Seeding default categories...");

  for (const cat of defaultCategories) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name, isDefault: true },
    });

    if (!existing) {
      await prisma.category.create({
        data: { ...cat, isDefault: true },
      });
      console.log(`  Created: ${cat.name}`);
    } else {
      console.log(`  Skipped (exists): ${cat.name}`);
    }
  }

  console.log("Seeding complete!");
}

seed()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
