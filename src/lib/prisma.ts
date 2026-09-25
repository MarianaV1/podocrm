import { PrismaClient } from "@prisma/client";

// Singleton de Prisma: evita crear múltiples conexiones en desarrollo
// por el hot-reload de Next.js. En producción se crea una sola vez.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Las consultas SQL no se imprimen por defecto (saturan la terminal). Para
// verlas en desarrollo: PRISMA_LOG=query pnpm dev
const log: ("query" | "error" | "warn")[] =
  process.env.NODE_ENV === "development"
    ? process.env.PRISMA_LOG === "query"
      ? ["query", "error", "warn"]
      : ["error", "warn"]
    : ["error"];

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ log });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
