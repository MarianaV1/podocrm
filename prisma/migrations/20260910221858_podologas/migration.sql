-- AlterTable
ALTER TABLE "Cita" ADD COLUMN     "podologaId" TEXT;

-- CreateTable
CREATE TABLE "Podologa" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Podologa_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_podologaId_fkey" FOREIGN KEY ("podologaId") REFERENCES "Podologa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
