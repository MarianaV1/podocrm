/*
  Warnings:

  - You are about to drop the column `direccion` on the `Paciente` table. All the data in the column will be lost.
  - You are about to drop the column `fechaNacimiento` on the `Paciente` table. All the data in the column will be lost.
  - You are about to drop the column `sexo` on the `Paciente` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Paciente" DROP COLUMN "direccion",
DROP COLUMN "fechaNacimiento",
DROP COLUMN "sexo";

-- DropEnum
DROP TYPE "Sexo";
