import { prisma } from "../src/lib/prisma.js";
import { TransactionType } from "../src/generated/prisma/client.js";

const defaultCategories = [
  { name: "Food",          icon: "restaurant",       color: "#FF6B6B",    type: "EXPENSE" as TransactionType, canonicalKey: "FOOD" },
  { name: "Transport",      icon: "directions_car",   color: "#4ECDC4",    type: "EXPENSE" as TransactionType, canonicalKey: "TRANSPORT" },
  { name: "Shopping",       icon: "shopping_bag",     color: "#FFB347",    type: "EXPENSE" as TransactionType, canonicalKey: "SHOPPING" },
  { name: "Entertainment",  icon: "movie",            color: "#A29BFE",    type: "EXPENSE" as TransactionType, canonicalKey: "ENTERTAINMENT" },
  { name: "Bills",          icon: "bolt",             color: "#F9CA24",    type: "EXPENSE" as TransactionType, canonicalKey: "BILLS" },
  { name: "Health",         icon: "local_hospital",   color: "#FF7979",    type: "EXPENSE" as TransactionType, canonicalKey: "HEALTH" },
  { name: "Education",      icon: "school",           color: "#7ED6DF",    type: "EXPENSE" as TransactionType, canonicalKey: "EDUCATION" },
  { name: "Other",          icon: "category",         color: "#95A5A6",    type: "EXPENSE" as TransactionType, canonicalKey: undefined },
  { name: "Salary",         icon: "account_balance",  color: "#6BCB77",    type: "INCOME" as TransactionType, canonicalKey: undefined },
  { name: "Freelance",      icon: "laptop",           color: "#4D96FF",    type: "INCOME" as TransactionType, canonicalKey: undefined },
  { name: "Other Income",   icon: "payments",         color: "#55A3E6",    type: "INCOME" as TransactionType, canonicalKey: undefined },
];

async function seed() {
  console.log("Seeding default categories...");

  for (const cat of defaultCategories) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name, type: cat.type, isDefault: true },
    });

    if (!existing) {
      await prisma.category.create({
        data: { ...cat, isDefault: true, ...(cat.canonicalKey ? { canonicalKey: cat.canonicalKey } : {}) },
      });
      console.log(`  Created: ${cat.name}`);
    } else {
      // Reconcile canonicalKey on existing rows so re-running seed stays correct
      await prisma.category.update({
        where: { id: existing.id },
        data: cat.canonicalKey ? { canonicalKey: cat.canonicalKey } : {},
      });
      console.log(`  Synced (exists): ${cat.name}`);
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
