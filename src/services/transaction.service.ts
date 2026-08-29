import { prisma } from "../lib/prisma.js";
import { Prisma } from "../generated/prisma/client.js";
import { checkOverspending } from "./budget.service.js";

interface CreateTransactionData {
  type: "EXPENSE" | "INCOME";
  amount: number;
  title: string;
  note?: string;
  paymentMethod: "CASH" | "CARD" | "BANK_TRANSFER" | "ESEWA" | "KHALTI" | "OTHER";
  date: string;
  categoryId: string;
}

interface GetTransactionsParams {
  type?: string;
  categoryId?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: string;
}

export const createTransaction = async (
  userId: string,
  data: CreateTransactionData,
) => {
  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
    select: { id: true, type: true },
  });
  if (!category) throw new Error("Category not found");
  if (category.type !== data.type) {
    throw new Error("Category type does not match transaction type");
  }

  const transaction = await prisma.transaction.create({
    data: {
      userId,
      type: data.type,
      amount: new Prisma.Decimal(data.amount),
      title: data.title,
      note: data.note ?? null,
      paymentMethod: data.paymentMethod,
      date: new Date(data.date),
      categoryId: data.categoryId,
    },
    include: {
      category: {
        select: { id: true, name: true, icon: true, color: true, type: true },
      },
    },
  });

  if (transaction.type === "EXPENSE") {
    const date = new Date(transaction.date);
    const alert = await checkOverspending(
      userId,
      data.categoryId,
      date.getMonth() + 1,
      date.getFullYear(),
    );
    return { transaction, alert };
  }

  return { transaction, alert: null };
};

export const getTransactions = async (
  userId: string,
  params: GetTransactionsParams = {},
) => {
  const {
    type,
    categoryId,
    paymentMethod,
    startDate,
    endDate,
    page = 1,
    limit = 20,
    sortBy = "date",
    order = "desc",
  } = params;

  const where: any = { userId };

  if (type) where.type = type;
  if (categoryId) where.categoryId = categoryId;
  if (paymentMethod) where.paymentMethod = paymentMethod;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, icon: true, color: true, type: true },
        },
      },
      orderBy: { [sortBy]: order },
      skip,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    items: transactions,
    total,
    page,
    limit,
    hasMore: skip + transactions.length < total,
  };
};

export const getTransaction = async (id: string, userId: string) => {
  const transaction = await prisma.transaction.findFirst({
    where: { id, userId },
    include: {
      category: {
        select: { id: true, name: true, icon: true, color: true, type: true },
      },
    },
  });
  if (!transaction) throw new Error("Transaction not found");
  return transaction;
};

export const updateTransaction = async (
  id: string,
  userId: string,
  data: Partial<CreateTransactionData>,
) => {
  const existing = await prisma.transaction.findFirst({
    where: { id, userId },
  });
  if (!existing) throw new Error("Transaction not found");

  const nextType = data.type ?? existing.type;
  const nextCategoryId = data.categoryId ?? existing.categoryId;
  const nextDate = data.date ? new Date(data.date) : existing.date;

  if (nextType !== existing.type || nextCategoryId !== existing.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: nextCategoryId },
      select: { id: true, type: true },
    });
    if (!category) throw new Error("Category not found");
    if (category.type !== nextType) {
      throw new Error("Category type does not match transaction type");
    }
  }

  const updateData: any = { ...data };
  if (data.amount) updateData.amount = new Prisma.Decimal(data.amount);
  if (data.date) updateData.date = nextDate;

  const transaction = await prisma.transaction.update({
    where: { id },
    data: updateData,
    include: {
      category: {
        select: { id: true, name: true, icon: true, color: true, type: true },
      },
    },
  });

  if (transaction.type === "EXPENSE") {
    const alert = await checkOverspending(
      userId,
      transaction.categoryId,
      nextDate.getMonth() + 1,
      nextDate.getFullYear(),
    );
    return { transaction, alert };
  }

  return { transaction, alert: null };
};

export const deleteTransaction = async (id: string, userId: string) => {
  const existing = await prisma.transaction.findFirst({
    where: { id, userId },
  });
  if (!existing) throw new Error("Transaction not found");
  await prisma.transaction.delete({ where: { id } });
};
