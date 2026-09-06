import { PrismaClient } from "@prisma/client";

// Singleton de Prisma: evita crear múltiples conexiones en desarrollo
// por el hot-reload de Next.js. En producción se crea una sola vez.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
