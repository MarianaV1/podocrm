-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('FEMENINO', 'MASCULINO', 'OTRO');

-- CreateTable
CREATE TABLE "Paciente" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "fechaNacimiento" TIMESTAMP(3),
    "sexo" "Sexo",
    "direccion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Paciente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HojaClinica" (
    "id" TEXT NOT NULL,
    "folio" INTEGER NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "diabetico" BOOLEAN NOT NULL DEFAULT false,
    "hipertenso" BOOLEAN NOT NULL DEFAULT false,
    "otrasCondiciones" TEXT,
    "alergias" TEXT,
    "comentarioSalud" TEXT,
    "motivoConsulta" TEXT,
    "antecedentes" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HojaClinica_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Paciente_nombre_idx" ON "Paciente"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "HojaClinica_folio_key" ON "HojaClinica"("folio");

-- CreateIndex
CREATE UNIQUE INDEX "HojaClinica_pacienteId_key" ON "HojaClinica"("pacienteId");

-- AddForeignKey
ALTER TABLE "HojaClinica" ADD CONSTRAINT "HojaClinica_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
