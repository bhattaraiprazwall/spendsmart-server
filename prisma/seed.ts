import { prisma } from "../src/lib/prisma.js";
import { TransactionType } from "../src/generated/prisma/client.js";

const defaultCategories = [
  { name: "Food & Dining",  icon: "restaurant",       color: "#FF6B6B",    type: "EXPENSE" as TransactionType },
  { name: "Transport",      icon: "directions_car",   color: "#4ECDC4",    type: "EXPENSE" as TransactionType },
  { name: "Shopping",       icon: "shopping_bag",     color: "#FFB347",    type: "EXPENSE" as TransactionType },
  { name: "Entertainment",  icon: "movie",            color: "#A29BFE",    type: "EXPENSE" as TransactionType },
  { name: "Utilities",      icon: "bolt",             color: "#F9CA24",    type: "EXPENSE" as TransactionType },
  { name: "Health",         icon: "local_hospital",   color: "#FF7979",    type: "EXPENSE" as TransactionType },
  { name: "Education",      icon: "school",           color: "#7ED6DF",    type: "EXPENSE" as TransactionType },
  { name: "Other",          icon: "category",         color: "#95A5A6",    type: "EXPENSE" as TransactionType },
  { name: "Salary",         icon: "account_balance",  color: "#6BCB77",    type: "INCOME" as TransactionType },
  { name: "Freelance",      icon: "laptop",           color: "#4D96FF",    type: "INCOME" as TransactionType },
  { name: "Other Income",   icon: "payments",         color: "#55A3E6",    type: "INCOME" as TransactionType },
];

async function seed() {
  console.log("Seeding default categories...");

  for (const cat of defaultCategories) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name, type: cat.type, isDefault: true },
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
