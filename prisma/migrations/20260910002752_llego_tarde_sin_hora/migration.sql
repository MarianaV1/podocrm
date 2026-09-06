/*
  Warnings:

  - You are about to drop the column `horaLlegada` on the `Cita` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "EstadoCita" ADD VALUE 'LLEGO_TARDE';

-- AlterTable
ALTER TABLE "Cita" DROP COLUMN "horaLlegada";
