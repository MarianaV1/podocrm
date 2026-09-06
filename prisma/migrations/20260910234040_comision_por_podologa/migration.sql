/*
  Warnings:

  - You are about to drop the column `comisionPct` on the `Producto` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Podologa" ADD COLUMN     "comisionPct" INTEGER NOT NULL DEFAULT 30;

-- AlterTable
ALTER TABLE "Producto" DROP COLUMN "comisionPct";
