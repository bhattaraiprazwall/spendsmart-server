import { prisma } from "../lib/prisma.js";
import { Prisma } from "../generated/prisma/client.js";

interface CreateTransactionData {
  type: "EXPENSE" | "INCOME";
  amount: number;
  title: string;
  note?: string;
  paymentMethod: "CASH" | "CARD" | "UPI" | "BANK_TRANSFER" | "OTHER";
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
        select: { id: true, name: true, icon: true, color: true },
      },
    },
  });
  return transaction;
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
          select: { id: true, name: true, icon: true, color: true },
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
        select: { id: true, name: true, icon: true, color: true },
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

  const updateData: any = { ...data };
  if (data.amount) updateData.amount = new Prisma.Decimal(data.amount);
  if (data.date) updateData.date = new Date(data.date);

  const transaction = await prisma.transaction.update({
    where: { id },
    data: updateData,
    include: {
      category: {
        select: { id: true, name: true, icon: true, color: true },
      },
    },
  });
  return transaction;
};

export const deleteTransaction = async (id: string, userId: string) => {
  const existing = await prisma.transaction.findFirst({
    where: { id, userId },
  });
  if (!existing) throw new Error("Transaction not found");
  await prisma.transaction.delete({ where: { id } });
};
